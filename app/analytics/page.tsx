"use client";

import { useState, useEffect, useCallback } from "react";
import s from "./analytics.module.css";

const SESSION_KEY = "analytics_key";

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
  currentBadge: string | null;
  lastMonthBadge: string | null;
  nextBadge: { badge: string; remaining: number; isContinuation: boolean } | null;
};

function getCurrentMonth() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getAvailableMonths(): string[] {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const months: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(jst.getUTCFullYear(), jst.getUTCMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function BadgeBar({ count, displayMax }: { count: number; displayMax: number }) {
  const thresholds = BADGE_THRESHOLDS.filter((t) => t.min <= displayMax);
  const fillPct = Math.min((count / displayMax) * 100, 100);

  return (
    <div className={s.barGroup}>
      <div className={s.barTrack}>
        <div className={s.barFill} style={{ width: `${fillPct}%` }} />
      </div>
      {thresholds.map(({ badge, min }) => {
        const pct = (min / displayMax) * 100;
        return (
          <div key={badge} className={s.thresholdMark} style={{ left: `${pct}%` }}>
            <div className={s.thresholdLine} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/images/badges/badge-${badge}.png`}
              alt={badge}
              className={s.thresholdIcon}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [month, setMonth] = useState(getCurrentMonth());
  const [students, setStudents] = useState<Student[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

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
      const sorted = [...(data.students as Student[])].sort((a, b) => {
        const aRem = a.nextBadge?.remaining ?? Infinity;
        const bRem = b.nextBadge?.remaining ?? Infinity;
        if (aRem !== bRem) return aRem - bRem;
        return b.count - a.count;
      });
      setStudents(sorted);
    }
    setDataLoading(false);
  }, [authKey, month]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthKey(null);
  };

  const displayMax = (() => {
    const max = Math.max(0, ...students.map((st) => st.count));
    if (max > 20) return 40;
    if (max > 12) return 20;
    return 12;
  })();

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

  const urgentCount = students.filter((st) => st.nextBadge && st.nextBadge.remaining <= 2).length;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <span className={s.logo}>Y-de-ONE 分析</span>
        <button className={s.logoutBtn} onClick={logout}>ログアウト</button>
      </header>

      <main className={s.main}>
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
          {!dataLoading && urgentCount > 0 && (
            <p className={s.urgentBadge}>あと1〜2回でバッジ達成 {urgentCount}名</p>
          )}
        </div>

        {dataLoading && <p className={s.loadingMsg}>読み込み中...</p>}

        {!dataLoading && (
          <div className={s.studentList}>
            {students.map((st) => (
              <div key={st.id} className={s.studentRow}>
                <div className={s.avatarWrap}>
                  {st.pictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={st.pictureUrl} alt="" className={s.avatar} />
                  ) : (
                    <div className={s.avatarFallback} />
                  )}
                </div>
                <div className={s.studentBody}>
                  <div className={s.studentMeta}>
                    <span className={s.studentName}>{st.name}</span>
                    <span className={s.countLabel}>{st.count}回</span>
                    {st.nextBadge && (
                      <span className={s.nextHint}>
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
                  <BadgeBar count={st.count} displayMax={displayMax} />
                </div>
              </div>
            ))}
            {students.length === 0 && (
              <p className={s.emptyMsg}>この月の会員データはありません</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
