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
} from "@/lib/studentAnalytics";

// ─── Types ────────────────────────────────────────────────────────────────────

type DistEntry = { count: number };
type StudentsResponse = {
  period: Period;
  kpi: StudentsKPI;
  students: StudentAnalysisSummary[];
  coOccurrence: CoOccurrencePair[];
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
  | "additionalPotential" | "daysSinceLastAttendance";

type FilterState = {
  potentialLevel: PotentialLevel | "";
  frequencyType: FrequencyType | "";
  behaviorType: BehaviorType | "";
  dormantOnly: boolean;
  primaryDow: string;
  searchName: string;
};

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

function Badge({
  label,
  color,
  small,
}: {
  label: string;
  color: string;
  small?: boolean;
}) {
  return (
    <span
      className={s.badge}
      style={{
        background: color + "18",
        color,
        borderColor: color + "40",
        fontSize: small ? 10 : 11,
      }}
    >
      {label}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 28 }: { src: string | null; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div
        className={s.avatar}
        style={{ width: size, height: size, fontSize: size * 0.42, flexShrink: 0 }}
      >
        {(name || "?")[0]}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className={s.avatarImg}
      style={{ width: size, height: size, flexShrink: 0 }}
      onError={() => setBroken(true)}
    />
  );
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function MiniBarChart({
  items,
  color = "#0090e8",
  height = 80,
}: {
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
            <div
              className={s.miniBarFill}
              style={{ height: `${(item.count / max) * 100}%`, background: color }}
            />
          </div>
          <span className={s.miniBarLabel}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const scoreColor =
    rec.score >= 70 ? "#16a34a" : rec.score >= 40 ? "#f59e0b" : "#94a3b8";
  return (
    <div className={s.recCard}>
      <div className={s.recHeader}>
        <div className={s.recClassInfo}>
          <span className={s.recDow}>{rec.dowLabel}曜</span>
          <span className={s.recTime}>{rec.time}〜{rec.endTime}</span>
        </div>
        <span className={s.recScore} style={{ color: scoreColor }}>
          {rec.score}pt
        </span>
      </div>
      <div className={s.recTitle}>{rec.title}</div>
      <div className={s.recTeacher}>{rec.teacher}</div>
      <div className={s.recMeta}>
        <span>平均 {rec.avgAttendees}人</span>
        <span>空き 約{rec.spacesLeft}席</span>
      </div>
      {rec.reasons.map((r, i) => (
        <div key={i} className={s.recReason}>
          <span className={s.recReasonDot}>●</span>
          {r}
        </div>
      ))}
    </div>
  );
}

// ─── Student Detail Modal ─────────────────────────────────────────────────────

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
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/students/${student.id}`, {
      headers: { "x-analytics-key": authKey },
    })
      .then((r) => r.json())
      .then((d: DetailResponse) => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [student.id, authKey]);

  return (
    <div
      className={s.modalOverlay}
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={s.modalPanel}>
        {/* Header */}
        <div className={s.modalHeader}>
          <div className={s.modalStudentInfo}>
            <Avatar src={student.pictureUrl} name={student.name} size={44} />
            <div>
              <div className={s.modalName}>{student.name}</div>
              <div className={s.modalBadgeRow}>
                <Badge
                  label={student.frequencyType}
                  color={FREQUENCY_COLOR[student.frequencyType]}
                />
                {student.trendType && (
                  <Badge
                    label={student.trendType}
                    color={TREND_COLOR[student.trendType]}
                  />
                )}
                {student.behaviorTypes.map((bt) => (
                  <Badge key={bt} label={bt} color={BEHAVIOR_COLOR[bt]} />
                ))}
              </div>
            </div>
          </div>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>

        {loading && <div className={s.modalLoading}>読み込み中...</div>}

        {!loading && detail && (
          <div className={s.modalBody}>
            {/* Basic Info */}
            <section className={s.modalSection}>
              <h3 className={s.modalSectionTitle}>基本情報</h3>
              <div className={s.infoGrid}>
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>初回参加日</span>
                  <span className={s.infoVal}>{detail.firstAttendanceDate ?? "—"}</span>
                </div>
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>累計参加回数</span>
                  <span className={s.infoVal}>{detail.allTimeCount}回</span>
                </div>
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>累計売上</span>
                  <span className={s.infoVal}>¥{detail.allTimeRevenue.toLocaleString()}</span>
                </div>
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>今月参加</span>
                  <span className={s.infoVal}>{student.currentCount}回</span>
                </div>
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>先月参加</span>
                  <span className={s.infoVal}>{student.prevCount}回</span>
                </div>
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>最終参加日</span>
                  <span className={s.infoVal}>{student.lastAttendanceDate ?? "—"}</span>
                </div>
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>平均参加間隔</span>
                  <span className={s.infoVal}>
                    {student.avgIntervalDays != null ? `${student.avgIntervalDays}日` : "—"}
                  </span>
                </div>
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>追加参加ポテンシャル</span>
                  <span className={s.infoVal}>
                    <Badge
                      label={student.additionalPotential}
                      color={POTENTIAL_COLOR[student.additionalPotential]}
                    />
                  </span>
                </div>
              </div>
            </section>

            {/* Distributions */}
            <section className={s.modalSection}>
              <h3 className={s.modalSectionTitle}>参加傾向</h3>
              <div className={s.chartGrid}>
                <div className={s.chartCard}>
                  <h4 className={s.chartTitle}>曜日別</h4>
                  <MiniBarChart
                    items={detail.distributions.dow.map((d) => ({ label: d.label, count: d.count }))}
                    color="#0090e8"
                    height={100}
                  />
                </div>
                <div className={s.chartCard}>
                  <h4 className={s.chartTitle}>時間帯別</h4>
                  <MiniBarChart
                    items={detail.distributions.time.map((d) => ({ label: d.time, count: d.count }))}
                    color="#e05080"
                    height={100}
                  />
                </div>
                <div className={s.chartCard}>
                  <h4 className={s.chartTitle}>クラス別</h4>
                  <MiniBarChart
                    items={detail.distributions.class.slice(0, 8).map((d) => ({ label: d.title.slice(0, 5), count: d.count }))}
                    color="#7c3aed"
                    height={100}
                  />
                </div>
                <div className={s.chartCard}>
                  <h4 className={s.chartTitle}>講師別</h4>
                  <MiniBarChart
                    items={detail.distributions.teacher.map((d) => ({ label: d.teacher.slice(0, 3), count: d.count }))}
                    color="#f59e0b"
                    height={100}
                  />
                </div>
              </div>
            </section>

            {/* Monthly Trend */}
            <section className={s.modalSection}>
              <h3 className={s.modalSectionTitle}>月別推移</h3>
              <div className={s.trendGrid}>
                <div className={s.trendCard}>
                  <h4 className={s.chartTitle}>参加回数</h4>
                  <MiniBarChart
                    items={detail.monthlyTrend.map((d) => ({ label: d.label, count: d.count }))}
                    color="#0090e8"
                    height={100}
                  />
                </div>
                <div className={s.trendCard}>
                  <h4 className={s.chartTitle}>売上</h4>
                  <div className={s.miniBarChart} style={{ height: 100 }}>
                    {(() => {
                      const max = Math.max(...detail.revenueTrend.map((i) => i.revenue), 1);
                      return detail.revenueTrend.map((item, i) => (
                        <div key={i} className={s.miniBarCol}>
                          <span className={s.miniBarVal}>
                            {item.revenue > 0 ? `¥${Math.round(item.revenue / 1000)}k` : ""}
                          </span>
                          <div className={s.miniBarTrack}>
                            <div
                              className={s.miniBarFill}
                              style={{
                                height: `${(item.revenue / max) * 100}%`,
                                background: "#e05080",
                              }}
                            />
                          </div>
                          <span className={s.miniBarLabel}>{item.label}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </section>

            {/* Recommendations */}
            {student.recommendations.length > 0 && (
              <section className={s.modalSection}>
                <h3 className={s.modalSectionTitle}>おすすめクラス</h3>
                {!student.hasEnoughHistory && (
                  <p className={s.dataNote}>参加履歴が3件未満のため参考値です</p>
                )}
                <div className={s.recGrid}>
                  {student.recommendations.map((rec) => (
                    <RecommendationCard key={rec.slotId} rec={rec} />
                  ))}
                </div>
              </section>
            )}
            {student.recommendations.length === 0 && (
              <section className={s.modalSection}>
                <h3 className={s.modalSectionTitle}>おすすめクラス</h3>
                <p className={s.dataNote}>
                  {!student.hasEnoughHistory
                    ? "おすすめを算出するための履歴が不足しています"
                    : "現在すべてのクラスに参加中か、適合するクラスがありません"}
                </p>
              </section>
            )}

            {/* History */}
            <section className={s.modalSection}>
              <h3 className={s.modalSectionTitle}>参加履歴（直近100件）</h3>
              {detail.history.length === 0 ? (
                <p className={s.dataNote}>参加履歴がありません</p>
              ) : (
                <div className={s.historyTableWrap}>
                  <table className={s.historyTable}>
                    <thead>
                      <tr>
                        <th>日付</th>
                        <th>曜</th>
                        <th>時間</th>
                        <th>クラス名</th>
                        <th>講師</th>
                        <th>料金</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.history.map((h, i) => (
                        <tr key={i}>
                          <td>{h.date}</td>
                          <td>{h.dowLabel}</td>
                          <td>{h.time}</td>
                          <td>{h.title || h.type}</td>
                          <td>{h.teacher || "—"}</td>
                          <td>¥{h.pricePaid.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
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
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, pw);
      onLogin(pw);
    } else {
      setError(true);
    }
  };

  return (
    <div className={s.loginPage}>
      <div className={s.loginCard}>
        <div className={s.loginLogo}>Y-de-ONE</div>
        <p className={s.loginSub}>生徒別 参加分析</p>
        <form onSubmit={submit} className={s.loginForm}>
          <input
            type="password"
            className={s.loginInput}
            placeholder="パスワード"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
          />
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

  const [sortKey, setSortKey] = useState<SortKey>("currentCount");
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    potentialLevel: "",
    frequencyType: "",
    behaviorType: "",
    dormantOnly: false,
    primaryDow: "",
    searchName: "",
  });

  const [selectedStudent, setSelectedStudent] = useState<StudentAnalysisSummary | null>(null);
  const [showCoOccurrence, setShowCoOccurrence] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

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

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!authKey) return <LoginPage onLogin={setAuthKey} />;

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthKey(null);
    setData(null);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortArrow = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      <span className={s.sortArrow}>{sortAsc ? "▲" : "▼"}</span>
    ) : (
      <span className={s.sortArrowInactive}>↕</span>
    );

  // Filter + sort
  const filteredStudents = (data?.students ?? [])
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
      return sortAsc
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

  const { kpi } = data ?? {};

  return (
    <div className={s.page}>
      {/* Header */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.headerLogo}>Y-de-ONE</span>
          <span className={s.headerDivider}>/</span>
          <Link href="/analytics" className={s.headerNav}>Analytics</Link>
          <span className={s.headerDivider}>/</span>
          <span className={s.headerTitle}>生徒別 参加分析</span>
        </div>
        <div className={s.headerRight}>
          {/* Period controls */}
          <div className={s.viewModeTabs}>
            {(["month", "week", "custom"] as const).map((mode) => (
              <button
                key={mode}
                className={`${s.viewModeTab} ${viewMode === mode ? s.viewModeTabActive : ""}`}
                onClick={() => setViewMode(mode)}
              >
                {mode === "month" ? "月別" : mode === "week" ? "週別" : "期間指定"}
              </button>
            ))}
          </div>

          {viewMode === "month" && (
            <div className={s.periodNav}>
              <button className={s.navArrow} onClick={() => setMonth(addMonths(month, -1))}>‹</button>
              <span className={s.periodLabel}>{formatMonthLabel(month)}</span>
              <button
                className={s.navArrow}
                onClick={() => setMonth(addMonths(month, 1))}
                disabled={month >= currentMonth}
              >›</button>
              {month !== currentMonth && (
                <button className={s.todayBtn} onClick={() => setMonth(currentMonth)}>今月</button>
              )}
            </div>
          )}
          {viewMode === "week" && (
            <div className={s.periodNav}>
              <button className={s.navArrow} onClick={() => setWeek(addWeeks(week, -1))}>‹</button>
              <span className={s.periodLabel} style={{ minWidth: 160 }}>{formatWeekLabel(week)}</span>
              <button
                className={s.navArrow}
                onClick={() => setWeek(addWeeks(week, 1))}
                disabled={week >= currentWeek}
              >›</button>
              {week !== currentWeek && (
                <button className={s.todayBtn} onClick={() => setWeek(currentWeek)}>今週</button>
              )}
            </div>
          )}
          {viewMode === "custom" && (
            <div className={s.customDateRow}>
              <input
                type="date"
                className={s.dateInput}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span className={s.dateSep}>〜</span>
              <input
                type="date"
                className={s.dateInput}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
              <button
                className={s.todayBtn}
                onClick={fetchData}
                disabled={!customFrom || !customTo}
              >
                適用
              </button>
            </div>
          )}

          <button className={s.logoutBtn} onClick={logout}>ログアウト</button>
        </div>
      </header>

      <main className={s.main}>
        {loading && (
          <div className={s.loadingBar}>
            <div className={s.loadingBarFill} />
          </div>
        )}

        {data && (
          <>
            {/* KPI Cards */}
            <div className={s.kpiRow}>
              <div className={s.kpiCard}>
                <span className={s.kpiVal}>{kpi!.regularMemberCount}人</span>
                <span className={s.kpiLabel}>レギュラーメンバー数</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiVal}>{kpi!.avgAttendancePerStudent}回</span>
                <span className={s.kpiLabel}>1人あたり平均参加回数</span>
                {kpi!.prevPeriodAvg > 0 && (
                  <span
                    className={s.kpiSub}
                    style={{ color: changeRateColor(kpi!.periodChange, 0) }}
                  >
                    前期 {kpi!.prevPeriodAvg}回
                    {kpi!.periodChange != null &&
                      ` (${changeRateText(kpi!.periodChange, 0)})`}
                  </span>
                )}
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiVal}>{kpi!.totalAttendance}回</span>
                <span className={s.kpiLabel}>総参加回数</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiVal}>¥{kpi!.totalRevenue.toLocaleString()}</span>
                <span className={s.kpiLabel}>総売上</span>
              </div>
              <div className={s.kpiCard}>
                <span
                  className={s.kpiVal}
                  style={{ color: kpi!.dormantCount > 0 ? "#e05080" : "#16a34a" }}
                >
                  {kpi!.dormantCount}人
                </span>
                <span className={s.kpiLabel}>30日以上未参加</span>
              </div>
              <div className={s.kpiCard}>
                <span
                  className={s.kpiVal}
                  style={{ color: kpi!.additionalPotentialCount > 0 ? "#16a34a" : "#94a3b8" }}
                >
                  {kpi!.additionalPotentialCount}人
                </span>
                <span className={s.kpiLabel}>追加参加ポテンシャル（高）</span>
              </div>
            </div>

            {/* Period label */}
            {data.period && (
              <p className={s.periodInfo}>
                集計期間: {data.period.from} 〜 {data.period.to.slice(0, 10)} ／ 比較期間: {data.period.prevFrom} 〜 {data.period.prevTo.slice(0, 10)}
              </p>
            )}

            {/* Search + Filter */}
            <div className={s.controlRow}>
              <input
                className={s.searchInput}
                placeholder="生徒名で検索..."
                value={filter.searchName}
                onChange={(e) => setFilter((f) => ({ ...f, searchName: e.target.value }))}
              />
              <button
                className={`${s.filterToggle} ${filterOpen ? s.filterToggleActive : ""}`}
                onClick={() => setFilterOpen((v) => !v)}
              >
                絞り込み {filterOpen ? "▲" : "▼"}
              </button>
              <span className={s.resultCount}>{filteredStudents.length}人表示</span>
              <button
                className={s.cooccurrenceBtn}
                onClick={() => setShowCoOccurrence((v) => !v)}
              >
                {showCoOccurrence ? "生徒一覧に戻る" : "共起分析を見る"}
              </button>
            </div>

            {filterOpen && (
              <div className={s.filterPanel}>
                <div className={s.filterRow}>
                  <label className={s.filterLabel}>参加頻度</label>
                  <select
                    className={s.filterSelect}
                    value={filter.frequencyType}
                    onChange={(e) =>
                      setFilter((f) => ({ ...f, frequencyType: e.target.value as FrequencyType | "" }))
                    }
                  >
                    <option value="">すべて</option>
                    <option value="高頻度">高頻度（月8回以上）</option>
                    <option value="中頻度">中頻度（月4〜7回）</option>
                    <option value="低頻度">低頻度（月1〜3回）</option>
                    <option value="休眠">休眠（30日以上未参加）</option>
                  </select>
                </div>
                <div className={s.filterRow}>
                  <label className={s.filterLabel}>追加参加ポテンシャル</label>
                  <select
                    className={s.filterSelect}
                    value={filter.potentialLevel}
                    onChange={(e) =>
                      setFilter((f) => ({ ...f, potentialLevel: e.target.value as PotentialLevel | "" }))
                    }
                  >
                    <option value="">すべて</option>
                    <option value="高">高</option>
                    <option value="中">中</option>
                    <option value="低">低</option>
                  </select>
                </div>
                <div className={s.filterRow}>
                  <label className={s.filterLabel}>参加傾向タイプ</label>
                  <select
                    className={s.filterSelect}
                    value={filter.behaviorType}
                    onChange={(e) =>
                      setFilter((f) => ({ ...f, behaviorType: e.target.value as BehaviorType | "" }))
                    }
                  >
                    <option value="">すべて</option>
                    <option value="固定クラス型">固定クラス型</option>
                    <option value="曜日固定型">曜日固定型</option>
                    <option value="複数クラス型">複数クラス型</option>
                  </select>
                </div>
                <div className={s.filterRow}>
                  <label className={s.filterLabel}>主な参加曜日</label>
                  <select
                    className={s.filterSelect}
                    value={filter.primaryDow}
                    onChange={(e) => setFilter((f) => ({ ...f, primaryDow: e.target.value }))}
                  >
                    <option value="">すべて</option>
                    {[2, 3, 4, 5, 6, 0].map((dow) => (
                      <option key={dow} value={String(dow)}>
                        {DOW_LABEL[dow]}曜日
                      </option>
                    ))}
                  </select>
                </div>
                <div className={s.filterRow}>
                  <label className={s.filterLabel}>30日以上不参加のみ</label>
                  <input
                    type="checkbox"
                    checked={filter.dormantOnly}
                    onChange={(e) =>
                      setFilter((f) => ({ ...f, dormantOnly: e.target.checked }))
                    }
                    className={s.filterCheckbox}
                  />
                </div>
                <button
                  className={s.filterClear}
                  onClick={() =>
                    setFilter({
                      potentialLevel: "",
                      frequencyType: "",
                      behaviorType: "",
                      dormantOnly: false,
                      primaryDow: "",
                      searchName: "",
                    })
                  }
                >
                  絞り込みをクリア
                </button>
              </div>
            )}

            {/* Co-occurrence View */}
            {showCoOccurrence && (
              <section className={s.section}>
                <h2 className={s.sectionTitle}>
                  クラス間 共起分析
                  <span className={s.sectionSub}>同じ生徒が参加している組み合わせ</span>
                </h2>
                {data.coOccurrence.length === 0 ? (
                  <p className={s.empty}>データが不足しています（生徒の参加履歴が少ない可能性があります）</p>
                ) : (
                  <div className={s.coTable}>
                    <table className={s.coTableInner}>
                      <thead>
                        <tr>
                          <th>クラスA</th>
                          <th>クラスB</th>
                          <th>A参加者数</th>
                          <th>両方参加</th>
                          <th>併用率</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.coOccurrence.map((pair, i) => (
                          <tr key={i}>
                            <td>{pair.classALabel}</td>
                            <td>{pair.classBLabel}</td>
                            <td>{pair.participantsA}人</td>
                            <td>{pair.both}人</td>
                            <td>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: pair.coRate >= 0.5 ? "#16a34a" : pair.coRate >= 0.3 ? "#f59e0b" : "#94a3b8",
                                }}
                              >
                                {Math.round(pair.coRate * 100)}%
                              </span>
                            </td>
                            <td>
                              {pair.isReferenceOnly && (
                                <span className={s.refLabel}>参考値</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                        <th className={s.thName}>
                          <button onClick={() => handleSort("name")} className={s.thBtn}>
                            生徒名 <SortArrow col="name" />
                          </button>
                        </th>
                        <th>
                          <button onClick={() => handleSort("currentCount")} className={s.thBtn}>
                            今月 <SortArrow col="currentCount" />
                          </button>
                        </th>
                        <th>
                          <button onClick={() => handleSort("prevCount")} className={s.thBtn}>
                            先月 <SortArrow col="prevCount" />
                          </button>
                        </th>
                        <th>
                          <button onClick={() => handleSort("changeCount")} className={s.thBtn}>
                            前月比 <SortArrow col="changeCount" />
                          </button>
                        </th>
                        <th>
                          <button onClick={() => handleSort("currentRevenue")} className={s.thBtn}>
                            今月売上 <SortArrow col="currentRevenue" />
                          </button>
                        </th>
                        <th>
                          <button onClick={() => handleSort("lastAttendanceDate")} className={s.thBtn}>
                            最終参加 <SortArrow col="lastAttendanceDate" />
                          </button>
                        </th>
                        <th>
                          <button onClick={() => handleSort("avgIntervalDays")} className={s.thBtn}>
                            平均間隔 <SortArrow col="avgIntervalDays" />
                          </button>
                        </th>
                        <th>主な曜日</th>
                        <th>よく参加するクラス</th>
                        <th>
                          <button onClick={() => handleSort("frequencyType")} className={s.thBtn}>
                            参加傾向 <SortArrow col="frequencyType" />
                          </button>
                        </th>
                        <th>
                          <button onClick={() => handleSort("additionalPotential")} className={s.thBtn}>
                            ポテンシャル <SortArrow col="additionalPotential" />
                          </button>
                        </th>
                        <th>おすすめ</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={13} className={s.tdEmpty}>
                            条件に一致する生徒がいません
                          </td>
                        </tr>
                      )}
                      {filteredStudents.map((st) => (
                        <tr
                          key={st.id}
                          className={s.studentRow}
                          onClick={() => setSelectedStudent(st)}
                        >
                          <td>
                            <div className={s.studentNameCell}>
                              <Avatar src={st.pictureUrl} name={st.name} size={28} />
                              <span className={s.studentNameText}>{st.name}</span>
                            </div>
                          </td>
                          <td className={s.tdNum}>{st.currentCount}</td>
                          <td className={s.tdNum}>{st.prevCount}</td>
                          <td
                            className={s.tdNum}
                            style={{ color: changeRateColor(st.changeRate, st.changeCount) }}
                          >
                            {changeRateText(st.changeRate, st.changeCount)}
                          </td>
                          <td className={s.tdNum}>¥{st.currentRevenue.toLocaleString()}</td>
                          <td className={s.tdDate}>
                            {st.lastAttendanceDate ?? (
                              <span className={s.noData}>—</span>
                            )}
                            {st.daysSinceLastAttendance != null &&
                              st.daysSinceLastAttendance >= 30 && (
                                <span
                                  className={s.daysAgoBadge}
                                  style={{
                                    color:
                                      st.daysSinceLastAttendance >= 60 ? "#e05080" : "#f59e0b",
                                  }}
                                >
                                  {st.daysSinceLastAttendance}日前
                                </span>
                              )}
                          </td>
                          <td className={s.tdDate}>
                            {st.avgIntervalDays != null
                              ? `${st.avgIntervalDays}日`
                              : <span className={s.noData}>—</span>}
                          </td>
                          <td>
                            {st.primaryDow != null
                              ? `${DOW_LABEL[st.primaryDow]}曜`
                              : <span className={s.noData}>—</span>}
                          </td>
                          <td className={s.tdClasses}>
                            {st.favoriteClasses.length > 0
                              ? st.favoriteClasses.slice(0, 2).join(" / ")
                              : <span className={s.noData}>—</span>}
                          </td>
                          <td>
                            <div className={s.badgeRow}>
                              <Badge
                                label={st.frequencyType}
                                color={FREQUENCY_COLOR[st.frequencyType]}
                                small
                              />
                              {st.trendType && (
                                <Badge
                                  label={st.trendType}
                                  color={TREND_COLOR[st.trendType]}
                                  small
                                />
                              )}
                              {st.behaviorTypes.slice(0, 1).map((bt) => (
                                <Badge key={bt} label={bt} color={BEHAVIOR_COLOR[bt]} small />
                              ))}
                            </div>
                          </td>
                          <td>
                            <Badge
                              label={`ポテンシャル ${st.additionalPotential}`}
                              color={POTENTIAL_COLOR[st.additionalPotential]}
                              small
                            />
                          </td>
                          <td className={s.tdRec}>
                            {st.recommendations.length > 0 ? (
                              <span className={s.recCount}>
                                {st.recommendations.length}件
                              </span>
                            ) : (
                              <span className={s.noData}>—</span>
                            )}
                          </td>
                          <td>
                            <button
                              className={s.detailBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(st);
                              }}
                            >
                              詳細
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        {!loading && !data && (
          <p className={s.empty} style={{ paddingTop: 64 }}>
            データを取得できませんでした
          </p>
        )}
      </main>

      {/* Detail Modal */}
      {selectedStudent && authKey && (
        <StudentDetailModal
          student={selectedStudent}
          authKey={authKey}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
