"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

type NavGrandchild = { label: string; href: string };
type NavChild =
  | { label: string; href: string; children?: undefined }
  | { label: string; href?: undefined; children: NavGrandchild[] };
type NavItem =
  | { label: string; href: string; children?: undefined }
  | { label: string; href?: undefined; children: NavChild[] };

const NAV_ITEMS: NavItem[] = [
  { label: "ホーム", href: "/" },
  {
    label: "レッスン",
    children: [
      {
        label: "クラス",
        children: [
          { label: "Y-de-ONE 大人バレエクラス", href: "/class" },
          { label: "Y-de-ONE モダンバレエクラス", href: "/modern-ballet" },
          { label: "埼玉クラス（門馬和樹クラス）", href: "/saitama" },
          { label: "ダウン症の方向けクラス", href: "/down-syndrome" },
        ],
      },
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
  const [openSubDropdowns, setOpenSubDropdowns] = useState<Set<string>>(new Set());

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    setOpenDropdowns(new Set());
    setOpenSubDropdowns(new Set());
  };

  const handleClose = () => {
    setIsOpen(false);
    setOpenDropdowns(new Set());
    setOpenSubDropdowns(new Set());
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

  const handleSubDropdownToggle = (label: string) => {
    setOpenSubDropdowns((prev) => {
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
          <a href="tel:08067400770" className={styles.phoneLink}>
            <i className="fa-solid fa-phone" aria-hidden="true" />
            <span className={styles.phoneNumber}>080-6740-0770</span>
          </a>
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
                        {item.children.map((child) => {
                          if (child.children) {
                            const isSubOpen = openSubDropdowns.has(child.label);
                            return (
                              <li key={child.label} className={styles.subNavItem}>
                                <button
                                  className={styles.subDropdownTrigger}
                                  onClick={() => handleSubDropdownToggle(child.label)}
                                  aria-expanded={isSubOpen}
                                >
                                  <span>{child.label}</span>
                                  <i className={`fa-solid fa-chevron-right ${styles.subChevron} ${isSubOpen ? styles.subChevronOpen : ""}`} />
                                </button>
                                <ul className={`${styles.subDropdown} ${isSubOpen ? styles.subDropdownOpen : ""}`}>
                                  {child.children.map((grandchild) => (
                                    <li key={grandchild.href}>
                                      <Link href={grandchild.href} onClick={handleClose}>
                                        <span>{grandchild.label}</span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            );
                          }
                          return (
                            <li key={child.href}>
                              <Link href={child.href} onClick={handleClose}>
                                <span>{child.label}</span>
                              </Link>
                            </li>
                          );
                        })}
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
