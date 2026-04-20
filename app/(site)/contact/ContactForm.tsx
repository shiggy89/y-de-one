"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Heading2 from "../../_components/sections/common/Heading2";
import styles from "./ContactForm.module.css";

const CATEGORIES = [
  "体験レッスン",
  "レッスン見学",
  "料金",
  "クラス・スケジュール",
  "出演依頼",
  "振付依頼",
  "出張レッスン",
  "その他",
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export default function ContactForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("お名前を入力してください。"); return; }
    if (!email.trim()) { setError("メールアドレスを入力してください。"); return; }
    if (!EMAIL_REGEX.test(email.trim())) { setError("正しいメールアドレスの形式で入力してください。"); return; }
    if (!message.trim()) { setError("お問い合わせ内容を入力してください。"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, message }),
      });

      if (!res.ok) throw new Error("送信失敗");

      sessionStorage.setItem("contactData", JSON.stringify({ name, email, category, message }));
      router.push("/contact/thanks");
    } catch {
      setError("送信中にエラーが発生しました。時間をおいて再度お試しください。");
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.contact}>
      <div className="inner">
        <section>
          <Heading2
            title="お問い合わせ"
            lead="Y-de-ONEへのご質問・ご相談はこちらからお気軽にどうぞ。"
          />

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>
                お名前 <span className={styles.required}>必須</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例）山田花子"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                メールアドレス <span className={styles.required}>必須</span>
              </label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="例）hanako@example.com"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>お問い合わせ種別</label>
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">選択してください（任意）</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                お問い合わせ内容 <span className={styles.required}>必須</span>
              </label>
              <textarea
                className={styles.textarea}
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="ご質問・ご相談内容をご記入ください"
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? "送信中..." : "送信する"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
