import Image from "next/image";
import Link from "next/link";
import styles from "./ModernBalletFloat.module.css";

export default function ModernBalletFloat() {
  return (
    <Link href="/modern-ballet" className={styles.floatWrap}>
      <div className={styles.bubble}>
        モダンバレエ<br />はこちら
      </div>
      <Image
        src="/images/modern-ballet/dog-ballet.png"
        alt="ワイデわんちゃん"
        width={80}
        height={80}
        className={styles.dog}
      />
    </Link>
  );
}
