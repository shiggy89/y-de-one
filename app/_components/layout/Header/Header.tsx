"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={`inner ${styles.inner} ${styles.innerHeader}`}>
        <div className={styles.headerLeft}>
          <Link href="/">
            <Image
              className={styles.siteLogo}
              src="/images/common/ydeone-logo.png"
              alt="質問できる大人バレエ教室 Y-de-ONE ロゴ"
              width={300}
              height={103}
            />
          </Link>
        </div>
        <button
          className={styles.navToggle}
          aria-label="メニューを開く"
          onClick={handleToggle}
          // onClick={()=> {setIsOpen(!isOpen)}}
        >
          {isOpen ? (
            <i className="fa-solid fa-xmark"></i>
            ) : (
            <i className="fa-solid fa-bars"></i>
          )}
        </button>
        <nav className="header-right">
          <ul className={`${styles.globalNav} ${isOpen ? styles.isOpen : ""}`}>
            <li><Link href="/" onClick={handleClose}>ホーム</Link></li>
            <li><Link href="/class" onClick={handleClose}>クラス</Link></li>
            <li><Link href="/price" onClick={handleClose}>料金</Link></li>
            <li><Link href="/instructor" onClick={handleClose}>講師</Link></li>
            <li><Link href="/studio" onClick={handleClose}>スタジオ紹介</Link></li>
            <li><Link href="/works" onClick={handleClose}>作品・活動</Link></li>
            <li><Link href="/access" onClick={handleClose}>アクセス</Link></li>
            <li><Link href="/blog" onClick={handleClose}>ブログ</Link></li>
            <li><Link href="/news" onClick={handleClose}>お知らせ</Link></li>
            <li><Link href="/contact" onClick={handleClose}>お問い合わせ</Link></li>
            <li><Link href="https://lin.ee/iz33eCM" onClick={handleClose}>体験レッスン</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
