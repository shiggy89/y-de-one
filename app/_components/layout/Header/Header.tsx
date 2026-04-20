"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

type NavChild = { label: string; href: string };
type NavItem =
  | { label: string; href: string; children?: undefined }
  | { label: string; href?: undefined; children: NavChild[] };

const NAV_ITEMS: NavItem[] = [
  { label: "ホーム", href: "/" },
  {
    label: "レッスン",
    children: [
      { label: "クラス", href: "/class" },
      { label: "料金", href: "/price" },
      { label: "講師", href: "/instructor" },
    ],
  },
  {
    label: "Y-de-ONEについて",
    children: [
      { label: "スタジオ紹介", href: "/studio" },
      { label: "作品・活動", href: "/works" },
    ],
  },
  { label: "アクセス", href: "/access" },
  {
    label: "最新情報",
    children: [
      { label: "ブログ", href: "/blog" },
      { label: "お知らせ", href: "/news" },
    ],
  },
  { label: "お問い合わせ", href: "/contact" },
  { label: "体験レッスン", href: "https://lin.ee/iz33eCM" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    setOpenDropdowns(new Set());
  };

  const handleClose = () => {
    setIsOpen(false);
    setOpenDropdowns(new Set());
  };

  const handleDropdownToggle = (label: string) => {
    setOpenDropdowns((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
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
        >
          {isOpen ? (
            <i className="fa-solid fa-xmark"></i>
          ) : (
            <i className="fa-solid fa-bars"></i>
          )}
        </button>
        <nav className="header-right">
          <ul className={`${styles.globalNav} ${isOpen ? styles.isOpen : ""}`}>
            {NAV_ITEMS.map((item) => {
              const isCta = item.label === "体験レッスン";

              if (item.children) {
                const isDropdownOpen = openDropdowns.has(item.label);
                return (
                  <li key={item.label} className={styles.navItem}>
                    <button
                      className={styles.dropdownTrigger}
                      onClick={() => handleDropdownToggle(item.label)}
                      aria-expanded={isDropdownOpen}
                    >
                      <span>{item.label}</span>
                      <i className={`fa-solid fa-chevron-down ${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ""}`} />
                    </button>
                    <ul className={`${styles.dropdown} ${isDropdownOpen ? styles.dropdownOpen : ""}`}>
                      <div className={styles.dropdownInner}>
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link href={child.href} onClick={handleClose}>
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        ))}
                      </div>
                    </ul>
                  </li>
                );
              }

              return (
                <li key={item.label} className={isCta ? styles.ctaItem : ""}>
                  <Link href={item.href} onClick={handleClose}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
