"use client";

import type { CSSProperties } from "react";
import Heading2 from "../common/Heading2";
import { FaqItem } from "../top/Faq";
import styles from "../top/Faq.module.css";
import sectionStyles from "./Faq.module.css";

export default function ModernBalletFaq() {
  return (
    <section className={sectionStyles.section}>
      <div className="inner">
        <Heading2
          title={<>モダンバレエ初心者からの<br className={sectionStyles.mobileOnlyBreak} />よくある質問</>}
          lead="モダンバレエが初めての方からよくいただく質問をまとめました。"
          leftSrc="/images/modern-ballet/dog-dance-icon.png"
          leftAlt=""
          width={400}
          height={400}
          leftStyle={{ "--heading-left-top-mobile": "-65px", "--heading-left-left-mobile": "50%" } as CSSProperties}
        />
        <dl className={styles.faqList}>
          <FaqItem
            question="モダンバレエは全くの初心者ですが、大丈夫ですか？"
            answer="もちろん大丈夫です。「自分を表現したい」という気持ちがあればOKです。ジャズダンスやクラシックバレエの経験はあるけれど、モダンバレエは初めてという方も多くいらっしゃいます。"
          />
          <FaqItem
            question="ジャズダンスやクラシックバレエの経験がありますが、今までの経験は活かせますか？"
            answer="十分に活かせます。バレエやジャズダンスで培った身体の使い方・リズム感はモダンバレエでも大きな強みになります。むしろ「経験があるからこそ感じられる自由さ」があります。"
          />
          <FaqItem
            question="クラシックバレエとモダンバレエは身体の使い方が全然違いますか？"
            answer="基本的な身体の使い方は共通していますが、モダンバレエは型にとらわれない動きが加わります。最初は戸惑うこともありますが、経験者の方はすぐに馴染まれる方が多いです。"
          />
          <FaqItem
            question="発表会はありますか？どんな内容ですか？"
            answer={<>はい、発表会があります。演目はすべて先生が振り付けたオリジナル作品です。「白鳥の湖」などの古典演目ではなく、音楽と身体表現を融合したオリジナルの世界観を舞台で表現します。<a href="/works#stage" style={{ color: "#de4e8c", fontWeight: 700, textDecoration: "underline" }}>発表会・舞台出演情報はこちら →</a></>}
          />
          <FaqItem
            question="途中からクラスに入っても大丈夫ですか？振付についていけるか不安です。"
            answer="もちろん大丈夫です。レッスン中にわからないことがあればその場で質問できる環境です。一人ひとりのペースに合わせて指導しますので、焦らずご自身のペースでご参加いただけます。"
          />
          <FaqItem
            question="他のダンス経験者と一緒のクラスになりますか？レベル差が気になります。"
            answer="クラスにはさまざまな経験をお持ちの方が参加されています。モダンバレエは「正解が一つではない」表現の世界なので、経験の差よりも自分らしい表現を大切にしています。"
          />
          <FaqItem
            question="体験レッスンはモダンバレエクラスで受けられますか？"
            answer={<>はい、モダンバレエクラスでの体験レッスン（¥3,300）と無料見学を随時受け付けています。LINEからお気軽にご予約ください。<a href="https://lin.ee/iz33eCM" style={{ color: "#de4e8c", fontWeight: 700, textDecoration: "underline" }}>体験レッスンはこちら →</a></>}
          />
        </dl>
      </div>
    </section>
  );
}
