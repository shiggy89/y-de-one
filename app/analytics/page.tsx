"use client";

import { useState, useEffect, useCallback } from "react";
import s from "./analytics.module.css";

const SESSION_KEY = "analytics_key";
const DISPLAY_MAX = 40;

const BADGE_THRESHOLDS = [
  { badge: "bronze",   min: 4  },
  { badge: "silver",   min: 8  },
  { badge: "gold",     min: 12 },
  { badge: "platinum", min: 20 },
  { badge: "diamond",  min: 40 },
];

const BADGE_LABEL: Record<string, string> = {
  normal: "ノーマル", bronze: "ブロンズ", silver: "シルバー",
  gold: "ゴールド", platinum: "プラチナ", diamond: "ダイヤモンド",
};

type Student = {
  id: number;
  name: string;
  pictureUrl: string | null;
  count: number;
  revenue: number;
  currentBadge: string | null;
  lastMonthBadge: string | null;
  nextBadge: { badge: string; remaining: number; isContinuation: boolean } | null;
  favoriteDay: string | null;
  favoriteLesson: string | null;
  avgInterval: number | null;
  lastVisitDate: string | null;
  daysSinceLastVisit: number | null;
};

type SortKey = "next_badge" | "last_visit" | "interval_long" | "count_desc" | "revenue" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "next_badge",    label: "次バッジまで順" },
  { value: "last_visit",    label: "最終来店（古い順）" },
  { value: "interval_long", label: "来店間隔（長い順）" },
  { value: "count_desc",    label: "今月の回数（多い順）" },
  { value: "revenue",       label: "売上（高い順）" },
  { value: "name",          label: "名前順" },
];

function sortStudents(students: Student[], key: SortKey): Student[] {
  return [...students].sort((a, b) => {
    switch (key) {
      case "next_badge": {
        const aR = a.nextBadge?.remaining ?? Infinity;
        const bR = b.nextBadge?.remaining ?? Infinity;
        return aR !== bR ? aR - bR : b.count - a.count;
      }
      case "last_visit":
        return (b.daysSinceLastVisit ?? -1) - (a.daysSinceLastVisit ?? -1);
      case "interval_long":
        return (b.avgInterval ?? -1) - (a.avgInterval ?? -1);
      case "count_desc":  return b.count - a.count;
      case "revenue":     return b.revenue - a.revenue;
      case "name":        return a.name.localeCompare(b.name, "ja");
    }
  });
}

function getCurrentMonth() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getAvailableMonths(): string[] {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(jst.getUTCFullYear(), jst.getUTCMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function intervalLevel(days: number): "great" | "good" | "warn" | "alert" {
  if (days <= 4) return "great";
  if (days <= 7) return "good";
  if (days <= 14) return "warn";
  return "alert";
}

// ── コンポーネント ──────────────────────────────────────────

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={s.avatar} />;
  }
  return <div className={s.avatarFallback}>{name.charAt(0)}</div>;
}

function KpiCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`${s.kpiCard} ${highlight ? s.kpiHighlight : ""}`}>
      <span className={s.kpiLabel}>{label}</span>
      <span className={s.kpiValue}>{value}</span>
    </div>
  );
}

function BadgeAxisHeader() {
  return (
    <div className={s.axisRow}>
      <div />
      <div className={s.axisBar}>
        {BADGE_THRESHOLDS.map(({ badge, min }) => (
          <div
            key={badge}
            className={s.axisItem}
            style={{ left: `${(min / DISPLAY_MAX) * 100}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/images/badges/badge-${badge}.png`}
              alt={badge}
              className={badge === "diamond" ? s.axisIconLg : s.axisIcon}
            />
            <span className={s.axisLabel}>{min}回</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BadgeBar({ count }: { count: number }) {
  const fillPct = Math.min((count / DISPLAY_MAX) * 100, 100);
  return (
    <div className={s.barGroup}>
      <div className={s.barTrack}>
        <div className={s.barFill} style={{ width: `${fillPct}%` }} />
      </div>
      {BADGE_THRESHOLDS.map(({ badge, min }) => (
        <div
          key={badge}
          className={s.thresholdMark}
          style={{ left: `${(min / DISPLAY_MAX) * 100}%` }}
        >
          <div className={s.thresholdLine} />
        </div>
      ))}
    </div>
  );
}

// ── メインページ ──────────────────────────────────────────

export default function AnalyticsPage() {
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [month, setMonth] = useState(getCurrentMonth());
  const [students, setStudents] = useState<Student[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("next_badge");

  const months = getAvailableMonths();

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setAuthKey(saved);
  }, []);

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(false);
    const res = await fetch(`/api/analytics?month=${month}`, {
      headers: { "x-analytics-key": pw },
    });
    setLoginLoading(false);
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, pw);
      setAuthKey(pw);
    } else {
      setLoginError(true);
    }
  };

  const fetchStudents = useCallback(async () => {
    if (!authKey) return;
    setDataLoading(true);
    const res = await fetch(`/api/analytics/students?month=${month}`, {
      headers: { "x-analytics-key": authKey },
    });
    if (res.ok) {
      const data = await res.json();
      setStudents(data.students as Student[]);
    }
    setDataLoading(false);
  }, [authKey, month]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthKey(null);
  };

  const sorted = sortStudents(students, sortKey);

  // KPI
  const active = students.filter(st => st.count > 0);
  const totalRevenue = active.reduce((sum, st) => sum + st.revenue, 0);
  const urgentCount = students.filter(st => st.nextBadge && st.nextBadge.remaining <= 2).length;
  const intervals = active.filter(st => st.avgInterval !== null).map(st => st.avgInterval!);
  const avgIntervalAll = intervals.length > 0
    ? Math.round((intervals.reduce((s, v) => s + v, 0) / intervals.length) * 10) / 10
    : null;

  if (!authKey) {
    return (
      <div className={s.loginPage}>
        <div className={s.loginCard}>
          <div className={s.loginLogo}>Y-de-ONE</div>
          <p className={s.loginSub}>分析ページ</p>
          <form onSubmit={submitLogin} className={s.loginForm}>
            <input
              type="password"
              className={s.loginInput}
              placeholder="パスワード"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
            />
            {loginError && <p className={s.loginError}>パスワードが違います</p>}
            <button type="submit" className={s.loginBtn} disabled={!pw || loginLoading}>
              {loginLoading ? "確認中..." : "ログイン"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <span className={s.logo}>Y-de-ONE 分析</span>
        <div className={s.headerRight}>
          <select
            className={s.monthSelect}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button className={s.logoutBtn} onClick={logout}>ログアウト</button>
        </div>
      </header>

      <main className={s.main}>
        {/* KPIカード */}
        <div className={s.kpiRow}>
          <KpiCard
            label="今月の売上"
            value={totalRevenue > 0 ? `¥${totalRevenue.toLocaleString()}` : "—"}
          />
          <KpiCard
            label="今月アクティブ"
            value={`${active.length}名`}
          />
          <KpiCard
            label="平均来店間隔"
            value={avgIntervalAll !== null ? `${avgIntervalAll}日` : "—"}
          />
          <KpiCard
            label="バッジ達成間近"
            value={`${urgentCount}名`}
            highlight={urgentCount > 0}
          />
        </div>

        {/* 生徒別分析 */}
        <div className={s.section}>
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>生徒別分析</h2>
            <select
              className={s.sortSelect}
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {dataLoading && <p className={s.loadingMsg}>読み込み中...</p>}

          {!dataLoading && (
            <div className={s.studentList}>
              <BadgeAxisHeader />

              {sorted.map((st) => (
                <div key={st.id} className={s.studentCard}>
                  <div className={s.cardGrid}>
                    <div className={s.avatarWrap}>
                      <Avatar src={st.pictureUrl} name={st.name} />
                    </div>
                    <div className={s.cardBody}>
                      {/* 1行目: 名前・回数・売上・最終来店・次バッジ */}
                      <div className={s.cardMeta}>
                        <span className={s.studentName}>{st.name}</span>
                        <span className={s.countLabel}>{st.count}回</span>
                        {st.revenue > 0 && (
                          <span className={s.revenuePill}>
                            ¥{st.revenue.toLocaleString()}
                          </span>
                        )}
                        {st.daysSinceLastVisit !== null && (
                          <span
                            className={s.lastVisitPill}
                            data-old={st.daysSinceLastVisit >= 21 ? "true" : "false"}
                          >
                            {st.daysSinceLastVisit === 0 ? "今日" : `${st.daysSinceLastVisit}日前`}
                          </span>
                        )}
                        {st.nextBadge && (
                          <span className={s.nextHint}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/images/badges/badge-${st.nextBadge.badge}.png`}
                              alt=""
                              className={s.nextHintIcon}
                            />
                            あと{st.nextBadge.remaining}回
                            {st.nextBadge.isContinuation
                              ? `で${BADGE_LABEL[st.nextBadge.badge]}継続`
                              : `で${BADGE_LABEL[st.nextBadge.badge]}`}
                          </span>
                        )}
                      </div>

                      {/* 2行目: バッジバー */}
                      <BadgeBar count={st.count} />

                      {/* 3行目: 行動パターンタグ */}
                      {(st.favoriteDay || st.favoriteLesson || st.avgInterval !== null) && (
                        <div className={s.cardTags}>
                          {st.favoriteDay && (
                            <span className={s.tagDay}>{st.favoriteDay}曜多め</span>
                          )}
                          {st.favoriteLesson && (
                            <span className={s.tagLesson}>{st.favoriteLesson}</span>
                          )}
                          {st.avgInterval !== null && (
                            <span
                              className={s.tagInterval}
                              data-level={intervalLevel(st.avgInterval)}
                            >
                              平均{st.avgInterval}日間隔
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {sorted.length === 0 && (
                <p className={s.emptyMsg}>この月の会員データはありません</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
