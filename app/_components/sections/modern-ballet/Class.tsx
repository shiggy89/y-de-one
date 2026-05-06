import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Class.module.css";

const MODERN_CLASSES = [
  {
    title: "プレモダン",
    level: "★☆☆",
    text: "35分のショートレッスンです。モダンバレエ初心者向けのクラスとなります。",
    icon: "/images/class/class4_icon.png",
  },
  {
    title: "モダンバレエ",
    level: "★★☆",
    text: "音楽に合わせてモダンバレエを踊るクラスです。初心者の方から上級者の方までご参加いただけます。",
    icon: "/images/class/class5_icon.png",
  },
];

export default function ModernBalletClass() {
  return (
    <section className={styles.classSection}>
      <div className="inner">
        <Heading2
          title={<>高田馬場・新宿<br className={styles.mobileOnlyBreak} />モダンバレエクラス<br />初心者歓迎・週5回開講</>}
          lead="Y-de-ONEのモダンバレエクラスは、週5回開講しています。初めての方も、経験者の方も、ご自身のペースで参加できます。"
          leftSrc="/images/modern-ballet/dog-spin-icon.png"
          leftAlt=""
          width={400}
          height={400}
          leftStyle={{ "--heading-left-left-mobile": "50%" } as CSSProperties}
        />
        <div className={styles.classGrid}>
          {MODERN_CLASSES.map((item) => (
            <article key={item.title} className={styles.classCard}>
              <Image
                className={styles.classIcon}
                src={item.icon}
                alt={`${item.title}のアイコン`}
                width={1024}
                height={1024}
              />
              <h3>{item.title}</h3>
              <p className={styles.level}>{item.level}</p>
              <p className={styles.description}>{item.text}</p>
            </article>
          ))}
        </div>
        <div className={styles.scheduleLink}>
          <Link href="/class#schedule">レッスンスケジュールはこちら →</Link>
        </div>
        <SectionCtaButton />
      </div>
    </section>
  );
}
