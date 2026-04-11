"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`inner ${styles.innerFooter}`}>
        <div className={styles.footerCol}>
          <Link href="/">
            <Image
              className={styles.ydeoneLogoFooter}
              src="/images/common/ydeone-logo.png"
              alt="質問できる大人バレエ教室 Y-de-ONE ロゴ"
              width={300}
              height={103}
            />
          </Link>
          <p className={styles.footerCopyText}>
            Y-de-ONE | ワイデワン<br />
            10代から80代まで通う<br />
            初心者歓迎大人バレエ教室
          </p>
          <p className={styles.footerArea}>
            高田馬場・東中野・落合・新宿エリア
          </p>
          <div className="footer-address">
            <p className={styles.footerAddressTitle}>所在地</p>
            <p className={styles.footerAddressRow}>
              <span>
                <i className="fa-solid fa-location-dot"></i>
              </span>
              <span>
                〒169-0075<br />
                東京都新宿区高田馬場3-36-6<br />
                兼子ビル2階
              </span>
            </p>
          </div>
        </div>
        <div className={`${styles.footerCol} ${styles.footerContact}`}>
          <div className={styles.footerBlock}>
            <p className={styles.footerHeading}>お問い合わせ</p>
            <p className={styles.footerContactRow}>
              <span>
                <i className="fa-solid fa-phone"></i>
              </span>
              <span>080-6740-0770</span>
            </p>
            <p className={styles.footerContactRow}>
              <span>
                <i className="fa-regular fa-envelope"></i>
              </span>
              <span>ydeone.danceschool@gmail.com</span>
            </p>
          </div>
          <div className={styles.footerBlock}>
            <p className={styles.footerHeading}>営業時間</p>
            <p className={styles.footerContactRow}>
              <span>
                <i className="fa-regular fa-clock"></i>
              </span>
              <span>
                月曜：定休日<br />
                火曜：10:30〜21:30<br />
                水曜：12:30〜22:00<br />
                木曜：11:15〜19:30<br />
                金曜：10:30〜21:30<br />
                土曜：10:30〜17:30<br />
                日曜：12:30〜17:30
              </span>
            </p>
          </div>
        </div>
        <div className={`${styles.footerCol} ${styles.footerLinks}`}>
          <ul className={styles.footerNav}>
            <li><Link href="#class">クラス</Link></li>
            <li><Link href="#price">料金システム</Link></li>
            <li><Link href="#instructor">講師一覧</Link></li>
            <li><Link href="/studio">スタジオ紹介</Link></li>
            <li><Link href="/works">作品・活動</Link></li>
            <li><Link href="/access">アクセス</Link></li>
            <li><Link href="/blog">ブログ</Link></li>
            <li><Link href="/news">お知らせ</Link></li>
            <li><Link href="#trial">体験レッスン</Link></li>
          </ul>
        </div>
      </div>
      <p className={styles.footerBottomCopy}>
        © 2025 Y-de-ONE. All rights reserved.
      </p>
    </footer>
  );
}
