"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import styles from "./Compare.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

export default function Compare({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return (
    <section>
      <div className="inner">
        <Heading2
          title={
            <>
              {t(<>入会金なし・無駄なく
              <br className={styles.mobileOnlyBreak} />
              通える大人バレエ教室</>, <>No joining fee, no wasted money:{" "}
              <br className={styles.mobileOnlyBreak} />
              an adult ballet school that fits your life</>)}
            </>
          }
          lead={t("Y-de-ONEは、一般的なバレエ教室とは違う特長があります。", "Y-de-ONE works differently from a typical ballet school.")}
          leftSrc="onpu1-icon.png"
          leftAlt={t("音符1のアイコン", "Music note icon") as string}
          rightSrc="onpu2-icon.png"
          rightAlt={t("音符2のアイコン", "Music note icon") as string}
        />
      <div className={styles.compareCol}>
        <div className={styles.leftCol}>
          <h3>{t("Y-de-ONE ワイデワン", "Y-de-ONE")}</h3>
          <ul>
            <li>
              <span className={styles.ok}>✓</span>
              <span className={styles.compareLabel}>{t("入会金：", "Joining fee:")}</span>
              <br />
              <span className={styles.tabY}>{t("なし（0円）", "None (¥0)")}</span>
            </li>
            <li>
              <span className={styles.ok}>✓</span>
              <span className={styles.compareLabel}>{t("料金システム：", "Pricing:")}</span>
              <br />
              <span className={styles.tabY}>{t(<>都度払い制<br className={styles.mobileOnlyBreak} />（通うほどお得）</>, "Pay as you go")}</span>
            </li>
            <li>
              <span className={styles.ok}>✓</span>
              <span className={styles.compareLabel}>{t("質問のしやすさ：", "Asking questions:")}</span>
              <br />
              <span className={styles.tabY}>{t("いつでも気軽に質問OK", "Ask anytime")}</span>
            </li>
            <li>
              <span className={styles.ok}>✓</span>
              <span className={styles.compareLabel}>{t("指導方法：", "Teaching:")}</span>
              <br />
              <span className={styles.tabY}>{t("一人ひとりをしっかり指導", "Individual guidance for everyone")}</span>
            </li>
          </ul>
        </div>
        <div className={styles.rightCol}>
          <h3>{t("一般的なバレエ教室", "A typical ballet school")}</h3>
          <ul>
            <li>
              <span className={styles.ng}>✕</span>
              <span className={styles.compareLabel}>{t("入会金：", "Joining fee:")}</span>
              <br />
              <span className={styles.tabN}>{t("あり（10,000円〜30,000円）", "Yes (¥10,000–30,000)")}</span>
            </li>
            <li>
              <span className={styles.ng}>✕</span>
              <span className={styles.compareLabel}>{t("料金システム：", "Pricing:")}</span>
              <br />
              <span className={styles.tabN}>{t(<>チケット制など<br className={styles.mobileOnlyBreak} />（期限切れで無駄に）</>, <>Ticket books and the like<br className={styles.mobileOnlyBreak} /> (unused tickets expire)</>)}</span>
            </li>
            <li>
              <span className={styles.ng}>✕</span>
              <span className={styles.compareLabel}>{t("質問のしやすさ：", "Asking questions:")}</span>
              <br />
              <span className={styles.tabN}>{t("質問しづらい雰囲気", "Hard to ask questions")}</span>
            </li>
            <li>
              <span className={styles.ng}>✕</span>
              <span className={styles.compareLabel}>{t("指導方法：", "Teaching:")}</span>
              <br />
              <span className={styles.tabN}>{t("個別に指導することは少ない", "Little individual guidance")}</span>
            </li>
          </ul>
        </div>
        <Image
          className={styles.dogPorkLeftIcon}
          src="/images/home/dog-pork-left-icon.png"
          alt={t("ワイデワンちゃんが左を指さしているアイコン", "Mascot dog pointing left") as string}
          width={469}
          height={532}
        />
        <Image
          className={styles.dogPorkUpIcon}
          src="/images/home/dog-pork-up-icon.png"
          alt={t("ワイデワンちゃんが上を指さしているアイコン", "Mascot dog pointing up") as string}
          width={469}
          height={532}
        />
      </div>
      <div className={styles.compareText}>
        <div className={styles.compareTextLeft}>
          <h3>
            {t(<>通えば通うほど<br />
            <span>お得</span>な<br />
            都度払いシステム</>, <>Pay as you go.<br />
            The more you come,<br />
            the cheaper<br />
            it gets</>)}
          </h3>
          <Image
            className={styles.yoshikiIdeaIcon}
            src="/images/home/yoshiki-idea-icon.png"
            alt={t("佳樹先生がひらめいているアイコン", "Teacher having an idea") as string}
            width={500}
            height={500}
          />
        </div>
        <div className={styles.compareTextRight}>
          <div className={styles.innerCompareTextRight}>
            <Image
              className={styles.discountDownIcon}
              src="/images/home/discount-down-icon.png"
              alt={t("1回あたりのバレエのレッスン料金が安くなるイメージのアイコン", "Price per lesson goes down") as string}
              width={632}
              height={680}
            />
            <p>{t("月に通う回数が多いほど、1回あたりのレッスン料金が安くなる仕組みです。", "The more lessons you take in a month, the less each lesson costs.")}</p>
          </div>
          <div className={styles.innerCompareTextRight}>
            <Image
              className={styles.caryyOverIcon}
              src="/images/home/caryy-over-icon.png"
              alt={t("バレエのレッスン料金が無駄にならないイメージのアイコン", "No wasted lesson fees") as string}
              width={826}
              height={720}
            />
            <p>{t("期限切れでお金が無駄になることもなく、自分のペースで安心して通えます。", "Nothing expires, so you can come at your own pace without wasting money.")}</p>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
