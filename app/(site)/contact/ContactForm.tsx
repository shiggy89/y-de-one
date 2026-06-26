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

const DEPARTMENTS = [
  "代表・役員",
  "経営企画室",
  "秘書室",
  "営業部",
  "営業推進部",
  "法人営業部",
  "個人営業部",
  "インサイドセールス部",
  "企画部",
  "商品企画部",
  "事業開発部",
  "新規事業部",
  "マーケティング部",
  "デジタルマーケティング部",
  "広報・PR部",
  "ブランド戦略部",
  "SNS・コンテンツ部",
  "制作部",
  "クリエイティブ部",
  "デザイン部",
  "映像・動画制作部",
  "イベント企画部",
  "プロモーション部",
  "人事部",
  "採用部",
  "人材開発部",
  "総務部",
  "経理部",
  "財務部",
  "法務部",
  "コンプライアンス部",
  "情報システム部",
  "DX推進部",
  "開発部",
  "エンジニアリング部",
  "カスタマーサポート部",
  "CS・CX部",
  "その他",
];

export default function ContactForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [category, setCategory] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNameKana, setCompanyNameKana] = useState("");
  const [companyPostal, setCompanyPostal] = useState("");
  const [companyPrefecture, setCompanyPrefecture] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyStreet, setCompanyStreet] = useState("");
  const [companyBuilding, setCompanyBuilding] = useState("");
  const [companyAddressKana, setCompanyAddressKana] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactNameKana, setContactNameKana] = useState("");
  const [contactDepartment, setContactDepartment] = useState("");
  const [contactPhone, setContactPhone] = useState("");
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
      if (!companyNameKana.trim()) { setError("会社名（ふりがな）を入力してください。"); return; }
      if (!companyPostal.trim()) { setError("郵便番号を入力してください。"); return; }
      if (!companyPrefecture.trim()) { setError("都道府県を入力してください。"); return; }
      if (!companyCity.trim()) { setError("市区町村を入力してください。"); return; }
      if (!companyStreet.trim()) { setError("番地を入力してください。"); return; }
      if (!companyBuilding.trim()) { setError("建物名・部屋番号を入力してください。"); return; }
      if (!companyAddressKana.trim()) { setError("住所（ふりがな）を入力してください。"); return; }
      if (!companyPhone.trim()) { setError("会社電話番号を入力してください。"); return; }
      if (!contactName.trim()) { setError("担当者氏名を入力してください。"); return; }
      if (!contactNameKana.trim()) { setError("担当者氏名（ふりがな）を入力してください。"); return; }
      if (!contactDepartment) { setError("担当部署を選択してください。"); return; }
      if (!contactPhone.trim()) { setError("担当電話番号を入力してください。"); return; }
      if (contactPhone.trim() === companyPhone.trim()) { setError("担当電話番号は会社電話番号と異なる番号を入力してください。"); return; }
    }
    if (!message.trim()) { setError("お問い合わせ内容を入力してください。"); return; }
    if (isOther && message.trim().length > 100) { setError("「その他」のお問い合わせ内容は100文字以内でご入力ください。"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, companyName, companyNameKana, companyPostal, companyPrefecture, companyCity, companyStreet, companyBuilding, companyAddressKana, companyPhone, contactName, contactNameKana, contactDepartment, contactPhone, message }),
      });

      if (!res.ok) throw new Error("送信失敗");

      sessionStorage.setItem("contactData", JSON.stringify({ name, email, category, companyName, companyNameKana, companyPostal, companyPrefecture, companyCity, companyStreet, companyBuilding, companyAddressKana, companyPhone, contactName, contactNameKana, contactDepartment, contactPhone, message }));
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
              <>
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
                    会社名（ふりがな） <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={companyNameKana}
                    onChange={(e) => setCompanyNameKana(e.target.value)}
                    placeholder="例）かぶしきがいしゃ〇〇"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    郵便番号 <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="text"
                    className={styles.inputShort}
                    value={companyPostal}
                    onChange={(e) => setCompanyPostal(e.target.value)}
                    placeholder="例）000-0000"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    都道府県 <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="text"
                    className={styles.inputShort}
                    value={companyPrefecture}
                    onChange={(e) => setCompanyPrefecture(e.target.value)}
                    placeholder="例）東京都"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    市区町村 <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    placeholder="例）渋谷区〇〇"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    番地 <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="text"
                    className={styles.inputShort}
                    value={companyStreet}
                    onChange={(e) => setCompanyStreet(e.target.value)}
                    placeholder="例）1-2-3"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    建物名・部屋番号 <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={companyBuilding}
                    onChange={(e) => setCompanyBuilding(e.target.value)}
                    placeholder="例）〇〇ビル 5階"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    住所（ふりがな） <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={companyAddressKana}
                    onChange={(e) => setCompanyAddressKana(e.target.value)}
                    placeholder="例）とうきょうとしぶやく〇〇1-2-3 〇〇びる5かい"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    会社電話番号 <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="tel"
                    className={styles.inputShort}
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="例）03-1234-5678"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    担当者氏名 <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="例）山田太郎"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    担当者氏名（ふりがな） <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={contactNameKana}
                    onChange={(e) => setContactNameKana(e.target.value)}
                    placeholder="例）やまだたろう"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    担当部署 <span className={styles.required}>必須</span>
                  </label>
                  <select
                    className={styles.select}
                    value={contactDepartment}
                    onChange={(e) => setContactDepartment(e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    担当電話番号 <span className={styles.required}>必須</span>
                  </label>
                  <input
                    type="tel"
                    className={styles.inputShort}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="例）090-1234-5678"
                  />
                </div>
              </>
            )}

            <div className={styles.field}>
              <label className={styles.label}>
                お問い合わせ内容 <span className={styles.required}>必須</span>
              </label>
              <textarea
                className={styles.textarea}
                rows={isOther ? 3 : 6}
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
