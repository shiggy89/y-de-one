"use client";

import Image from "next/image";
import Heading2 from "./Heading2";

export default function Compare() {
  return (
    <section className="compare">
      <div className="inner inner-compare">
        <Heading2
          title="入会金なし・無駄なく通える大人バレエ教室"
          lead="Y-de-ONEは、一般的なバレエ教室とは違う特長があります。"
          leftClassName="heading2-icon-left"
          leftSrc="onpu1-icon.png"
          leftAlt="音符1のアイコン"
          rightClassName="heading2-icon-right"
          rightSrc="onpu2-icon.png"
          rightAlt="音符2のアイコン"
        />
      <div className="compare-col">
        <div className="left-col">
          <h3>Y-de-ONE ワイデワン</h3>
          <ul>
            <li><span className="ok">✓</span>入会金：<br /><span className="tabY">なし（0円）</span></li>
            <li><span className="ok">✓</span>料金システム ：<br /><span className="tabY">都度払い制（通うほどお得）</span></li>
            <li><span className="ok">✓</span>質問のしやすさ：<br /><span className="tabY">いつでも気軽に質問OK</span></li>
            <li><span className="ok">✓</span>指導方法：<br /><span className="tabY">一人ひとりをしっかり指導</span></li>
          </ul>
        </div>
        <div className="right-col">
          <h3>一般的なバレエ教室</h3>
          <ul>
            <li><span className="ng">✕</span>入会金：<br /><span className="tabN">あり（10,000円〜30,000円）</span></li>
            <li><span className="ng">✕</span>料金システム ：<br /><span className="tabN">チケット制（期限切れで無駄に）</span></li>
            <li><span className="ng">✕</span>質問のしやすさ：<br /><span className="tabN">質問しづらい雰囲気</span></li>
            <li><span className="ng">✕</span>指導方法：<br /><span className="tabN">個別に指導することは少ない</span></li>
          </ul>
        </div>
        <Image
          className="dog-pork-left-icon"
          src="/images/dog-pork-left-icon.png"
          alt="ワイデワンちゃんが左を指さしているアイコン"
          width={469}
          height={532}
        />
        <Image
          className="dog-pork-up-icon"
          src="/images/dog-pork-up-icon.png"
          alt="ワイデワンちゃんが上を指さしているアイコン"
          width={469}
          height={532}
        />
      </div>
      <div className="compare-text">
        <div className="compare-text-left">
          <h3>
            通えば通うほど<br />
            <span>お得</span>な<br />
            都度払いシステム
          </h3>
          <Image
            className="yoshiki-idea-icon"
            src="/images/yoshiki-idea-icon.png"
            alt="佳樹先生がひらめいているアイコン"  
            width={500}
            height={500}
          />
        </div>
        <div className="compare-text-right">
          <div className="inner-compare-text-right">
            <Image
              className="discount-down-icon"
              src="/images/discount-down-icon.png"
              alt="1回あたりのバレエのレッスン料金が安くなるイメージのアイコン"
              width={632}
              height={680}
            />
            <p>月に通う回数が多いほど、1回あたりのレッスン料金が安くなる仕組みです。</p>
          </div>
          <div className="inner-compare-text-right">
            <Image
              className="caryy-over-icon"
              src="/images/caryy-over-icon.png"
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