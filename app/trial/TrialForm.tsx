"use client";

import { useEffect, useState, type FormEvent } from "react";
import liff from "@line/liff";
import Heading2 from "../_components/Heading2";

type Profile = {
  userId: string;
  displayName: string;
};

const TIME_SLOTS: Record<number, string[]> = {
  // getDay(): 0=日,1=月,2=火,3=水,4=木,5=金,6=土
  1: [], // 月曜は休講
  2: ["13:00 - 14:30"],
  3: ["13:00 - 14:30", "15:00 - 16:30", "19:15 - 20:45"],
  4: ["13:00 - 14:30", "15:30 - 17:00", "19:30 - 21:00"],
  5: ["15:00 - 16:30"],
  6: ["12:30 - 14:00", "14:30 - 16:00", "16:30 - 18:00"],
  0: ["12:30 - 14:00", "14:30 - 16:00"], // 日
};

export default function TrialPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フォーム
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [experience, setExperience] = useState("");
  const [question, setQuestion] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  // ===== LIFF 初期化 =====
  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

        if (!liffId) {
          console.warn("NEXT_PUBLIC_LIFF_ID が設定されていません。");
          setLoading(false);
          return;
        }

        // 開発用：ブラウザから直接アクセスしたときのダミープロフィール
        if (!liff.isInClient() && process.env.NODE_ENV !== "production") {
          setProfile({
            userId: "debug",
            displayName: "テストユーザー",
          });
          setLoading(false);
          return;
        }

        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const p = await liff.getProfile();
        setProfile({
          userId: p.userId,
          displayName: p.displayName,
        });
      } catch (e) {
        console.error(e);
        setError(
          "LINEログインに失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        setLoading(false);
      }
    };

    // isInClient() が投げる環境もあるので try で包む
    try {
      initLiff();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  // ===== 日付変更 =====
  const handleDateChange = (value: string) => {
    setDate(value);
    setTimeSlot("");
    setDateError(null);

    if (!value) return;

    const d = new Date(value + "T00:00:00");
    const day = d.getDay();

    if (day === 1) {
      setDateError("月曜日はレッスン休講日のため、別の日付をお選びください。");
    }
  };

  const getTimeSlotsForSelectedDate = (): string[] => {
    if (!date) return [];
    const d = new Date(date + "T00:00:00");
    const day = d.getDay();
    return TIME_SLOTS[day] || [];
  };

  // ===== 送信 =====
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // 必須チェック
    if (!name.trim()) {
      setError("氏名を入力してください。");
      return;
    }
    if (!date) {
      setError("体験レッスン希望日を選択してください。");
      return;
    }
    const d = new Date(date + "T00:00:00");
    if (d.getDay() === 1) {
      setError("月曜日はレッスン休講日のため、別の日付をお選びください。");
      return;
    }
    if (!timeSlot) {
      setError("体験レッスン時間帯を選択してください。");
      return;
    }
    if (!experience) {
      setError("バレエ経験を選択してください。");
      return;
    }

    try {
      await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId: profile?.userId,
          lineDisplayName: profile?.displayName,
          name,
          date,
          timeSlot,
          experience,
          question, // 質問は任意
        }),
      });

      alert(
        "体験レッスンのお申込みありがとうございます。\n詳細はこの後LINEでご連絡いたします。"
      );
      // 必要であればLIFFを閉じる
      try {
        if (liff.isInClient()) {
          liff.closeWindow();
        }
      } catch {
        // ブラウザ直アクセス時などは何もしない
      }
    } catch (e) {
      console.error(e);
      setError(
        "送信中にエラーが発生しました。時間をおいて再度お試しください。"
      );
    }
  };

  if (loading) {
    return (
      <main className="trial">
        <div className="inner inner-trial">
          <p>読み込み中です…</p>
        </div>
      </main>
    );
  }

  const slots = getTimeSlotsForSelectedDate();

  // ここから下（return 内）は、あなたのHTMLをそのまま残しています
  return (
    <main className="trial">
      <div className="inner inner-trial">
        <h1 className="page-title">
          Y-de-ONEバレエ体験レッスンのお申込み〜初心者歓迎〜
        </h1>
        <section aria-labelledby="trial-form-heading">
          <Heading2
            title="体験レッスン申込みフォーム"
            lead={
              <>
                高田馬場・東中野・落合・新宿エリアにある「質問できる大人バレエ教室」
                Y-de-ONE（ワイデワン）の体験レッスンお申込みページです。
              </>
            }
            leftClassName="ballet-woman-icon heading2-icon-left"
            leftSrc="ballet-woman2-icon.png"
            leftAlt="バレエアイコン"
            rightClassName="ballet-woman-icon heading2-icon-right"
            rightSrc="ballet-woman3-icon.png"
            rightAlt="バレエアイコン"
            width={469}
            height={532}
          />

          {profile && (
            <p className="trial-line-name">
              <strong>{profile.displayName}</strong>
              さん、Y-de-ONEのバレエ体験レッスンに興味をもっていただきありがとうございます。
            </p>
          )}

          <form className="trial-form" onSubmit={handleSubmit}>
            {/* 氏名（必須） */}
            <div className="form-field">
              <label className="form-label">
                氏名 <span className="form-required">必須</span>
              </label>
              <input
                type="text"
                className="form-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例）山田花子 / はなこ さん"
              />
            </div>

            {/* 希望日（必須） */}
            <div className="form-field">
              <label className="form-label">
                体験レッスン希望日 <span className="form-required">必須</span>
              </label>
              <input
                type="date"
                className="form-input"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              {dateError && <p className="form-error">{dateError}</p>}
              <p className="form-note">
                ※ 月曜日はレッスン休講日のため選択できません。
              </p>
            </div>

            {/* 時間帯（必須） */}
            <div className="form-field">
              <label className="form-label">
                体験レッスン時間帯 <span className="form-required">必須</span>
              </label>

              {!date && (
                <p className="form-note">
                  先に「体験レッスン希望日」を選択してください。
                </p>
              )}

              {date && slots.length === 0 && (
                <p className="form-note">
                  この日はレッスンを行っていません。別の日付をお選びください。
                </p>
              )}

              {slots.length > 0 && (
                <div className="radio-group">
                  {slots.map((slot) => (
                    <label key={slot} className="radio-item">
                      <input
                        type="radio"
                        name="timeSlot"
                        value={slot}
                        required
                        checked={timeSlot === slot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                      />
                      <span>{slot}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* バレエ経験（必須） */}
            <div className="form-field">
              <label className="form-label">
                バレエ経験 <span className="form-required">必須</span>
              </label>
              <div className="radio-group">
                {["はじめて", "少しだけ経験あり", "昔しっかりやっていた", "今も現役"].map(
                  (label) => (
                    <label key={label} className="radio-item">
                      <input
                        type="radio"
                        name="experience"
                        value={label}
                        required
                        checked={experience === label}
                        onChange={(e) => setExperience(e.target.value)}
                      />
                      <span>{label}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* ご質問（任意） */}
            <div className="form-field">
              <label className="form-label">
                ご質問・不安なことなど（任意）
              </label>
              <textarea
                className="form-textarea"
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例）服装・持ち物が知りたい／からだが硬いのが心配 など"
              />
            </div>

            {/* エラー表示 */}
            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="form-submit">
              この内容で体験レッスンを申込む
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
