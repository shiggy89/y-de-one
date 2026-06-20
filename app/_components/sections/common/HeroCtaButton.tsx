import Link from "next/link";
import styles from "./CtaButton.module.css";

type Props = {
  href?: string;
  showLineText?: boolean;
  className?: string;
};

export default function HeroCtaButton({
  href = "https://lin.ee/iz33eCM",
  showLineText = true,
  className,
}: Props) {
  return (
    <div className={[styles.centerBtn, className].filter(Boolean).join(" ")}>
      <Link href={href} className={styles.ctaBtn}>
        体験レッスンはこちら{" "}
        <i className="fa-solid fa-arrow-up-right-from-square"></i>
      </Link>

      {showLineText && (
        <>
          <span className={styles.lineAddText}>
            <i className="fa-brands fa-line"></i>
            LINEから簡単に予約できます
          </span>
          <span className={styles.lineSubText}>見学（無料）もお申込みいただけます</span>
          <span className={styles.lineNotText}>
            LINEをお持ちでない方は<Link href="/contact" className={styles.lineNotLink}>こちら</Link>
          </span>
        </>
      )}
    </div>
  );
}
