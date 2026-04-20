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
  label = "見学・体験レッスン",
  note = "友だち追加をして見学・体験レッスンにお申込み下さい",
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
    </div>
  );
}
