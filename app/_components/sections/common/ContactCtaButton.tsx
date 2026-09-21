import Link from "next/link";
import styles from "./CtaButton.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

type Props = {
  className?: string;
  lang?: Lang;
};

export default function ContactCtaButton({ className, lang = "ja" }: Props) {
  const t = makeT(lang);
  return (
    <div className={`${styles.centerBtn}${className ? ` ${className}` : ""}`}>
      <Link href={localePath(lang, "/contact")} className={styles.ctaBtn}>
        {t("お問い合わせはこちら", "Contact us")}{" "}
        <i className="fa-solid fa-arrow-up-right-from-square" />
      </Link>
    </div>
  );
}
