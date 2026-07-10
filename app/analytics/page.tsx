"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import s from "./analytics.module.css";
import {
  FrequencyType, TrendType, BehaviorType, PotentialLevel,
  Recommendation, CoOccurrencePair, StudentAnalysisSummary, StudentsKPI, Period,
  ActionPriorityStudent, ClassRecruitmentOpportunity, MonthlyDistributionBucket,
  RevenueImpact, RecruitmentCandidate,
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

function calcManagementScore(ak: AnalyticsData["kpi"], sk: StudentsKPI): number {
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

function getClassHint(c: ClassFillSlot): { text: string; color: string } | null {
  if (c.sessions < 3) return null;
  if (c.fillRate >= 0.85) return { text: "増設候補", color: "#16a34a" };
  if (c.avgAttendees <= 2) return { text: "継続要検討", color: "#e05080" };
  if (c.avgAttendees <= 5) return { text: "時間変更を検討", color: "#f59e0b" };
  return null;
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

// ─── ② 改善提案エンジン ──────────────────────────────────────────────────────

type ProposalType = "time_change" | "expand" | "merge" | "close" | "consecutive" | "teacher_move";

type ImprovementProposal = {
  type: ProposalType;
  stars: number;
  title: string;
  badge: string;
  currentState: string;
  headline: string;
  reason?: string;
  expectedLessons?: number;
  expectedRevenue?: number;
};

const PROPOSAL_COLOR: Record<ProposalType, string> = {
  time_change: "#f59e0b",
  expand: "#16a34a",
  merge: "#7c3aed",
  close: "#e05080",
  consecutive: "#0090e8",
  teacher_move: "#7c3aed",
};

function buildImprovementProposals(
  classFill: ClassFillSlot[],
  classRecruitment: ClassRecruitmentOpportunity[],
  coOccurrence: CoOccurrencePair[],
  avgPrice: number,
): ImprovementProposal[] {
  const PER_MONTH = 4;
  const proposals: ImprovementProposal[] = [];
  const recruitMap = new Map(classRecruitment.map((r) => [r.slotId, r]));

  // Best-performing day average (for time-change recommendations)
  const avgByDow: Record<number, { total: number; count: number }> = {};
  classFill.forEach((c) => {
    if (!avgByDow[c.dow]) avgByDow[c.dow] = { total: 0, count: 0 };
    avgByDow[c.dow].total += c.avgAttendees;
    avgByDow[c.dow].count++;
  });
  const dowAvg = Object.fromEntries(
    Object.entries(avgByDow).map(([k, v]) => [k, v.total / v.count])
  );

  // 1. Low-fill classes → time change / close / merge
  classFill
    .filter((c) => c.sessions >= 3 && c.avgAttendees <= 5)
    .forEach((c) => {
      const bestDow = Object.entries(dowAvg)
        .map(([dow, avg]) => ({ dow: Number(dow), avg }))
        .filter((x) => x.dow !== c.dow)
        .sort((a, b) => b.avg - a.avg)[0];

      if (c.avgAttendees <= 2) {
        // Very low → merge or close
        const similar = classFill.find(
          (x) => x.id !== c.id && x.avgAttendees >= 6 && x.sessions >= 2
        );
        proposals.push({
          type: similar ? "merge" : "close",
          stars: 5,
          title: `${DOW_LABEL[c.dow]}曜 ${c.time} ${c.title}`,
          badge: similar ? "統合候補" : "終了・統合候補",
          currentState: `平均参加 ${c.avgAttendees}人`,
          headline: similar
            ? `${DOW_LABEL[similar.dow]}曜 ${similar.time}との統合を検討`
            : "クラスの終了または統合を推奨",
          reason: similar
            ? `${similar.title}は平均${similar.avgAttendees}人 — 生徒移行でコスト削減`
            : "参加者が少なく採算が難しい状況です",
          expectedLessons: 0,
          expectedRevenue: 0,
        });
      } else {
        // Moderately low → time/day change
        const gainEstimate = bestDow ? Math.round((bestDow.avg - c.avgAttendees) * 0.4) : 2;
        proposals.push({
          type: "time_change",
          stars: c.avgAttendees <= 3 ? 5 : 4,
          title: `${DOW_LABEL[c.dow]}曜 ${c.time} ${c.title}`,
          badge: "時間・曜日変更候補",
          currentState: `平均参加 ${c.avgAttendees}人`,
          headline: bestDow
            ? `${DOW_LABEL[bestDow.dow]}曜への変更を推奨（同曜平均${bestDow.avg.toFixed(1)}人）`
            : "時間帯・曜日の変更で参加率向上を期待",
          reason: `充填率${Math.round(c.fillRate * 100)}% — 他曜日と比較して参加率が低い状況です`,
          expectedLessons: Math.max(0, gainEstimate) * PER_MONTH,
          expectedRevenue: Math.max(0, gainEstimate) * PER_MONTH * avgPrice,
        });
      }
    });

  // 2. High-fill classes → expand
  classFill
    .filter((c) => c.sessions >= 2 && c.fillRate >= 0.75)
    .forEach((c) => {
      const recOp = recruitMap.get(c.id);
      const candCount = recOp?.candidateCount ?? 0;
      const expectedStudents = candCount > 0 ? candCount : Math.round(c.avgAttendees * 0.4);
      proposals.push({
        type: "expand",
        stars: c.fillRate >= 0.9 ? 5 : 4,
        title: `${DOW_LABEL[c.dow]}曜 ${c.time} ${c.title}`,
        badge: "増設候補",
        currentState: `充填率 ${Math.round(c.fillRate * 100)}%（平均${c.avgAttendees}人）`,
        headline: "需要が高いため別曜日・時間での増設を推奨",
        reason: candCount >= 3
          ? `参加候補者が${candCount}名確認済み — 増設で受け皿を増やせます`
          : "充填率が高く新規生徒が入りにくい状況です",
        expectedLessons: expectedStudents * PER_MONTH,
        expectedRevenue: expectedStudents * PER_MONTH * avgPrice,
      });
    });

  // 3. Co-occurrence → consecutive scheduling (only if NOT already on the same day)
  coOccurrence
    .filter((p) => p.coRate >= 0.5 && p.both >= 3 && !p.isReferenceOnly)
    .filter((p) => p.classALabel.split(" ")[0] !== p.classBLabel.split(" ")[0])
    .slice(0, 2)
    .forEach((p) => {
      const potentialStudents = Math.round((p.participantsA - p.both) * 0.3);
      proposals.push({
        type: "consecutive",
        stars: p.coRate >= 0.7 ? 5 : 4,
        title: `${p.classALabel} + ${p.classBLabel}`,
        badge: "同日開催を検討",
        currentState: `${Math.round(p.coRate * 100)}%の生徒が両クラスに参加`,
        headline: "同日連続にまとめると生徒の利便性が向上します",
        reason: `${p.participantsA}名中${p.both}名が両方参加 — スケジュール集約で通いやすくなります`,
        expectedLessons: potentialStudents * PER_MONTH,
        expectedRevenue: potentialStudents * PER_MONTH * avgPrice,
      });
    });

  // 4. Teacher placement: same teacher with high avg elsewhere but low here
  const teacherStats: Record<string, { slots: ClassFillSlot[] }> = {};
  classFill.filter((c) => c.teacher).forEach((c) => {
    if (!teacherStats[c.teacher]) teacherStats[c.teacher] = { slots: [] };
    teacherStats[c.teacher].slots.push(c);
  });
  Object.entries(teacherStats).forEach(([teacher, { slots }]) => {
    if (slots.length < 2) return;
    const avgs = slots.map((c) => c.avgAttendees);
    const maxAvg = Math.max(...avgs);
    const minAvg = Math.min(...avgs);
    if (maxAvg >= 8 && minAvg <= 3 && maxAvg - minAvg >= 5) {
      const lowSlot = slots.find((c) => c.avgAttendees === minAvg)!;
      const highSlot = slots.find((c) => c.avgAttendees === maxAvg)!;
      proposals.push({
        type: "teacher_move",
        stars: 3,
        title: `${teacher} 先生の担当クラス`,
        badge: "講師配置の見直し",
        currentState: `${DOW_LABEL[lowSlot.dow]}曜${lowSlot.title}: 平均${minAvg}人 / ${DOW_LABEL[highSlot.dow]}曜${highSlot.title}: 平均${maxAvg}人`,
        headline: `${DOW_LABEL[highSlot.dow]}曜への配置集中で参加率向上を期待`,
        reason: "同講師でも曜日・時間帯により大きな差があります",
        expectedLessons: (maxAvg - minAvg) * PER_MONTH,
        expectedRevenue: (maxAvg - minAvg) * PER_MONTH * avgPrice,
      });
    }
  });

  return proposals
    .sort((a, b) => b.stars !== a.stars ? b.stars - a.stars : (b.expectedRevenue ?? 0) - (a.expectedRevenue ?? 0))
    .slice(0, 8);
}

function ImprovementProposalSection({ proposals }: { proposals: ImprovementProposal[] }) {
  if (proposals.length === 0) {
    return (
      <section className={s.section}>
        <h2 className={s.sectionTitle}>今月の改善提案 <span className={s.sectionSub}>データ分析から自動生成</span></h2>
        <p className={s.dataNote}>参加データが3回以上あるクラスから改善提案が自動生成されます</p>
      </section>
    );
  }
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>
        今月の改善提案
        <span className={s.sectionSub}>データ分析から自動生成 — {proposals.length}件</span>
      </h2>
      <div className={s.proposalList}>
        {proposals.map((p, i) => {
          const color = PROPOSAL_COLOR[p.type];
          return (
            <div key={i} className={s.proposalCard} style={{ borderLeftColor: color }}>
              <div className={s.proposalCardHead}>
                <StarRating stars={p.stars} size={14} />
                <span className={s.proposalBadge} style={{ background: color + "18", color, borderColor: color + "40" }}>
                  {p.badge}
                </span>
              </div>
              <div className={s.proposalTitle}>{p.title}</div>
              <div className={s.proposalCurrent}>{p.currentState}</div>
              <div className={s.proposalArrow}>↓</div>
              <div className={s.proposalHeadline}>{p.headline}</div>
              {p.reason && <div className={s.proposalReason}>{p.reason}</div>}
              {(p.expectedLessons ?? 0) > 0 && (
                <div className={s.proposalEffect}>
                  <span className={s.proposalEffectLabel}>期待</span>
                  <span className={s.proposalEffectItem}>+{p.expectedLessons}レッスン/月</span>
                  <span className={s.proposalEffectItem} style={{ color: "#16a34a" }}>
                    +¥{(p.expectedRevenue ?? 0).toLocaleString()}/月
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── ① 経営サマリー KPI ───────────────────────────────────────────────────────

type KpiDrillTarget = "" | "churn" | "fill" | "recruit" | "potential" | "lowfreq" | "highfreq";
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
      val: `${ak.churnRiskCount}人`, label: "参加減少傾向",
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
    { val: `+¥${revenueImpact.additionalRevenue.toLocaleString()}`, label: "参加伸び代（推計）", color: "#16a34a", drill: "potential" as KpiDrillTarget },
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
      val: `${sk.recruitableClassCount}クラス`, label: "参加機会あり",
      color: "#0090e8", drill: "recruit" as KpiDrillTarget,
    },
  ];

  const renderCard = (c: KpiCard, i: number) => (
    <div
      key={i}
      className={`${s.kpiCard} ${c.drill ? s.kpiCardClickable : ""} ${drillTarget === c.drill && c.drill ? s.kpiCardActive : ""}`}
      onClick={() => c.drill ? onDrill(drillTarget === c.drill ? "" : c.drill) : undefined}
      title={c.drill ? "クリックで詳細へ" : undefined}
    >
      <span className={s.kpiVal} style={{ color: c.color }}>{c.val}</span>
      <span className={s.kpiLabel}>{c.label}</span>
      {c.sub && <span className={s.kpiSub}>{c.sub}</span>}
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

// ─── ③ クラス別 参加機会 ──────────────────────────────────────────────────────

function ClassRecruitmentSection({
  opportunities, allStudents, onSelectStudent, avgPrice,
}: {
  opportunities: ClassRecruitmentOpportunity[];
  allStudents: StudentAnalysisSummary[];
  onSelectStudent: (st: StudentAnalysisSummary) => void;
  avgPrice: number;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (opportunities.length === 0) return null;

  return (
    <section className={s.section} id="section-recruit">
      <h2 className={s.sectionTitle}>
        クラス別 参加機会
        <span className={s.sectionSub}>空き席 × 参加適性で優先順位付け</span>
      </h2>
      <div className={s.recruitGrid}>
        {opportunities.map((op) => {
          const isOpen = expanded === op.slotId;
          // Improvement hint: lots of candidates → announce; few → consider time change
          const hint = op.candidateCount >= Math.ceil(op.spacesLeft * 0.5)
            ? `適合候補${op.candidateCount}名（充填余地あり）`
            : op.spacesLeft >= 8 && op.candidateCount < 3
              ? "候補者少 — 時間・曜日の変更を検討"
              : `参加適性の高い候補 ${op.candidateCount}名`;

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
              <div className={s.recruitHint}>→ {hint}</div>
              <button className={s.recruitExpandBtn}
                onClick={() => setExpanded(isOpen ? null : op.slotId)}>
                候補 {op.candidateCount}名を{isOpen ? "閉じる ▲" : "見る ▼"}
              </button>
              {isOpen && (
                <div className={s.recruitCandList}>
                  {op.candidates.map((c, i) => {
                    const full = allStudents.find((a) => a.id === c.id);
                    const recStars = c.recScore >= 70 ? 5 : c.recScore >= 55 ? 4 : c.recScore >= 40 ? 3 : c.recScore >= 25 ? 2 : 1;
                    const participationRate = `参加適性 ${Math.round(c.recScore * 0.7)}%`;
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
                          <div className={s.recruitCandMeta}>
                            <span className={s.recruitCandExpect}>{participationRate}</span>
                          </div>
                        </div>
                        {full && (
                          <button className={s.recruitCandDetailBtn} onClick={() => onSelectStudent(full)}>詳細</button>
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

// ─── ④ クラス別充填状況 ──────────────────────────────────────────────────────

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
          <span className={s.sectionSub}>目標 15人/クラス — カードに改善ヒント表示</span>
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
                const hint = getClassHint(c);
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
                    {hint && (
                      <div className={s.classHint} style={{ color: hint.color, borderColor: hint.color + "40", background: hint.color + "10" }}>
                        {hint.text}
                      </div>
                    )}
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
            const hint = getClassHint(c);
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
                {hint && (
                  <div className={s.classHint} style={{ color: hint.color, borderColor: hint.color + "40", background: hint.color + "10", fontSize: 9 }}>
                    {hint.text}
                  </div>
                )}
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

// ─── ⑤ 参加減少傾向（教室改善指標） ─────────────────────────────────────────

function ChurnInsightSection({
  churnRisk, studentsData,
}: {
  churnRisk: ChurnItem[];
  studentsData: StudentsData | null;
}) {
  if (churnRisk.length === 0) return null;
  const studentMap = new Map((studentsData?.students ?? []).map((st) => [st.id, st]));

  const severe = churnRisk.filter((c) => c.daysAgo >= 60);
  const moderate = churnRisk.filter((c) => c.daysAgo >= 30 && c.daysAgo < 60);

  // Aggregate behavior patterns of churned students
  const churnStudents = churnRisk.map((c) => studentMap.get(c.id)).filter(Boolean) as StudentAnalysisSummary[];
  const behaviorCounts: Record<string, number> = {};
  churnStudents.flatMap((st) => st.behaviorTypes).forEach((b) => { behaviorCounts[b] = (behaviorCounts[b] ?? 0) + 1; });
  const topBehavior = Object.entries(behaviorCounts).sort((a, b) => b[1] - a[1])[0];

  const insights: string[] = [];
  if (severe.length >= 2) insights.push(`⚠️ 60日以上未参加が${severe.length}名 — 特定クラスへの集中した離脱がないか確認推奨`);
  if (topBehavior && topBehavior[1] >= 2) {
    const msg = topBehavior[0] === "固定クラス型"
      ? "特定クラスの内容・時間帯を見直し推奨"
      : topBehavior[0] === "曜日固定型"
        ? "特定曜日のクラス構成を見直し推奨"
        : "参加パターンを分析して対応クラスを改善推奨";
    insights.push(`📌 離脱生徒に「${topBehavior[0]}」が多い（${topBehavior[1]}名）— ${msg}`);
  }
  if (moderate.length >= 2) insights.push(`💡 ${moderate.length}名が30〜60日未参加 — 発表会・イベント等の開催タイミングで自然な復帰が期待できます`);

  return (
    <section className={s.section} id="section-churn">
      <h2 className={s.sectionTitle}>
        参加減少傾向の生徒
        <span className={s.sectionSub}>教室改善の指標として分析 — {churnRisk.length}名</span>
      </h2>

      {insights.length > 0 && (
        <div className={s.churnInsightBox}>
          <div className={s.churnInsightTitle}>クラス改善の観点</div>
          {insights.map((txt, i) => (
            <div key={i} className={s.churnInsightPattern}>{txt}</div>
          ))}
        </div>
      )}

      <div className={s.churnNewGrid}>
        {churnRisk.map((c) => {
          const st = studentMap.get(c.id);
          const overdueDays = st?.avgIntervalDays ? Math.max(0, c.daysAgo - st.avgIntervalDays) : null;
          const dangerColor = c.daysAgo >= 60 ? "#e05080" : "#f59e0b";
          const topRec = st?.recommendations[0];

          return (
            <div key={c.id} className={s.churnNewCard}>
              <div className={s.churnNewHeader}>
                <Avatar src={c.picture_url} name={c.name} size={36} />
                <div className={s.churnNewInfo}>
                  <div className={s.churnNewName}>{c.name}</div>
                  <div className={s.churnDangerBadge} style={{ background: dangerColor + "20", color: dangerColor, borderColor: dangerColor + "40" }}>
                    {c.daysAgo}日未参加
                  </div>
                  {st?.frequencyType && <Badge label={st.frequencyType} color={FREQUENCY_COLOR[st.frequencyType]} small />}
                </div>
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
                  <span className={s.churnRecLabel}>参加傾向クラス</span>
                  <span className={s.churnRecVal}>{topRec.dowLabel}曜 {topRec.time}〜 {topRec.title}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── ⑥ 生徒参加分析 ─────────────────────────────────────────────────────────

function RevenueImpactBanner({ impact }: { impact: RevenueImpact }) {
  const [expanded, setExpanded] = useState(false);
  if (impact.targetCount === 0) return null;
  return (
    <div className={s.impactBanner}>
      <div className={s.impactTop}>
        <span className={s.impactIcon}>💡</span>
        <span className={s.impactTitle}>
          参加ポテンシャル高 <strong>{impact.targetCount}名</strong> が月+2回参加した場合の売上予測
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

const FREQ_ORDER: FrequencyType[] = ["高頻度", "中頻度", "低頻度", "休眠"];

function AttendanceInsightSection({
  students, monthlyDistribution, revenueImpact,
}: {
  students: StudentAnalysisSummary[];
  monthlyDistribution: MonthlyDistributionBucket[];
  revenueImpact: RevenueImpact;
}) {
  const byFreq = students.reduce((acc, st) => {
    acc[st.frequencyType] = (acc[st.frequencyType] ?? 0) + 1;
    return acc;
  }, {} as Record<FrequencyType, number>);

  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>
        生徒参加分析
        <span className={s.sectionSub}>参加頻度・ポテンシャル分布</span>
      </h2>

      <div className={s.attendanceGrid}>
        {FREQ_ORDER.map((freq) => {
          const count = byFreq[freq] ?? 0;
          const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
          const color = FREQUENCY_COLOR[freq];
          const insight = freq === "高頻度"
            ? "教室の核となる生徒"
            : freq === "中頻度"
              ? "頻度向上の余地あり"
              : freq === "低頻度"
                ? "クラス構成の見直しで改善可"
                : "参加機会・環境の再検討";
          return (
            <div key={freq} className={s.attendanceCard} style={{ borderLeftColor: color }}>
              <div className={s.attendanceFreqBadge} style={{ color, background: color + "18" }}>{freq}</div>
              <div className={s.attendanceCount} style={{ color }}>{count}<span className={s.attendanceUnit}>人</span></div>
              <div className={s.attendancePct}>{pct}%</div>
              <div className={s.attendanceInsight}>{insight}</div>
            </div>
          );
        })}
      </div>

      <RevenueImpactBanner impact={revenueImpact} />
    </section>
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
        <p className={s.loginSub}>教室改善分析</p>
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

  // ── All hooks must be declared before any conditional return ──
  const ak = analyticsData?.kpi;
  const sk = studentsData?.kpi;
  const avgPrice = studentsData?.revenueImpact.avgPricePerLesson ?? 2200;

  const proposals = useMemo(
    () => analyticsData && studentsData
      ? buildImprovementProposals(
          analyticsData.classFill,
          studentsData.classRecruitment,
          studentsData.coOccurrence,
          avgPrice,
        )
      : [],
    [analyticsData, studentsData, avgPrice],
  );

  if (!authKey) return <LoginPage onLogin={setAuthKey} />;

  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setAuthKey(null); setAnalyticsData(null); setStudentsData(null); };

  const handleDrill = (target: KpiDrillTarget) => {
    setDrillTarget(target);
    if (!target) return;
    const idMap: Partial<Record<KpiDrillTarget, string>> = {
      churn: "section-churn", fill: "section-fill", recruit: "section-recruit",
    };
    const id = idMap[target];
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.headerLogo}>Y-de-ONE</span>
          <span className={s.headerDivider}>/</span>
          <span className={s.headerTitle}>教室改善分析</span>
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

            {/* ② 今月の改善提案 */}
            <ImprovementProposalSection proposals={proposals} />

            {/* ③ クラス別 参加機会 */}
            {studentsData && (
              <ClassRecruitmentSection
                opportunities={studentsData.classRecruitment}
                allStudents={studentsData.students}
                onSelectStudent={setSelectedStudent}
                avgPrice={avgPrice}
              />
            )}

            {/* ④ クラス別 充填状況 */}
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

            {/* ⑤ 参加減少傾向（教室改善指標） */}
            {analyticsData && (
              <ChurnInsightSection
                churnRisk={analyticsData.churnRisk}
                studentsData={studentsData}
              />
            )}

            {/* ⑥ 生徒参加分析 */}
            {studentsData && (
              <AttendanceInsightSection
                students={studentsData.students}
                monthlyDistribution={studentsData.monthlyDistribution}
                revenueImpact={studentsData.revenueImpact}
              />
            )}

            {/* ⑦ 詳細分析（折りたたみ） */}
            <CollapsibleSection title="詳細分析" sub="出席推移・ランキング・共起分析・生徒テーブル" defaultOpen={false} id="section-detail">
              {analyticsData && (
                <>
                  {/* 出席推移 */}
                  <div className={s.trendGrid} style={{ marginBottom: 24 }}>
                    <div className={s.trendCard}>
                      <h3 className={s.trendTitle}>週別（過去12週）</h3>
                      <BarTrend items={analyticsData.weeklyTrend} color="#0090e8" />
                    </div>
                    <div className={s.trendCard}>
                      <h3 className={s.trendTitle}>月別（過去12ヶ月）</h3>
                      <BarTrend items={analyticsData.monthlyTrend} color="#e05080" />
                    </div>
                  </div>

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

                  {/* 複数クラス */}
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
