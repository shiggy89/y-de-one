"use client";

import { FormEvent, useState } from "react";

export default function TrialFormPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    console.log("体験レッスン申込データ:", data);

    // ここで将来は API / Googleフォーム などに送信する
    alert("体験レッスンの申込みを受け付けました！");

    setIsSubmitting(false);
    e.currentTarget.reset();
  };

  return (
    <main className="inner">
      <h1>体験レッスン予約フォーム</h1>
      <p>
        下記のフォームにご入力のうえ送信してください。
        <br />
        講師よりLINEまたはメールでご連絡いたします。
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: "24px" }}>
        {/* お名前 */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="name">お名前（必須）</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="例：山田 花子"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        {/* 連絡先（メール or LINE ID） */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="contact">ご連絡先（メール or LINE）（必須）</label>
          <input
            id="contact"
            name="contact"
            type="text"
            required
            placeholder="例：sample@example.com / LINE ID など"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        {/* 希望日時 */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="date">体験レッスン希望日（必須）</label>
          <input
            id="date"
            name="date"
            type="date"
            required
            style={{ padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="time">体験レッスン希望時間帯（必須）</label>
          <select
            id="time"
            name="time"
            required
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          >
            <option value="">選択してください</option>
            <option value="morning">午前（〜12:00）</option>
            <option value="afternoon">午後（12:00〜17:00）</option>
            <option value="evening">夜（17:00以降）</option>
          </select>
        </div>

        {/* バレエ経験 */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="experience">バレエ経験</label>
          <select
            id="experience"
            name="experience"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          >
            <option value="first">まったく初めて</option>
            <option value="little">少しだけ経験あり</option>
            <option value="experienced">昔しっかりやっていた</option>
          </select>
        </div>

        {/* ご質問・メッセージ */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="message">ご質問・気になることなど</label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder="例：運動不足ですが大丈夫でしょうか？ など"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        {/* 同意 */}
        <div style={{ marginBottom: "24px" }}>
          <label>
            <input type="checkbox" name="agree" required /> 個人情報の取扱いに同意します
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "12px 32px",
            borderRadius: "9999px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isSubmitting ? "送信中..." : "体験レッスンを申し込む"}
        </button>
      </form>
    </main>
  );
}