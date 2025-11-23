"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import Link from "next/link";

export default function LiffPage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // LIFF 初期化
    liff
      .init({
        liffId: process.env.NEXT_PUBLIC_LIFF_ID as string,
      })
      .then(async () => {
        console.log("LIFF init OK");

        // ログインしていない場合はログイン
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        // プロフィール取得
        const p = await liff.getProfile();
        setProfile(p);

      })
      .catch((err: unknown) => {
        console.error("LIFF init error:", err);
      });
  }, []);

  return (
    <main className="inner">
      <h1>LINEログイン完了</h1>
      <p>ようこそ！体験レッスンの申込みに進めます。</p>

      {profile && (
        <p style={{ marginTop: "8px" }}>
          <strong>{profile.displayName}</strong> さん
        </p>
      )}

      <Link
        href="/trial"
        style={{
          display: "inline-block",
          marginTop: "24px",
          padding: "12px 24px",
          background: "#0090e8",
          color: "#fff",
          borderRadius: "9999px",
        }}
      >
        体験レッスン申込みへ
      </Link>
    </main>
  );
}
