"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import liff from "@line/liff";
import Heading2 from "../_components/sections/common/Heading2";
import { useRouter } from "next/navigation";
import styles from "./TrialForm.module.css";

type Profile = {
  userId: string;
  displayName: string;
};

const TIME_SLOTS: Record<string, Record<number, string[]>> = {
  バレエ: {
    2: ["13:00 - 14:30"],
    3: ["13:00 - 14:30", "19:15 - 20:45"],
    4: ["13:00 - 14:30"],
    5: ["15:00 - 16:30"],
    6: ["12:30 - 14:00", "14:30 - 16:00"],
    0: ["12:30 - 14:00", "14:30 - 16:00"],
  },
  モダンバレエ: {
    2: ["19:30 - 21:00"],
    3: ["15:00 - 16:30"],
    4: ["15:30 - 17:00", "19:30 - 21:00"],
    6: ["16:30 - 18:00"],
  },
};

export default function TrialPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フォーム
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [experience, setExperience] = useState("");
  const [question, setQuestion] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [datePlaceholder, setDatePlaceholder] = useState("希望日を選択してください");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const balletWomanStyle = {
    "--heading-icon-width": "172px",
  } as CSSProperties;

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
    setTimeSlot("");
    setDateError(null);

    // 入力クリアされた場合
    if (!value) {
      setDate("");
      setDatePlaceholder("希望日を選択してください");
      return;
    }

    // ▼ ここで「過去日付かどうか」をチェック
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 今日の0:00に揃える

    const selected = new Date(value + "T00:00:00");

    if (selected < today) {
      // 過去の日付が選ばれたら、値を戻してエラー表示
      setDate("");
      setDatePlaceholder("希望日を選択してください");
      setDateError("過去の日付は選択できません。本日以降の日付をお選びください。");
      return;
    }

    // ここまで来たら「今日以降」なので確定
    setDate(value);

    const day = selected.getDay();
    const youbi = ["日", "月", "火", "水", "木", "金", "土"][day];
    setDatePlaceholder(`${value}（${youbi}）`);

    if (day === 1) {
      setDateError("月曜日はレッスン休講日のため、別の日付をお選びください。");
    }
  };

  const getTimeSlotsForSelectedDate = (): string[] => {
    if (!date || !genre) return [];
    const d = new Date(date + "T00:00:00");
    const day = d.getDay();
    return TIME_SLOTS[genre]?.[day] ?? [];
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
    if (!genre) {
      setError("体験レッスンの種類を選択してください。");
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
          genre,
          date,
          timeSlot,
          experience,
          question,
        }),
      });

      alert(
        "体験レッスンのお申込みありがとうございます。\n詳細はこの後LINEでご連絡いたします。"
      );
      router.push("/");
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
      <main className={styles.trial}>
        <div className={`inner `}>
          <p>読み込み中です…</p>
        </div>
      </main>
    );
  }

  const slots = getTimeSlotsForSelectedDate();

  // ここから下（return 内）は、あなたのHTMLをそのまま残しています
  return (
    <main className={styles.trial}>
      <div className={`inner `}>
<section aria-labelledby="trial-form-heading">
          <Heading2
            title="体験レッスン申込みフォーム"
            lead={
              <>
                高田馬場・東中野・落合・新宿エリアにある「質問できる大人バレエ教室」
                Y-de-ONE（ワイデワン）の体験レッスンお申込みページです。
              </>
            }
          />

          {profile && (
            // <p className={styles.trialLineName}>
            //     <strong>{profile.displayName}</strong>
            //     さん、Y-de-ONEのバレエ体験レッスンに興味をもっていただきありがとうございます。
            // </p>
            <>
              <p className={styles.trialLineName}>
                <strong>{profile.displayName}</strong>
                さん、Y-de-ONEのバレエ体験レッスンに興味をもっていただきありがとうございます。
              </p>
              <p className={styles.formNote}>
                ※ この端末の LINE userId：<code>{profile.userId}</code>
                <br />
                （管理者ID取得のための一時表示です。控えたらこの表示は削除してください）
              </p>
            </>

          )}

          <form className={styles.trialForm} onSubmit={handleSubmit}>
            {/* 氏名（必須） */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                氏名 <span className={styles.formRequired}>必須</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例）山田花子"
              />
            </div>

            {/* ジャンル（必須） */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                体験レッスンの種類 <span className={styles.formRequired}>必須</span>
              </label>
              <div className={styles.radioGroup}>
                {["バレエ", "モダンバレエ"].map((g) => (
                  <label key={g} className={styles.radioItem}>
                    <input
                      type="radio"
                      name="genre"
                      value={g}
                      required
                      checked={genre === g}
                      onChange={(e) => { setGenre(e.target.value); setTimeSlot(""); }}
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 希望日（必須） */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                体験レッスン希望日 <span className={styles.formRequired}>必須</span>
              </label>
              <input
                type="date"
                className={styles.formInput}
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                min={todayStr}
              />
              {date && (
                <p className={styles.formNote}>
                  選択した日：{datePlaceholder}
                </p>
              )}
              {dateError && <p className={styles.formError}>{dateError}</p>}
              {/* <p className={styles.formNote}>
                ※ 月曜日はレッスン休講日のため選択できません。
              </p> */}
            </div>

            {/* 時間帯（必須） */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                体験レッスン時間帯 <span className={styles.formRequired}>必須</span>
              </label>

              {!genre && (
                <p className={styles.formNote}>
                  先に「体験レッスンの種類」を選択してください。
                </p>
              )}

              {genre && !date && (
                <p className={styles.formNote}>
                  先に「体験レッスン希望日」を選択してください。
                </p>
              )}

              {genre && date && slots.length === 0 && (
                <p className={styles.formNote}>
                  この日は{genre}の体験レッスンを行っていません。別の日付をお選びください。
                </p>
              )}

              {slots.length > 0 && (
                <div className={styles.radioGroup}>
                  {slots.map((slot) => (
                    <label key={slot} className={styles.radioItem}>
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
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                バレエ経験 <span className={styles.formRequired}>必須</span>
              </label>
              <div className={styles.radioGroup}>
                {["はじめて", "少しだけ経験あり", "昔やっていた", "今も現役"].map(
                  (label) => (
                    <label key={label} className={styles.radioItem}>
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
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                ご質問・不安なことなど（任意）
              </label>
              <textarea
                className={styles.formTextarea}
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例）服装・持ち物が知りたい／からだが硬いのが心配 など"
              />
            </div>

            {/* エラー表示 */}
            {error && <p className={styles.formError}>{error}</p>}

            <button type="submit" className={styles.formSubmit}>
              この内容で体験レッスンを申込む
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
