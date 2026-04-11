"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import styles from "./Compare.module.css";

export default function Compare() {
  return (
    <section>
      <div className="inner">
        <Heading2
          title={
            <>
              入会金なし・無駄なく
              <br className={styles.mobileOnlyBreak} />
              通える大人バレエ教室
            </>
          }
          lead="Y-de-ONEは、一般的なバレエ教室とは違う特長があります。"
          leftSrc="onpu1-icon.png"
          leftAlt="音符1のアイコン"
          rightSrc="onpu2-icon.png"
          rightAlt="音符2のアイコン"
        />
      <div className={styles.compareCol}>
        <div className={styles.leftCol}>
          <h3>Y-de-ONE ワイデワン</h3>
          <ul>
            <li>
              <span className={styles.ok}>✓</span>
              <span className={styles.compareLabel}>入会金：</span>
              <br />
              <span className={styles.tabY}>なし（0円）</span>
            </li>
            <li>
              <span className={styles.ok}>✓</span>
              <span className={styles.compareLabel}>料金システム：</span>
              <br />
              <span className={styles.tabY}>都度払い制<br className={styles.mobileOnlyBreak} />（通うほどお得）</span>
            </li>
            <li>
              <span className={styles.ok}>✓</span>
              <span className={styles.compareLabel}>質問のしやすさ：</span>
              <br />
              <span className={styles.tabY}>いつでも気軽に質問OK</span>
            </li>
            <li>
              <span className={styles.ok}>✓</span>
              <span className={styles.compareLabel}>指導方法：</span>
              <br />
              <span className={styles.tabY}>一人ひとりをしっかり指導</span>
            </li>
          </ul>
        </div>
        <div className={styles.rightCol}>
          <h3>一般的なバレエ教室</h3>
          <ul>
            <li>
              <span className={styles.ng}>✕</span>
              <span className={styles.compareLabel}>入会金：</span>
              <br />
              <span className={styles.tabN}>あり（10,000円〜30,000円）</span>
            </li>
            <li>
              <span className={styles.ng}>✕</span>
              <span className={styles.compareLabel}>料金システム：</span>
              <br />
              <span className={styles.tabN}>チケット制など<br className={styles.mobileOnlyBreak} />（期限切れで無駄に）</span>
            </li>
            <li>
              <span className={styles.ng}>✕</span>
              <span className={styles.compareLabel}>質問のしやすさ：</span>
              <br />
              <span className={styles.tabN}>質問しづらい雰囲気</span>
            </li>
            <li>
              <span className={styles.ng}>✕</span>
              <span className={styles.compareLabel}>指導方法：</span>
              <br />
              <span className={styles.tabN}>個別に指導することは少ない</span>
            </li>
          </ul>
        </div>
        <Image
          className={styles.dogPorkLeftIcon}
          src="/images/home/dog-pork-left-icon.png"
          alt="ワイデワンちゃんが左を指さしているアイコン"
          width={469}
          height={532}
        />
        <Image
          className={styles.dogPorkUpIcon}
          src="/images/home/dog-pork-up-icon.png"
          alt="ワイデワンちゃんが上を指さしているアイコン"
          width={469}
          height={532}
        />
      </div>
      <div className={styles.compareText}>
        <div className={styles.compareTextLeft}>
          <h3>
            通えば通うほど<br />
            <span>お得</span>な<br />
            都度払いシステム
          </h3>
          <Image
            className={styles.yoshikiIdeaIcon}
            src="/images/home/yoshiki-idea-icon.png"
            alt="佳樹先生がひらめいているアイコン"  
            width={500}
            height={500}
          />
        </div>
        <div className={styles.compareTextRight}>
          <div className={styles.innerCompareTextRight}>
            <Image
              className={styles.discountDownIcon}
              src="/images/home/discount-down-icon.png"
              alt="1回あたりのバレエのレッスン料金が安くなるイメージのアイコン"
              width={632}
              height={680}
            />
            <p>月に通う回数が多いほど、1回あたりのレッスン料金が安くなる仕組みです。</p>
          </div>
          <div className={styles.innerCompareTextRight}>
            <Image
              className={styles.caryyOverIcon}
              src="/images/home/caryy-over-icon.png"
              alt="バレエのレッスン料金が無駄にならないイメージのアイコン"
              width={826}
              height={720}
            />
            <p>期限切れでお金が無駄になることもなく、自分のペースで安心して通えます。</p>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
