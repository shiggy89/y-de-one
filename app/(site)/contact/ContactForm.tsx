"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Heading2 from "../../_components/sections/common/Heading2";
import styles from "./ContactForm.module.css";

const CATEGORIES = [
  "体験レッスン",
  "レッスン見学",
  "料金",
  "Y-de-ONE クラス",
  "埼玉クラス（門馬和樹クラス）",
  "ダウン症の方向けクラス",
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
  const [emailConfirm, setEmailConfirm] = useState("");
  const [category, setCategory] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isOther = category === "その他";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("お名前を入力してください。"); return; }
    if (!email.trim()) { setError("メールアドレスを入力してください。"); return; }
    if (!EMAIL_REGEX.test(email.trim())) { setError("正しいメールアドレスの形式で入力してください。"); return; }
    if (!emailConfirm.trim()) { setError("メールアドレス（確認）を入力してください。"); return; }
    if (email.trim() !== emailConfirm.trim()) { setError("メールアドレスが一致していません。"); return; }
    if (!category) { setError("お問い合わせ種別を選択してください。"); return; }
    if (isOther) {
      if (!companyName.trim()) { setError("会社名を入力してください。"); return; }
      if (!companyAddress.trim()) { setError("会社住所を入力してください。"); return; }
      if (!companyPhone.trim()) { setError("会社電話番号を入力してください。"); return; }
    }
    if (!message.trim()) { setError("お問い合わせ内容を入力してください。"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, companyName, companyAddress, companyPhone, message }),
      });

      if (!res.ok) throw new Error("送信失敗");

      sessionStorage.setItem("contactData", JSON.stringify({ name, email, category, companyName, companyAddress, companyPhone, message }));
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
            lead={<>Y-de-ONEへのご質問・ご相談は<br />こちらからお気軽にご連絡ください。</>}
          />

          <div className={styles.phoneSection}>
            <p className={styles.phoneSectionTitle}>
              <i className="fa-solid fa-phone" aria-hidden="true" />
              お電話でのお問い合わせ
            </p>
            <a href="tel:08067400770" className={styles.phoneNumber}>
              080-6740-0770
            </a>
          </div>

          <p className={styles.formTitle}>フォームでのお問い合わせ</p>

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
              <label className={styles.label}>
                メールアドレス（確認） <span className={styles.required}>必須</span>
              </label>
              <input
                type="email"
                className={styles.input}
                value={emailConfirm}
                onChange={(e) => setEmailConfirm(e.target.value)}
                placeholder="もう一度入力してください"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                お問い合わせ種別 <span className={styles.required}>必須</span>
              </label>
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">選択してください</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {isOther && (
              <div className={styles.otherFields}>
                <p className={styles.otherNote}>
                  「その他」をご選択の場合、以下の項目が必要です。
                </p>
                <div className={styles.field}>
                  <label className={styles.label}>
                    会社名 <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="例）株式会社〇〇"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    会社住所 <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="例）東京都渋谷区〇〇1-2-3"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    会社電話番号 <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="tel"
                    className={styles.input}
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="例）03-1234-5678"
                  />
                </div>
              </div>
            )}

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
