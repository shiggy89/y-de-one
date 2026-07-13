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
};

type SortKey = "next_badge" | "count_desc" | "count_asc" | "name";
type Tab = "badge" | "revenue" | "patterns";

type PatternData = {
  lessonFreq: { title: string; count: number }[];
  teacherFreq: { teacher: string; count: number }[];
  dayFreq: { day: string; count: number }[];
  intervalStats: { id: number; name: string; avgInterval: number; visitCount: number }[];
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "next_badge", label: "次バッジまで順" },
  { value: "count_desc", label: "多い順" },
  { value: "count_asc", label: "少ない順" },
  { value: "name",       label: "名前順" },
];

const TABS: { value: Tab; label: string }[] = [
  { value: "badge",    label: "バッジ進捗" },
  { value: "revenue",  label: "売り上げランキング" },
  { value: "patterns", label: "行動パターン" },
];

function sortStudents(students: Student[], key: SortKey): Student[] {
  return [...students].sort((a, b) => {
    if (key === "next_badge") {
      const aRem = a.nextBadge?.remaining ?? Infinity;
      const bRem = b.nextBadge?.remaining ?? Infinity;
      return aRem !== bRem ? aRem - bRem : b.count - a.count;
    }
    if (key === "count_desc") return b.count - a.count;
    if (key === "count_asc")  return a.count - b.count;
    return a.name.localeCompare(b.name, "ja");
  });
}

function getCurrentMonth() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getAvailableMonths(): string[] {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(jst.getUTCFullYear(), jst.getUTCMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

// ── コンポーネント ──────────────────────────────────────────

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

function HBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className={s.hbarRow}>
      <span className={s.hbarLabel}>{label}</span>
      <div className={s.hbarTrack}>
        <div className={s.hbarFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={s.hbarCount}>{count}</span>
    </div>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={s.avatar} />;
  }
  return <div className={s.avatarFallback}>{name.charAt(0)}</div>;
}

// ── メインページ ──────────────────────────────────────────

export default function AnalyticsPage() {
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [month, setMonth] = useState(getCurrentMonth());
  const [tab, setTab] = useState<Tab>("badge");
  const [students, setStudents] = useState<Student[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("next_badge");
  const [patterns, setPatterns] = useState<PatternData | null>(null);
  const [patternsLoading, setPatternsLoading] = useState(false);

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

  const fetchPatterns = useCallback(async () => {
    if (!authKey) return;
    setPatternsLoading(true);
    const res = await fetch(`/api/analytics/patterns?month=${month}`, {
      headers: { "x-analytics-key": authKey },
    });
    if (res.ok) {
      setPatterns(await res.json());
    }
    setPatternsLoading(false);
  }, [authKey, month]);

  useEffect(() => {
    if (tab === "patterns") fetchPatterns();
  }, [tab, fetchPatterns]);

  // 月が変わったらパターンキャッシュをリセット
  useEffect(() => { setPatterns(null); }, [month]);

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthKey(null);
  };

  const sorted = sortStudents(students, sortKey);
  const urgentCount = students.filter((st) => st.nextBadge && st.nextBadge.remaining <= 2).length;
  const revenueSorted = [...students].sort((a, b) => b.revenue - a.revenue).filter(st => st.revenue > 0);
  const maxRevenue = revenueSorted[0]?.revenue ?? 1;

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
        <button className={s.logoutBtn} onClick={logout}>ログアウト</button>
      </header>

      <main className={s.main}>
        {/* ツールバー */}
        <div className={s.toolbar}>
          <select
            className={s.monthSelect}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {tab === "badge" && (
            <>
              <select
                className={s.monthSelect}
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {!dataLoading && urgentCount > 0 && (
                <p className={s.urgentBadge}>あと1〜2回でバッジ達成 {urgentCount}名</p>
              )}
            </>
          )}
        </div>

        {/* タブ */}
        <div className={s.tabs}>
          {TABS.map((t) => (
            <button
              key={t.value}
              className={`${s.tab} ${tab === t.value ? s.tabActive : ""}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {dataLoading && <p className={s.loadingMsg}>読み込み中...</p>}

        {/* バッジ進捗タブ */}
        {!dataLoading && tab === "badge" && (
          <div className={s.studentList}>
            <BadgeAxisHeader />
            {sorted.map((st) => (
              <div key={st.id} className={s.studentRow}>
                <div className={s.avatarWrap}>
                  <Avatar src={st.pictureUrl} name={st.name} />
                </div>
                <div className={s.studentBody}>
                  <div className={s.studentMeta}>
                    <span className={s.studentName}>{st.name}</span>
                    <span className={s.countLabel}>{st.count}回</span>
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
                  <BadgeBar count={st.count} />
                </div>
              </div>
            ))}
            {sorted.length === 0 && (
              <p className={s.emptyMsg}>この月の会員データはありません</p>
            )}
          </div>
        )}

        {/* 売り上げランキングタブ */}
        {!dataLoading && tab === "revenue" && (
          <div className={s.revenueList}>
            {revenueSorted.length === 0 && (
              <p className={s.emptyMsg}>この月の売り上げデータはありません</p>
            )}
            {revenueSorted.map((st, idx) => (
              <div key={st.id} className={s.revenueRow}>
                <span className={`${s.rank} ${idx < 3 ? s.rankTop : ""}`}>#{idx + 1}</span>
                <div className={s.avatarWrap}>
                  <Avatar src={st.pictureUrl} name={st.name} />
                </div>
                <div className={s.revenueBody}>
                  <div className={s.revenueMeta}>
                    <span className={s.studentName}>{st.name}</span>
                    <span className={s.revenueAmount}>¥{st.revenue.toLocaleString()}</span>
                  </div>
                  <div className={s.revenueBarTrack}>
                    <div
                      className={s.revenueBarFill}
                      style={{ width: `${(st.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 行動パターンタブ */}
        {tab === "patterns" && (
          <>
            {patternsLoading && <p className={s.loadingMsg}>読み込み中...</p>}
            {!patternsLoading && patterns && (
              <div className={s.patternsWrap}>

                {/* レッスン別 */}
                <section className={s.patternSection}>
                  <h3 className={s.patternTitle}>よく出るレッスン</h3>
                  {patterns.lessonFreq.length === 0
                    ? <p className={s.emptyMsg}>データなし</p>
                    : patterns.lessonFreq.map(({ title, count }) => (
                        <HBar
                          key={title}
                          label={title}
                          count={count}
                          max={patterns.lessonFreq[0].count}
                          color="linear-gradient(90deg, #e05080, #f472b6)"
                        />
                      ))
                  }
                </section>

                {/* 先生別 */}
                <section className={s.patternSection}>
                  <h3 className={s.patternTitle}>先生別</h3>
                  {patterns.teacherFreq.length === 0
                    ? <p className={s.emptyMsg}>データなし</p>
                    : patterns.teacherFreq.map(({ teacher, count }) => (
                        <HBar
                          key={teacher}
                          label={teacher}
                          count={count}
                          max={patterns.teacherFreq[0].count}
                          color="linear-gradient(90deg, #0090e8, #38bdf8)"
                        />
                      ))
                  }
                </section>

                {/* 曜日別 */}
                <section className={s.patternSection}>
                  <h3 className={s.patternTitle}>曜日別</h3>
                  {(() => {
                    const maxDay = Math.max(...patterns.dayFreq.map(d => d.count), 1);
                    return patterns.dayFreq.map(({ day, count }) => (
                      <HBar
                        key={day}
                        label={day}
                        count={count}
                        max={maxDay}
                        color="linear-gradient(90deg, #7c3aed, #a78bfa)"
                      />
                    ));
                  })()}
                </section>

                {/* 出席間隔 */}
                <section className={s.patternSection}>
                  <h3 className={s.patternTitle}>出席間隔（過去6ヶ月）</h3>
                  <p className={s.patternNote}>来店日の間隔の平均。数字が小さいほど頻繁に通っている。</p>
                  {patterns.intervalStats.length === 0
                    ? <p className={s.emptyMsg}>データなし（2回以上来店した生徒のみ表示）</p>
                    : patterns.intervalStats.map(({ id, name, avgInterval, visitCount }) => (
                        <div key={id} className={s.intervalRow}>
                          <span className={s.intervalName}>{name}</span>
                          <span
                            className={s.intervalDays}
                            data-level={
                              avgInterval <= 4 ? "great" :
                              avgInterval <= 7 ? "good" :
                              avgInterval <= 14 ? "warn" : "alert"
                            }
                          >
                            {avgInterval}日
                          </span>
                          <span className={s.intervalVisits}>{visitCount}回来店</span>
                        </div>
                      ))
                  }
                </section>

              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
