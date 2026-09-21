"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Class.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

const CLASS_ITEMS = [
  {
    title: "バレエ入門",
    titleEn: "Ballet Introduction",
    level: "★☆☆",
    text: "バレエ初心者向けのクラスです。ストレッチと基本動作を中心に、無理なくバレエに慣れていきます。",
    textEn: "A class for ballet beginners. Built around stretching and basic movements, it lets you get used to ballet without strain.",
    icon: "/images/class/class1_icon.png",
    bg: styles.pinkCard,
  },
  {
    title: "バレエ入門基礎",
    titleEn: "Ballet Introduction & Basics",
    level: "★★☆",
    text: "バレエ入門クラスに慣れてきた方向けのクラスです。基本動作を繰り返し練習し、動きの流れを身につけます。",
    textEn: "For students who are comfortable in the Introduction class. You repeat the basic movements and learn how they flow together.",
    icon: "/images/class/class2_icon.png",
    bg: styles.pinkCard,
  },
  {
    title: "バレエ基礎",
    titleEn: "Ballet Basics",
    level: "★★★",
    text: "バレエ入門基礎クラスに慣れた方向けのクラスです。より複雑なバレエの動きに挑戦し、基礎力を高めます。",
    textEn: "For students who are comfortable in Introduction & Basics. You take on more complex ballet movements and build a stronger foundation.",
    icon: "/images/class/class3_icon.png",
    bg: styles.pinkCard,
  },
  {
    title: "ポワント",
    titleEn: "Pointe",
    level: "★★★",
    text: "トゥシューズを履いて行うバレエクラスです。安全のため、ポワント向けのバレエクラスへの参加が必要となります。",
    textEn: "A ballet class danced in pointe shoes. For safety, you need to take the ballet classes that prepare you for pointe.",
    icon: "/images/class/class6_icon.png",
    bg: styles.creamCard,
  },
  {
    title: "プレモダン",
    titleEn: "Pre-Modern",
    level: "★☆☆",
    text: "35分のショートレッスンです。モダンバレエ初心者向けのクラスとなります。",
    textEn: "A 35-minute short lesson for people new to modern ballet.",
    icon: "/images/class/class4_icon.png",
    bg: styles.blueCard,
  },
  {
    title: "モダンバレエ",
    titleEn: "Modern Ballet",
    level: "★★☆",
    text: "音楽に合わせてモダンバレエを踊るクラスです。初心者の方から上級者の方までご参加いただけます。",
    textEn: "A class where you dance modern ballet to music. Everyone from beginners to advanced dancers can join.",
    icon: "/images/class/class5_icon.png",
    bg: styles.blueCard,
  },
];

export default function Class({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return (
    <section className={styles.classSection}>
      <div className={styles.contentInner}>
        <Heading2
          className={styles.classHeading}
          title={
            t(<>
              初心者から経験者まで選べる
              <br className={styles.mobileOnlyBreak} />
              大人バレエクラス
            </>, <>
              Adult ballet classes for
              <br className={styles.mobileOnlyBreak} />{" "}
              beginners to experienced dancers
            </>)
          }
          lead={t("バレエ入門からトゥシューズで踊るポワントまで、レベルや目的に合わせて選べる6つのクラスをご用意しています。", "Six classes, from Ballet Introduction to Pointe in toe shoes, let you choose by level and goal.")}
        />

        <div className={styles.classGrid}>
          {CLASS_ITEMS.map((item) => (
            <article key={item.title} className={`${styles.classCard} ${item.bg}`}>
              <Image
                className={styles.classIcon}
                src={item.icon}
                alt={t(`${item.title}のアイコン`, `${item.titleEn} icon`) as string}
                width={1024}
                height={1024}
              />
              <h3>{t(item.title, item.titleEn)}</h3>
              <p className={styles.level}>{item.level}</p>
              <p className={styles.description}>{t(item.text, item.textEn)}</p>
            </article>
          ))}
        </div>

        <SectionCtaButton lang={lang} />
      </div>
    </section>
  );
}
