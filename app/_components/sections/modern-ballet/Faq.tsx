"use client";

import type { CSSProperties } from "react";
import Heading2 from "../common/Heading2";
import { FaqItem } from "../top/Faq";
import styles from "../top/Faq.module.css";
import sectionStyles from "./Faq.module.css";
import { TRIAL_ENTRY_URL } from "@/lib/demo";
import { localePath, makeT, type Lang } from "@/lib/i18n";

export default function ModernBalletFaq({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return (
    <section className={sectionStyles.section}>
      <div className="inner">
        <Heading2
          className="h2SmallMargin"
          title={t(<>モダンバレエ初心者からの<br className={sectionStyles.mobileOnlyBreak} />よくある質問</>, <>Questions from modern ballet<br className={sectionStyles.mobileOnlyBreak} />{" "}beginners</>)}
          lead={t("モダンバレエが初めての方からよくいただく質問をまとめました。", "The questions we hear most often from people new to modern ballet.")}
          leftSrc="/images/modern-ballet/dog-dance-icon.png"
          leftAlt=""
          width={400}
          height={400}
          leftStyle={{ "--heading-left-top-mobile": "-65px", "--heading-left-left-mobile": "50%" } as CSSProperties}
        />
        <dl className={styles.faqList}>
          <FaqItem
            question={t("モダンバレエは全くの初心者ですが、大丈夫ですか？", "Is it OK if I am a complete beginner at modern ballet?") as string}
            answer={t("もちろん大丈夫です。「自分を表現したい」という気持ちがあればOKです。ジャズダンスやクラシックバレエの経験はあるけれど、モダンバレエは初めてという方も多くいらっしゃいます。", "Of course. All you need is the wish to express yourself. Many of our students have jazz or classical ballet experience but are new to modern ballet.")}
          />
          <FaqItem
            question={t("ジャズダンスやクラシックバレエの経験がありますが、今までの経験は活かせますか？", "I have jazz or classical ballet experience. Will it help?") as string}
            answer={t("十分に活かせます。バレエやジャズダンスで培った身体の使い方・リズム感はモダンバレエでも大きな強みになります。むしろ「経験があるからこそ感じられる自由さ」があります。", "Very much. The body control and sense of rhythm you built in ballet or jazz are a big strength in modern ballet. There is even a kind of freedom you can only feel because you have that experience.")}
          />
          <FaqItem
            question={t("クラシックバレエとモダンバレエは身体の使い方が全然違いますか？", "Is the way of using the body very different from classical ballet?") as string}
            answer={t("基本的な身体の使い方は共通していますが、モダンバレエは型にとらわれない動きが加わります。最初は戸惑うこともありますが、レッスンを重ねるうちに自然と感覚がつかめます。", "The basics are shared, but modern ballet adds movement that is not bound to set forms. It can feel unfamiliar at first, but the feeling comes naturally as you keep taking lessons.")}
          />
          <FaqItem
            question={t("発表会はありますか？どんな内容ですか？", "Is there a recital? What is it like?") as string}
            answer={t(<>はい、発表会があります。演目はすべて先生が振り付けたオリジナル作品です。「白鳥の湖」などの古典演目ではなく、音楽と身体表現を融合したオリジナルの世界観を舞台で表現します。<a href="/works#stage" style={{ color: "#de4e8c", fontWeight: 700, textDecoration: "underline" }}>発表会・舞台出演情報はこちら →</a></>,
              <>Yes. Every piece is original choreography by our teachers. Instead of classical works such as Swan Lake, we bring an original world that fuses music and physical expression to the stage. <a href={localePath(lang, "/works#stage")} style={{ color: "#de4e8c", fontWeight: 700, textDecoration: "underline" }}>Recitals and stage appearances →</a></>)}
          />
          <FaqItem
            question={t("途中からクラスに入っても大丈夫ですか？振付についていけるか不安です。", "Can I join partway through? I worry I will not keep up with the choreography.") as string}
            answer={t("もちろん大丈夫です。一人ひとりのペースに合わせて指導しますので、焦らずご自身のペースでご参加いただけます。レッスン中にわからないことがあればその場で質問していただけますので、お気軽にご参加ください。", "Of course. We teach at each student's own pace, so there is no need to rush. If anything is unclear you can ask right in the lesson, so please feel free to join.")}
          />
          <FaqItem
            question={t("他のダンス経験者と一緒のクラスになりますか？レベル差が気になります。", "Will I be in a class with other experienced dancers? I worry about differences in level.") as string}
            answer={t("クラスにはさまざまな経験をお持ちの方が参加されています。モダンバレエは「正解が一つではない」表現の世界なので、経験の差よりも自分らしい表現を大切にしています。", "Our classes include people with all kinds of experience. Modern ballet is a world of expression with no single right answer, so we value your own way of expressing yourself more than differences in experience.")}
          />
          <FaqItem
            question={t("体験レッスンはモダンバレエクラスで受けられますか？", "Can I take a trial lesson in a modern ballet class?") as string}
            answer={t(<>はい、モダンバレエクラスでの体験レッスン（¥3,500）と無料見学を随時受け付けています。LINEからお気軽にご予約ください。<a href={TRIAL_ENTRY_URL} style={{ color: "#de4e8c", fontWeight: 700, textDecoration: "underline" }}>体験レッスンはこちら →</a></>,
              <>Yes. Trial lessons in the modern ballet classes (¥3,500) and free studio visits are open all year. <a href={TRIAL_ENTRY_URL} style={{ color: "#de4e8c", fontWeight: 700, textDecoration: "underline" }}>Book a trial lesson →</a></>)}
          />
          <FaqItem
            question={t("男性でも参加できますか？", "Can men join?") as string}
            answer={t("もちろんです。男性の生徒さんも多数通われています。年齢・性別問わず、どなたでも歓迎します。", "Of course. Many of our students are men. Everyone is welcome, whatever their age or gender.")}
          />
          <FaqItem
            question={t("体型や性別に関係なく参加できますか？", "Can I join whatever my body type or gender?") as string}
            answer={t("はい、体型・年齢・性別を問わず、どなたでも大歓迎です。LGBTQの方も安心してご参加いただけます。Y-de-ONEは、すべての方が自分らしく踊れる環境づくりを大切にしています。", "Yes. Everyone is welcome, whatever their body type, age or gender, and LGBTQ people can join with peace of mind. We care about creating a place where everyone can dance as themselves.")}
          />
        </dl>
      </div>
    </section>
  );
}
