"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import Heading2 from "../_components/sections/common/Heading2";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./TrialForm.module.css";
import { lineAuthHeaders } from "@/lib/lineClient";
import { DEMO_MODE } from "@/lib/demo";
import { fetchDemoSession } from "@/lib/demoClient";
import { EN, fmtLessons, fmtMonth, fmtYearMonth, tr, weekday } from "@/lib/tr";

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
// 最初に表示する候補日数（残りは「さらに日程を表示」で開く）
const INITIAL_DATE_COUNT = 3;
const YOUBI = [0, 1, 2, 3, 4, 5, 6].map(weekday);

// 「13:00 - 14:30　バレエ入門（門馬和樹）」を英語で表示する（送信する値は日本語のまま）
function trSlot(slot: string): string {
  if (!EN) return slot;
  const m = slot.match(/^(\d{2}:\d{2} - \d{2}:\d{2})　(.+?)（(.+?)）$/);
  return m ? `${m[1]}  ${tr(m[2])} (${tr(m[3])})` : slot;
}

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
  const [showAllDates, setShowAllDates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const trialPrice = isNewPricingActive() ? "3,500" : "3,300";

  // ===== LIFF 初期化 =====
  useEffect(() => {
    const initLiff = async () => {
      try {
        if (DEMO_MODE) {
          const session = await fetchDemoSession();
          setProfile({ userId: session.lineUserId, displayName: session.displayName });
          setLoading(false);
          return;
        }

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
            headers: { "Content-Type": "application/json", ...lineAuthHeaders() },
            body: JSON.stringify({ line_picture_url: p.pictureUrl }),
          }).catch(console.error);
        }
      } catch (e) {
        console.error(e);
        setError(tr("LINEログインに失敗しました。時間をおいて再度お試しください。"));
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
    setShowAllDates(false);
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
  const visibleGroups = showAllDates ? dateGroups : dateGroups.slice(0, INITIAL_DATE_COUNT);
  const hiddenCount = dateGroups.length - visibleGroups.length;

  // ===== 送信 =====
  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError(tr("氏名を入力してください。")); return; }
    if (formType === "trial" && !genre) { setError(tr("体験レッスンの種類を選択してください。")); return; }
    if (noSlotMatch) {
      if (!customRequest.trim()) { setError(tr("ご希望の曜日・時間帯を入力してください。")); return; }
    } else if (!date || !timeSlot) {
      setError(tr("希望日時を選択してください。"));
      return;
    }
    if (formType === "trial" && !experience) { setError(tr("バレエ経験を選択してください。")); return; }

    setSubmitting(true);
    try {
      await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...lineAuthHeaders() },
        body: JSON.stringify({
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
        ? tr("ご希望ありがとうございます。\nスタッフが改めて日程をご案内いたします。")
        : formType === "visit"
          ? tr("見学のお申込みありがとうございます。\n詳細はこの後LINEでご連絡いたします。")
          : tr("体験レッスンのお申込みありがとうございます。\n詳細はこの後LINEでご連絡いたします。");
      alert(msg);
      router.push("/");
      try { if (liff.isInClient()) liff.closeWindow(); } catch { /* ignore */ }
    } catch (e) {
      console.error(e);
      setError(tr("送信中にエラーが発生しました。時間をおいて再度お試しください。"));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.trial}>
        <div className="inner"><p>{tr("読み込み中です…")}</p></div>
      </main>
    );
  }

  return (
    <main className={styles.trial}>
      <div className="inner">
        <section aria-labelledby="trial-form-heading">
          <Heading2
            title={<>{tr("見学・体験レッスン")}<br className={styles.titleBr} />{tr("申込みフォーム")}</>}
            lead={
              <>
                {tr("高田馬場・東中野・落合・新宿エリアにある「質問できる大人バレエ教室」 Y-de-ONE（ワイデワン）の体験レッスン・レッスン見学お申込みページです。")}
              </>
            }
          />

          {profile && (
            <p className={styles.trialLineName}>
              <strong>{profile.displayName}</strong>
              {tr("さん、Y-de-ONEに興味をもっていただきありがとうございます。")}
            </p>
          )}

          <form className={styles.trialForm} onSubmit={handleSubmit}>

            {/* 申込み種別（必須） */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {tr("申込み種別")} <span className={styles.formRequired}>{tr("必須")}</span>
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
                  <span>{EN ? `Trial lesson (¥${trialPrice})` : `体験レッスン（¥${trialPrice}）`}</span>
                </label>
                <label className={styles.radioItem}>
                  <input
                    type="radio"
                    name="formType"
                    value="visit"
                    checked={formType === "visit"}
                    onChange={() => handleFormTypeChange("visit")}
                  />
                  <span>{tr("レッスン見学（無料）")}</span>
                </label>
              </div>
            </div>

            {/* 氏名（必須） */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {tr("氏名")} <span className={styles.formRequired}>{tr("必須")}</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tr("例）山田花子")}
              />
            </div>

            {/* ジャンル（体験のみ・必須） */}
            {formType === "trial" && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  {tr("体験レッスンの種類")} <span className={styles.formRequired}>{tr("必須")}</span>
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
                        setShowAllDates(false);
                      }}
                      />
                      <span>{tr(g)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 希望日時（必須）：空いている日時だけを選択肢として表示する */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {tr(formType === "visit" ? "見学希望日時" : "体験レッスン希望日時")}{" "}
                <span className={styles.formRequired}>{tr("必須")}</span>
              </label>

              {formType === "trial" && !genre && (
                <p className={styles.formNote}>{tr("先に「体験レッスンの種類」を選択してください。")}</p>
              )}

              {(formType === "visit" || genre) && dateGroups.length === 0 && (
                <p className={styles.formNote}>
                  {tr("現在お選びいただける日時がありません。お手数ですがお問い合わせください。")}
                </p>
              )}

              {dateGroups.length > 0 && (
                <div className={styles.slotList}>
                  {visibleGroups.map((group) => (
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
                            <span>{trSlot(item)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      className={styles.showMoreButton}
                      onClick={() => setShowAllDates(true)}
                    >
                      {tr("さらに日程を表示")}
                    </button>
                  )}
                </div>
              )}

              {(formType === "visit" || genre) && (
                <div
                  className={`${styles.noMatchCard} ${noSlotMatch ? styles.noMatchCardActive : ""}`}
                >
                  <label className={styles.noMatchOption}>
                    <input
                      type="radio"
                      name="dateTimeSlot"
                      checked={noSlotMatch}
                      onChange={selectNoSlotMatch}
                    />
                    <span className={styles.noMatchText}>
                      <span className={styles.noMatchTitle}>
                        {tr("希望の日時がない場合")}
                        <br />
                        {tr("（曜日・時間帯を伝える）")}
                      </span>
                      <span className={styles.noMatchSub}>
                        {tr("ご希望をお聞きして、スタッフから改めて日程をご案内します")}
                      </span>
                    </span>
                  </label>

                  {noSlotMatch && (
                    <div className={styles.noMatchField}>
                      <label className={styles.formLabel}>
                        {tr("ご希望の曜日・時間帯")} <span className={styles.formRequired}>{tr("必須")}</span>
                      </label>
                      <textarea
                        className={styles.formTextarea}
                        rows={3}
                        value={customRequest}
                        onChange={(e) => setCustomRequest(e.target.value)}
                        placeholder={tr("例）水曜19時以降 / 土日の午前中を希望 など")}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* バレエ経験（体験のみ・必須） */}
            {formType === "trial" && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  {tr("バレエ経験")} <span className={styles.formRequired}>{tr("必須")}</span>
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
                      <span>{tr(label)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ご質問（任意） */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>{tr("ご質問・不安なことなど（任意）")}</label>
              <textarea
                className={styles.formTextarea}
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  tr(formType === "visit"
                    ? "例）服装について知りたい／子連れでも大丈夫か など"
                    : "例）服装・持ち物が知りたい／からだが硬いのが心配 など")
                }
              />
            </div>

            {error && <p className={styles.formError}>{error}</p>}

            <button type="submit" className={styles.formSubmit} disabled={submitting}>
              {tr(submitting
                ? "送信中..."
                : noSlotMatch
                  ? "この内容で日程を相談する"
                  : formType === "visit"
                    ? "この内容で見学を申込む"
                    : "この内容で体験レッスンを申込む")}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
