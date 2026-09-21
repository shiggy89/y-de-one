import Link from "next/link";
import styles from "./CtaButton.module.css";
import { TRIAL_ENTRY_URL } from "@/lib/demo";
import { localePath, makeT, type Lang } from "@/lib/i18n";

type Props = {
  href?: string;
  label?: string;
  note?: string;
  className?: string;
  lang?: Lang;
};

export default function SectionCtaButton({
  href = TRIAL_ENTRY_URL,
  label,
  note,
  className,
  lang = "ja",
}: Props) {
  const t = makeT(lang);
  label ??= t("体験レッスンはこちら", "Book a trial lesson") as string;
  note ??= t("LINEから簡単に予約できます", "Book in a minute through LINE, Japan's main messaging app") as string;
  return (
    <div className={`${styles.centerBtn}${className ? ` ${className}` : ""}`}>
      <Link href={href} className={styles.ctaBtn}>
        {label}{" "}
        <i className="fa-solid fa-arrow-up-right-from-square"></i>
      </Link>

      <span className={styles.lineAddText}>
        <i className="fa-brands fa-line"></i>
        {note}
      </span>
      <span className={styles.lineSubText}>{t("見学（無料）もお申込みいただけます", "Free studio visits are welcome too")}</span>
      <span className={styles.lineNotText}>
        {t(<>LINEをお持ちでない方は<Link href="/contact" className={styles.lineNotLink}>こちら</Link></>,
          <>No LINE account? <Link href={localePath(lang, "/contact")} className={styles.lineNotLink}>Contact us here</Link></>)}
      </span>
    </div>
  );
}
