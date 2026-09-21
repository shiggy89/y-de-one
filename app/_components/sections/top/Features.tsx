"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import styles from "./Features.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

export default function Features({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return(
    <section>
      <div className="inner">
        <Heading2
          title={
            <>
              {t(<>初心者でも安心！
              <br className={styles.mobileOnlyBreak} />
              質問できる大人バレエレッスン</>, <>Beginners welcome!{" "}
              <br className={styles.mobileOnlyBreak} />
              Adult ballet lessons where you can ask anything</>)}
            </>
          }
          lead={t("Y-de-ONEでは、初めての方でも安心してバレエを楽しんでいただけるよう質問しやすい雰囲気と丁寧な指導を大切にしています。", "At Y-de-ONE we keep the atmosphere relaxed and the teaching careful, so even first-timers can enjoy ballet and feel free to ask questions.")}
          leftSrc="kirakira-icon.png"
          leftAlt={t("キラキラのアイコン", "Sparkle icon") as string}
          rightSrc="toe-shoes-icon.png"
          rightAlt={t("バレエのトーシューズのアイコン", "Pointe shoes icon") as string}
        />
        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <h3>{t("質問しやすい雰囲気", "A relaxed place to ask questions")}</h3>
            <Image
              className={styles.featureIcons}
              src="/images/home/feature1-icon.png"
              alt={t("質問できる大人バレエレッスン1つ目の特徴のアイコン", "Feature 1 icon") as string}
              width={1024}
              height={1024}
            />
            <p>{t("一般的なバレエ教室とは違い、レッスン中でも気軽に質問できる環境です。わからないことをその場で解決できます。", "Unlike many ballet schools, you can ask questions right in the middle of a lesson and get answers on the spot.")}</p>
          </div>
          <div className={styles.featureItem}>
            <h3>{t("一人ひとりをしっかり指導", "Personal attention for everyone")}</h3>
            <Image
              className={styles.featureIcons}
              src="/images/home/feature2-icon.png"
              alt={t("質問できる大人バレエレッスン2つ目の特徴のアイコン", "Feature 2 icon") as string}
              width={1024}
              height={1024}
            />
            <p>{t("先生が一人ずつ丁寧に声をかけ、個別に指導します。バレエ初心者の方でも安心して上達できます。", "The teachers speak to each student and give individual guidance, so beginners can improve with confidence.")}</p>
          </div>
          <div className={styles.featureItem}>
            <h3>{t("10代から80代まで", "From teens to 80s")}</h3>
            <Image
              className={styles.featureIcons}
              src="/images/home/feature3-icon.png"
              alt={t("質問できる大人バレエレッスン3つ目の特徴のアイコン", "Feature 3 icon") as string}
              width={1024}
              height={1024}
            />
            <p>{t("幅広い年齢層の方が通っています。50代、60代から始める方も多く、年齢を気にせずバレエを楽しめます。", "Students of all ages come to class. Many start in their 50s or 60s, and nobody minds how old you are.")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
