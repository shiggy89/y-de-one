"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import Heading2 from "../_components/sections/common/Heading2";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./TrialForm.module.css";

type Profile = {
  userId: string;
  displayName: string;
};

// 2026年9月から新料金体系（体験レッスン3,300円→3,500円）に切替
const NEW_PRICING_MONTH = "2026-09";
const isNewPricingActive = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }).slice(0, 7) >= NEW_PRICING_MONTH;

// 体験レッスン用（ジャンル×曜日）
const TRIAL_SLOTS: Record<string, Record<number, string[]>> = {
  バレエ: {
    2: ["13:00 - 14:30"],
    3: ["13:00 - 14:30", "19:15 - 20:45"],
    4: ["13:00 - 14:30"],
    5: ["15:00 - 16:30"],
    6: ["12:30 - 14:00"],
    0: ["12:30 - 14:00"],
  },
  モダンバレエ: {
    2: ["19:30 - 21:00"],
    3: ["15:00 - 16:30"],
    4: ["15:30 - 17:00", "19:30 - 21:00"],
    6: ["14:30 - 16:00"],
  },
};

// 見学用（曜日 → 全クラス一覧）
const VISIT_SLOTS: Record<number, string[]> = {
  0: [ // 日
    "12:30 - 14:00　バレエ入門基礎合同（青山佳樹）",
    "14:00 - 14:35　ポワント（青山佳樹）",
  ],
  2: [ // 火
    "13:00 - 14:30　バレエ入門（門馬和樹）",
    "14:30 - 15:05　プレモダン（門馬和樹）",
    "19:30 - 21:00　モダンバレエ（青山佳樹）",
  ],
  3: [ // 水
    "13:00 - 14:30　バレエ入門基礎（門馬和樹）",
    "15:00 - 16:30　モダンバレエ（門馬和樹）",
    "19:15 - 20:45　バレエ入門基礎合同（青山佳樹）",
  ],
  4: [ // 木
    "13:00 - 14:30　バレエ入門基礎合同（青山佳樹）",
    "14:30 - 15:05　ポワント（青山佳樹）",
    "15:30 - 17:00　モダンバレエ（青山佳樹）",
    "19:30 - 21:00　モダンバレエ（門馬和樹）",
  ],
  5: [ // 金
    "15:00 - 16:30　バレエ入門（青山佳樹）",
    "16:30 - 17:05　ポワント（青山佳樹）",
  ],
  6: [ // 土
    "12:30 - 14:00　バレエ入門基礎合同（門馬和樹）",
    "14:30 - 16:00　モダンバレエ（青山佳樹）",
  ],
};

// 今日から先、何日分の候補日を表示するか（3週間分）
const UPCOMING_DAYS = 21;
const YOUBI = ["日", "月", "火", "水", "木", "金", "土"];

// タイムゾーンのズレを起こさない日付文字列変換（toISOString()はUTC変換されるため使わない）
function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type DateGroup = { date: string; label: string; items: string[] };

// 今日から先の実際のカレンダー日付に、空いている枠だけを当てはめて一覧化する
function buildDateGroups(formType: "trial" | "visit", genre: string): DateGroup[] {
  const groups: DateGroup[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < UPCOMING_DAYS; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const day = d.getDay();
    const isJuly2026 = d.getFullYear() === 2026 && d.getMonth() === 6;

    let items: string[] = [];
    if (formType === "visit") {
      items = VISIT_SLOTS[day] ?? [];
      if (isJuly2026 && day === 2) {
        items = items.filter((s) => !s.startsWith("19:30"));
      }
    } else if (genre) {
      items = TRIAL_SLOTS[genre]?.[day] ?? [];
      if (isJuly2026 && genre === "モダンバレエ" && day === 2) {
        items = items.filter((s) => s !== "19:30 - 21:00");
      }
    }

    if (items.length > 0) {
      groups.push({
        date: localDateStr(d),
        label: `${d.getMonth() + 1}/${d.getDate()}(${YOUBI[day]})`,
        items,
      });
    }
  }
  return groups;
}

export default function TrialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フォーム
  const [formType, setFormType] = useState<"trial" | "visit">(
    searchParams.get("type") === "visit" ? "visit" : "trial"
  );
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [experience, setExperience] = useState("");
  const [question, setQuestion] = useState("");
  const [noSlotMatch, setNoSlotMatch] = useState(false);
  const [customRequest, setCustomRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const trialPrice = isNewPricingActive() ? "3,500" : "3,300";

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
        if (p.pictureUrl) {
          fetch("/api/mypage/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineUserId: p.userId, line_picture_url: p.pictureUrl }),
          }).catch(console.error);
        }
      } catch (e) {
        console.error(e);
        setError("LINEログインに失敗しました。時間をおいて再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    try { initLiff(); } catch (e) { console.error(e); setLoading(false); }
  }, []);

  // 申込み種別が変わったらジャンル・日時・経験をリセット
  const handleFormTypeChange = (type: "trial" | "visit") => {
    setFormType(type);
    setGenre("");
    setDate("");
    setTimeSlot("");
    setExperience("");
    setNoSlotMatch(false);
    setCustomRequest("");
  };

  // 日時の選択(日付と時間帯を同時に確定させる)
  const selectSlot = (slotDate: string, item: string) => {
    setDate(slotDate);
    setTimeSlot(item);
    setNoSlotMatch(false);
  };

  // 「希望の日時が見つからない」を選んだ場合
  const selectNoSlotMatch = () => {
    setNoSlotMatch(true);
    setDate("");
    setTimeSlot("");
  };

  const dateGroups = buildDateGroups(formType, genre);

  // ===== 送信 =====
  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("氏名を入力してください。"); return; }
    if (formType === "trial" && !genre) { setError("体験レッスンの種類を選択してください。"); return; }
    if (noSlotMatch) {
      if (!customRequest.trim()) { setError("ご希望の曜日・時間帯を入力してください。"); return; }
    } else if (!date || !timeSlot) {
      setError("希望日時を選択してください。");
      return;
    }
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
          date: noSlotMatch ? undefined : date,
          timeSlot: noSlotMatch ? undefined : timeSlot,
          customRequest: noSlotMatch ? customRequest : undefined,
          experience: formType === "trial" ? experience : undefined,
          question,
        }),
      });

      const msg = noSlotMatch
        ? "ご希望ありがとうございます。\nスタッフが改めて日程をご案内いたします。"
        : formType === "visit"
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

  return (
    <main className={styles.trial}>
      <div className="inner">
        <section aria-labelledby="trial-form-heading">
          <Heading2
            title={<>見学・体験レッスン<br className={styles.titleBr} />申込みフォーム</>}
            lead={
              <>
                高田馬場・東中野・落合・新宿エリアにある「質問できる大人バレエ教室」
                Y-de-ONE（ワイデワン）の体験レッスン・レッスン見学お申込みページです。
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
                  <span>体験レッスン（¥{trialPrice}）</span>
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
                        onChange={(e) => {
                        setGenre(e.target.value);
                        setDate("");
                        setTimeSlot("");
                        setNoSlotMatch(false);
                        setCustomRequest("");
                      }}
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 希望日時（必須）：空いている日時だけを選択肢として表示する */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {formType === "visit" ? "見学希望日時" : "体験レッスン希望日時"}{" "}
                <span className={styles.formRequired}>必須</span>
              </label>

              {formType === "trial" && !genre && (
                <p className={styles.formNote}>先に「体験レッスンの種類」を選択してください。</p>
              )}

              {(formType === "visit" || genre) && dateGroups.length === 0 && (
                <p className={styles.formNote}>
                  現在お選びいただける日時がありません。お手数ですがお問い合わせください。
                </p>
              )}

              {dateGroups.length > 0 && (
                <div className={styles.slotList}>
                  {dateGroups.map((group) => (
                    <div key={group.date} className={styles.slotGroup}>
                      <p className={styles.slotDate}>{group.label}</p>
                      <div className={styles.radioGroup}>
                        {group.items.map((item) => (
                          <label key={item} className={styles.radioItem}>
                            <input
                              type="radio"
                              name="dateTimeSlot"
                              checked={date === group.date && timeSlot === item}
                              onChange={() => selectSlot(group.date, item)}
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(formType === "visit" || genre) && (
                <label className={`${styles.radioItem} ${styles.noMatchOption}`}>
                  <input
                    type="radio"
                    name="dateTimeSlot"
                    checked={noSlotMatch}
                    onChange={selectNoSlotMatch}
                  />
                  <span>ご希望の日時が見つからない方はこちら</span>
                </label>
              )}

              {noSlotMatch && (
                <div className={styles.noMatchField}>
                  <label className={styles.formLabel}>
                    ご希望の曜日・時間帯 <span className={styles.formRequired}>必須</span>
                  </label>
                  <textarea
                    className={styles.formTextarea}
                    rows={3}
                    value={customRequest}
                    onChange={(e) => setCustomRequest(e.target.value)}
                    placeholder="例）水曜19時以降 / 土日の午前中を希望 など"
                  />
                  <p className={styles.formNote}>
                    いただいた内容をもとに、スタッフから改めて日程をご案内いたします。
                  </p>
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
                : noSlotMatch
                  ? "この内容で日程を相談する"
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
