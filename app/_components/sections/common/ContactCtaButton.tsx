import Link from "next/link";
import styles from "./CtaButton.module.css";

type Props = {
  className?: string;
};

export default function ContactCtaButton({ className }: Props) {
  return (
    <div className={`${styles.centerBtn}${className ? ` ${className}` : ""}`}>
      <Link href="/contact" className={styles.ctaBtn}>
        お問い合わせはこちら{" "}
        <i className="fa-solid fa-arrow-up-right-from-square" />
      </Link>
    </div>
  );
}
