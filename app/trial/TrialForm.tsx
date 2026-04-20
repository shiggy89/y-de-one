"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import Heading2 from "../_components/sections/common/Heading2";
import { useRouter } from "next/navigation";
import styles from "./TrialForm.module.css";

type Profile = {
  userId: string;
  displayName: string;
};

// 体験レッスン用（ジャンル×曜日）
const TRIAL_SLOTS: Record<string, Record<number, string[]>> = {
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

// 見学用（曜日 → 全クラス一覧）
const VISIT_SLOTS: Record<number, string[]> = {
  0: [ // 日
    "12:30 - 14:00　バレエ入門（青山佳樹）",
    "14:30 - 16:00　バレエ基礎（青山佳樹）",
    "16:00 - 16:35　ポワント（青山佳樹）",
  ],
  2: [ // 火
    "13:00 - 14:30　バレエ入門（門馬和樹）",
    "14:30 - 15:05　プレモダン（門馬和樹）",
    "19:30 - 21:00　モダンバレエ（青山佳樹）",
  ],
  3: [ // 水
    "13:00 - 14:30　バレエ基礎（門馬和樹）",
    "15:00 - 16:30　モダンバレエ（門馬和樹）",
    "19:15 - 20:45　バレエ入門基礎（青山佳樹）",
  ],
  4: [ // 木
    "13:00 - 14:30　バレエ基礎（青山佳樹）",
    "14:30 - 15:05　ポワント（青山佳樹）",
    "15:30 - 17:00　モダンバレエ（青山佳樹）",
    "19:30 - 21:00　モダンバレエ（門馬和樹）",
  ],
  5: [ // 金
    "15:00 - 16:30　バレエ入門（青山佳樹）",
    "16:30 - 17:05　ポワント（青山佳樹）",
  ],
  6: [ // 土
    "12:30 - 14:00　バレエ入門基礎（門馬和樹）",
    "14:30 - 16:00　バレエ基礎（青山佳樹）",
    "16:30 - 18:00　モダンバレエ（青山佳樹）",
  ],
};

export default function TrialPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フォーム
  const [formType, setFormType] = useState<"trial" | "visit">("trial");
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [experience, setExperience] = useState("");
  const [question, setQuestion] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [datePlaceholder, setDatePlaceholder] = useState("希望日を選択してください");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
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
        setProfile({ userId: p.userId, displayName: p.displayName });
      } catch (e) {
        console.error(e);
        setError("LINEログインに失敗しました。時間をおいて再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    try { initLiff(); } catch (e) { console.error(e); setLoading(false); }
  }, []);

  // 申込み種別が変わったらジャンル・時間帯・経験をリセット
  const handleFormTypeChange = (type: "trial" | "visit") => {
    setFormType(type);
    setGenre("");
    setTimeSlot("");
    setExperience("");
  };

  // ===== 日付変更 =====
  const handleDateChange = (value: string) => {
    setTimeSlot("");
    setDateError(null);

    if (!value) {
      setDate("");
      setDatePlaceholder("希望日を選択してください");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(value + "T00:00:00");

    if (selected < today) {
      setDate("");
      setDatePlaceholder("希望日を選択してください");
      setDateError("過去の日付は選択できません。本日以降の日付をお選びください。");
      return;
    }

    setDate(value);
    const day = selected.getDay();
    const youbi = ["日", "月", "火", "水", "木", "金", "土"][day];
    setDatePlaceholder(`${value}（${youbi}）`);

    if (day === 1) {
      setDateError("月曜日はレッスン休講日のため、別の日付をお選びください。");
    }
  };

  const getSlots = (): string[] => {
    if (!date) return [];
    const day = new Date(date + "T00:00:00").getDay();
    if (formType === "visit") return VISIT_SLOTS[day] ?? [];
    if (!genre) return [];
    return TRIAL_SLOTS[genre]?.[day] ?? [];
  };

  // ===== 送信 =====
  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("氏名を入力してください。"); return; }
    if (formType === "trial" && !genre) { setError("体験レッスンの種類を選択してください。"); return; }
    if (!date) { setError("希望日を選択してください。"); return; }
    const d = new Date(date + "T00:00:00");
    if (d.getDay() === 1) { setError("月曜日はレッスン休講日のため、別の日付をお選びください。"); return; }
    if (!timeSlot) { setError("時間帯を選択してください。"); return; }
    if (formType === "trial" && !experience) { setError("バレエ経験を選択してください。"); return; }

    setSubmitting(true);
    try {
      await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId: profile?.userId,
          lineDisplayName: profile?.displayName,
          name,
          formType,
          genre: formType === "trial" ? genre : undefined,
          date,
          timeSlot,
          experience: formType === "trial" ? experience : undefined,
          question,
        }),
      });

      const msg = formType === "visit"
        ? "見学のお申込みありがとうございます。\n詳細はこの後LINEでご連絡いたします。"
        : "体験レッスンのお申込みありがとうございます。\n詳細はこの後LINEでご連絡いたします。";
      alert(msg);
      router.push("/");
      try { if (liff.isInClient()) liff.closeWindow(); } catch { /* ignore */ }
    } catch (e) {
      console.error(e);
      setError("送信中にエラーが発生しました。時間をおいて再度お試しください。");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.trial}>
        <div className="inner"><p>読み込み中です…</p></div>
      </main>
    );
  }

  const slots = getSlots();

  return (
    <main className={styles.trial}>
      <div className="inner">
        <section aria-labelledby="trial-form-heading">
          <Heading2
            title="体験レッスン・見学 申込みフォーム"
            lead={
              <>
                高田馬場・東中野・落合・新宿エリアにある「質問できる大人バレエ教室」
                Y-de-ONE（ワイデワン）の体験レッスン・見学お申込みページです。
              </>
            }
          />

          {profile && (
            <p className={styles.trialLineName}>
              <strong>{profile.displayName}</strong>
              さん、Y-de-ONEに興味をもっていただきありがとうございます。
            </p>
          )}

          <form className={styles.trialForm} onSubmit={handleSubmit}>

            {/* 申込み種別（必須） */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                申込み種別 <span className={styles.formRequired}>必須</span>
              </label>
              <div className={styles.radioGroup}>
                <label className={styles.radioItem}>
                  <input
                    type="radio"
                    name="formType"
                    value="trial"
                    checked={formType === "trial"}
                    onChange={() => handleFormTypeChange("trial")}
                  />
                  <span>体験レッスン（¥3,300）</span>
                </label>
                <label className={styles.radioItem}>
                  <input
                    type="radio"
                    name="formType"
                    value="visit"
                    checked={formType === "visit"}
                    onChange={() => handleFormTypeChange("visit")}
                  />
                  <span>レッスン見学（無料）</span>
                </label>
              </div>
            </div>

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

            {/* ジャンル（体験のみ・必須） */}
            {formType === "trial" && (
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
                        checked={genre === g}
                        onChange={(e) => { setGenre(e.target.value); setTimeSlot(""); }}
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 希望日（必須） */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {formType === "visit" ? "見学希望日" : "体験レッスン希望日"}{" "}
                <span className={styles.formRequired}>必須</span>
              </label>
              <input
                type="date"
                className={styles.formInput}
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                min={todayStr}
              />
              {date && <p className={styles.formNote}>選択した日：{datePlaceholder}</p>}
              {dateError && <p className={styles.formError}>{dateError}</p>}
            </div>

            {/* 時間帯（必須） */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                時間帯 <span className={styles.formRequired}>必須</span>
              </label>

              {formType === "trial" && !genre && (
                <p className={styles.formNote}>先に「体験レッスンの種類」を選択してください。</p>
              )}

              {(formType === "visit" || genre) && !date && (
                <p className={styles.formNote}>先に「希望日」を選択してください。</p>
              )}

              {(formType === "visit" || genre) && date && slots.length === 0 && (
                <p className={styles.formNote}>
                  {formType === "visit"
                    ? "この日はレッスンを行っていません。別の日付をお選びください。"
                    : `この日は${genre}の体験レッスンを行っていません。別の日付をお選びください。`}
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
                        checked={timeSlot === slot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                      />
                      <span>{slot}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* バレエ経験（体験のみ・必須） */}
            {formType === "trial" && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  バレエ経験 <span className={styles.formRequired}>必須</span>
                </label>
                <div className={styles.radioGroup}>
                  {["はじめて", "少しだけ経験あり", "昔やっていた", "今も現役"].map((label) => (
                    <label key={label} className={styles.radioItem}>
                      <input
                        type="radio"
                        name="experience"
                        value={label}
                        checked={experience === label}
                        onChange={(e) => setExperience(e.target.value)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ご質問（任意） */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>ご質問・不安なことなど（任意）</label>
              <textarea
                className={styles.formTextarea}
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  formType === "visit"
                    ? "例）服装について知りたい／子連れでも大丈夫か など"
                    : "例）服装・持ち物が知りたい／からだが硬いのが心配 など"
                }
              />
            </div>

            {error && <p className={styles.formError}>{error}</p>}

            <button type="submit" className={styles.formSubmit} disabled={submitting}>
              {submitting
                ? "送信中..."
                : formType === "visit"
                  ? "この内容で見学を申込む"
                  : "この内容で体験レッスンを申込む"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
