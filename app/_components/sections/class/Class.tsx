"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Class.module.css";

const CLASS_ITEMS = [
  {
    title: "バレエ入門",
    level: "★☆☆",
    text: "バレエ初心者向けのクラスです。ストレッチと基本動作を中心に、無理なくバレエに慣れていきます。",
    icon: "/images/class/class1_icon.png",
    bg: styles.pinkCard,
  },
  {
    title: "バレエ入門基礎",
    level: "★★☆",
    text: "バレエ入門クラスに慣れてきた方向けのクラスです。基本動作を繰り返し練習し、動きの流れを身につけます。",
    icon: "/images/class/class2_icon.png",
    bg: styles.pinkCard,
  },
  {
    title: "バレエ基礎",
    level: "★★★",
    text: "バレエ入門基礎クラスに慣れた方向けのクラスです。より複雑なバレエの動きに挑戦し、基礎力を高めます。",
    icon: "/images/class/class3_icon.png",
    bg: styles.pinkCard,
  },
  {
    title: "ポワント",
    level: "★★☆",
    text: "トゥシューズを履いて行うバレエクラスです。安全のため、ポワント向けのバレエクラスへの参加が必要となります。",
    icon: "/images/class/class6_icon.png",
    bg: styles.creamCard,
  },
  {
    title: "プレモダン",
    level: "★☆☆",
    text: "35分のショートレッスンです。モダンバレエ初心者向けのクラスとなります。",
    icon: "/images/class/class4_icon.png",
    bg: styles.blueCard,
  },
  {
    title: "モダンバレエ",
    level: "★★☆",
    text: "音楽に合わせてモダンバレエを踊るクラスです。初心者の方から上級者の方までご参加いただけます。",
    icon: "/images/class/class5_icon.png",
    bg: styles.blueCard,
  },
];

export default function Class() {
  return (
    <section className={styles.classSection}>
      <div className={styles.contentInner}>
        <Heading2
          className={styles.classHeading}
          title={
            <>
              初心者から経験者まで選べる
              <br className={styles.mobileOnlyBreak} />
              大人バレエクラス
            </>
          }
          lead="バレエ入門からトゥシューズで踊るポワントまで、レベルや目的に合わせて選べる6つのクラスをご用意しています。"
        />

        <div className={styles.classGrid}>
          {CLASS_ITEMS.map((item) => (
            <article key={item.title} className={`${styles.classCard} ${item.bg}`}>
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

        <SectionCtaButton />
      </div>
    </section>
  );
}
