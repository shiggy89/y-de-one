"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import styles from "./Features.module.css";

export default function Features() {
  return(
    <section>
      <div className="inner">
        <Heading2
          title={
            <>
              初心者でも安心！
              <br className={styles.mobileOnlyBreak} />
              質問できる大人バレエレッスン
            </>
          }
          lead="Y-de-ONEでは、初めての方でも安心してバレエを楽しんでいただけるよう質問しやすい雰囲気と丁寧な指導を大切にしています。"
          leftSrc="kirakira-icon.png"
          leftAlt="キラキラのアイコン"
          rightSrc="toe-shoes-icon.png"
          rightAlt="バレエのトーシューズのアイコン"
        />
        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <h3>質問しやすい雰囲気</h3>
            <Image
              className={styles.featureIcons}
              src="/images/home/feature1-icon.png"
              alt="質問できる大人バレエレッスン1つ目の特徴のアイコン"
              width={1024}
              height={1024}
            />
            <p>一般的なバレエ教室とは違い、レッスン中でも気軽に質問できる環境です。わからないことをその場で解決できます。</p>
          </div>
          <div className={styles.featureItem}>
            <h3>一人ひとりをしっかり指導</h3>
            <Image
              className={styles.featureIcons}
              src="/images/home/feature2-icon.png"
              alt="質問できる大人バレエレッスン2つ目の特徴のアイコン"
              width={1024}
              height={1024}
            />
            <p>先生が一人ずつ丁寧に声をかけ、個別に指導します。バレエ初心者の方でも安心して上達できます。</p>
          </div>
          <div className={styles.featureItem}>
            <h3>10代から80代まで</h3>
            <Image
              className={styles.featureIcons}
              src="/images/home/feature3-icon.png"
              alt="質問できる大人バレエレッスン3つ目の特徴のアイコン"
              width={1024}
              height={1024}
            />
            <p>幅広い年齢層の方が通っています。50代、60代から始める方も多く、年齢を気にせずバレエを楽しめます。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
