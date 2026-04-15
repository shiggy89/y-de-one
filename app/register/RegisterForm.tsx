"use client";

import { useEffect, useState, type FormEvent } from "react";
import liff from "@line/liff";
import Heading2 from "../_components/sections/common/Heading2";
import styles from "../trial/TrialForm.module.css";
import popupStyles from "./register.module.css";

type Profile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

export default function RegisterForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

        if (!liffId) {
          setLoading(false);
          return;
        }

        if (!liff.isInClient() && process.env.NODE_ENV !== "production") {
          setProfile({ userId: "debug", displayName: "テストユーザー" });
          setLoading(false);
          return;
        }

        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const p = await liff.getProfile();
        setProfile({ userId: p.userId, displayName: p.displayName, pictureUrl: p.pictureUrl });
      } catch (e) {
        console.error(e);
        setError("LINEログインに失敗しました。時間をおいて再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    try {
      initLiff();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!lastName.trim() || !firstName.trim()) {
      setError("氏名を入力してください。");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId: profile?.userId,
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          lineDisplayName: profile?.displayName,
          linePictureUrl: profile?.pictureUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました。");
        return;
      }

      setShowPopup(true);
    } catch (e) {
      console.error(e);
      setError("送信中にエラーが発生しました。時間をおいて再度お試しください。");
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    try {
      if (liff.isInClient()) {
        liff.closeWindow();
      }
    } catch {
      // ブラウザ直アクセス時は何もしない
    }
  };

  if (loading) {
    return (
      <main className={styles.trial}>
        <div className="inner">
          <p>読み込み中です…</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.trial}>
      <div className="inner">
        <Heading2
          title="会員登録フォーム"
          lead="Y-de-ONE（ワイデワン）の会員登録ページです。"
        />

        {profile && (
          <p className={styles.trialLineName}>
            <strong>{profile.displayName}</strong>
            さん、お名前を登録してください。
          </p>
        )}

        <form className={styles.trialForm} onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label className={styles.formLabel}>
                姓 <span className={styles.formRequired}>必須</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="例）山田"
              />
            </div>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label className={styles.formLabel}>
                名 <span className={styles.formRequired}>必須</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="例）花子"
              />
            </div>
          </div>

          {error && <p className={styles.formError}>{error}</p>}

          <button type="submit" className={styles.formSubmit}>
            登録する
          </button>
        </form>
      </div>

      {showPopup && (
        <div className={popupStyles.overlay}>
          <div className={popupStyles.popup}>
            <p className={popupStyles.popupIcon}>✅</p>
            <p className={popupStyles.popupTitle}>登録が完了しました！</p>
            <p className={popupStyles.popupText}>
              {profile?.displayName} さん、<br />Y-de-ONEへようこそ！
            </p>
            <button className={popupStyles.popupBtn} onClick={handlePopupClose}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
