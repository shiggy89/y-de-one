"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import s from "./analytics.module.css";
import {
  FrequencyType, TrendType, BehaviorType, PotentialLevel,
  Recommendation, CoOccurrencePair, StudentAnalysisSummary, StudentsKPI, Period,
  ActionPriorityStudent, ClassRecruitmentOpportunity, MonthlyDistributionBucket,
  RevenueImpact, ScoreBreakdownItem, RecruitmentCandidate,
} from "@/lib/studentAnalytics";

// ─── Raw API Types ─────────────────────────────────────────────────────────────

type Student = { id: number; name: string; picture_url: string | null };
type ClassFillSlot = {
  id: string; day: string; dow: number; title: string; teacher: string;
  time: string; endTime: string; color: string; sessions: number;
  avgAttendees: number; fillRate: number; students: Student[];
};
type RehearsalSlot = { dow: number; title: string; teacher: string; time: string; endTime: string };
type RankItem = Student & { count?: number; total?: number; badgeCount?: number; topBadge?: string; classCount?: number; classes?: string[] };
type ChurnItem = Student & { lastDate: string; daysAgo: number };
type TrendItem = { week?: string; month?: string; label: string; count: number };
type AnalyticsData = {
  kpi: { totalAttendance: number; totalRevenue: number; prevMonthRevenue: number; avgFillPct: number; churnRiskCount: number };
  classFill: ClassFillSlot[];
  rehearsalSlots: RehearsalSlot[];
  individualByDow: Record<number, number>;
  individualStudentsByDow: Record<number, Student[]>;
  rankings: { byAttendance: RankItem[]; byRevenue: RankItem[]; byBadges: RankItem[] };
  churnRisk: ChurnItem[];
  weeklyTrend: TrendItem[];
  monthlyTrend: TrendItem[];
  multiClass: { avgClassesPerStudent: number; multiStudents: RankItem[] };
};
type StudentsData = {
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
  allTimeCount: number; allTimeRevenue: number; firstAttendanceDate: string | null;
  monthlyTrend: { yearMonth: string; label: string; count: number }[];
  revenueTrend: { yearMonth: string; label: string; revenue: number }[];
  distributions: {
    dow: { dow: number; label: string; count: number }[];
    class: { title: string; count: number }[];
    teacher: { teacher: string; count: number }[];
    time: { time: string; count: number }[];
  };
  history: { date: string; dowLabel: string; time: string; title: string; teacher: string; type: string; pricePaid: number }[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = "analytics_key";
const DOW_ORDER = [2, 3, 4, 5, 6, 0];
const DOW_LABEL = ["日", "月", "火", "水", "木", "金", "土"] as const;
const BADGE_EMOJI: Record<string, string> = { normal: "⚪", bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💎", diamond: "💠" };
const FREQUENCY_COLOR: Record<FrequencyType, string> = { 高頻度: "#16a34a", 中頻度: "#0090e8", 低頻度: "#f59e0b", 休眠: "#e05080" };
const POTENTIAL_COLOR: Record<PotentialLevel, string> = { 高: "#16a34a", 中: "#f59e0b", 低: "#94a3b8" };
const BEHAVIOR_COLOR: Record<string, string> = { 固定クラス型: "#7c3aed", 曜日固定型: "#0090e8", 複数クラス型: "#e05080" };
const TREND_COLOR: Record<string, string> = { 増加傾向: "#16a34a", 減少傾向: "#e05080", 安定: "#94a3b8" };

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
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${mon.getFullYear()}/${fmt(mon)}〜${fmt(sun)}`;
}

function formatMonthLabel(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return `${y}/${mo}`;
}

function fillColor(rate: number): string {
  if (rate >= 1) return "#16a34a";
  if (rate >= 0.67) return "#22c55e";
  if (rate >= 0.4) return "#f59e0b";
  return "#e05080";
}

function calcManagementScore(
  ak: AnalyticsData["kpi"],
  sk: StudentsKPI,
): number {
  const revenueScore = ak.prevMonthRevenue > 0
    ? Math.min(20, Math.round((ak.totalRevenue / ak.prevMonthRevenue) * 15))
    : 12;
  const fillScore = Math.round((ak.avgFillPct / 100) * 25);
  const churnScore = Math.max(0, 25 - ak.churnRiskCount * 5);
  const recruitScore = Math.min(15, sk.recruitableClassCount * 4);
  const freqScore = sk.avgAttendancePerStudent >= 4 ? 15 : sk.avgAttendancePerStudent >= 2.5 ? 10 : 5;
  return Math.min(100, revenueScore + fillScore + churnScore + recruitScore + freqScore);
}

function calcForecastRevenue(totalRevenue: number): number {
  const now = new Date();
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.round(totalRevenue * daysInMonth / day);
}

function calcNextVisit(lastDate: string | null, avgInterval: number | null): string | null {
  if (!lastDate || !avgInterval) return null;
  const d = new Date(lastDate + "T00:00:00");
  d.setDate(d.getDate() + Math.round(avgInterval));
  return d.toISOString().split("T")[0];
}

function nextVisitStatus(nextDate: string | null): { label: string; color: string } | null {
  if (!nextDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nd = new Date(nextDate + "T00:00:00");
  const diffDays = Math.round((today.getTime() - nd.getTime()) / 86400000);
  if (diffDays < 0) { const m = nd.getMonth() + 1; const d = nd.getDate(); return { label: `${m}/${d}頃`, color: "#16a34a" }; }
  if (diffDays === 0) return { label: "今日頃", color: "#f59e0b" };
  if (diffDays <= 7) return { label: `${diffDays}日超過`, color: "#f59e0b" };
  return { label: `${diffDays}日超過`, color: "#e05080" };
}

// ─── Base UI Components ───────────────────────────────────────────────────────

function Avatar({ src, name, size = 28 }: { src: string | null; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className={s.avatar} style={{ width: size, height: size, fontSize: size * 0.44, flexShrink: 0 }}>
        {(name || "?")[0]}
      </div>
    );
  }
  return <img src={src} alt={name} className={s.avatarImg} style={{ width: size, height: size, flexShrink: 0 }} onError={() => setBroken(true)} />;
}

function Badge({ label, color, small }: { label: string; color: string; small?: boolean }) {
  return (
    <span className={s.badge} style={{ background: color + "18", color, borderColor: color + "40", fontSize: small ? 10 : 11 }}>
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

function BarTrend({ items, color = "#e05080" }: { items: TrendItem[]; color?: string }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className={s.barTrend}>
      {items.map((item, i) => (
        <div key={i} className={s.barTrendCol}>
          <span className={s.barTrendVal}>{item.count || ""}</span>
          <div className={s.barTrendTrack}>
            <div className={s.barTrendFill} style={{ height: `${(item.count / max) * 100}%`, background: color }} />
          </div>
          <span className={s.barTrendLabel}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function MiniBarChart({ items, color = "#0090e8", height = 80 }: { items: { label: string; count: number }[]; color?: string; height?: number }) {
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

function CollapsibleSection({
  title, sub, children, defaultOpen = false, id,
}: {
  title: string; sub?: string; children: React.ReactNode; defaultOpen?: boolean; id?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={s.collapseSection} id={id}>
      <button className={s.collapseHeader} onClick={() => setOpen((v) => !v)}>
        <div className={s.collapseHeaderLeft}>
          <span className={s.collapseTitle}>{title}</span>
          {sub && <span className={s.collapseSub}>{sub}</span>}
        </div>
        <span className={s.collapseIcon}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className={s.collapseBody}>{children}</div>}
    </section>
  );
}

// ─── ② 今日やること Hero Card ─────────────────────────────────────────────────

type TodayAction = { rank: number; stars: number; label: string; detail: string; expectedRevenue: string; color: string };

function buildTodayActions(
  actionStudents: ActionPriorityStudent[],
  classRecruitment: ClassRecruitmentOpportunity[],
  churnRisk: ChurnItem[],
  avgPrice: number,
): TodayAction[] {
  const items: TodayAction[] = [];
  actionStudents.slice(0, 2).forEach((st, i) => {
    items.push({
      rank: i + 1,
      stars: st.priorityStars,
      label: `${st.name} さんへ声かけ`,
      detail: st.priorityReasons[0] ?? "参加履歴からタイミング到来",
      expectedRevenue: `期待 +¥${(avgPrice * 2).toLocaleString()}`,
      color: i === 0 ? "#e05080" : "#f59e0b",
    });
  });
  if (classRecruitment[0]) {
    const op = classRecruitment[0];
    items.push({
      rank: items.length + 1,
      stars: 4,
      label: `${op.title}（${op.dowLabel}曜 ${op.time}〜）へ${op.candidateCount}名案内`,
      detail: `空き${op.spacesLeft}席 · 候補${op.candidateCount}名確認済み`,
      expectedRevenue: `期待 +${op.candidateCount}レッスン`,
      color: "#0090e8",
    });
  }
  if (churnRisk[0] && items.length < 5) {
    items.push({
      rank: items.length + 1,
      stars: 3,
      label: `${churnRisk[0].name} さんへ復帰連絡`,
      detail: `${churnRisk[0].daysAgo}日以上未参加 — 早めのフォローが効果的`,
      expectedRevenue: "復帰期待",
      color: "#7c3aed",
    });
  }
  return items.slice(0, 5);
}

function TodayActionCard({
  actions, lineSentCount, announcedCount,
}: { actions: TodayAction[]; lineSentCount: number; announcedCount: number }) {
  if (actions.length === 0) return null;
  return (
    <div className={s.todayHero}>
      <div className={s.todayHeroHeader}>
        <span className={s.todayHeroIcon}>⚡</span>
        <span className={s.todayHeroTitle}>今日やること</span>
        {(lineSentCount > 0 || announcedCount > 0) && (
          <span className={s.todayHeroDone}>
            {lineSentCount > 0 && `LINE済み ${lineSentCount}件`}
            {lineSentCount > 0 && announcedCount > 0 && " · "}
            {announcedCount > 0 && `案内済み ${announcedCount}件`}
          </span>
        )}
      </div>
      <div className={s.todayHeroList}>
        {actions.map((a, i) => (
          <div key={i} className={s.todayHeroItem} style={{ borderLeftColor: a.color }}>
            <div className={s.todayHeroRank} style={{ background: a.color }}>{a.rank}</div>
            <div className={s.todayHeroContent}>
              <div className={s.todayHeroLabel}>{a.label}</div>
              <div className={s.todayHeroDetail}>{a.detail}</div>
            </div>
            <div className={s.todayHeroRight}>
              <StarRating stars={a.stars} size={11} />
              <div className={s.todayHeroExpect} style={{ color: a.color }}>{a.expectedRevenue}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ① 経営サマリー KPI ───────────────────────────────────────────────────────

type KpiDrillTarget = "" | "churn" | "fill" | "action" | "recruit" | "potential" | "lowfreq" | "highfreq";
type KpiCard = { val: string; label: string; drill: KpiDrillTarget; color?: string; sub?: string };

function KpiSection({
  ak, sk, revenueImpact, month,
  onDrill, drillTarget,
}: {
  ak: AnalyticsData["kpi"]; sk: StudentsKPI; revenueImpact: RevenueImpact;
  month: string; onDrill: (t: KpiDrillTarget) => void; drillTarget: KpiDrillTarget;
}) {
  const score = calcManagementScore(ak, sk);
  const scoreColor = score >= 80 ? "#16a34a" : score >= 60 ? "#f59e0b" : "#e05080";
  const scoreLabel = score >= 80 ? "良好" : score >= 60 ? "普通" : "要改善";
  const forecast = calcForecastRevenue(ak.totalRevenue);
  const revenueChange = ak.prevMonthRevenue > 0
    ? Math.round(((ak.totalRevenue - ak.prevMonthRevenue) / ak.prevMonthRevenue) * 100)
    : null;

  const CARDS1: KpiCard[] = [
    {
      val: `¥${ak.totalRevenue.toLocaleString()}`, label: "今月売上",
      sub: ak.prevMonthRevenue > 0 ? `前月 ¥${ak.prevMonthRevenue.toLocaleString()}` : undefined,
      drill: "" as KpiDrillTarget,
    },
    {
      val: revenueChange !== null ? `${revenueChange > 0 ? "+" : ""}${revenueChange}%` : "—",
      label: "前月比",
      color: revenueChange !== null ? (revenueChange > 0 ? "#16a34a" : revenueChange < 0 ? "#e05080" : "#94a3b8") : "#94a3b8",
      drill: "" as KpiDrillTarget,
    },
    { val: `${ak.totalAttendance}回`, label: "延べ参加人数", drill: "" as KpiDrillTarget },
    {
      val: `${ak.avgFillPct}%`, label: "平均充填率",
      color: fillColor(ak.avgFillPct / 100),
      drill: "fill" as KpiDrillTarget,
    },
    {
      val: `${ak.churnRiskCount}人`, label: "チャーンリスク",
      color: ak.churnRiskCount > 0 ? "#e05080" : "#16a34a",
      drill: "churn" as KpiDrillTarget,
    },
    {
      val: `${sk.regularMemberCount}人中 ${sk.avgAttendancePerStudent}回`,
      label: "平均参加回数",
      drill: "" as KpiDrillTarget,
    },
  ];
  const CARDS2: KpiCard[] = [
    { val: `¥${forecast.toLocaleString()}`, label: "今月予測売上", color: "#7c3aed", drill: "" as KpiDrillTarget },
    { val: `+¥${revenueImpact.additionalRevenue.toLocaleString()}`, label: "期待追加売上", color: "#16a34a", drill: "potential" as KpiDrillTarget },
    {
      val: `${score}点`, label: "経営スコア", color: scoreColor,
      sub: scoreLabel, drill: "" as KpiDrillTarget,
    },
    {
      val: `${sk.additionalPotentialCount}人`, label: "参加ポテンシャル高",
      color: sk.additionalPotentialCount > 0 ? "#16a34a" : "#94a3b8",
      drill: "potential" as KpiDrillTarget,
    },
    {
      val: `${sk.todayApproachCount}人`, label: "今日アプローチ推奨",
      color: "#e05080", drill: "action" as KpiDrillTarget,
    },
    {
      val: `${sk.recruitableClassCount}クラス`, label: "集客チャンスあり",
      color: "#0090e8", drill: "recruit" as KpiDrillTarget,
    },
  ];

  const renderCard = (c: KpiCard, i: number) => (
    <div
      key={i}
      className={`${s.kpiCard} ${c.drill ? s.kpiCardClickable : ""} ${drillTarget === c.drill && c.drill ? s.kpiCardActive : ""}`}
      onClick={() => c.drill ? onDrill(drillTarget === c.drill ? "" : c.drill) : undefined}
      title={c.drill ? "クリックしてドリルダウン" : undefined}
    >
      <span className={s.kpiVal} style={{ color: (c as { color?: string }).color }}>{c.val}</span>
      <span className={s.kpiLabel}>{c.label}</span>
      {(c as { sub?: string }).sub && <span className={s.kpiSub}>{(c as { sub?: string }).sub}</span>}
      {c.drill && <span className={s.kpiDrillHint}>{drillTarget === c.drill ? "▲ 閉じる" : "▼ 詳細"}</span>}
    </div>
  );

  return (
    <>
      <div className={s.kpiRow}>{CARDS1.map((c, i) => renderCard(c, i))}</div>
      <div className={s.kpiRow} style={{ marginTop: -8 }}>{CARDS2.map((c, i) => renderCard(c, i))}</div>
    </>
  );
}

// ─── ③ 今日アプローチすべき生徒 ──────────────────────────────────────────────

function ActionStudentsSection({
  students, allStudents, onSelectStudent, lineSent, onToggleLine, avgPrice,
}: {
  students: ActionPriorityStudent[];
  allStudents: StudentAnalysisSummary[];
  onSelectStudent: (st: StudentAnalysisSummary) => void;
  lineSent: Set<number>;
  onToggleLine: (id: number) => void;
  avgPrice: number;
}) {
  const [expandedBreakdown, setExpandedBreakdown] = useState<number | null>(null);
  if (students.length === 0) return null;
  const STAR_BORDER: Record<number, string> = { 5: "#e05080", 4: "#f59e0b", 3: "#0090e8", 2: "#94a3b8", 1: "#cbd5e1" };

  return (
    <section className={s.section} id="section-action">
      <h2 className={s.sectionTitle}>
        今日アプローチすべき生徒
        <span className={s.sectionSub}>参加履歴から優先度を算出 — 上位{students.length}名</span>
      </h2>
      <div className={s.actionGrid}>
        {students.map((st) => {
          const full = allStudents.find((a) => a.id === st.id);
          const sent = lineSent.has(st.id);
          const isBreakdownOpen = expandedBreakdown === st.id;
          const expectedRev = `+¥${(avgPrice * 2).toLocaleString()}`;
          return (
            <div key={st.id} className={`${s.actionCard} ${sent ? s.actionCardSent : ""}`}
              style={{ borderLeft: `4px solid ${STAR_BORDER[st.priorityStars] ?? "#e2e8f0"}` }}>
              <div className={s.actionCardHeader}>
                <Avatar src={st.pictureUrl} name={st.name} size={36} />
                <div className={s.actionCardMeta}>
                  <div className={s.actionCardName}>{st.name}</div>
                  <StarRating stars={st.priorityStars} size={13} />
                </div>
                <div className={s.actionCardRight}>
                  <div className={s.actionExpect} style={{ color: sent ? "#94a3b8" : "#16a34a" }}>{expectedRev}</div>
                  <button className={s.actionScoreBtn}
                    onClick={() => setExpandedBreakdown(isBreakdownOpen ? null : st.id)}>
                    {st.priorityScore}pt {isBreakdownOpen ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {isBreakdownOpen && (
                <div className={s.breakdown}>
                  <div className={s.breakdownTitle}>スコア内訳</div>
                  {st.scoreBreakdown.map((item, i) => (
                    <div key={i} className={s.breakdownItem}>
                      <span className={s.breakdownPts} style={{ color: item.points > 0 ? "#16a34a" : "#e05080" }}>
                        {item.points > 0 ? `+${item.points}` : item.points}
                      </span>
                      <span className={s.breakdownLabel}>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={s.actionCardStats}>
                <div className={s.actionStat}><span className={s.actionStatLabel}>今月</span><span className={s.actionStatVal}>{st.currentCount}回</span></div>
                <div className={s.actionStat}><span className={s.actionStatLabel}>最終参加</span><span className={s.actionStatVal}>{st.daysSinceLastAttendance !== null ? `${st.daysSinceLastAttendance}日前` : "—"}</span></div>
                <div className={s.actionStat}><span className={s.actionStatLabel}>平均間隔</span><span className={s.actionStatVal}>{st.avgIntervalDays !== null ? `${st.avgIntervalDays}日` : "—"}</span></div>
              </div>

              {st.topRecommendation && (
                <div className={s.actionRec}>
                  <span className={s.actionRecLabel}>おすすめ</span>
                  <span className={s.actionRecVal}>{st.topRecommendation.dowLabel}曜 {st.topRecommendation.time}〜 {st.topRecommendation.title}</span>
                </div>
              )}

              <div className={s.actionCardFooter}>
                <button
                  className={`${s.lineBtn} ${sent ? s.lineBtnSent : ""}`}
                  onClick={() => onToggleLine(st.id)}
                >
                  {sent ? "✓ LINE済み" : "LINE送信済みにする"}
                </button>
                {full && (
                  <button className={s.detailBtn} onClick={() => onSelectStudent(full)}>詳細</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── ④ クラス別集客チャンス ───────────────────────────────────────────────────

function ClassRecruitmentSection({
  opportunities, allStudents, onSelectStudent, announced, onToggleAnnounce, avgPrice,
}: {
  opportunities: ClassRecruitmentOpportunity[];
  allStudents: StudentAnalysisSummary[];
  onSelectStudent: (st: StudentAnalysisSummary) => void;
  announced: Set<string>;
  onToggleAnnounce: (key: string) => void;
  avgPrice: number;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (opportunities.length === 0) return null;

  return (
    <section className={s.section} id="section-recruit">
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
              <div className={s.recruitFillWrap}>
                <div className={s.recruitFillBar} style={{ width: `${Math.min(100, (op.avgAttendees / 15) * 100)}%` }} />
              </div>
              <div className={s.recruitFillLabel}>平均 {op.avgAttendees}人 / 定員15名</div>
              <button className={s.recruitExpandBtn}
                onClick={() => setExpanded(isOpen ? null : op.slotId)}>
                候補 {op.candidateCount}名を{isOpen ? "閉じる ▲" : "見る ▼"}
              </button>
              {isOpen && (
                <div className={s.recruitCandList}>
                  {op.candidates.map((c, i) => {
                    const full = allStudents.find((a) => a.id === c.id);
                    const recStars = c.recScore >= 70 ? 5 : c.recScore >= 55 ? 4 : c.recScore >= 40 ? 3 : c.recScore >= 25 ? 2 : 1;
                    const annKey = `${op.slotId}_${c.id}`;
                    const isAnnounced = announced.has(annKey);
                    const expectedRev = `+¥${avgPrice.toLocaleString()}`;
                    const participationRate = `参加率 ${Math.round(c.recScore * 0.7)}%`;
                    return (
                      <div key={c.id} className={`${s.recruitCandItem} ${isAnnounced ? s.recruitCandAnnounced : ""}`}>
                        <span className={s.recruitCandRank}>#{i + 1}</span>
                        <Avatar src={c.pictureUrl} name={c.name} size={28} />
                        <div className={s.recruitCandInfo}>
                          <div className={s.recruitCandName}>{c.name}</div>
                          <StarRating stars={recStars} size={11} />
                          {c.recReasons.slice(0, 2).map((r, ri) => (
                            <div key={ri} className={s.recruitCandReason}>● {r}</div>
                          ))}
                          <div className={s.recruitCandMeta}>
                            <span className={s.recruitCandExpect}>{participationRate}</span>
                            <span className={s.recruitCandExpect} style={{ color: "#16a34a" }}>{expectedRev}</span>
                          </div>
                        </div>
                        <div className={s.recruitCandActions}>
                          <button
                            className={`${s.recruitCandAnnounceBtn} ${isAnnounced ? s.recruitCandAnnouncedBtn : ""}`}
                            onClick={() => onToggleAnnounce(annKey)}
                          >
                            {isAnnounced ? "✓ 案内済み" : "案内済みに"}
                          </button>
                          {full && (
                            <button className={s.recruitCandDetailBtn} onClick={() => onSelectStudent(full)}>詳細</button>
                          )}
                        </div>
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

// ─── ⑤ クラス別充填状況 ──────────────────────────────────────────────────────

type FillSort = "space" | "popular" | "dow";

function ClassFillSection({
  classFill, rehearsalSlots, individualByDow, individualStudentsByDow, classRecruitment,
  classViewMode, classWeek, classMonth, currentWeek, currentMonth,
  onChangeMode, onChangeWeek, onChangeMonth,
}: {
  classFill: ClassFillSlot[];
  rehearsalSlots: RehearsalSlot[];
  individualByDow: Record<number, number>;
  individualStudentsByDow: Record<number, Student[]>;
  classRecruitment: ClassRecruitmentOpportunity[];
  classViewMode: "week" | "month";
  classWeek: string; classMonth: string; currentWeek: string; currentMonth: string;
  onChangeMode: (m: "week" | "month") => void;
  onChangeWeek: (w: string) => void;
  onChangeMonth: (m: string) => void;
}) {
  const [fillSort, setFillSort] = useState<FillSort>("dow");
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [expandedExtra, setExpandedExtra] = useState<string | null>(null);

  const recruitMap = new Map(classRecruitment.map((op) => [op.slotId, op.candidateCount]));

  const sortedFill = [...classFill].sort((a, b) => {
    if (fillSort === "space") return (15 - a.avgAttendees) - (15 - b.avgAttendees);
    if (fillSort === "popular") return b.avgAttendees - a.avgAttendees;
    const ai = DOW_ORDER.indexOf(a.dow); const bi = DOW_ORDER.indexOf(b.dow);
    return ai !== bi ? ai - bi : a.time.localeCompare(b.time);
  });

  const byDow = fillSort === "dow"
    ? DOW_ORDER.map((dow) => ({
      dow, day: DOW_LABEL[dow],
      classes: sortedFill.filter((c) => c.dow === dow),
      rehearsals: rehearsalSlots.filter((r) => r.dow === dow),
      individualCount: individualByDow[dow] ?? 0,
      individualStudents: individualStudentsByDow[dow] ?? [],
    })).filter((d) => d.classes.length > 0 || d.rehearsals.length > 0)
    : [{ dow: -1, day: "", classes: sortedFill, rehearsals: [], individualCount: 0, individualStudents: [] }];

  return (
    <section className={s.section} id="section-fill">
      <div className={s.fillSectionHeader}>
        <h2 className={s.sectionTitle}>
          クラス別 充填状況
          <span className={s.sectionSub}>目標 15人/クラス</span>
        </h2>
        <div className={s.fillControls}>
          <div className={s.fillSortTabs}>
            {([["dow", "曜日順"], ["space", "空席多い順"], ["popular", "人気順"]] as [FillSort, string][]).map(([k, l]) => (
              <button key={k} className={`${s.fillSortTab} ${fillSort === k ? s.fillSortTabActive : ""}`}
                onClick={() => setFillSort(k)}>{l}</button>
            ))}
          </div>
          <div className={s.classPeriodControl}>
            <div className={s.viewModeTabs}>
              {(["week", "month"] as const).map((mode) => (
                <button key={mode}
                  className={`${s.viewModeTab} ${classViewMode === mode ? s.viewModeTabActive : ""}`}
                  onClick={() => onChangeMode(mode)}>
                  {mode === "week" ? "週別" : "月別"}
                </button>
              ))}
            </div>
            {classViewMode === "week" ? (
              <div className={s.periodNav}>
                <button className={s.navArrow} onClick={() => onChangeWeek(addWeeks(classWeek, -1))}>‹</button>
                <span className={s.periodLabel}>{formatWeekLabel(classWeek)}</span>
                <button className={s.navArrow} onClick={() => onChangeWeek(addWeeks(classWeek, 1))} disabled={classWeek >= currentWeek}>›</button>
                {classWeek !== currentWeek && <button className={s.todayBtn} onClick={() => onChangeWeek(currentWeek)}>今週</button>}
              </div>
            ) : (
              <div className={s.periodNav}>
                <button className={s.navArrow} onClick={() => onChangeMonth(addMonths(classMonth, -1))}>‹</button>
                <span className={s.periodLabel}>{formatMonthLabel(classMonth)}</span>
                <button className={s.navArrow} onClick={() => onChangeMonth(addMonths(classMonth, 1))} disabled={classMonth >= currentMonth}>›</button>
                {classMonth !== currentMonth && <button className={s.todayBtn} onClick={() => onChangeMonth(currentMonth)}>今月</button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {fillSort === "dow" ? (
        <div className={s.scheduleGrid}>
          {byDow.map(({ dow, day, classes, rehearsals, individualCount, individualStudents }) => (
            <div key={dow} className={s.dayCol}>
              <div className={s.dayHeader}>{day}曜日</div>
              {classes.map((c) => {
                const color = fillColor(c.fillRate);
                const pct = Math.min(c.fillRate * 100, 100);
                const isOpen = expandedClass === c.id;
                const candCount = recruitMap.get(c.id);
                const bgClass = c.color === "pink" ? s.cardPink : c.color === "blue" ? s.cardBlue : c.color === "yellow" ? s.cardYellow : s.classCard;
                return (
                  <div key={c.id} className={`${s.classCard} ${bgClass}`} onClick={() => setExpandedClass(isOpen ? null : c.id)}>
                    {candCount !== undefined && <span className={s.candidateBadge}>候補{candCount}名</span>}
                    <div className={s.classCardHeader}>
                      <span className={s.classTime}>{c.time}〜{c.endTime}</span>
                      <span className={s.classAvg} style={{ color }}>{c.avgAttendees}</span>
                    </div>
                    <div className={s.classTitle}>{c.title}</div>
                    <div className={s.classTeacher}>{c.teacher}</div>
                    <div className={s.fillTrack}><div className={s.fillBar} style={{ width: `${pct}%`, background: color }} /></div>
                    <div className={s.fillLabel} style={{ color }}>{c.sessions > 0 ? `${c.avgAttendees} / 15人` : "データなし"}</div>
                    {isOpen && c.students.length > 0 && (
                      <div className={s.studentAvatars}>
                        {c.students.map((st) => (
                          <div key={st.id} className={s.studentAvatar}>
                            <Avatar src={st.picture_url} name={st.name} size={32} />
                            <span className={s.studentName}>{st.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {rehearsals.map((r) => {
                const rKey = `rehearsal-${r.dow}`;
                const isOpen = expandedExtra === rKey;
                return (
                  <div key={rKey} className={s.rehearsalCard} onClick={() => setExpandedExtra(isOpen ? null : rKey)}>
                    <div className={s.extraCardHeader}>
                      <span className={s.classTime}>{r.time}〜{r.endTime}</span>
                      <span className={s.rehearsalBadge}>スケジュール</span>
                    </div>
                    <div className={s.rehearsalTitle}>{r.title}</div>
                    {isOpen && <div className={s.extraNote}>出席記録なし</div>}
                  </div>
                );
              })}
              {individualCount > 0 && (() => {
                const iKey = `individual-${dow}`;
                const isOpen = expandedExtra === iKey;
                return (
                  <div className={s.individualCard} onClick={() => setExpandedExtra(isOpen ? null : iKey)}>
                    <div className={s.extraCardHeader}>
                      <div className={s.individualTitle}>個人レッスン</div>
                      <div className={s.individualCount}>{individualCount}<span className={s.individualUnit}>件</span></div>
                    </div>
                    {isOpen && individualStudents.length > 0 && (
                      <div className={s.studentAvatars}>
                        {individualStudents.map((st) => (
                          <div key={st.id} className={s.studentAvatar}>
                            <Avatar src={st.picture_url} name={st.name} size={32} />
                            <span className={s.studentName}>{st.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      ) : (
        <div className={s.flatFillGrid}>
          {sortedFill.map((c) => {
            const color = fillColor(c.fillRate);
            const pct = Math.min(c.fillRate * 100, 100);
            const candCount = recruitMap.get(c.id);
            const isOpen = expandedClass === c.id;
            return (
              <div key={c.id} className={s.flatFillCard} onClick={() => setExpandedClass(isOpen ? null : c.id)}>
                {candCount !== undefined && <span className={s.candidateBadge}>候補{candCount}名</span>}
                <div className={s.flatFillHeader}>
                  <span className={s.flatFillDow}>{DOW_LABEL[c.dow]}曜 {c.time}</span>
                  <span className={s.classAvg} style={{ color }}>{c.avgAttendees}</span>
                </div>
                <div className={s.classTitle} style={{ fontSize: 12 }}>{c.title}</div>
                <div className={s.fillTrack}><div className={s.fillBar} style={{ width: `${pct}%`, background: color }} /></div>
                <div className={s.fillLabel} style={{ color, fontSize: 10 }}>{c.sessions > 0 ? `${c.avgAttendees} / 15人` : "データなし"}</div>
                {isOpen && c.students.length > 0 && (
                  <div className={s.studentAvatars}>
                    {c.students.map((st) => (
                      <div key={st.id} className={s.studentAvatar}>
                        <Avatar src={st.picture_url} name={st.name} size={24} />
                        <span className={s.studentName} style={{ fontSize: 9 }}>{st.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── ⑥ チャーンリスク（改善版） ──────────────────────────────────────────────

function ChurnRiskSection({
  churnRisk, studentsData, lineSent, onToggleLine, avgPrice,
}: {
  churnRisk: ChurnItem[];
  studentsData: StudentsData | null;
  lineSent: Set<number>;
  onToggleLine: (id: number) => void;
  avgPrice: number;
}) {
  if (churnRisk.length === 0) return null;
  const studentMap = new Map((studentsData?.students ?? []).map((st) => [st.id, st]));

  return (
    <section className={s.section} id="section-churn">
      <h2 className={s.sectionTitle}>
        チャーンリスク
        <span className={s.sectionSub}>30日以上未参加 — 危険度順</span>
      </h2>
      <div className={s.churnNewGrid}>
        {churnRisk.map((c) => {
          const st = studentMap.get(c.id);
          const sent = lineSent.has(c.id);
          const overdueDays = st?.avgIntervalDays ? Math.max(0, c.daysAgo - st.avgIntervalDays) : null;
          const dangerColor = c.daysAgo >= 60 ? "#e05080" : "#f59e0b";
          const topRec = st?.recommendations[0];
          const expectedRev = `+¥${(avgPrice * 4).toLocaleString()}`;

          return (
            <div key={c.id} className={`${s.churnNewCard} ${sent ? s.churnCardSent : ""}`}>
              <div className={s.churnNewHeader}>
                <Avatar src={c.picture_url} name={c.name} size={40} />
                <div className={s.churnNewInfo}>
                  <div className={s.churnNewName}>{c.name}</div>
                  <div className={s.churnDangerBadge} style={{ background: dangerColor + "20", color: dangerColor, borderColor: dangerColor + "40" }}>
                    {c.daysAgo}日未参加
                  </div>
                </div>
                <div className={s.churnExpect} style={{ color: sent ? "#94a3b8" : "#16a34a" }}>{expectedRev}</div>
              </div>

              <div className={s.churnStatRow}>
                <div className={s.churnStatItem}>
                  <span className={s.churnStatLabel}>最終参加</span>
                  <span className={s.churnStatVal}>{c.lastDate}</span>
                </div>
                {st?.avgIntervalDays && (
                  <div className={s.churnStatItem}>
                    <span className={s.churnStatLabel}>平均間隔</span>
                    <span className={s.churnStatVal}>{st.avgIntervalDays}日</span>
                  </div>
                )}
                {overdueDays !== null && overdueDays > 0 && (
                  <div className={s.churnStatItem}>
                    <span className={s.churnStatLabel}>超過</span>
                    <span className={s.churnStatVal} style={{ color: dangerColor }}>{overdueDays}日</span>
                  </div>
                )}
              </div>

              {topRec && (
                <div className={s.churnRecRow}>
                  <span className={s.churnRecLabel}>おすすめ</span>
                  <span className={s.churnRecVal}>{topRec.dowLabel}曜 {topRec.time}〜 {topRec.title}</span>
                </div>
              )}

              <button className={`${s.churnLineBtn} ${sent ? s.churnLineBtnSent : ""}`}
                onClick={() => onToggleLine(c.id)}>
                {sent ? "✓ LINE済み" : "LINE送信済みにする"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── 売上インパクトバナー ─────────────────────────────────────────────────────

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
          {expanded ? "▲ 閉じる" : "▼ 計算式"}
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
      {expanded && <div className={s.impactFormula}>計算式: {impact.formula}</div>}
    </div>
  );
}

// ─── 生徒テーブル（詳細分析内） ───────────────────────────────────────────────

type SortKey = "name" | "currentCount" | "currentRevenue" | "lastAttendanceDate" | "avgIntervalDays" | "frequencyType" | "additionalPotential" | "nextVisit";

function StudentTable({
  students, onSelectStudent,
}: { students: StudentAnalysisSummary[]; onSelectStudent: (st: StudentAnalysisSummary) => void }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("currentCount");
  const [sortAsc, setSortAsc] = useState(false);
  const [freqFilter, setFreqFilter] = useState<FrequencyType | "">("");
  const [potFilter, setPotFilter] = useState<PotentialLevel | "">("");

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortAsc((v) => !v); else { setSortKey(k); setSortAsc(false); }
  };

  const filtered = students
    .filter((st) => {
      if (search && !st.name.includes(search)) return false;
      if (freqFilter && st.frequencyType !== freqFilter) return false;
      if (potFilter && st.additionalPotential !== potFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let va: number | string = 0; let vb: number | string = 0;
      switch (sortKey) {
        case "name": va = a.name; vb = b.name; break;
        case "currentCount": va = a.currentCount; vb = b.currentCount; break;
        case "currentRevenue": va = a.currentRevenue; vb = b.currentRevenue; break;
        case "lastAttendanceDate": va = a.lastAttendanceDate ?? ""; vb = b.lastAttendanceDate ?? ""; break;
        case "avgIntervalDays": va = a.avgIntervalDays ?? 9999; vb = b.avgIntervalDays ?? 9999; break;
        case "frequencyType": { const o = { 高頻度: 0, 中頻度: 1, 低頻度: 2, 休眠: 3 }; va = o[a.frequencyType]; vb = o[b.frequencyType]; break; }
        case "additionalPotential": { const o = { 高: 0, 中: 1, 低: 2 }; va = o[a.additionalPotential]; vb = o[b.additionalPotential]; break; }
        case "nextVisit": {
          va = calcNextVisit(a.lastAttendanceDate, a.avgIntervalDays) ?? "9999-99-99";
          vb = calcNextVisit(b.lastAttendanceDate, b.avgIntervalDays) ?? "9999-99-99";
          break;
        }
      }
      if (typeof va === "string" && typeof vb === "string") return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

  const Arr = ({ col }: { col: SortKey }) => (
    sortKey === col
      ? <span className={s.sortArrow}>{sortAsc ? "▲" : "▼"}</span>
      : <span className={s.sortArrowInactive}>↕</span>
  );

  return (
    <>
      <div className={s.studentTableControls}>
        <input className={s.searchInput} placeholder="生徒名で検索..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={s.filterSelect} value={freqFilter} onChange={(e) => setFreqFilter(e.target.value as FrequencyType | "")}>
          <option value="">参加頻度：すべて</option>
          <option value="高頻度">高頻度</option><option value="中頻度">中頻度</option>
          <option value="低頻度">低頻度</option><option value="休眠">休眠</option>
        </select>
        <select className={s.filterSelect} value={potFilter} onChange={(e) => setPotFilter(e.target.value as PotentialLevel | "")}>
          <option value="">ポテンシャル：すべて</option>
          <option value="高">高</option><option value="中">中</option><option value="低">低</option>
        </select>
        <span className={s.resultCount}>{filtered.length}人</span>
      </div>
      <div className={s.tableWrap}>
        <table className={s.studentTable}>
          <thead>
            <tr>
              <th className={s.thName}><button onClick={() => handleSort("name")} className={s.thBtn}>生徒名 <Arr col="name" /></button></th>
              <th><button onClick={() => handleSort("currentCount")} className={s.thBtn}>今月 <Arr col="currentCount" /></button></th>
              <th><button onClick={() => handleSort("currentRevenue")} className={s.thBtn}>売上 <Arr col="currentRevenue" /></button></th>
              <th><button onClick={() => handleSort("lastAttendanceDate")} className={s.thBtn}>最終参加 <Arr col="lastAttendanceDate" /></button></th>
              <th><button onClick={() => handleSort("nextVisit")} className={s.thBtn}>次回予測 <Arr col="nextVisit" /></button></th>
              <th><button onClick={() => handleSort("avgIntervalDays")} className={s.thBtn}>平均間隔 <Arr col="avgIntervalDays" /></button></th>
              <th><button onClick={() => handleSort("frequencyType")} className={s.thBtn}>頻度 <Arr col="frequencyType" /></button></th>
              <th><button onClick={() => handleSort("additionalPotential")} className={s.thBtn}>ポテンシャル <Arr col="additionalPotential" /></button></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} className={s.tdEmpty}>条件に一致する生徒がいません</td></tr>}
            {filtered.map((st) => {
              const nextDate = calcNextVisit(st.lastAttendanceDate, st.avgIntervalDays);
              const nextStatus = nextVisitStatus(nextDate);
              return (
                <tr key={st.id} className={s.studentRow} onClick={() => onSelectStudent(st)}>
                  <td>
                    <div className={s.studentNameCell}>
                      <Avatar src={st.pictureUrl} name={st.name} size={26} />
                      <span className={s.studentNameText}>{st.name}</span>
                    </div>
                  </td>
                  <td className={s.tdNum}>{st.currentCount}</td>
                  <td className={s.tdNum}>¥{st.currentRevenue.toLocaleString()}</td>
                  <td className={s.tdDate}>{st.lastAttendanceDate ?? "—"}</td>
                  <td className={s.tdDate}>
                    {nextStatus ? <span style={{ fontWeight: 600, color: nextStatus.color }}>{nextStatus.label}</span> : "—"}
                  </td>
                  <td className={s.tdDate}>{st.avgIntervalDays != null ? `${st.avgIntervalDays}日` : "—"}</td>
                  <td><Badge label={st.frequencyType} color={FREQUENCY_COLOR[st.frequencyType]} small /></td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <StarRating stars={st.additionalPotential === "高" ? 5 : st.additionalPotential === "中" ? 3 : 1} size={10} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: POTENTIAL_COLOR[st.additionalPotential] }}>{st.additionalPotential}</span>
                    </div>
                  </td>
                  <td>
                    <button className={s.detailBtn} onClick={(e) => { e.stopPropagation(); onSelectStudent(st); }}>詳細</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── ⑩ 今日の営業成果 ────────────────────────────────────────────────────────

function SalesResultsSection({
  lineSentCount, announcedCount, avgPrice,
}: { lineSentCount: number; announcedCount: number; avgPrice: number }) {
  const total = lineSentCount + announcedCount;
  const estimatedRev = lineSentCount * avgPrice * 2;

  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>
        今日の営業成果
        <span className={s.sectionSub}>本日のアクション結果</span>
      </h2>
      <div className={s.salesFunnel}>
        <div className={s.salesStep}>
          <span className={s.salesStepVal} style={{ color: total > 0 ? "#0090e8" : "#94a3b8" }}>{total}件</span>
          <span className={s.salesStepLabel}>LINE送信 / 案内</span>
        </div>
        <div className={s.salesArrow}>→</div>
        <div className={s.salesStep}>
          <span className={s.salesStepVal} style={{ color: "#94a3b8" }}>—</span>
          <span className={s.salesStepLabel}>参加予定</span>
          <span className={s.salesStepNote}>次回来店時に確認</span>
        </div>
        <div className={s.salesArrow}>→</div>
        <div className={s.salesStep}>
          <span className={s.salesStepVal} style={{ color: "#94a3b8" }}>—</span>
          <span className={s.salesStepLabel}>実際参加</span>
          <span className={s.salesStepNote}>来店後に記録</span>
        </div>
        <div className={s.salesArrow}>→</div>
        <div className={s.salesStep}>
          <span className={s.salesStepVal} style={{ color: estimatedRev > 0 ? "#16a34a" : "#94a3b8" }}>
            {estimatedRev > 0 ? `+¥${estimatedRev.toLocaleString()}` : "—"}
          </span>
          <span className={s.salesStepLabel}>追加売上（推定）</span>
          <span className={s.salesStepNote}>{lineSentCount}名 × 2回 × 単価</span>
        </div>
      </div>
    </section>
  );
}

// ─── 生徒詳細モーダル ─────────────────────────────────────────────────────────

type DetailTab = "overview" | "pattern" | "analysis";

function StudentDetailModal({
  student, authKey, onClose,
}: { student: StudentAnalysisSummary; authKey: string; onClose: () => void }) {
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>("overview");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true); setTab("overview");
    fetch(`/api/analytics/students/${student.id}`, { headers: { "x-analytics-key": authKey } })
      .then((r) => r.json()).then((d) => { setDetail(d); setLoading(false); }).catch(() => setLoading(false));
  }, [student.id, authKey]);

  const TABS: { key: DetailTab; label: string }[] = [
    { key: "overview", label: "基本情報" },
    { key: "pattern", label: "参加パターン" },
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
            <button key={t.key} className={`${s.modalTab} ${tab === t.key ? s.modalTabActive : ""}`}
              onClick={() => setTab(t.key)}>{t.label}</button>
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
                    <div className={s.infoItem}><span className={s.infoLabel}>最終参加日</span><span className={s.infoVal}>{student.lastAttendanceDate ?? "—"}</span></div>
                    <div className={s.infoItem}><span className={s.infoLabel}>平均間隔</span><span className={s.infoVal}>{student.avgIntervalDays != null ? `${student.avgIntervalDays}日` : "—"}</span></div>
                    <div className={s.infoItem}><span className={s.infoLabel}>参加ポテンシャル</span><span className={s.infoVal}><Badge label={student.additionalPotential} color={POTENTIAL_COLOR[student.additionalPotential]} /></span></div>
                    <div className={s.infoItem}><span className={s.infoLabel}>参加頻度</span><span className={s.infoVal}><Badge label={student.frequencyType} color={FREQUENCY_COLOR[student.frequencyType]} /></span></div>
                  </div>
                </section>
                {student.recommendations.length > 0 && (
                  <section className={s.modalSection}>
                    <h3 className={s.modalSectionTitle}>おすすめクラス</h3>
                    <div className={s.recGrid}>
                      {student.recommendations.map((rec) => {
                        const stars = rec.score >= 70 ? 5 : rec.score >= 55 ? 4 : rec.score >= 40 ? 3 : rec.score >= 25 ? 2 : 1;
                        return (
                          <div key={rec.slotId} className={s.recCard}>
                            <div className={s.recHeader}>
                              <div className={s.recClassInfo}>
                                <span className={s.recDow}>{rec.dowLabel}曜 {rec.time}〜{rec.endTime}</span>
                              </div>
                              <div className={s.recScoreGroup}>
                                <StarRating stars={stars} size={12} />
                                <span className={s.recScore} style={{ color: rec.score >= 70 ? "#16a34a" : "#f59e0b" }}>{rec.score}点</span>
                              </div>
                            </div>
                            <div className={s.recTitle}>{rec.title}</div>
                            <div className={s.recTeacher}>{rec.teacher}</div>
                            <div className={s.recMeta}><span>平均 {rec.avgAttendees}人</span><span>空き 約{rec.spacesLeft}席</span></div>
                            {rec.reasons.map((r, i) => (
                              <div key={i} className={s.recReason}><span className={s.recReasonDot}>●</span>{r}</div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
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
                            <tr key={i}><td>{h.date}</td><td>{h.dowLabel}</td><td>{h.time}</td><td>{h.title || h.type}</td><td>{h.teacher || "—"}</td><td>¥{h.pricePaid.toLocaleString()}</td></tr>
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
                  <div className={s.chartGrid}>
                    <div className={s.chartCard}><h4 className={s.chartTitle}>参加回数</h4><MiniBarChart items={detail.monthlyTrend.map((d) => ({ label: d.label, count: d.count }))} color="#0090e8" height={100} /></div>
                    <div className={s.chartCard}>
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
            {tab === "analysis" && (
              <section className={s.modalSection}>
                <h3 className={s.modalSectionTitle}>分析根拠</h3>
                <div className={s.groundsBlock}>
                  <div className={s.groundsLabel}>ポテンシャル判定</div>
                  <div className={s.groundsStars}>
                    <StarRating stars={student.additionalPotential === "高" ? (student.recommendations.length >= 2 ? 5 : 4) : student.additionalPotential === "中" ? 3 : 1} size={18} />
                    <span style={{ marginLeft: 8, fontWeight: 700, color: POTENTIAL_COLOR[student.additionalPotential] }}>{student.additionalPotential}</span>
                  </div>
                  {student.additionalPotential === "高" && <div className={s.groundsReason}>● 今月{student.currentCount}回参加（増加余地あり）</div>}
                  {student.daysSinceLastAttendance !== null && student.daysSinceLastAttendance < 14 && <div className={s.groundsReason}>● 直近{student.daysSinceLastAttendance}日以内に参加あり</div>}
                  {student.avgIntervalDays && <div className={s.groundsReason}>● 平均参加間隔 {student.avgIntervalDays}日</div>}
                  {student.recommendations.length > 0 && <div className={s.groundsReason}>● おすすめクラス{student.recommendations.length}件該当</div>}
                </div>
                {student.recommendations.length > 0 && (
                  <div className={s.groundsBlock}>
                    <div className={s.groundsLabel}>推薦スコア詳細</div>
                    {student.recommendations.map((rec) => (
                      <div key={rec.slotId} className={s.groundsRecRow}>
                        <div className={s.groundsRecTitle}>{rec.title}（{rec.dowLabel}曜 {rec.time}〜）</div>
                        <span className={s.groundsRecScore}>{rec.score}点</span>
                        <div className={s.groundsRecReasons}>
                          {rec.reasons.map((r, i) => <span key={i} className={s.groundsTag}>● {r}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(false);
    const res = await fetch(`/api/analytics?month=${getMonths()[0]}`, { headers: { "x-analytics-key": pw } });
    setLoading(false);
    if (res.ok) { sessionStorage.setItem(SESSION_KEY, pw); onLogin(pw); }
    else setError(true);
  };

  return (
    <div className={s.loginPage}>
      <div className={s.loginCard}>
        <div className={s.loginLogo}>Y-de-ONE</div>
        <p className={s.loginSub}>経営ダッシュボード</p>
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

export default function AnalyticsPage() {
  const months = getMonths();
  const currentMonth = months[0];
  const currentWeek = getMondayStr();

  const [authKey, setAuthKey] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const [classViewMode, setClassViewMode] = useState<"week" | "month">("month");
  const [classWeek, setClassWeek] = useState(currentWeek);
  const [classMonth, setClassMonth] = useState(currentMonth);

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [studentsData, setStudentsData] = useState<StudentsData | null>(null);
  const [loading, setLoading] = useState(false);

  const [lineSent, setLineSent] = useState<Set<number>>(new Set());
  const [announced, setAnnounced] = useState<Set<string>>(new Set());
  const [drillTarget, setDrillTarget] = useState<KpiDrillTarget>("");
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalysisSummary | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setAuthKey(saved);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!authKey) return;
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (classViewMode === "week") params.set("classWeek", classWeek);
    else params.set("classMonth", classMonth);

    const [aRes, sRes] = await Promise.all([
      fetch(`/api/analytics?${params}`, { headers: { "x-analytics-key": authKey } }),
      fetch(`/api/analytics/students?month=${month}`, { headers: { "x-analytics-key": authKey } }),
    ]);
    if (aRes.ok) setAnalyticsData(await aRes.json());
    if (sRes.ok) setStudentsData(await sRes.json());
    setLoading(false);
  }, [authKey, month, classViewMode, classWeek, classMonth]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!authKey) return <LoginPage onLogin={setAuthKey} />;

  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setAuthKey(null); setAnalyticsData(null); setStudentsData(null); };

  const toggleLineSent = (id: number) => {
    setLineSent((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleAnnounced = (key: string) => {
    setAnnounced((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  const handleDrill = (target: KpiDrillTarget) => {
    setDrillTarget(target);
    if (!target) return;
    const idMap: Partial<Record<KpiDrillTarget, string>> = {
      churn: "section-churn", fill: "section-fill",
      action: "section-action", recruit: "section-recruit",
    };
    const id = idMap[target];
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const ak = analyticsData?.kpi;
  const sk = studentsData?.kpi;
  const avgPrice = studentsData?.revenueImpact.avgPricePerLesson ?? 2200;
  const todayActions = studentsData && analyticsData
    ? buildTodayActions(studentsData.actionStudents, studentsData.classRecruitment, analyticsData.churnRisk, avgPrice)
    : [];

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.headerLogo}>Y-de-ONE</span>
          <span className={s.headerDivider}>/</span>
          <span className={s.headerTitle}>経営ダッシュボード</span>
        </div>
        <div className={s.headerRight}>
          <div className={s.monthNav}>
            <button className={s.navArrow} onClick={() => setMonth(addMonths(month, -1))}>‹</button>
            <span className={s.navLabel}>{formatMonthLabel(month)}</span>
            <button className={s.navArrow} onClick={() => setMonth(addMonths(month, 1))} disabled={month >= currentMonth}>›</button>
            {month !== currentMonth && <button className={s.todayBtn} onClick={() => setMonth(currentMonth)}>今月</button>}
          </div>
          <button className={s.logoutBtn} onClick={logout}>ログアウト</button>
        </div>
      </header>

      <main className={s.main}>
        {loading && <div className={s.loadingBar}><div className={s.loadingBarFill} /></div>}

        {(analyticsData || studentsData) && (
          <>
            {/* ② 今日やること */}
            <TodayActionCard
              actions={todayActions}
              lineSentCount={lineSent.size}
              announcedCount={announced.size}
            />

            {/* ① 経営サマリー KPI */}
            {ak && sk && (
              <KpiSection
                ak={ak} sk={sk}
                revenueImpact={studentsData!.revenueImpact}
                month={month}
                onDrill={handleDrill}
                drillTarget={drillTarget}
              />
            )}

            {/* 売上インパクト */}
            {studentsData && <RevenueImpactBanner impact={studentsData.revenueImpact} />}

            {/* ③ 今日アプローチすべき生徒 */}
            {studentsData && (
              <ActionStudentsSection
                students={studentsData.actionStudents}
                allStudents={studentsData.students}
                onSelectStudent={setSelectedStudent}
                lineSent={lineSent}
                onToggleLine={toggleLineSent}
                avgPrice={avgPrice}
              />
            )}

            {/* ④ クラス別集客チャンス */}
            {studentsData && (
              <ClassRecruitmentSection
                opportunities={studentsData.classRecruitment}
                allStudents={studentsData.students}
                onSelectStudent={setSelectedStudent}
                announced={announced}
                onToggleAnnounce={toggleAnnounced}
                avgPrice={avgPrice}
              />
            )}

            {/* ⑤ クラス別充填状況 */}
            {analyticsData && (
              <ClassFillSection
                classFill={analyticsData.classFill}
                rehearsalSlots={analyticsData.rehearsalSlots}
                individualByDow={analyticsData.individualByDow}
                individualStudentsByDow={analyticsData.individualStudentsByDow}
                classRecruitment={studentsData?.classRecruitment ?? []}
                classViewMode={classViewMode}
                classWeek={classWeek} classMonth={classMonth}
                currentWeek={currentWeek} currentMonth={currentMonth}
                onChangeMode={(m) => { setClassViewMode(m); if (m === "week") setClassWeek(currentWeek); else setClassMonth(currentMonth); }}
                onChangeWeek={setClassWeek}
                onChangeMonth={setClassMonth}
              />
            )}

            {/* ⑥ チャーンリスク */}
            {analyticsData && (
              <ChurnRiskSection
                churnRisk={analyticsData.churnRisk}
                studentsData={studentsData}
                lineSent={lineSent}
                onToggleLine={toggleLineSent}
                avgPrice={avgPrice}
              />
            )}

            {/* ⑦ 出席推移（折りたたみ） */}
            {analyticsData && (
              <CollapsibleSection title="出席推移" sub="週別・月別の参加傾向" defaultOpen={false} id="section-trend">
                <div className={s.trendGrid}>
                  <div className={s.trendCard}>
                    <h3 className={s.trendTitle}>週別（過去12週）</h3>
                    <BarTrend items={analyticsData.weeklyTrend} color="#0090e8" />
                  </div>
                  <div className={s.trendCard}>
                    <h3 className={s.trendTitle}>月別（過去12ヶ月）</h3>
                    <BarTrend items={analyticsData.monthlyTrend} color="#e05080" />
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* ⑧ 詳細分析（折りたたみ） */}
            <CollapsibleSection title="詳細分析" sub="ランキング・分布・生徒テーブル" defaultOpen={false} id="section-detail">
              {analyticsData && (
                <>
                  {/* ランキング */}
                  <div className={s.rankingGrid} style={{ marginBottom: 24 }}>
                    <div className={s.rankCard}>
                      <h3 className={s.rankTitle}>出席回数ランキング</h3>
                      {analyticsData.rankings.byAttendance.map((r, i) => (
                        <div key={r.id} className={s.rankRow}>
                          <span className={s.rankNo}>{i + 1}</span>
                          <Avatar src={r.picture_url} name={r.name} size={28} />
                          <span className={s.rankName}>{r.name}</span>
                          <span className={s.rankVal}>{r.count}回</span>
                        </div>
                      ))}
                    </div>
                    <div className={s.rankCard}>
                      <h3 className={s.rankTitle}>支払い金額ランキング</h3>
                      {analyticsData.rankings.byRevenue.map((r, i) => (
                        <div key={r.id} className={s.rankRow}>
                          <span className={s.rankNo}>{i + 1}</span>
                          <Avatar src={r.picture_url} name={r.name} size={28} />
                          <span className={s.rankName}>{r.name}</span>
                          <span className={s.rankVal}>¥{(r.total ?? 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className={s.rankCard}>
                      <h3 className={s.rankTitle}>バッジ獲得月数（累計）</h3>
                      {analyticsData.rankings.byBadges.map((r, i) => (
                        <div key={r.id} className={s.rankRow}>
                          <span className={s.rankNo}>{i + 1}</span>
                          <Avatar src={r.picture_url} name={r.name} size={28} />
                          <span className={s.rankName}>{r.name}</span>
                          <span className={s.rankVal}>{BADGE_EMOJI[r.topBadge ?? "normal"]} {r.badgeCount}ヶ月</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 複数クラス掛け持ち */}
                  {analyticsData.multiClass.multiStudents.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 className={s.rankTitle} style={{ marginBottom: 10 }}>
                        複数クラス掛け持ち — 平均 {analyticsData.multiClass.avgClassesPerStudent} クラス/人
                      </h3>
                      <div className={s.rankCard} style={{ maxWidth: 480 }}>
                        {analyticsData.multiClass.multiStudents.map((r, i) => (
                          <div key={r.id} className={s.rankRow}>
                            <span className={s.rankNo}>{i + 1}</span>
                            <Avatar src={r.picture_url} name={r.name} size={28} />
                            <span className={s.rankName}>{r.name}</span>
                            <span className={s.rankVal}>{r.classCount}クラス</span>
                            <span className={s.multiClasses}>{(r.classes ?? []).join(" / ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 共起分析 */}
              {studentsData && studentsData.coOccurrence.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 className={s.rankTitle} style={{ marginBottom: 10 }}>クラス間 共起分析</h3>
                  <div className={s.coCards}>
                    {studentsData.coOccurrence.slice(0, 10).map((pair, i) => {
                      const rateColor = pair.coRate >= 0.5 ? "#16a34a" : pair.coRate >= 0.3 ? "#f59e0b" : "#94a3b8";
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
                          <div className={s.coMeta}>{pair.participantsA}人中 {pair.both}人が両方参加</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 参加回数分布 */}
              {studentsData && (
                <div style={{ marginBottom: 24 }}>
                  <h3 className={s.rankTitle} style={{ marginBottom: 10 }}>月間参加回数 分布</h3>
                  <div className={s.distCard}>
                    {studentsData.monthlyDistribution.map((b) => {
                      const colors: Record<string, string> = { "0": "#e2e8f0", "1-3": "#f59e0b", "4-6": "#0090e8", "7-9": "#7c3aed", "10+": "#16a34a" };
                      const max = Math.max(...studentsData.monthlyDistribution.map((x) => x.count), 1);
                      return (
                        <div key={b.key} className={s.distRow}>
                          <span className={s.distLabel}>{b.label}</span>
                          <div className={s.distBarTrack}>
                            <div className={s.distBarFill} style={{ width: `${(b.count / max) * 100}%`, background: colors[b.key] ?? "#0090e8" }} />
                          </div>
                          <span className={s.distCount}>{b.count}人</span>
                          <span className={s.distPct}>{b.pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 生徒テーブル */}
              {studentsData && (
                <div>
                  <h3 className={s.rankTitle} style={{ marginBottom: 10 }}>生徒一覧</h3>
                  <StudentTable students={studentsData.students} onSelectStudent={setSelectedStudent} />
                </div>
              )}
            </CollapsibleSection>

            {/* ⑩ 今日の営業成果 */}
            <SalesResultsSection
              lineSentCount={lineSent.size}
              announcedCount={announced.size}
              avgPrice={avgPrice}
            />
          </>
        )}

        {!loading && !analyticsData && !studentsData && (
          <p className={s.empty} style={{ paddingTop: 64 }}>データを取得できませんでした</p>
        )}
      </main>

      {selectedStudent && authKey && (
        <StudentDetailModal student={selectedStudent} authKey={authKey} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}
