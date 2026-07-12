"use client";

import { useState, useEffect } from "react";
import s from "./analytics.module.css";

const SESSION_KEY = "analytics_key";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function AnalyticsPage() {
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setAuthKey(saved);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch(`/api/analytics?month=${getCurrentMonth()}`, {
      headers: { "x-analytics-key": pw },
    });
    setLoading(false);
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, pw);
      setAuthKey(pw);
    } else {
      setError(true);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthKey(null);
  };

  if (!authKey) {
    return (
      <div className={s.loginPage}>
        <div className={s.loginCard}>
          <div className={s.loginLogo}>Y-de-ONE</div>
          <p className={s.loginSub}>分析ページ</p>
          <form onSubmit={submit} className={s.loginForm}>
            <input
              type="password"
              className={s.loginInput}
              placeholder="パスワード"
              value={pw}
              onChange={e => setPw(e.target.value)}
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

  return (
    <div className={s.page}>
      <header className={s.header}>
        <span className={s.logo}>Y-de-ONE 分析</span>
        <button className={s.logoutBtn} onClick={logout}>ログアウト</button>
      </header>
      <main className={s.main}>
        <p className={s.placeholder}>準備中</p>
      </main>
    </div>
  );
}
