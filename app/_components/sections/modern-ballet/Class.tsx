import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Class.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

const MODERN_CLASSES = [
  {
    title: "プレモダン",
    titleEn: "Pre-Modern",
    level: "★☆☆",
    text: "35分のショートレッスンです。モダンバレエ初心者向けのクラスとなります。",
    textEn: "A 35-minute short lesson for people new to modern ballet.",
    icon: "/images/class/class4_icon.png",
  },
  {
    title: "モダンバレエ",
    titleEn: "Modern Ballet",
    level: "★★☆",
    text: "音楽に合わせてモダンバレエを踊るクラスです。初心者の方から上級者の方までご参加いただけます。",
    textEn: "A class where you dance modern ballet to music. Everyone from beginners to advanced dancers can join.",
    icon: "/images/class/class5_icon.png",
  },
];

export default function ModernBalletClass({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return (
    <section className={styles.classSection}>
      <div className="inner">
        <Heading2
          className="h2SmallMargin"
          title={t(<>高田馬場・新宿<br className={styles.mobileOnlyBreak} />モダンバレエクラス<br />初心者歓迎・週5回開講</>, <>Modern ballet classes in<br className={styles.mobileOnlyBreak} />{" "}Takadanobaba and Shinjuku<br />Beginners welcome, five days a week</>)}
          lead={t("Y-de-ONEのモダンバレエクラスは、週5回開講しています。初めての方も、経験者の方も、ご自身のペースで参加できます。", "Our modern ballet classes run five days a week. Beginners and experienced dancers alike can join at their own pace.")}
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
        <div className={styles.scheduleLink}>
          <Link href={localePath(lang, "/class#schedule")}>{t("レッスンスケジュールはこちら →", "See the lesson schedule →")}</Link>
        </div>
        <SectionCtaButton lang={lang} />
      </div>
    </section>
  );
}
