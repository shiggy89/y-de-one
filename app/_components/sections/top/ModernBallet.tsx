import Image from "next/image";
import Link from "next/link";
import Heading2 from "../common/Heading2";
import styles from "./ModernBallet.module.css";

export default function ModernBallet() {
  return (
    <section>
      <div className="inner">
        <Heading2
          title="大人バレエだけじゃない。東京でモダンバレエも学べる教室"
          lead="Y-de-ONEでは、バレエに加えてモダンバレエも学べます。「バレエを始めたら、モダンバレエも楽しくなってきた」そんな生徒さんが多くいらっしゃいます。"
        />
        <div className={styles.modernList}>
          <div className={styles.modernItem}>
            <h3>バレエと一緒に楽しめる</h3>
            <Image src="/images/modern-ballet/together.png" alt="" width={1024} height={1024} className={styles.modernIcon} />
            <p>バレエのレッスンと同じ教室で、モダンバレエも楽しめます。「こんな踊り方もあるんだ」と新鮮な発見がある方も多いです。</p>
          </div>
          <div className={styles.modernItem}>
            <h3>初めての方も安心して参加できます</h3>
            <Image src="/images/modern-ballet/beginner.png" alt="" width={1024} height={1024} className={styles.modernIcon} />
            <p>モダンバレエが初めての方向けに、35分の入門クラス（プレモダン）をご用意しています。まずはそこから始められます。</p>
          </div>
          <div className={styles.modernItem}>
            <h3>週5回開講・通いやすい高田馬場</h3>
            <Image src="/images/modern-ballet/schedule.png" alt="" width={1024} height={1024} className={styles.modernIcon} />
            <p>高田馬場で週5回開講しているので、ご自身のペースで無理なく通えます。</p>
          </div>
        </div>
        <div className={styles.modernLinkWrap}>
          <Link href="/modern-ballet" className={styles.modernLink}>
            モダンバレエについて詳しく見る →
          </Link>
        </div>
      </div>
    </section>
  );
}
