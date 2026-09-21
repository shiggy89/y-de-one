"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";
import { useNewsBadge } from "../../hooks/useNewsBadge";
import { DEMO_MODE, TRIAL_ENTRY_URL } from "@/lib/demo";
import { alternatePath, localePath, makeT, type Lang } from "@/lib/i18n";

type NavGrandchild = { label: string; href: string };
type NavChild =
  | { label: string; href: string; children?: undefined }
  | { label: string; href?: undefined; children: NavGrandchild[] };
type NavItem =
  | { label: string; href: string; mobileOnly?: boolean; children?: undefined }
  | { label: string; href?: undefined; children: NavChild[] };

const NAV_ITEMS: NavItem[] = [
  { label: "祝日・変更・不定期レッスンと休講のお知らせ", href: "/lesson-info" },
  { label: "スケジュール", href: "/class#schedule" },
  {
    label: "クラス",
    children: [
      { label: "大人バレエクラス", href: "/class" },
      { label: "モダンバレエクラス", href: "/modern-ballet" },
      { label: "埼玉クラス（大宮・朝霞）", href: "/saitama" },
      { label: "ダウン症の方向けクラス", href: "/down-syndrome" },
    ],
  },
  { label: "料金", href: "/price" },
  { label: "講師", href: "/instructor", mobileOnly: true },
  { label: "生徒の声", href: "/voice" },
  {
    label: "Y-de-ONE",
    children: [
      { label: "講師", href: "/instructor" },
      { label: "スタジオ紹介", href: "/studio" },
      { label: "作品・活動", href: "/works" },
      { label: "ブログ", href: "/blog" },
    ],
  },
  { label: "アクセス", href: "/access" },
  { label: "お知らせ", href: "/news" },
  { label: "お問い合わせ", href: "/contact" },
  { label: "体験レッスン", href: TRIAL_ENTRY_URL },
];

const NAV_ITEMS_EN: NavItem[] = [
  { label: "Schedule changes & closures", href: "/lesson-info" },
  { label: "Schedule", href: "/class#schedule" },
  {
    label: "Classes",
    children: [
      { label: "Adult ballet", href: "/class" },
      { label: "Modern ballet", href: "/modern-ballet" },
      { label: "Saitama classes (Omiya & Asaka)", href: "/saitama" },
      { label: "Classes for people with Down syndrome", href: "/down-syndrome" },
    ],
  },
  { label: "Price", href: "/price" },
  { label: "Instructors", href: "/instructor", mobileOnly: true },
  { label: "Student voices", href: "/voice" },
  {
    label: "Y-de-ONE",
    children: [
      { label: "Instructors", href: "/instructor" },
      { label: "The studio", href: "/studio" },
      { label: "Works & activities", href: "/works" },
    ],
  },
  { label: "Access", href: "/access" },
  { label: "Contact", href: "/contact" },
  { label: "Trial lesson", href: TRIAL_ENTRY_URL },
];

export default function Header({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  const navItems = lang === "en" ? NAV_ITEMS_EN : NAV_ITEMS;
  const [isOpen, setIsOpen] = useState(false);
  const showBadge = useNewsBadge();
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [openSubDropdowns, setOpenSubDropdowns] = useState<Set<string>>(new Set());
  const [showCallModal, setShowCallModal] = useState(false);

  useEffect(() => {
    setIsOpen(false);
    setOpenDropdowns(new Set());
    setOpenSubDropdowns(new Set());
  }, [pathname]);

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
          <Link href={localePath(lang, "/")}>
            <Image
              className={styles.siteLogo}
              src="/images/common/ydeone-logo.png"
              alt={t("質問できる大人バレエ教室 Y-de-ONE ロゴ", "Y-de-ONE adult ballet school logo") as string}
              width={300}
              height={103}
            />
          </Link>
          {lang === "ja" && (
            <Link href="/news" className={styles.bellLink} aria-label="お知らせ">
              <i className="fa-solid fa-bell" aria-hidden="true" />
              {showBadge && <span className={styles.bellBadge} />}
            </Link>
          )}
          <button
            type="button"
            className={styles.phoneLink}
            onClick={() => setShowCallModal(true)}
            aria-label={t("お電話", "Call the studio") as string}
          >
            <i className="fa-solid fa-phone" aria-hidden="true" />
            <span className={styles.phoneNumber}>080-6740-0770</span>
          </button>
          {DEMO_MODE && (
            <Link className={styles.langSwitch} href={alternatePath(lang, pathname)} hrefLang={lang === "en" ? "ja" : "en"}>
              {lang === "en" ? "日本語" : "English"}
            </Link>
          )}
        </div>
        <button
          className={styles.navToggle}
          aria-label={t("メニューを開く", "Open menu") as string}
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
            {navItems.map((item) => {
              const isCta = item.href === TRIAL_ENTRY_URL;

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
                                      <Link href={localePath(lang, grandchild.href)} onClick={() => setIsOpen(false)}>
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
                              <Link href={localePath(lang, child.href)} onClick={() => setIsOpen(false)}>
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

              const isNews = item.href === "/news";
              const isLessonInfo = item.href === "/lesson-info";
              const isMobileOnly = "mobileOnly" in item && item.mobileOnly;
              return (
                <li key={item.label} className={`${isCta ? styles.ctaItem : ""} ${isLessonInfo ? styles.lessonInfoNavItem : ""} ${isMobileOnly ? styles.mobileOnlyItem : ""}`}>
                  <Link
                    href={localePath(lang, item.href)}
                                        className={isNews ? styles.newsNavLink : ""}
                  >
                    {isLessonInfo && lang === "ja" ? <>祝日・変更・不定期レッスンと<br />休講のお知らせ</> : item.label}
                    {isNews && showBadge && <span className={styles.navBadge} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      {showCallModal && (
        <div className={styles.callModalOverlay} onClick={() => setShowCallModal(false)}>
          <div className={styles.callModal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.callModalText}>
              {t("お電話は体験レッスン・見学のお申し込み専用です。その他のお問い合わせは、お問い合わせフォームよりお願いいたします。",
                "Phone calls are for trial lesson and studio visit bookings in Japanese only. For anything else, please use the contact form.")}
            </p>
            <div className={styles.callModalButtons}>
              <a
                href="tel:08067400770"
                className={styles.callModalCall}
                onClick={() => setShowCallModal(false)}
              >
                {t("電話をかける", "Call")}
              </a>
              <button
                type="button"
                className={styles.callModalCancel}
                onClick={() => setShowCallModal(false)}
              >
                {t("閉じる", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
