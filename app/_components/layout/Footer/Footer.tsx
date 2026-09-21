"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";
import { DEMO_MODE, TRIAL_ENTRY_URL } from "@/lib/demo";
import { homePath, localePath, makeT, type Lang } from "@/lib/i18n";

export default function Footer({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  const en = lang === "en";
  return (
    <footer className={styles.footer}>
      <div className={`inner ${styles.innerFooter}`}>
        <div className={styles.footerCol}>
          <Link href={homePath(lang)}>
            <Image
              className={styles.ydeoneLogoFooter}
              src="/images/common/ydeone-logo.png"
              alt={t("質問できる大人バレエ教室 Y-de-ONE ロゴ", "Y-de-ONE adult ballet school logo") as string}
              width={300}
              height={103}
            />
          </Link>
          <p className={styles.footerCopyText}>
            {t(<>Y-de-ONE | ワイデワン<br />
            10代から80代まで通う<br />
            初心者歓迎大人バレエ教室</>, <>Y-de-ONE<br />
            Adult ballet school<br />
            Ages 10 to 80+, beginners welcome</>)}
          </p>
          <p className={styles.footerArea}>
            {t("高田馬場・東中野・落合・新宿エリア", "Takadanobaba · Higashi-Nakano · Ochiai · Shinjuku, Tokyo")}
          </p>
          <div className="footer-address">
            <p className={styles.footerAddressTitle}>{t("所在地", "Address")}</p>
            <p className={styles.footerAddressRow}>
              <span>
                <i className="fa-solid fa-location-dot"></i>
              </span>
              <span>
                {t(<>〒169-0075<br />
                東京都新宿区高田馬場3-36-6<br />
                兼子ビル2階</>, <>Kaneko Bldg. 2F, 3-36-6 Takadanobaba<br />
                Shinjuku-ku, Tokyo 169-0075</>)}
              </span>
            </p>
          </div>
        </div>
        <div className={`${styles.footerCol} ${styles.footerContact}`}>
          <div className={styles.footerBlock}>
            <p className={styles.footerHeading}>{t("お問い合わせ", "Contact")}</p>
            <p className={styles.footerContactRow}>
              <span>
                <i className="fa-solid fa-phone"></i>
              </span>
              <a href="tel:08067400770" className={styles.footerPhone}>080-6740-0770</a>
            </p>
            <p className={styles.footerContactRow}>
              <span>
                <i className="fa-regular fa-envelope"></i>
              </span>
              <a href="mailto:ydeone.danceschool@gmail.com" className={styles.footerPhone}>ydeone.danceschool@gmail.com</a>
            </p>
          </div>
          <div className={styles.footerBlock}>
            <p className={styles.footerHeading}>{t("営業時間", "Opening hours")}</p>
            <p className={styles.footerContactRow}>
              <span>
                <i className="fa-regular fa-clock"></i>
              </span>
              <span>
                {t(<>月曜：定休日<br />
                火曜：13:00〜21:00<br />
                水曜：13:00〜20:45<br />
                木曜：13:00〜21:00<br />
                金曜：15:00〜17:05<br />
                土曜：12:30〜18:00<br />
                日曜：12:30〜16:30</>, <>Mon: closed<br />
                Tue: 13:00–21:00<br />
                Wed: 13:00–20:45<br />
                Thu: 13:00–21:00<br />
                Fri: 15:00–17:05<br />
                Sat: 12:30–18:00<br />
                Sun: 12:30–16:30</>)}
              </span>
            </p>
          </div>
        </div>
        <div className={`${styles.footerCol} ${styles.footerLinks}`}>
          <ul className={styles.footerNav}>
            <li className={styles.footerNavGroup}>{t("レッスン", "Lessons")}</li>
            <li><Link href={localePath(lang, "/class#schedule")}>{t("スケジュール", "Schedule")}</Link></li>
            <li><Link href={localePath(lang, "/class")}>{t("大人バレエクラス", "Adult ballet")}</Link></li>
            <li><Link href={localePath(lang, "/modern-ballet")}>{t("モダンバレエクラス", "Modern ballet")}</Link></li>
            <li><Link href={localePath(lang, "/saitama")}>{t("埼玉クラス（大宮・朝霞）", "Saitama classes (Omiya & Asaka)")}</Link></li>
            <li><Link href={localePath(lang, "/down-syndrome")}>{t("ダウン症の方向けクラス", "Down syndrome classes")}</Link></li>
            <li><Link href={localePath(lang, "/price")}>{t("料金", "Price")}</Link></li>
            <li><Link href={localePath(lang, "/instructor")}>{t("講師", "Instructors")}</Link></li>
            <li className={styles.footerNavGroup}>Y-de-ONE</li>
            <li><Link href={localePath(lang, "/studio")}>{t("スタジオ紹介", "The studio")}</Link></li>
            <li><Link href={localePath(lang, "/works")}>{t("作品・活動", "Works & activities")}</Link></li>
            {!en && <li><Link href="/blog">ブログ</Link></li>}
            <li className={styles.footerNavGroup}>{t("その他", "More")}</li>
            <li><Link href={localePath(lang, "/access")}>{t("アクセス", "Access")}</Link></li>
            {!en && <li><Link href="/news">お知らせ</Link></li>}
            <li><Link href={localePath(lang, "/contact")}>{t("お問い合わせ", "Contact")}</Link></li>
            <li><a href={TRIAL_ENTRY_URL} {...(DEMO_MODE ? {} : { target: "_blank", rel: "noopener noreferrer" })}>{t("体験レッスン", "Trial lesson")}</a></li>
          </ul>
        </div>
      </div>
      <p className={styles.footerBottomCopy}>
        © 2025 Y-de-ONE. All rights reserved.
      </p>
    </footer>
  );
}
