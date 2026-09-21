import Link from "next/link";
import styles from "./CtaButton.module.css";
import { TRIAL_ENTRY_URL } from "@/lib/demo";
import { localePath, makeT, type Lang } from "@/lib/i18n";

type Props = {
  href?: string;
  showLineText?: boolean;
  className?: string;
  lang?: Lang;
};

export default function HeroCtaButton({
  href = TRIAL_ENTRY_URL,
  showLineText = true,
  className,
  lang = "ja",
}: Props) {
  const t = makeT(lang);
  return (
    <div className={[styles.centerBtn, className].filter(Boolean).join(" ")}>
      <Link href={href} className={styles.ctaBtn}>
        {t("体験レッスンはこちら", "Book a trial lesson")}{" "}
        <i className="fa-solid fa-arrow-up-right-from-square"></i>
      </Link>

      {showLineText && (
        <>
          <span className={styles.lineAddText}>
            <i className="fa-brands fa-line"></i>
            {t("LINEから簡単に予約できます", "Book in a minute through LINE, Japan's main messaging app")}
          </span>
          <span className={styles.lineSubText}>{t("見学（無料）もお申込みいただけます", "Free studio visits are welcome too")}</span>
          <span className={styles.lineNotText}>
            {t(<>LINEをお持ちでない方は<Link href="/contact" className={styles.lineNotLink}>こちら</Link></>,
              <>No LINE account? <Link href={localePath(lang, "/contact")} className={styles.lineNotLink}>Contact us here</Link></>)}
          </span>
        </>
      )}
    </div>
  );
}
