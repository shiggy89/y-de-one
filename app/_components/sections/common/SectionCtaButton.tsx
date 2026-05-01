import Link from "next/link";
import styles from "./CtaButton.module.css";

type Props = {
  href?: string;
  label?: string;
  note?: string;
  className?: string;
};

export default function SectionCtaButton({
  href = "https://lin.ee/iz33eCM",
  label = "体験レッスンはこちら",
  note = "LINEから簡単に予約できます",
  className,
}: Props) {
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
      <span className={styles.lineSubText}>見学（無料）もお申込みいただけます</span>
    </div>
  );
}
