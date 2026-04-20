"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./thanks.module.css";

type ContactData = {
  name: string;
  email: string;
  category: string;
  message: string;
};

export default function ThanksPage() {
  const [data, setData] = useState<ContactData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("contactData");
    if (raw) {
      setData(JSON.parse(raw));
      sessionStorage.removeItem("contactData");
    }
  }, []);

  return (
    <main className={styles.thanks}>
      <div className="inner">
        <div className={styles.card}>
          <div className={styles.icon}>✉️</div>
          <div className={styles.titleBlock}>
            {data && <p className={styles.nameLabel}>{data.name} 様</p>}
            <h1 className={styles.title}>お問い合わせありがとうございます</h1>
          </div>
          <p className={styles.lead}>
            担当者より<strong className={styles.highlight}>48時間以内</strong>にご返信いたします。
          </p>
          <p className={styles.note}>
            返信がない場合はメールが届いていない可能性がございますので、お手数ですが、Y-de-ONE 公式LINE、またはお電話にてご確認ください。
          </p>

          <div className={styles.contacts}>
            <a
              href="https://lin.ee/iz33eCM"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.lineBlock}
            >
              <img
                src="https://qr-official.line.me/gs/M_509nbfzj_GW.png?oat_content=qr"
                alt="Y-de-ONE 公式LINE QRコード"
                className={styles.qr}
              />
              <span className={styles.lineLabel}>公式LINEはこちら</span>
            </a>

            <a href="tel:08067400770" className={styles.phoneBlock}>
              <span className={styles.phoneIcon}>📞</span>
              <span className={styles.phoneNumber}>080-6740-0770</span>
            </a>
          </div>

          {data && (
            <div className={styles.summary}>
              <h2 className={styles.summaryTitle}>▼ お問い合わせ内容</h2>
              <dl className={styles.dl}>
                <dt>お名前</dt>
                <dd>{data.name}</dd>
                <dt>メールアドレス</dt>
                <dd>{data.email}</dd>
                {data.category && (
                  <>
                    <dt>種別</dt>
                    <dd>{data.category}</dd>
                  </>
                )}
                <dt>内容</dt>
                <dd className={styles.messageText}>{data.message}</dd>
              </dl>
            </div>
          )}

          <Link href="/" className={styles.backLink}>
            トップページへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
