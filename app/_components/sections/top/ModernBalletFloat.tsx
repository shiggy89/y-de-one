import Image from "next/image";
import Link from "next/link";
import styles from "./ModernBalletFloat.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

export default function ModernBalletFloat({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return (
    <Link href={localePath(lang, "/modern-ballet")} className={styles.floatWrap}>
      <div className={styles.bubble}>
        {t(<>モダンバレエ<br />はこちら</>, <>Modern<br />ballet</>)}
      </div>
      <Image
        src="/images/modern-ballet/dog-ballet.png"
        alt={t("ワイデわんちゃん", "Mascot dog") as string}
        width={80}
        height={80}
        className={styles.dog}
      />
    </Link>
  );
}
