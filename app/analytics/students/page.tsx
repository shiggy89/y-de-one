"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import s from "./students.module.css";
import {
  FrequencyType,
  TrendType,
  BehaviorType,
  PotentialLevel,
  Recommendation,
  CoOccurrencePair,
  StudentAnalysisSummary,
  StudentsKPI,
  Period,
  ActionPriorityStudent,
  ClassRecruitmentOpportunity,
  MonthlyDistributionBucket,
  RevenueImpact,
  PotentialStars,
  ScoreBreakdownItem,
  RecruitmentCandidate,
} from "@/lib/studentAnalytics";

// ─── Types ────────────────────────────────────────────────────────────────────

type DistEntry = { count: number };

type ActionLog = {
  id: number;
  student_id: number;
  studentName: string;
  studentPictureUrl: string | null;
  action_type: string;
  recommended_slot_id: string | null;
  note: string | null;
  actioned_at: string;
  outcome: "attended" | "not_attended" | null;
  outcome_at: string | null;
};

type ActionStats = {
  totalSent: number;
  attended: number;
  notAttended: number;
  pending: number;
  successRate: number;
  additionalRevenue: number;
};

type StudentsResponse = {
  period: Period;
  kpi: StudentsKPI;
  students: StudentAnalysisSummary[];
  coOccurrence: CoOccurrencePair[];
  actionStudents: ActionPriorityStudent[];
  classRecruitment: ClassRecruitmentOpportunity[];
  monthlyDistribution: MonthlyDistributionBucket[];
  revenueImpact: RevenueImpact;
};

type DetailResponse = {
  student: { id: number; name: string; pictureUrl: string | null };
  allTimeCount: number;
  allTimeRevenue: number;
  firstAttendanceDate: string | null;
  monthlyTrend: { yearMonth: string; label: string; count: number }[];
  revenueTrend: { yearMonth: string; label: string; revenue: number }[];
  distributions: {
    dow: { dow: number; label: string; count: number }[];
    class: { title: string; count: number }[];
    teacher: { teacher: string; count: number }[];
    time: { time: string; count: number }[];
  };
  history: {
    date: string;
    dowLabel: string;
    time: string;
    title: string;
    teacher: string;
    type: string;
    pricePaid: number;
  }[];
};

type SortKey =
  | "name" | "currentCount" | "prevCount" | "changeCount" | "currentRevenue"
  | "lastAttendanceDate" | "avgIntervalDays" | "frequencyType"
  | "additionalPotential" | "daysSinceLastAttendance" | "nextVisit";

type FilterState = {
  potentialLevel: PotentialLevel | "";
  frequencyType: FrequencyType | "";
  behaviorType: BehaviorType | "";
  dormantOnly: boolean;
  primaryDow: string;
  searchName: string;
};

type KpiFilter =
  | "" | "potential_high" | "low_freq" | "mid_freq" | "high_freq"
  | "almost_one_more" | "today_approach" | "recruitable" | "dormant";

const SESSION_KEY = "analytics_key";
const DOW_LABEL = ["日", "月", "火", "水", "木", "金", "土"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonths(): string[] {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function getMondayStr(d: Date = new Date()): string {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - diff);
  return mon.toISOString().split("T")[0];
}

function addWeeks(weekStr: string, delta: number): string {
  const d = new Date(weekStr + "T00:00:00");
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().split("T")[0];
}

function addMonths(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatWeekLabel(weekStr: string): string {
  const mon = new Date(weekStr + "T00:00:00");
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${mon.getFullYear()}/${fmt(mon)}〜${fmt(sun)}`;
}

function formatMonthLabel(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  return `${y}/${m}`;
}

function changeRateText(rate: number | null, changeCount: number): string {
  if (rate === null) {
    if (changeCount > 0) return `+${changeCount}回`;
    if (changeCount < 0) return `${changeCount}回`;
    return "—";
  }
  const pct = Math.round(rate * 100);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

function changeRateColor(rate: number | null, changeCount: number): string {
  const val = rate ?? changeCount;
  if (val > 0) return "#16a34a";
  if (val < 0) return "#e05080";
  return "#94a3b8";
}

function calcNextVisit(lastDate: string | null, avgInterval: number | null): string | null {
  if (!lastDate || !avgInterval) return null;
  const d = new Date(lastDate + "T00:00:00");
  d.setDate(d.getDate() + Math.round(avgInterval));
  return d.toISOString().split("T")[0];
}

function nextVisitStatus(nextDate: string | null): { label: string; color: string } | null {
  if (!nextDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nd = new Date(nextDate + "T00:00:00");
  const diffDays = Math.round((today.getTime() - nd.getTime()) / 86400000);
  if (diffDays < 0) {
    const m = nd.getMonth() + 1;
    const d = nd.getDate();
    return { label: `${m}/${d}頃`, color: "#16a34a" };
  }
  if (diffDays === 0) return { label: "今日頃", color: "#f59e0b" };
  if (diffDays <= 7) return { label: `${diffDays}日超過`, color: "#f59e0b" };
  return { label: `${diffDays}日超過`, color: "#e05080" };
}

// ─── Badge Components ─────────────────────────────────────────────────────────

const FREQUENCY_COLOR: Record<FrequencyType, string> = {
  高頻度: "#16a34a",
  中頻度: "#0090e8",
  低頻度: "#f59e0b",
  休眠: "#e05080",
};

const POTENTIAL_COLOR: Record<PotentialLevel, string> = {
  高: "#16a34a",
  中: "#f59e0b",
  低: "#94a3b8",
};

const BEHAVIOR_COLOR: Record<BehaviorType, string> = {
  固定クラス型: "#7c3aed",
  曜日固定型: "#0090e8",
  複数クラス型: "#e05080",
};

const TREND_COLOR: Record<string, string> = {
  増加傾向: "#16a34a",
  減少傾向: "#e05080",
  安定: "#94a3b8",
};

function Badge({ label, color, small }: { label: string; color: string; small?: boolean }) {
  return (
    <span
      className={s.badge}
      style={{ background: color + "18", color, borderColor: color + "40", fontSize: small ? 10 : 11 }}
    >
      {label}
    </span>
  );
}

function StarRating({ stars, max = 5, size = 12 }: { stars: number; max?: number; size?: number }) {
  return (
    <span className={s.starRating} style={{ fontSize: size }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < stars ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
    </span>
  );
}

function Avatar({ src, name, size = 28 }: { src: string | null; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className={s.avatar} style={{ width: size, height: size, fontSize: size * 0.42, flexShrink: 0 }}>
        {(name || "?")[0]}
      </div>
    );
  }
  return (
    <img src={src} alt={name} className={s.avatarImg}
      style={{ width: size, height: size, flexShrink: 0 }} onError={() => setBroken(true)} />
  );
}

function MiniBarChart({ items, color = "#0090e8", height = 80 }: {
  items: (DistEntry & { label: string })[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className={s.miniBarChart} style={{ height }}>
      {items.map((item, i) => (
        <div key={i} className={s.miniBarCol}>
          <span className={s.miniBarVal}>{item.count > 0 ? item.count : ""}</span>
          <div className={s.miniBarTrack}>
            <div className={s.miniBarFill} style={{ height: `${(item.count / max) * 100}%`, background: color }} />
          </div>
          <span className={s.miniBarLabel}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Today's Action Card ──────────────────────────────────────────────────────

type TodayAction = {
  rank: number;
  label: string;
  detail: string;
  expectedRevenue: string;
  color: string;
};

function TodayActionCard({
  actions,
  onSelectStudent,
  allStudents,
  actionPriorityStudents,
}: {
  actions: TodayAction[];
  onSelectStudent: (st: StudentAnalysisSummary) => void;
  allStudents: StudentAnalysisSummary[];
  actionPriorityStudents: ActionPriorityStudent[];
}) {
  if (actions.length === 0) return null;
  return (
    <section className={s.todayCard}>
      <div className={s.todayTitle}>今日やること</div>
      <div className={s.todayList}>
        {actions.map((a, i) => (
          <div key={i} className={s.todayItem} style={{ borderLeft: `3px solid ${a.color}` }}>
            <div className={s.todayRank} style={{ background: a.color }}>
              {a.rank}
            </div>
            <div className={s.todayContent}>
              <div className={s.todayLabel}>{a.label}</div>
              <div className={s.todayDetail}>{a.detail}</div>
            </div>
            <div className={s.todayExpect} style={{ color: a.color }}>
              {a.expectedRevenue}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildTodayActions(
  actionStudents: ActionPriorityStudent[],
  classRecruitment: ClassRecruitmentOpportunity[],
  kpi: StudentsKPI,
  avgPrice: number,
): TodayAction[] {
  const actions: TodayAction[] = [];
  let rank = 1;

  const top = actionStudents[0];
  if (top) {
    actions.push({
      rank: rank++,
      label: `${top.name} さんへLINE連絡`,
      detail: top.priorityReasons[0] ?? "参加履歴から今がアプローチのタイミング",
      expectedRevenue: `期待売上 +¥${(avgPrice * 2).toLocaleString()}`,
      color: "#e05080",
    });
  }

  const topClass = classRecruitment[0];
  if (topClass) {
    actions.push({
      rank: rank++,
      label: `${topClass.title}（${topClass.dowLabel}曜 ${topClass.time}〜）を${topClass.candidateCount}名へ案内`,
      detail: `現在${topClass.spacesLeft}席空き・候補${topClass.candidateCount}名確認済み`,
      expectedRevenue: `期待 +${topClass.candidateCount}レッスン`,
      color: "#0090e8",
    });
  }

  if (kpi.dormantCount > 0) {
    const second = actionStudents[1];
    actions.push({
      rank: rank++,
      label: second ? `${second.name} さんへフォロー` : `休眠中の${kpi.dormantCount}名へフォロー`,
      detail: "30日以上未参加の生徒への声かけ",
      expectedRevenue: "復帰率向上を期待",
      color: "#f59e0b",
    });
  }

  return actions.slice(0, 3);
}

// ─── Revenue Impact Banner ────────────────────────────────────────────────────

function RevenueImpactBanner({ impact }: { impact: RevenueImpact }) {
  const [expanded, setExpanded] = useState(false);
  if (impact.targetCount === 0) return null;
  return (
    <div className={s.impactBanner}>
      <div className={s.impactTop}>
        <span className={s.impactIcon}>💡</span>
        <span className={s.impactTitle}>
          参加ポテンシャル高 <strong>{impact.targetCount}名</strong> が月+2回来た場合の売上予測
        </span>
        <button className={s.impactToggle} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "▲ 閉じる" : "▼ 詳細"}
        </button>
      </div>
      <div className={s.impactCols}>
        <div className={s.impactCol}>
          <span className={s.impactColLabel}>今週</span>
          <span className={s.impactColVal}>+{impact.weeklyLessons}回</span>
          <span className={s.impactColMoney}>+¥{impact.weeklyRevenue.toLocaleString()}</span>
        </div>
        <div className={s.impactDivider}>→</div>
        <div className={s.impactCol}>
          <span className={s.impactColLabel}>今月予測</span>
          <span className={s.impactColVal}>+{impact.additionalLessons}回</span>
          <span className={s.impactColMoney} style={{ color: "#16a34a" }}>+¥{impact.additionalRevenue.toLocaleString()}</span>
        </div>
        <div className={s.impactDivider}>→</div>
        <div className={s.impactCol}>
          <span className={s.impactColLabel}>年間換算</span>
          <span className={s.impactColVal}>+{impact.additionalLessons * 12}回</span>
          <span className={s.impactColMoney} style={{ color: "#e05080", fontSize: 18 }}>+¥{impact.yearlyRevenue.toLocaleString()}</span>
        </div>
      </div>
      {expanded && (
        <div className={s.impactFormula}>計算式: {impact.formula}</div>
      )}
    </div>
  );
}

// ─── Action Priority Students ─────────────────────────────────────────────────

function ActionStudentsSection({
  students,
  onSelectStudent,
  allStudents,
  authKey,
  onActionLogged,
}: {
  students: ActionPriorityStudent[];
  onSelectStudent: (st: StudentAnalysisSummary) => void;
  allStudents: StudentAnalysisSummary[];
  authKey: string;
  onActionLogged: () => void;
}) {
  const [expandedBreakdown, setExpandedBreakdown] = useState<number | null>(null);
  const [sendingLine, setSendingLine] = useState<number | null>(null);

  if (students.length === 0) return null;

  const STAR_BORDER: Record<number, string> = { 5: "#e05080", 4: "#f59e0b", 3: "#0090e8", 2: "#94a3b8", 1: "#cbd5e1" };

  const sendLine = async (st: ActionPriorityStudent) => {
    setSendingLine(st.id);
    try {
      await fetch("/api/analytics/actions", {
        method: "POST",
        headers: { "content-type": "application/json", "x-analytics-key": authKey },
        body: JSON.stringify({
          student_id: st.id,
          action_type: "line_message",
          recommended_slot_id: st.topRecommendation?.slotId ?? null,
          note: st.priorityReasons[0] ?? null,
        }),
      });
      onActionLogged();
    } finally {
      setSendingLine(null);
    }
  };

  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>
        今日アプローチすべき生徒
        <span className={s.sectionSub}>参加履歴から優先度を算出 — 上位{students.length}名</span>
      </h2>
      <div className={s.actionGrid}>
        {students.map((st) => {
          const full = allStudents.find((a) => a.id === st.id);
          const borderColor = STAR_BORDER[st.priorityStars] ?? "#e2e8f0";
          const isBreakdownOpen = expandedBreakdown === st.id;
          return (
            <div key={st.id} className={s.actionCard} style={{ borderLeft: `4px solid ${borderColor}` }}>
              <div className={s.actionCardHeader}>
                <Avatar src={st.pictureUrl} name={st.name} size={36} />
                <div className={s.actionCardMeta}>
                  <div className={s.actionCardName}>{st.name}</div>
                  <StarRating stars={st.priorityStars} size={13} />
                </div>
                <button
                  className={s.actionScoreBtn}
                  onClick={() => setExpandedBreakdown(isBreakdownOpen ? null : st.id)}
                  title="スコア内訳を見る"
                >
                  {st.priorityScore}pt {isBreakdownOpen ? "▲" : "▼"}
                </button>
              </div>

              {isBreakdownOpen && (
                <div className={s.breakdown}>
                  <div className={s.breakdownTitle}>スコア内訳</div>
                  {st.scoreBreakdown.map((item, i) => (
                    <div key={i} className={s.breakdownItem}>
                      <span
                        className={s.breakdownPts}
                        style={{ color: item.points > 0 ? "#16a34a" : "#e05080" }}
                      >
                        {item.points > 0 ? `+${item.points}` : item.points}
                      </span>
                      <span className={s.breakdownLabel}>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={s.actionCardStats}>
                <div className={s.actionStat}>
                  <span className={s.actionStatLabel}>今月</span>
                  <span className={s.actionStatVal}>{st.currentCount}回</span>
                </div>
                <div className={s.actionStat}>
                  <span className={s.actionStatLabel}>最終参加</span>
                  <span className={s.actionStatVal}>
                    {st.daysSinceLastAttendance !== null ? `${st.daysSinceLastAttendance}日前` : "—"}
                  </span>
                </div>
                <div className={s.actionStat}>
                  <span className={s.actionStatLabel}>平均間隔</span>
                  <span className={s.actionStatVal}>
                    {st.avgIntervalDays !== null ? `${st.avgIntervalDays}日` : "—"}
                  </span>
                </div>
              </div>

              {st.topRecommendation && (
                <div className={s.actionRec}>
                  <span className={s.actionRecLabel}>おすすめ</span>
                  <span className={s.actionRecVal}>
                    {st.topRecommendation.dowLabel}曜 {st.topRecommendation.time}〜 {st.topRecommendation.title}
                  </span>
                </div>
              )}

              <div className={s.actionCardFooter}>
                <button
                  className={s.lineBtn}
                  onClick={() => sendLine(st)}
                  disabled={sendingLine === st.id}
                >
                  {sendingLine === st.id ? "送信中..." : "LINE 送信記録"}
                </button>
                {full && (
                  <button className={s.detailBtn} onClick={() => onSelectStudent(full)}>
                    詳細
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Class Recruitment Section ────────────────────────────────────────────────

function ClassRecruitmentSection({
  opportunities,
  onSelectStudent,
  allStudents,
}: {
  opportunities: ClassRecruitmentOpportunity[];
  onSelectStudent: (st: StudentAnalysisSummary) => void;
  allStudents: StudentAnalysisSummary[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (opportunities.length === 0) return null;

  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>
        クラス別 集客チャンス
        <span className={s.sectionSub}>空き席 × 候補者数で優先順位付け</span>
      </h2>
      <div className={s.recruitGrid}>
        {opportunities.map((op) => {
          const isOpen = expanded === op.slotId;
          return (
            <div key={op.slotId} className={s.recruitCard}>
              <div className={s.recruitHeader}>
                <span className={s.recruitDow}>{op.dowLabel}曜 {op.time}</span>
                <span className={s.recruitSpace}>空き{op.spacesLeft}席</span>
              </div>
              <div className={s.recruitTitle}>{op.title}</div>
              <div className={s.recruitTeacher}>{op.teacher}</div>
              <div className={s.recruitFill}>
                <div className={s.recruitFillBar}
                  style={{ width: `${Math.min(100, (op.avgAttendees / 15) * 100)}%` }} />
              </div>
              <div className={s.recruitFillLabel}>平均 {op.avgAttendees}人 / 定員15名</div>
              <button
                className={s.recruitExpandBtn}
                onClick={() => setExpanded(isOpen ? null : op.slotId)}
              >
                候補 {op.candidateCount}名を{isOpen ? "閉じる ▲" : "見る ▼"}
              </button>

              {isOpen && (
                <div className={s.recruitCandList}>
                  {op.candidates.map((c, i) => {
                    const full = allStudents.find((a) => a.id === c.id);
                    const recStars = c.recScore >= 70 ? 5 : c.recScore >= 55 ? 4 : c.recScore >= 40 ? 3 : c.recScore >= 25 ? 2 : 1;
                    return (
                      <div key={c.id} className={s.recruitCandItem}>
                        <span className={s.recruitCandRank}>#{i + 1}</span>
                        <Avatar src={c.pictureUrl} name={c.name} size={28} />
                        <div className={s.recruitCandInfo}>
                          <div className={s.recruitCandName}>{c.name}</div>
                          <StarRating stars={recStars} size={11} />
                          {c.recReasons.slice(0, 2).map((r, ri) => (
                            <div key={ri} className={s.recruitCandReason}>● {r}</div>
                          ))}
                        </div>
                        {full && (
                          <button className={s.recruitCandBtn} onClick={() => onSelectStudent(full)}>
                            詳細
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Monthly Distribution ─────────────────────────────────────────────────────

function MonthlyDistributionSection({ buckets }: { buckets: MonthlyDistributionBucket[] }) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const BUCKET_COLORS: Record<string, string> = {
    "0": "#e2e8f0", "1-3": "#f59e0b", "4-6": "#0090e8", "7-9": "#7c3aed", "10+": "#16a34a",
  };
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>
        月間参加回数 分布
        <span className={s.sectionSub}>今月の参加回数帯ごとの人数</span>
      </h2>
      <div className={s.distCard}>
        {buckets.map((b) => (
          <div key={b.key} className={s.distRow}>
            <span className={s.distLabel}>{b.label}</span>
            <div className={s.distBarTrack}>
              <div className={s.distBarFill}
                style={{ width: `${(b.count / maxCount) * 100}%`, background: BUCKET_COLORS[b.key] ?? "#0090e8" }} />
            </div>
            <span className={s.distCount}>{b.count}人</span>
            <span className={s.distPct}>{b.pct}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Action Stats Section ─────────────────────────────────────────────────────

function ActionStatsSection({
  stats,
  logs,
  authKey,
  onUpdate,
}: {
  stats: ActionStats;
  logs: ActionLog[];
  authKey: string;
  onUpdate: () => void;
}) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const recordOutcome = async (id: number, outcome: "attended" | "not_attended") => {
    setUpdatingId(id);
    try {
      await fetch(`/api/analytics/actions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-analytics-key": authKey },
        body: JSON.stringify({ outcome }),
      });
      onUpdate();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>
        施策効果測定
        <span className={s.sectionSub}>今月のアクション結果</span>
      </h2>
      <div className={s.statsRow}>
        <div className={s.statCard}>
          <span className={s.statVal}>{stats.totalSent}件</span>
          <span className={s.statLabel}>LINE送信記録</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statVal} style={{ color: "#16a34a" }}>{stats.attended}件</span>
          <span className={s.statLabel}>参加確認</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statVal} style={{ color: "#f59e0b" }}>{stats.pending}件</span>
          <span className={s.statLabel}>結果待ち</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statVal} style={{ color: stats.successRate >= 40 ? "#16a34a" : "#f59e0b" }}>
            {stats.successRate}%
          </span>
          <span className={s.statLabel}>成功率</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statVal} style={{ color: "#16a34a" }}>+¥{stats.additionalRevenue.toLocaleString()}</span>
          <span className={s.statLabel}>追加売上（推定）</span>
        </div>
      </div>

      <button className={s.historyToggle} onClick={() => setShowHistory((v) => !v)}>
        {showHistory ? "履歴を閉じる ▲" : "アクション履歴を見る ▼"} ({logs.length}件)
      </button>

      {showHistory && logs.length > 0 && (
        <div className={s.historyTableWrap} style={{ marginTop: 12 }}>
          <table className={s.historyTable}>
            <thead>
              <tr>
                <th>日時</th>
                <th>生徒</th>
                <th>種別</th>
                <th>結果</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className={s.tdDate}>{log.actioned_at.slice(0, 10)}</td>
                  <td>
                    <div className={s.studentNameCell}>
                      <Avatar src={log.studentPictureUrl} name={log.studentName} size={22} />
                      <span style={{ fontSize: 12 }}>{log.studentName}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 11, color: "#64748b" }}>
                    {log.action_type === "line_message" ? "LINE送信" : log.action_type}
                  </td>
                  <td>
                    {log.outcome === "attended" && (
                      <Badge label="参加あり" color="#16a34a" small />
                    )}
                    {log.outcome === "not_attended" && (
                      <Badge label="参加なし" color="#e05080" small />
                    )}
                    {!log.outcome && (
                      <Badge label="未確認" color="#94a3b8" small />
                    )}
                  </td>
                  <td>
                    {!log.outcome && (
                      <div className={s.outcomeButtons}>
                        <button
                          className={s.outcomeBtnPos}
                          disabled={updatingId === log.id}
                          onClick={() => recordOutcome(log.id, "attended")}
                        >
                          来た
                        </button>
                        <button
                          className={s.outcomeBtnNeg}
                          disabled={updatingId === log.id}
                          onClick={() => recordOutcome(log.id, "not_attended")}
                        >
                          来なかった
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

function RecommendationCard({ rec, currentMonthlyCount }: { rec: Recommendation; currentMonthlyCount: number }) {
  const stars = rec.score >= 70 ? 5 : rec.score >= 55 ? 4 : rec.score >= 40 ? 3 : rec.score >= 25 ? 2 : 1;
  const scoreColor = rec.score >= 70 ? "#16a34a" : rec.score >= 40 ? "#f59e0b" : "#94a3b8";
  const expectedTo = currentMonthlyCount + Math.max(1, Math.ceil(rec.score / 50));

  return (
    <div className={s.recCard}>
      <div className={s.recHeader}>
        <div className={s.recClassInfo}>
          <span className={s.recDow}>{rec.dowLabel}曜</span>
          <span className={s.recTime}>{rec.time}〜{rec.endTime}</span>
        </div>
        <div className={s.recScoreGroup}>
          <StarRating stars={stars} size={12} />
          <span className={s.recScore} style={{ color: scoreColor }}>{rec.score}点</span>
        </div>
      </div>
      <div className={s.recTitle}>{rec.title}</div>
      <div className={s.recTeacher}>{rec.teacher}</div>
      <div className={s.recMeta}>
        <span>平均 {rec.avgAttendees}人</span>
        <span>空き 約{rec.spacesLeft}席</span>
      </div>
      <div className={s.recReasonTitle}>おすすめ理由</div>
      {rec.reasons.map((r, i) => (
        <div key={i} className={s.recReason}>
          <span className={s.recReasonDot}>●</span>{r}
        </div>
      ))}
      <div className={s.recExpect}>
        期待効果: 月{currentMonthlyCount}回→月{expectedTo}回参加が期待できます
      </div>
    </div>
  );
}

// ─── Student Detail Modal ─────────────────────────────────────────────────────

type DetailTab = "overview" | "pattern" | "analysis";

function AttendancePossibilitySection({ student }: { student: StudentAnalysisSummary }) {
  const nextDate = calcNextVisit(student.lastAttendanceDate, student.avgIntervalDays);
  const nextStatus = nextVisitStatus(nextDate);
  const topClass = student.favoriteClasses[0] ?? null;
  const topDow = student.primaryDow !== null ? DOW_LABEL[student.primaryDow] : null;

  return (
    <section className={s.modalSection}>
      <h3 className={s.modalSectionTitle}>参加傾向分析</h3>
      <div className={s.possibilityGrid}>
        {topDow && (
          <div className={s.possibilityItem}>
            <span className={s.possibilityLabel}>よく参加する曜日</span>
            <span className={s.possibilityVal}>{topDow}曜日</span>
          </div>
        )}
        {student.primaryTime && (
          <div className={s.possibilityItem}>
            <span className={s.possibilityLabel}>よく参加する時間帯</span>
            <span className={s.possibilityVal}>{student.primaryTime}〜</span>
          </div>
        )}
        {student.favoriteTeacher && (
          <div className={s.possibilityItem}>
            <span className={s.possibilityLabel}>よく参加する講師</span>
            <span className={s.possibilityVal}>{student.favoriteTeacher}先生</span>
          </div>
        )}
        {topClass && (
          <div className={s.possibilityItem}>
            <span className={s.possibilityLabel}>よく参加するクラス</span>
            <span className={s.possibilityVal}>{topClass}</span>
          </div>
        )}
        {student.avgIntervalDays !== null && (
          <div className={s.possibilityItem}>
            <span className={s.possibilityLabel}>平均参加間隔</span>
            <span className={s.possibilityVal}>{student.avgIntervalDays}日ごと</span>
          </div>
        )}
        {nextStatus && (
          <div className={s.possibilityItem} style={{ gridColumn: "1/-1" }}>
            <span className={s.possibilityLabel}>次回来店予測</span>
            <span className={s.possibilityVal} style={{ color: nextStatus.color }}>
              {nextStatus.label}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function AnalysisGroundsSection({ student }: { student: StudentAnalysisSummary }) {
  const potentialStarsData = (() => {
    const p = student.additionalPotential;
    const r = student.recommendations;
    const d = student.daysSinceLastAttendance;
    const c = student.currentCount;
    const reasons: string[] = [];
    let stars = 1;
    if (p === "高") {
      stars = r.length >= 2 && d !== null && d < 14 ? 5 : 4;
      reasons.push(`今月${c}回参加（増加余地あり）`);
      if (d !== null && d < 14) reasons.push(`直近${d}日以内に参加あり`);
      if (r.length > 0) reasons.push(`おすすめクラス${r.length}件該当`);
      if (student.avgIntervalDays) reasons.push(`平均参加間隔 ${student.avgIntervalDays}日`);
    } else if (p === "中") {
      stars = d !== null && d < 21 ? 3 : 2;
      reasons.push("参加ペースに増加余地あり");
      if (d !== null) reasons.push(`最終参加から${d}日経過`);
    } else {
      stars = 1;
      if (d !== null && d >= 30) reasons.push(`${d}日以上未参加`);
      else if (c >= 8) reasons.push("既に高頻度（増加余地少）");
      else reasons.push("参加回数が少ない");
    }
    return { stars, reasons };
  })();

  return (
    <section className={s.modalSection}>
      <h3 className={s.modalSectionTitle}>分析根拠</h3>

      <div className={s.groundsBlock}>
        <div className={s.groundsLabel}>ポテンシャル判定</div>
        <div className={s.groundsStars}>
          <StarRating stars={potentialStarsData.stars} size={18} />
          <span style={{ marginLeft: 8, fontWeight: 700, color: POTENTIAL_COLOR[student.additionalPotential] }}>
            {student.additionalPotential}
          </span>
        </div>
        {potentialStarsData.reasons.map((r, i) => (
          <div key={i} className={s.groundsReason}>● {r}</div>
        ))}
      </div>

      {student.recommendations.length > 0 && (
        <div className={s.groundsBlock}>
          <div className={s.groundsLabel}>推薦スコア詳細</div>
          {student.recommendations.map((rec) => (
            <div key={rec.slotId} className={s.groundsRecRow}>
              <span className={s.groundsRecTitle}>{rec.title}（{rec.dowLabel}曜 {rec.time}〜）</span>
              <span className={s.groundsRecScore}>{rec.score}点</span>
              <div className={s.groundsRecReasons}>
                {rec.reasons.map((r, i) => <span key={i} className={s.groundsTag}>● {r}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StudentDetailModal({
  student,
  authKey,
  onClose,
}: {
  student: StudentAnalysisSummary;
  authKey: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>("overview");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setTab("overview");
    fetch(`/api/analytics/students/${student.id}`, {
      headers: { "x-analytics-key": authKey },
    })
      .then((r) => r.json())
      .then((d: DetailResponse) => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [student.id, authKey]);

  const TABS: { key: DetailTab; label: string }[] = [
    { key: "overview", label: "基本情報" },
    { key: "pattern",  label: "参加パターン" },
    { key: "analysis", label: "分析根拠" },
  ];

  return (
    <div className={s.modalOverlay} ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className={s.modalPanel}>
        <div className={s.modalHeader}>
          <div className={s.modalStudentInfo}>
            <Avatar src={student.pictureUrl} name={student.name} size={44} />
            <div>
              <div className={s.modalName}>{student.name}</div>
              <div className={s.modalBadgeRow}>
                <Badge label={student.frequencyType} color={FREQUENCY_COLOR[student.frequencyType]} />
                {student.trendType && <Badge label={student.trendType} color={TREND_COLOR[student.trendType]} />}
                {student.behaviorTypes.map((bt) => <Badge key={bt} label={bt} color={BEHAVIOR_COLOR[bt]} />)}
              </div>
            </div>
          </div>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={s.modalTabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`${s.modalTab} ${tab === t.key ? s.modalTabActive : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div className={s.modalLoading}>読み込み中...</div>}

        {!loading && detail && (
          <div className={s.modalBody}>
            {tab === "overview" && (
              <>
                <section className={s.modalSection}>
                  <h3 className={s.modalSectionTitle}>基本情報</h3>
                  <div className={s.infoGrid}>
                    <div className={s.infoItem}><span className={s.infoLabel}>初回参加日</span><span className={s.infoVal}>{detail.firstAttendanceDate ?? "—"}</span></div>
                    <div className={s.infoItem}><span className={s.infoLabel}>累計参加</span><span className={s.infoVal}>{detail.allTimeCount}回</span></div>
                    <div className={s.infoItem}><span className={s.infoLabel}>累計売上</span><span className={s.infoVal}>¥{detail.allTimeRevenue.toLocaleString()}</span></div>
                    <div className={s.infoItem}><span className={s.infoLabel}>今月参加</span><span className={s.infoVal}>{student.currentCount}回</span></div>
                    <div className={s.infoItem}><span className={s.infoLabel}>先月参加</span><span className={s.infoVal}>{student.prevCount}回</span></div>
                    <div className={s.infoItem}><span className={s.infoLabel}>最終参加日</span><span className={s.infoVal}>{student.lastAttendanceDate ?? "—"}</span></div>
                    <div className={s.infoItem}><span className={s.infoLabel}>平均参加間隔</span><span className={s.infoVal}>{student.avgIntervalDays != null ? `${student.avgIntervalDays}日` : "—"}</span></div>
                    <div className={s.infoItem}><span className={s.infoLabel}>参加ポテンシャル</span><span className={s.infoVal}><Badge label={student.additionalPotential} color={POTENTIAL_COLOR[student.additionalPotential]} /></span></div>
                  </div>
                </section>
                <AttendancePossibilitySection student={student} />
                {student.recommendations.length > 0 && (
                  <section className={s.modalSection}>
                    <h3 className={s.modalSectionTitle}>おすすめクラス</h3>
                    {!student.hasEnoughHistory && <p className={s.dataNote}>参加履歴が3件未満のため参考値です</p>}
                    <div className={s.recGrid}>
                      {student.recommendations.map((rec) => (
                        <RecommendationCard key={rec.slotId} rec={rec} currentMonthlyCount={student.currentCount} />
                      ))}
                    </div>
                  </section>
                )}
                {student.recommendations.length === 0 && (
                  <section className={s.modalSection}>
                    <h3 className={s.modalSectionTitle}>おすすめクラス</h3>
                    <p className={s.dataNote}>
                      {!student.hasEnoughHistory ? "履歴不足のため算出できません" : "現在すべてのクラスに参加中か適合なし"}
                    </p>
                  </section>
                )}
                <section className={s.modalSection}>
                  <h3 className={s.modalSectionTitle}>参加履歴（直近100件）</h3>
                  {detail.history.length === 0 ? (
                    <p className={s.dataNote}>参加履歴がありません</p>
                  ) : (
                    <div className={s.historyTableWrap}>
                      <table className={s.historyTable}>
                        <thead><tr><th>日付</th><th>曜</th><th>時間</th><th>クラス名</th><th>講師</th><th>料金</th></tr></thead>
                        <tbody>
                          {detail.history.map((h, i) => (
                            <tr key={i}>
                              <td>{h.date}</td><td>{h.dowLabel}</td><td>{h.time}</td>
                              <td>{h.title || h.type}</td><td>{h.teacher || "—"}</td>
                              <td>¥{h.pricePaid.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

            {tab === "pattern" && (
              <>
                <section className={s.modalSection}>
                  <h3 className={s.modalSectionTitle}>参加パターン</h3>
                  <div className={s.chartGrid}>
                    <div className={s.chartCard}><h4 className={s.chartTitle}>曜日別</h4><MiniBarChart items={detail.distributions.dow.map((d) => ({ label: d.label, count: d.count }))} color="#0090e8" height={100} /></div>
                    <div className={s.chartCard}><h4 className={s.chartTitle}>時間帯別</h4><MiniBarChart items={detail.distributions.time.map((d) => ({ label: d.time, count: d.count }))} color="#e05080" height={100} /></div>
                    <div className={s.chartCard}><h4 className={s.chartTitle}>クラス別</h4><MiniBarChart items={detail.distributions.class.slice(0, 8).map((d) => ({ label: d.title.slice(0, 5), count: d.count }))} color="#7c3aed" height={100} /></div>
                    <div className={s.chartCard}><h4 className={s.chartTitle}>講師別</h4><MiniBarChart items={detail.distributions.teacher.map((d) => ({ label: d.teacher.slice(0, 3), count: d.count }))} color="#f59e0b" height={100} /></div>
                  </div>
                </section>
                <section className={s.modalSection}>
                  <h3 className={s.modalSectionTitle}>月別推移</h3>
                  <div className={s.trendGrid}>
                    <div className={s.trendCard}><h4 className={s.chartTitle}>参加回数</h4><MiniBarChart items={detail.monthlyTrend.map((d) => ({ label: d.label, count: d.count }))} color="#0090e8" height={100} /></div>
                    <div className={s.trendCard}>
                      <h4 className={s.chartTitle}>売上</h4>
                      <div className={s.miniBarChart} style={{ height: 100 }}>
                        {(() => {
                          const max = Math.max(...detail.revenueTrend.map((i) => i.revenue), 1);
                          return detail.revenueTrend.map((item, i) => (
                            <div key={i} className={s.miniBarCol}>
                              <span className={s.miniBarVal}>{item.revenue > 0 ? `¥${Math.round(item.revenue / 1000)}k` : ""}</span>
                              <div className={s.miniBarTrack}><div className={s.miniBarFill} style={{ height: `${(item.revenue / max) * 100}%`, background: "#e05080" }} /></div>
                              <span className={s.miniBarLabel}>{item.label}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {tab === "analysis" && <AnalysisGroundsSection student={student} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const month = getMonths()[0];
    const res = await fetch(`/api/analytics/students?month=${month}`, {
      headers: { "x-analytics-key": pw },
    });
    setLoading(false);
    if (res.ok) { sessionStorage.setItem(SESSION_KEY, pw); onLogin(pw); }
    else setError(true);
  };

  return (
    <div className={s.loginPage}>
      <div className={s.loginCard}>
        <div className={s.loginLogo}>Y-de-ONE</div>
        <p className={s.loginSub}>行動支援ダッシュボード</p>
        <form onSubmit={submit} className={s.loginForm}>
          <input type="password" className={s.loginInput} placeholder="パスワード" value={pw}
            onChange={(e) => setPw(e.target.value)} autoFocus />
          {error && <p className={s.loginError}>パスワードが違います</p>}
          <button type="submit" className={s.loginBtn} disabled={!pw || loading}>
            {loading ? "確認中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentsAnalyticsPage() {
  const months = getMonths();
  const currentMonth = months[0];
  const currentWeek = getMondayStr();

  const [authKey, setAuthKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "custom">("month");
  const [month, setMonth] = useState(currentMonth);
  const [week, setWeek] = useState(currentWeek);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [data, setData] = useState<StudentsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionStats, setActionStats] = useState<ActionStats | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);

  const [sortKey, setSortKey] = useState<SortKey>("currentCount");
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    potentialLevel: "", frequencyType: "", behaviorType: "", dormantOnly: false, primaryDow: "", searchName: "",
  });
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>("");

  const [selectedStudent, setSelectedStudent] = useState<StudentAnalysisSummary | null>(null);
  const [showCoOccurrence, setShowCoOccurrence] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedTalkScript, setExpandedTalkScript] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setAuthKey(saved);
  }, []);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (viewMode === "month") p.set("month", month);
    else if (viewMode === "week") p.set("week", week);
    else if (customFrom && customTo) { p.set("from", customFrom); p.set("to", customTo); }
    return p.toString();
  }, [viewMode, month, week, customFrom, customTo]);

  const fetchData = useCallback(async () => {
    if (!authKey) return;
    const params = buildParams();
    if (!params) return;
    setLoading(true);
    const res = await fetch(`/api/analytics/students?${params}`, {
      headers: { "x-analytics-key": authKey },
    });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [authKey, buildParams]);

  const fetchActionStats = useCallback(async () => {
    if (!authKey) return;
    const res = await fetch(`/api/analytics/actions?month=${month}`, {
      headers: { "x-analytics-key": authKey },
    });
    if (res.ok) {
      const d = await res.json();
      setActionStats(d.stats);
      setActionLogs(d.logs ?? []);
    }
  }, [authKey, month]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchActionStats(); }, [fetchActionStats]);

  if (!authKey) return <LoginPage onLogin={setAuthKey} />;

  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setAuthKey(null); setData(null); };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortArrow = ({ col }: { col: SortKey }) =>
    sortKey === col ? <span className={s.sortArrow}>{sortAsc ? "▲" : "▼"}</span> : <span className={s.sortArrowInactive}>↕</span>;

  const students = data?.students ?? [];

  const kpiFilteredStudents = (() => {
    if (!kpiFilter) return students;
    switch (kpiFilter) {
      case "potential_high": return students.filter((st) => st.additionalPotential === "高");
      case "low_freq": return students.filter((st) => st.currentCount >= 1 && st.currentCount <= 3);
      case "mid_freq": return students.filter((st) => st.currentCount >= 4 && st.currentCount <= 6);
      case "high_freq": return students.filter((st) => st.currentCount >= 7);
      case "dormant": return students.filter((st) => st.frequencyType === "休眠");
      case "almost_one_more": return students.filter((st) => {
        if (!st.avgIntervalDays || !st.daysSinceLastAttendance) return false;
        return st.daysSinceLastAttendance >= st.avgIntervalDays * 0.8 && st.daysSinceLastAttendance < 30;
      });
      case "today_approach": {
        const ids = new Set((data?.actionStudents ?? []).map((a) => a.id));
        return students.filter((st) => ids.has(st.id));
      }
      case "recruitable": {
        const ids = new Set((data?.classRecruitment ?? []).flatMap((op) => op.candidates.map((c) => c.id)));
        return students.filter((st) => ids.has(st.id));
      }
      default: return students;
    }
  })();

  const filteredStudents = kpiFilteredStudents
    .filter((st) => {
      if (filter.searchName && !st.name.includes(filter.searchName)) return false;
      if (filter.potentialLevel && st.additionalPotential !== filter.potentialLevel) return false;
      if (filter.frequencyType && st.frequencyType !== filter.frequencyType) return false;
      if (filter.behaviorType && !st.behaviorTypes.includes(filter.behaviorType)) return false;
      if (filter.dormantOnly && st.frequencyType !== "休眠") return false;
      if (filter.primaryDow && st.primaryDow !== Number(filter.primaryDow)) return false;
      return true;
    })
    .sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;
      switch (sortKey) {
        case "name": valA = a.name; valB = b.name; break;
        case "currentCount": valA = a.currentCount; valB = b.currentCount; break;
        case "prevCount": valA = a.prevCount; valB = b.prevCount; break;
        case "changeCount": valA = a.changeCount; valB = b.changeCount; break;
        case "currentRevenue": valA = a.currentRevenue; valB = b.currentRevenue; break;
        case "lastAttendanceDate": valA = a.lastAttendanceDate ?? ""; valB = b.lastAttendanceDate ?? ""; break;
        case "avgIntervalDays": valA = a.avgIntervalDays ?? 9999; valB = b.avgIntervalDays ?? 9999; break;
        case "daysSinceLastAttendance": valA = a.daysSinceLastAttendance ?? 9999; valB = b.daysSinceLastAttendance ?? 9999; break;
        case "nextVisit": {
          const ndA = calcNextVisit(a.lastAttendanceDate, a.avgIntervalDays);
          const ndB = calcNextVisit(b.lastAttendanceDate, b.avgIntervalDays);
          valA = ndA ?? "9999-99-99"; valB = ndB ?? "9999-99-99";
          break;
        }
        case "frequencyType": {
          const order = { 高頻度: 0, 中頻度: 1, 低頻度: 2, 休眠: 3 };
          valA = order[a.frequencyType]; valB = order[b.frequencyType]; break;
        }
        case "additionalPotential": {
          const order = { 高: 0, 中: 1, 低: 2 };
          valA = order[a.additionalPotential]; valB = order[b.additionalPotential]; break;
        }
      }
      if (typeof valA === "string" && typeof valB === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  const { kpi } = data ?? {};

  type KpiCardConfig = {
    val: string;
    label: string;
    color?: string;
    filter: KpiFilter;
    sub?: string;
  };

  const kpiCards1: KpiCardConfig[] = kpi ? [
    { val: `${kpi.regularMemberCount}人`, label: "レギュラーメンバー", filter: "" },
    { val: `${kpi.avgAttendancePerStudent}回`, label: "1人あたり平均参加", filter: "", sub: kpi.prevPeriodAvg > 0 ? `前期 ${kpi.prevPeriodAvg}回 (${kpi.periodChange != null ? (kpi.periodChange > 0 ? "+" : "") + Math.round(kpi.periodChange * 100) + "%" : "—"})` : undefined },
    { val: `${kpi.totalAttendance}回`, label: "総参加回数", filter: "" },
    { val: `¥${kpi.totalRevenue.toLocaleString()}`, label: "総売上", filter: "" },
    { val: `${kpi.dormantCount}人`, label: "30日以上未参加", color: kpi.dormantCount > 0 ? "#e05080" : "#16a34a", filter: "dormant" },
    { val: `${kpi.additionalPotentialCount}人`, label: "参加ポテンシャル高", color: kpi.additionalPotentialCount > 0 ? "#16a34a" : "#94a3b8", filter: "potential_high" },
  ] : [];

  const kpiCards2: KpiCardConfig[] = kpi ? [
    { val: `${kpi.lowFreqCount}人`, label: "月1〜3回（低頻度）", color: "#f59e0b", filter: "low_freq" },
    { val: `${kpi.midFreqCount}人`, label: "月4〜6回（中頻度）", color: "#0090e8", filter: "mid_freq" },
    { val: `${kpi.highFreqCount}人`, label: "月7回以上（高頻度）", color: "#16a34a", filter: "high_freq" },
    { val: `${kpi.almostOneMoreCount}人`, label: "今月あと1回来そう", color: "#0090e8", filter: "almost_one_more" },
    { val: `${kpi.todayApproachCount}人`, label: "今日アプローチ推奨", color: "#e05080", filter: "today_approach" },
    { val: `${kpi.recruitableClassCount}クラス`, label: "集客チャンスあり", color: "#7c3aed", filter: "recruitable" },
  ] : [];

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.headerLogo}>Y-de-ONE</span>
          <span className={s.headerDivider}>/</span>
          <Link href="/analytics" className={s.headerNav}>Analytics</Link>
          <span className={s.headerDivider}>/</span>
          <span className={s.headerTitle}>行動支援ダッシュボード</span>
        </div>
        <div className={s.headerRight}>
          <div className={s.viewModeTabs}>
            {(["month", "week", "custom"] as const).map((mode) => (
              <button key={mode}
                className={`${s.viewModeTab} ${viewMode === mode ? s.viewModeTabActive : ""}`}
                onClick={() => setViewMode(mode)}>
                {mode === "month" ? "月別" : mode === "week" ? "週別" : "期間指定"}
              </button>
            ))}
          </div>
          {viewMode === "month" && (
            <div className={s.periodNav}>
              <button className={s.navArrow} onClick={() => setMonth(addMonths(month, -1))}>‹</button>
              <span className={s.periodLabel}>{formatMonthLabel(month)}</span>
              <button className={s.navArrow} onClick={() => setMonth(addMonths(month, 1))} disabled={month >= currentMonth}>›</button>
              {month !== currentMonth && <button className={s.todayBtn} onClick={() => setMonth(currentMonth)}>今月</button>}
            </div>
          )}
          {viewMode === "week" && (
            <div className={s.periodNav}>
              <button className={s.navArrow} onClick={() => setWeek(addWeeks(week, -1))}>‹</button>
              <span className={s.periodLabel} style={{ minWidth: 160 }}>{formatWeekLabel(week)}</span>
              <button className={s.navArrow} onClick={() => setWeek(addWeeks(week, 1))} disabled={week >= currentWeek}>›</button>
              {week !== currentWeek && <button className={s.todayBtn} onClick={() => setWeek(currentWeek)}>今週</button>}
            </div>
          )}
          {viewMode === "custom" && (
            <div className={s.customDateRow}>
              <input type="date" className={s.dateInput} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <span className={s.dateSep}>〜</span>
              <input type="date" className={s.dateInput} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              <button className={s.todayBtn} onClick={fetchData} disabled={!customFrom || !customTo}>適用</button>
            </div>
          )}
          <button className={s.logoutBtn} onClick={logout}>ログアウト</button>
        </div>
      </header>

      <main className={s.main}>
        {loading && <div className={s.loadingBar}><div className={s.loadingBarFill} /></div>}

        {data && (
          <>
            {/* Today's Action Card */}
            <TodayActionCard
              actions={buildTodayActions(data.actionStudents, data.classRecruitment, data.kpi, data.revenueImpact.avgPricePerLesson)}
              onSelectStudent={setSelectedStudent}
              allStudents={students}
              actionPriorityStudents={data.actionStudents}
            />

            {/* Revenue Impact Banner */}
            <RevenueImpactBanner impact={data.revenueImpact} />

            {/* KPI Row 1 */}
            <div className={s.kpiRow}>
              {kpiCards1.map((c) => (
                <div
                  key={c.label}
                  className={`${s.kpiCard} ${c.filter && kpiFilter === c.filter ? s.kpiCardActive : ""} ${c.filter ? s.kpiCardClickable : ""}`}
                  onClick={() => {
                    if (!c.filter) return;
                    setKpiFilter((prev) => prev === c.filter ? "" : c.filter);
                    setShowCoOccurrence(false);
                  }}
                  title={c.filter ? "クリックして絞り込み" : undefined}
                >
                  <span className={s.kpiVal} style={{ color: c.color }}>{c.val}</span>
                  <span className={s.kpiLabel}>{c.label}</span>
                  {c.sub && <span className={s.kpiSub}>{c.sub}</span>}
                  {c.filter && <span className={s.kpiFilterHint}>{kpiFilter === c.filter ? "絞込中 ✕" : "▼ 絞込"}</span>}
                </div>
              ))}
            </div>

            {/* KPI Row 2 */}
            <div className={s.kpiRow} style={{ marginTop: -8 }}>
              {kpiCards2.map((c) => (
                <div
                  key={c.label}
                  className={`${s.kpiCard} ${kpiFilter === c.filter ? s.kpiCardActive : ""} ${s.kpiCardClickable}`}
                  onClick={() => {
                    setKpiFilter((prev) => prev === c.filter ? "" : c.filter);
                    setShowCoOccurrence(false);
                  }}
                >
                  <span className={s.kpiVal} style={{ color: c.color }}>{c.val}</span>
                  <span className={s.kpiLabel}>{c.label}</span>
                  <span className={s.kpiFilterHint}>{kpiFilter === c.filter ? "絞込中 ✕" : "▼ 絞込"}</span>
                </div>
              ))}
            </div>

            {kpiFilter && (
              <div className={s.kpiFilterBanner}>
                絞込中: <strong>{kpiCards1.find((c) => c.filter === kpiFilter)?.label ?? kpiCards2.find((c) => c.filter === kpiFilter)?.label}</strong>
                <button className={s.kpiFilterClear} onClick={() => setKpiFilter("")}>✕ 解除</button>
              </div>
            )}

            {data.period && (
              <p className={s.periodInfo}>集計期間: {data.period.from} 〜 {data.period.to.slice(0, 10)} ／ 比較期間: {data.period.prevFrom} 〜 {data.period.prevTo.slice(0, 10)}</p>
            )}

            {!kpiFilter && (
              <>
                <ActionStudentsSection
                  students={data.actionStudents}
                  allStudents={students}
                  onSelectStudent={setSelectedStudent}
                  authKey={authKey!}
                  onActionLogged={fetchActionStats}
                />
                <ClassRecruitmentSection
                  opportunities={data.classRecruitment}
                  onSelectStudent={setSelectedStudent}
                  allStudents={students}
                />
                <MonthlyDistributionSection buckets={data.monthlyDistribution} />
              </>
            )}

            {/* Search + Filter */}
            <div className={s.controlRow}>
              <input className={s.searchInput} placeholder="生徒名で検索..."
                value={filter.searchName} onChange={(e) => setFilter((f) => ({ ...f, searchName: e.target.value }))} />
              <button className={`${s.filterToggle} ${filterOpen ? s.filterToggleActive : ""}`}
                onClick={() => setFilterOpen((v) => !v)}>
                絞り込み {filterOpen ? "▲" : "▼"}
              </button>
              <span className={s.resultCount}>{filteredStudents.length}人表示</span>
              <button className={s.cooccurrenceBtn} onClick={() => setShowCoOccurrence((v) => !v)}>
                {showCoOccurrence ? "生徒一覧に戻る" : "共起分析を見る"}
              </button>
            </div>

            {filterOpen && (
              <div className={s.filterPanel}>
                <div className={s.filterRow}>
                  <label className={s.filterLabel}>参加頻度</label>
                  <select className={s.filterSelect} value={filter.frequencyType}
                    onChange={(e) => setFilter((f) => ({ ...f, frequencyType: e.target.value as FrequencyType | "" }))}>
                    <option value="">すべて</option>
                    <option value="高頻度">高頻度（月8回以上）</option>
                    <option value="中頻度">中頻度（月4〜7回）</option>
                    <option value="低頻度">低頻度（月1〜3回）</option>
                    <option value="休眠">休眠（30日以上未参加）</option>
                  </select>
                </div>
                <div className={s.filterRow}>
                  <label className={s.filterLabel}>参加ポテンシャル</label>
                  <select className={s.filterSelect} value={filter.potentialLevel}
                    onChange={(e) => setFilter((f) => ({ ...f, potentialLevel: e.target.value as PotentialLevel | "" }))}>
                    <option value="">すべて</option>
                    <option value="高">高</option><option value="中">中</option><option value="低">低</option>
                  </select>
                </div>
                <div className={s.filterRow}>
                  <label className={s.filterLabel}>参加傾向タイプ</label>
                  <select className={s.filterSelect} value={filter.behaviorType}
                    onChange={(e) => setFilter((f) => ({ ...f, behaviorType: e.target.value as BehaviorType | "" }))}>
                    <option value="">すべて</option>
                    <option value="固定クラス型">固定クラス型</option>
                    <option value="曜日固定型">曜日固定型</option>
                    <option value="複数クラス型">複数クラス型</option>
                  </select>
                </div>
                <div className={s.filterRow}>
                  <label className={s.filterLabel}>主な参加曜日</label>
                  <select className={s.filterSelect} value={filter.primaryDow}
                    onChange={(e) => setFilter((f) => ({ ...f, primaryDow: e.target.value }))}>
                    <option value="">すべて</option>
                    {[2, 3, 4, 5, 6, 0].map((dow) => (
                      <option key={dow} value={String(dow)}>{DOW_LABEL[dow]}曜日</option>
                    ))}
                  </select>
                </div>
                <div className={s.filterRow}>
                  <label className={s.filterLabel}>30日以上不参加のみ</label>
                  <input type="checkbox" checked={filter.dormantOnly}
                    onChange={(e) => setFilter((f) => ({ ...f, dormantOnly: e.target.checked }))}
                    className={s.filterCheckbox} />
                </div>
                <button className={s.filterClear}
                  onClick={() => setFilter({ potentialLevel: "", frequencyType: "", behaviorType: "", dormantOnly: false, primaryDow: "", searchName: "" })}>
                  絞り込みをクリア
                </button>
              </div>
            )}

            {/* Co-occurrence View */}
            {showCoOccurrence && (
              <section className={s.section}>
                <h2 className={s.sectionTitle}>
                  クラス間 共起分析
                  <span className={s.sectionSub}>同じ生徒が複数参加しているクラスの組み合わせ</span>
                </h2>
                {data.coOccurrence.length === 0 ? (
                  <p className={s.empty}>データが不足しています</p>
                ) : (
                  <div className={s.coCards}>
                    {data.coOccurrence.map((pair, i) => {
                      const rateColor = pair.coRate >= 0.5 ? "#16a34a" : pair.coRate >= 0.3 ? "#f59e0b" : "#94a3b8";
                      const isExpanded = expandedTalkScript === `${i}`;
                      return (
                        <div key={i} className={`${s.coCard} ${pair.isReferenceOnly ? s.coCardRef : ""}`}>
                          <div className={s.coFlow}>
                            <div className={s.coClass}>{pair.classALabel}</div>
                            <div className={s.coArrow}>
                              <div className={s.coRate} style={{ color: rateColor }}>{Math.round(pair.coRate * 100)}%</div>
                              <div className={s.coArrowLine}>→</div>
                            </div>
                            <div className={s.coClass}>{pair.classBLabel}</div>
                          </div>
                          <div className={s.coMeta}>
                            <span>{pair.participantsA}人中 {pair.both}人が両方参加</span>
                            {pair.isReferenceOnly && <span className={s.refLabel}>参考値</span>}
                          </div>
                          <button className={s.coTalkBtn}
                            onClick={() => setExpandedTalkScript(isExpanded ? null : `${i}`)}>
                            おすすめトーク {isExpanded ? "▲" : "▼"}
                          </button>
                          {isExpanded && <div className={s.coTalkScript}>{pair.talkScript}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Student Table */}
            {!showCoOccurrence && (
              <section className={s.section}>
                <div className={s.tableWrap}>
                  <table className={s.studentTable}>
                    <thead>
                      <tr>
                        <th className={s.thName}><button onClick={() => handleSort("name")} className={s.thBtn}>生徒名 <SortArrow col="name" /></button></th>
                        <th><button onClick={() => handleSort("currentCount")} className={s.thBtn}>今月 <SortArrow col="currentCount" /></button></th>
                        <th><button onClick={() => handleSort("prevCount")} className={s.thBtn}>先月 <SortArrow col="prevCount" /></button></th>
                        <th><button onClick={() => handleSort("changeCount")} className={s.thBtn}>前月比 <SortArrow col="changeCount" /></button></th>
                        <th><button onClick={() => handleSort("currentRevenue")} className={s.thBtn}>今月売上 <SortArrow col="currentRevenue" /></button></th>
                        <th><button onClick={() => handleSort("lastAttendanceDate")} className={s.thBtn}>最終参加 <SortArrow col="lastAttendanceDate" /></button></th>
                        <th><button onClick={() => handleSort("nextVisit")} className={s.thBtn}>次回予測 <SortArrow col="nextVisit" /></button></th>
                        <th><button onClick={() => handleSort("avgIntervalDays")} className={s.thBtn}>平均間隔 <SortArrow col="avgIntervalDays" /></button></th>
                        <th>よく参加するクラス</th>
                        <th><button onClick={() => handleSort("frequencyType")} className={s.thBtn}>参加傾向 <SortArrow col="frequencyType" /></button></th>
                        <th><button onClick={() => handleSort("additionalPotential")} className={s.thBtn}>ポテンシャル <SortArrow col="additionalPotential" /></button></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 && (
                        <tr><td colSpan={12} className={s.tdEmpty}>条件に一致する生徒がいません</td></tr>
                      )}
                      {filteredStudents.map((st) => {
                        const nextDate = calcNextVisit(st.lastAttendanceDate, st.avgIntervalDays);
                        const nextStatus = nextVisitStatus(nextDate);
                        const potStars = st.additionalPotential === "高"
                          ? (st.recommendations.length >= 2 ? 5 : 4)
                          : st.additionalPotential === "中" ? 3 : 1;
                        return (
                          <tr key={st.id} className={s.studentRow} onClick={() => setSelectedStudent(st)}>
                            <td>
                              <div className={s.studentNameCell}>
                                <Avatar src={st.pictureUrl} name={st.name} size={28} />
                                <span className={s.studentNameText}>{st.name}</span>
                              </div>
                            </td>
                            <td className={s.tdNum}>{st.currentCount}</td>
                            <td className={s.tdNum}>{st.prevCount}</td>
                            <td className={s.tdNum} style={{ color: changeRateColor(st.changeRate, st.changeCount) }}>
                              {changeRateText(st.changeRate, st.changeCount)}
                            </td>
                            <td className={s.tdNum}>¥{st.currentRevenue.toLocaleString()}</td>
                            <td className={s.tdDate}>
                              {st.lastAttendanceDate ?? <span className={s.noData}>—</span>}
                              {st.daysSinceLastAttendance != null && st.daysSinceLastAttendance >= 30 && (
                                <span className={s.daysAgoBadge}
                                  style={{ color: st.daysSinceLastAttendance >= 60 ? "#e05080" : "#f59e0b" }}>
                                  {st.daysSinceLastAttendance}日前
                                </span>
                              )}
                            </td>
                            <td className={s.tdDate}>
                              {nextStatus
                                ? <span style={{ fontWeight: 600, color: nextStatus.color }}>{nextStatus.label}</span>
                                : <span className={s.noData}>—</span>}
                            </td>
                            <td className={s.tdDate}>
                              {st.avgIntervalDays != null ? `${st.avgIntervalDays}日` : <span className={s.noData}>—</span>}
                            </td>
                            <td className={s.tdClasses}>
                              {st.favoriteClasses.length > 0 ? st.favoriteClasses.slice(0, 2).join(" / ") : <span className={s.noData}>—</span>}
                            </td>
                            <td>
                              <div className={s.badgeRow}>
                                <Badge label={st.frequencyType} color={FREQUENCY_COLOR[st.frequencyType]} small />
                                {st.trendType && <Badge label={st.trendType} color={TREND_COLOR[st.trendType]} small />}
                              </div>
                            </td>
                            <td>
                              <div className={s.potentialCell}>
                                <StarRating stars={potStars} size={11} />
                                <span className={s.potentialLabel} style={{ color: POTENTIAL_COLOR[st.additionalPotential] }}>
                                  {st.additionalPotential}
                                </span>
                              </div>
                            </td>
                            <td>
                              <button className={s.detailBtn}
                                onClick={(e) => { e.stopPropagation(); setSelectedStudent(st); }}>
                                詳細
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Action Stats */}
            {actionStats && (
              <ActionStatsSection
                stats={actionStats}
                logs={actionLogs}
                authKey={authKey!}
                onUpdate={fetchActionStats}
              />
            )}
          </>
        )}

        {!loading && !data && (
          <p className={s.empty} style={{ paddingTop: 64 }}>データを取得できませんでした</p>
        )}
      </main>

      {selectedStudent && authKey && (
        <StudentDetailModal student={selectedStudent} authKey={authKey} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}
