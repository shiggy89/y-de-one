"use client";

import { useState, useEffect, useCallback } from "react";
import s from "./analytics.module.css";

// ── Types ────────────────────────────────────────────────────
type Student = { id: number; name: string; picture_url: string | null };
type ClassFill = {
  id: string; day: string; dow: number; title: string; teacher: string;
  time: string; endTime: string; color: string; sessions: number;
  avgAttendees: number; fillRate: number; students: Student[];
};
type RehearsalSlot = { dow: number; title: string; teacher: string; time: string; endTime: string };
type RankItem = Student & { count?: number; total?: number; badgeCount?: number; topBadge?: string; classCount?: number; classes?: string[] };
type ChurnItem = Student & { lastDate: string; daysAgo: number };
type TrendItem = { week?: string; month?: string; label: string; count: number };
type AnalyticsData = {
  kpi: { totalAttendance: number; totalRevenue: number; avgFillPct: number; churnRiskCount: number };
  classFill: ClassFill[];
  rehearsalSlots: RehearsalSlot[];
  individualByDow: Record<number, number>;
  isWeeklyView: boolean;
  classWeek: string | null;
  classMonth: string;
  rankings: { byAttendance: RankItem[]; byRevenue: RankItem[]; byBadges: RankItem[] };
  churnRisk: ChurnItem[];
  weeklyTrend: TrendItem[];
  monthlyTrend: TrendItem[];
  multiClass: { avgClassesPerStudent: number; multiStudents: RankItem[] };
};

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

const SESSION_KEY = "analytics_key";
const DOW_ORDER = [2, 3, 4, 5, 6, 0]; // 火〜日

const BADGE_EMOJI: Record<string, string> = {
  normal: "⚪", bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💎", diamond: "💠",
};

function fillColor(rate: number): string {
  if (rate >= 1) return "#16a34a";
  if (rate >= 0.67) return "#22c55e";
  if (rate >= 0.4) return "#f59e0b";
  return "#e05080";
}

function Avatar({ src, name, size = 28 }: { src: string | null; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initials = (name || "?")[0];
  if (!src || broken) {
    return (
      <div className={s.avatar} style={{ width: size, height: size, fontSize: size * 0.45, flexShrink: 0 }}>
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src} alt={name} className={s.avatarImg}
      style={{ width: size, height: size, flexShrink: 0 }}
      onError={() => setBroken(true)}
    />
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
            <div
              className={s.barTrendFill}
              style={{ height: `${(item.count / max) * 100}%`, background: color }}
            />
          </div>
          <span className={s.barTrendLabel}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Login ────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(false);
    const months = getMonths();
    const res = await fetch(`/api/analytics?month=${months[0]}`, { headers: { "x-analytics-key": pw } });
    setLoading(false);
    if (res.ok) { sessionStorage.setItem(SESSION_KEY, pw); onLogin(pw); }
    else setError(true);
  };

  return (
    <div className={s.loginPage}>
      <div className={s.loginCard}>
        <div className={s.loginLogo}>Y-de-ONE</div>
        <p className={s.loginSub}>Analytics Dashboard</p>
        <form onSubmit={submit} className={s.loginForm}>
          <input
            type="password" className={s.loginInput} placeholder="パスワード"
            value={pw} onChange={(e) => setPw(e.target.value)} autoFocus
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

// ── Dashboard ─────────────────────────────────────────────────
export default function AnalyticsPage() {
  const months = getMonths();
  const currentMonth = months[0];
  const currentWeek = getMondayStr();

  const [authKey, setAuthKey] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  // Class fill independent navigation
  const [classViewMode, setClassViewMode] = useState<"week" | "month">("month");
  const [classWeek, setClassWeek] = useState(currentWeek);
  const [classMonth, setClassMonth] = useState(currentMonth);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setAuthKey(saved);
  }, []);

  const fetchData = useCallback(async () => {
    if (!authKey) return;
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (classViewMode === "week") {
      params.set("classWeek", classWeek);
    } else {
      params.set("classMonth", classMonth);
    }
    const res = await fetch(`/api/analytics?${params}`, { headers: { "x-analytics-key": authKey } });
    setData(res.ok ? await res.json() : null);
    setLoading(false);
  }, [authKey, month, classViewMode, classWeek, classMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!authKey) return <LoginPage onLogin={setAuthKey} />;

  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setAuthKey(null); setData(null); };

  const switchClassMode = (mode: "week" | "month") => {
    setClassViewMode(mode);
    if (mode === "week") setClassWeek(currentWeek);
    else setClassMonth(currentMonth);
  };

  // Group classFill by DOW
  const byDow = DOW_ORDER.map((dow) => ({
    dow,
    day: ["日", "月", "火", "水", "木", "金", "土"][dow],
    classes: (data?.classFill ?? []).filter((c) => c.dow === dow),
    rehearsals: (data?.rehearsalSlots ?? []).filter((r) => r.dow === dow),
    individualCount: data?.individualByDow?.[dow] ?? 0,
  })).filter((d) => d.classes.length > 0 || d.rehearsals.length > 0);

  return (
    <div className={s.page}>
      {/* Header */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.headerLogo}>Y-de-ONE</span>
          <span className={s.headerDivider}>/</span>
          <span className={s.headerTitle}>Analytics</span>
        </div>
        <div className={s.headerRight}>
          <div className={s.monthNav}>
            <button
              className={s.navArrow}
              onClick={() => setMonth(addMonths(month, -1))}
            >&#8249;</button>
            <span className={s.navLabel}>{formatMonthLabel(month)}</span>
            <button
              className={s.navArrow}
              onClick={() => setMonth(addMonths(month, 1))}
              disabled={month >= currentMonth}
            >&#8250;</button>
          </div>
          <button className={s.logoutBtn} onClick={logout}>ログアウト</button>
        </div>
      </header>

      <main className={s.main}>
        {loading && <div className={s.loadingBar}><div className={s.loadingBarFill} /></div>}

        {data && (
          <>
            {/* ── KPI ── */}
            <div className={s.kpiRow}>
              <div className={s.kpiCard}>
                <span className={s.kpiVal}>{data.kpi.totalAttendance}</span>
                <span className={s.kpiLabel}>延べ出席人数</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiVal}>¥{data.kpi.totalRevenue.toLocaleString()}</span>
                <span className={s.kpiLabel}>月間売上</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiVal} style={{ color: fillColor(data.kpi.avgFillPct / 100) }}>
                  {data.kpi.avgFillPct}%
                </span>
                <span className={s.kpiLabel}>平均充填率 / 15人</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiVal} style={{ color: data.kpi.churnRiskCount > 0 ? "#e05080" : "#16a34a" }}>
                  {data.kpi.churnRiskCount}人
                </span>
                <span className={s.kpiLabel}>チャーンリスク（30日未出席）</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiVal}>{data.multiClass.avgClassesPerStudent}</span>
                <span className={s.kpiLabel}>平均掛け持ちクラス数</span>
              </div>
            </div>

            {/* ── Class Fill Schedule View ── */}
            <section className={s.section}>
              <div className={s.classSectionHeader}>
                <h2 className={s.sectionTitle}>
                  クラス別 充填状況
                  <span className={s.sectionSub}>目標 15人/クラス</span>
                </h2>
                <div className={s.classPeriodControl}>
                  {/* 週別/月別 tabs */}
                  <div className={s.viewModeTabs}>
                    <button
                      className={`${s.viewModeTab} ${classViewMode === "week" ? s.viewModeTabActive : ""}`}
                      onClick={() => switchClassMode("week")}
                    >週別</button>
                    <button
                      className={`${s.viewModeTab} ${classViewMode === "month" ? s.viewModeTabActive : ""}`}
                      onClick={() => switchClassMode("month")}
                    >月別</button>
                  </div>

                  {/* Navigation */}
                  {classViewMode === "week" ? (
                    <div className={s.periodNav}>
                      <button className={s.navArrow} onClick={() => setClassWeek(addWeeks(classWeek, -1))}>&#8249;</button>
                      <span className={s.periodLabel}>{formatWeekLabel(classWeek)}</span>
                      <button
                        className={s.navArrow}
                        onClick={() => setClassWeek(addWeeks(classWeek, 1))}
                        disabled={classWeek >= currentWeek}
                      >&#8250;</button>
                      {classWeek !== currentWeek && (
                        <button className={s.todayBtn} onClick={() => setClassWeek(currentWeek)}>今週</button>
                      )}
                    </div>
                  ) : (
                    <div className={s.periodNav}>
                      <button className={s.navArrow} onClick={() => setClassMonth(addMonths(classMonth, -1))}>&#8249;</button>
                      <span className={s.periodLabel}>{formatMonthLabel(classMonth)}</span>
                      <button
                        className={s.navArrow}
                        onClick={() => setClassMonth(addMonths(classMonth, 1))}
                        disabled={classMonth >= currentMonth}
                      >&#8250;</button>
                      {classMonth !== currentMonth && (
                        <button className={s.todayBtn} onClick={() => setClassMonth(currentMonth)}>今月</button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={s.scheduleGrid}>
                {byDow.map(({ dow, day, classes, rehearsals, individualCount }) => (
                  <div key={dow} className={s.dayCol}>
                    <div className={s.dayHeader}>{day}曜日</div>

                    {/* Regular classes */}
                    {classes.map((c) => {
                      const color = fillColor(c.fillRate);
                      const pct = Math.min(c.fillRate * 100, 100);
                      const isOpen = expandedClass === c.id;
                      const bgClass = c.color === "pink" ? s.cardPink
                        : c.color === "blue" ? s.cardBlue
                        : c.color === "yellow" ? s.cardYellow
                        : s.classCard;
                      return (
                        <div key={c.id} className={`${s.classCard} ${bgClass}`} onClick={() => setExpandedClass(isOpen ? null : c.id)}>
                          <div className={s.classCardHeader}>
                            <span className={s.classTime}>{c.time}〜{c.endTime}</span>
                            <span className={s.classAvg} style={{ color }}>{c.avgAttendees}</span>
                          </div>
                          <div className={s.classTitle}>{c.title}</div>
                          <div className={s.classTeacher}>{c.teacher}</div>
                          <div className={s.fillTrack}>
                            <div className={s.fillBar} style={{ width: `${pct}%`, background: color }} />
                            <span className={s.fillTarget} />
                          </div>
                          <div className={s.fillLabel} style={{ color }}>
                            {c.sessions > 0 ? `${c.avgAttendees} / 15人` : "データなし"}
                          </div>
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

                    {/* リハーサル cards */}
                    {rehearsals.map((r) => (
                      <div key={`rehearsal-${r.dow}-${r.time}`} className={s.rehearsalCard}>
                        <span className={s.classTime}>{r.time}〜{r.endTime}</span>
                        <div className={s.rehearsalTitle}>{r.title}</div>
                        <div className={s.rehearsalBadge}>スケジュール</div>
                      </div>
                    ))}

                    {/* 個人レッスンカード */}
                    {individualCount > 0 && (
                      <div className={s.individualCard}>
                        <div className={s.individualTitle}>個人レッスン</div>
                        <div className={s.individualCount}>{individualCount}<span className={s.individualUnit}>件</span></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Rankings ── */}
            <section className={s.section}>
              <h2 className={s.sectionTitle}>ランキング<span className={s.sectionSub}>{month}</span></h2>
              <div className={s.rankingGrid}>
                <div className={s.rankCard}>
                  <h3 className={s.rankTitle}>出席回数</h3>
                  {data.rankings.byAttendance.map((r, i) => (
                    <div key={r.id} className={s.rankRow}>
                      <span className={s.rankNo}>{i + 1}</span>
                      <Avatar src={r.picture_url} name={r.name} size={28} />
                      <span className={s.rankName}>{r.name}</span>
                      <span className={s.rankVal}>{r.count}回</span>
                    </div>
                  ))}
                  {data.rankings.byAttendance.length === 0 && <p className={s.empty}>データなし</p>}
                </div>

                <div className={s.rankCard}>
                  <h3 className={s.rankTitle}>支払い金額</h3>
                  {data.rankings.byRevenue.map((r, i) => (
                    <div key={r.id} className={s.rankRow}>
                      <span className={s.rankNo}>{i + 1}</span>
                      <Avatar src={r.picture_url} name={r.name} size={28} />
                      <span className={s.rankName}>{r.name}</span>
                      <span className={s.rankVal}>¥{(r.total ?? 0).toLocaleString()}</span>
                    </div>
                  ))}
                  {data.rankings.byRevenue.length === 0 && <p className={s.empty}>データなし</p>}
                </div>

                <div className={s.rankCard}>
                  <h3 className={s.rankTitle}>バッジ獲得月数（累計）</h3>
                  {data.rankings.byBadges.map((r, i) => (
                    <div key={r.id} className={s.rankRow}>
                      <span className={s.rankNo}>{i + 1}</span>
                      <Avatar src={r.picture_url} name={r.name} size={28} />
                      <span className={s.rankName}>{r.name}</span>
                      <span className={s.rankVal}>
                        {BADGE_EMOJI[r.topBadge ?? "normal"]} {r.badgeCount}ヶ月
                      </span>
                    </div>
                  ))}
                  {data.rankings.byBadges.length === 0 && <p className={s.empty}>データなし</p>}
                </div>
              </div>
            </section>

            {/* ── Churn Risk ── */}
            {data.churnRisk.length > 0 && (
              <section className={s.section}>
                <h2 className={s.sectionTitle}>
                  チャーンリスク
                  <span className={s.sectionSub}>30日以上未出席の会員</span>
                </h2>
                <div className={s.churnGrid}>
                  {data.churnRisk.map((c) => (
                    <div key={c.id} className={s.churnCard}>
                      <Avatar src={c.picture_url} name={c.name} size={40} />
                      <div className={s.churnInfo}>
                        <span className={s.churnName}>{c.name}</span>
                        <span className={s.churnDate}>最終出席: {c.lastDate}</span>
                      </div>
                      <span className={s.churnDays} style={{ color: c.daysAgo >= 60 ? "#e05080" : "#f59e0b" }}>
                        {c.daysAgo}日前
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Trends ── */}
            <section className={s.section}>
              <h2 className={s.sectionTitle}>出席推移</h2>
              <div className={s.trendGrid}>
                <div className={s.trendCard}>
                  <h3 className={s.trendTitle}>週別（過去12週）</h3>
                  <BarTrend items={data.weeklyTrend} color="#0090e8" />
                </div>
                <div className={s.trendCard}>
                  <h3 className={s.trendTitle}>月別（過去12ヶ月）</h3>
                  <BarTrend items={data.monthlyTrend} color="#e05080" />
                </div>
              </div>
            </section>

            {/* ── Multi-class ── */}
            {data.multiClass.multiStudents.length > 0 && (
              <section className={s.section}>
                <h2 className={s.sectionTitle}>
                  複数クラス掛け持ち
                  <span className={s.sectionSub}>平均 {data.multiClass.avgClassesPerStudent} クラス/人</span>
                </h2>
                <div className={s.rankCard} style={{ maxWidth: 480 }}>
                  {data.multiClass.multiStudents.map((r, i) => (
                    <div key={r.id} className={s.rankRow}>
                      <span className={s.rankNo}>{i + 1}</span>
                      <Avatar src={r.picture_url} name={r.name} size={28} />
                      <span className={s.rankName}>{r.name}</span>
                      <span className={s.rankVal}>{r.classCount}クラス</span>
                      <span className={s.multiClasses}>{(r.classes ?? []).join(" / ")}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {!loading && !data && (
          <p className={s.empty} style={{ paddingTop: 64 }}>データを取得できませんでした</p>
        )}
      </main>
    </div>
  );
}
