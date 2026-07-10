"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./analytics.module.css";

type AnalyticsData = {
  month: string;
  totalAttendance: number;
  totalSessions: number;
  avgPerSession: number;
  topClass: string;
  topDay: string;
  classRanking: { title: string; count: number }[];
  dayRanking: { day: string; count: number }[];
  teacherRanking: { teacher: string; count: number }[];
};

function getAvailableMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function BarChart({ items, max }: { items: { label: string; count: number }[]; max: number }) {
  return (
    <div className={styles.barChart}>
      {items.map(({ label, count }) => (
        <div key={label} className={styles.barRow}>
          <span className={styles.barLabel}>{label}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: max > 0 ? `${(count / max) * 100}%` : "0%" }}
            />
          </div>
          <span className={styles.barCount}>{count}</span>
        </div>
      ))}
    </div>
  );
}

const SESSION_KEY = "analytics_key";

export default function AnalyticsPage() {
  const months = getAvailableMonths();
  const [password, setPassword] = useState("");
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [month, setMonth] = useState(months[0]);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setAuthKey(saved);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(false);
    const res = await fetch(`/api/analytics?month=${months[0]}`, {
      headers: { "x-analytics-key": password },
    });
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, password);
      setAuthKey(password);
    } else {
      setAuthError(true);
    }
  };

  const fetchData = useCallback(async () => {
    if (!authKey) return;
    setLoading(true);
    const res = await fetch(`/api/analytics?month=${month}`, {
      headers: { "x-analytics-key": authKey },
    });
    if (res.ok) {
      setData(await res.json());
    } else {
      setData(null);
    }
    setLoading(false);
  }, [authKey, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthKey(null);
    setData(null);
    setPassword("");
  };

  if (!authKey) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>Y-de-ONE</h1>
          <p className={styles.loginSub}>分析ダッシュボード</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input
              type="password"
              className={styles.loginInput}
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {authError && <p className={styles.loginError}>パスワードが違います</p>}
            <button type="submit" className={styles.loginBtn} disabled={!password}>
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  const classMax = Math.max(...(data?.classRanking.map((c) => c.count) ?? [1]));
  const dayMax = Math.max(...(data?.dayRanking.map((d) => d.count) ?? [1]));
  const teacherMax = Math.max(...(data?.teacherRanking.map((t) => t.count) ?? [1]));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerLogo}>Y-de-ONE</span>
          <span className={styles.headerTitle}>分析ダッシュボード</span>
        </div>
        <div className={styles.headerRight}>
          <select
            className={styles.monthSelect}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button className={styles.logoutBtn} onClick={handleLogout}>ログアウト</button>
        </div>
      </header>

      <main className={styles.main}>
        {loading && <p className={styles.loadingMsg}>読み込み中...</p>}

        {!loading && data && (
          <>
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryValue}>{data.totalAttendance}</span>
                <span className={styles.summaryLabel}>延べ出席人数</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryValue}>{data.totalSessions}</span>
                <span className={styles.summaryLabel}>開催レッスン数</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryValue}>{data.avgPerSession}</span>
                <span className={styles.summaryLabel}>1レッスン平均</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryValue}>{data.topClass}</span>
                <span className={styles.summaryLabel}>最多クラス</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryValue}>{data.topDay}曜</span>
                <span className={styles.summaryLabel}>最多曜日</span>
              </div>
            </div>

            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h2 className={styles.chartTitle}>クラス別 出席数</h2>
                <BarChart
                  items={data.classRanking.map((c) => ({ label: c.title, count: c.count }))}
                  max={classMax}
                />
              </div>
              <div className={styles.chartCard}>
                <h2 className={styles.chartTitle}>曜日別 出席数</h2>
                <BarChart
                  items={data.dayRanking
                    .filter((d) => d.count > 0)
                    .map((d) => ({ label: `${d.day}曜`, count: d.count }))}
                  max={dayMax}
                />
              </div>
              <div className={styles.chartCard}>
                <h2 className={styles.chartTitle}>先生別 出席数</h2>
                <BarChart
                  items={data.teacherRanking.map((t) => ({ label: t.teacher, count: t.count }))}
                  max={teacherMax}
                />
              </div>
            </div>

            {data.totalAttendance === 0 && (
              <p className={styles.emptyMsg}>この月のデータはありません</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
