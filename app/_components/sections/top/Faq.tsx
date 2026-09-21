"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Heading2 from "../common/Heading2";
import styles from "./Faq.module.css";
import ctaStyles from "../common/CtaButton.module.css";
import { TRIAL_ENTRY_URL } from "@/lib/demo";
import { localePath, makeT, type Lang } from "@/lib/i18n";

type FaqItemProps = {
  question: string,
  answer: ReactNode,
};

export function FaqItem({
  question,
  answer,
}: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return(
    <div className={styles.faqItem}>
      <button 
        type="button"
        className={styles.faqQ}
        onClick={()=>setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <p>
          <i className="fa-solid fa-q"></i>
          {question}
        </p>
        <span className={`${styles.angleDown} ${isOpen ? styles.isOpen : ""}`}><i className="fa-solid fa-angle-down"></i></span>
      </button>
      <dd className={`${styles.faqA} ${isOpen ? styles.isOpen : ""}`}>{answer}</dd>
    </div>    
  );
}

export default function Faq({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  const link = (path: string, label: string) => (
    <a href={localePath(lang, path)} style={{ color: "#0090e8", fontWeight: 700, textDecoration: "underline" }}>{label}</a>
  );
  const dogQaIconStyle = {
    "--heading-icon-width": "159px",
    "--heading-left-left": "8%",
    "--heading-left-top-mobile": "-76px",
    "--heading-left-left-mobile": "calc(44% + 20px)",
    "--heading-icon-width-mobile": "167px",
  } as CSSProperties;
  const qaIconStyle = {
    "--heading-icon-width": "159px",
    "--heading-right-left": "88%",
  } as CSSProperties;

  return(
    <section>
      <div className={`inner ${styles.innerFaq}`}>
        <Heading2
          title={
            <>
              {t(<>服装・年齢・レベル…大人
              <br className={styles.mobileOnlyBreak} />
              バレエ初心者のよくある質問</>, <>Clothes, age, level…
              <br className={styles.mobileOnlyBreak} />
              Questions from adult ballet beginners</>)}
            </>
          }
          lead={t("バレエが初めての方からよくいただく質問をまとめました。", "The questions we hear most often from people new to ballet.")}
          leftSrc="dog-qa-icon.png"
          leftAlt={t("ワイデワンちゃんのQ&Aアイコン", "Mascot dog Q&A icon") as string}
          leftStyle={dogQaIconStyle}
          rightClassName={styles.qaIcon}
          rightSrc="qa-icon.png"
          rightAlt={t("Q&Aアイコン", "Q&A icon") as string}
          rightStyle={qaIconStyle}
          width={469}
          height={532}
        />
        <dl className={styles.faqList}>
          <FaqItem
            question={t("全くの初心者ですが、大丈夫ですか？", "Is it OK if I am a complete beginner?") as string}
            answer={t("もちろん大丈夫です。Y-de-ONEの生徒さんの約80%が初心者からスタートしています。最初から丁寧に指導しますので、安心してご参加ください。", "Of course. About 80% of our students started as complete beginners. We teach carefully from the very beginning, so please join us without worry.")}
          />
          <FaqItem
            question={t("どんな服装で行けばいいですか？", "What should I wear?") as string}
            answer={t("動きやすい服装であれば何でもOKです。Tシャツとレギンス、ジャージなどで構いません。バレエシューズは無料でレンタルできます。", "Anything you can move in is fine: a T-shirt and leggings, or a tracksuit. Ballet shoes can be borrowed for free.")}
          />
          <FaqItem
            question={t("50代、60代から始めても大丈夫ですか？", "Can I start in my 50s or 60s?") as string}
            answer={t("はい、Y-de-ONEには50代、60代から始められる方が多数いらっしゃいます。年齢に関係なく、ご自身のペースで楽しんでいただけます。実際に80代の生徒さんもいらっしゃいます。", "Yes. Many of our students started in their 50s or 60s. Whatever your age, you can enjoy ballet at your own pace. We even have students in their 80s.")}
          />
          <FaqItem
            question={t("レッスンのレベルはどのくらいですか？", "What level are the lessons?") as string}
            answer={t(<>「バレエ入門」「バレエ入門基礎」「バレエ基礎」「ポワント」「プレモダン」「モダンバレエ」の6クラスをご用意しています。全くの初心者から、ブランクがある方、経験者の方まで、それぞれのペースで取り組めます。詳しくは<a href="/class" style={{ color: "#0090e8", fontWeight: 700, textDecoration: "underline" }}>クラスページ</a>をご覧ください。</>,
            <>We offer six classes: Ballet Introduction, Ballet Introduction &amp; Basics, Ballet Basics, Pointe, Pre-Modern and Modern Ballet. Complete beginners, returning dancers and experienced dancers can all work at their own pace. See the {link("/class", "classes page")} for details.</>)}
          />
          <FaqItem
            question={t("月謝はどのくらいですか？", "How much are the lessons?") as string}
            answer={t(<>月の1回目：3,500円、2回目：2,800円、3回目：2,600円...と通えば通うほど1回あたりの料金がお得になります。入会金は不要です。詳しくは<a href="/price" style={{ color: "#0090e8", fontWeight: 700, textDecoration: "underline" }}>料金ページ</a>をご覧ください。</>,
            <>You pay per lesson, with no fixed monthly tuition. The first lesson of the month costs ¥3,500 (including the ¥500 monthly studio fee), the second ¥2,800, the third ¥2,600… and each lesson gets cheaper the more you come. There is no joining fee. See the {link("/price", "price page")} for details.</>)}
          />
          <FaqItem
            question={t("体が硬くても大丈夫ですか？", "Is it OK if I am not flexible?") as string}
            answer={t("問題ありません。バレエを続けることで、少しずつ柔軟性も向上していきます。無理のない範囲で、ご自身のペースで取り組んでいただけます。", "No problem. Flexibility improves gradually as you keep dancing. You can work at your own pace, within what feels comfortable.")}
          />
          <FaqItem
            question={t("レッスン中に質問してもいいですか？", "May I ask questions during the lesson?") as string}
            answer={t("はい、遠慮なく質問してください。Y-de-ONEでは、質問しやすい雰囲気づくりを大切にしています。わからないことは、その場で解決できるようサポートします。", "Yes, please do. We work hard to keep the atmosphere easy for asking questions, and we will help you sort out anything you do not understand on the spot.")}
          />
          <FaqItem
            question={t("男性でも参加できますか？", "Can men join?") as string}
            answer={t("もちろんです。男性の生徒さんも多数通われています。年齢・性別問わず、どなたでも歓迎します。", "Of course. Many of our students are men. Everyone is welcome, whatever their age or gender.")}
          />
          <FaqItem
            question={t("体型や性別に関係なく参加できますか？", "Can I join whatever my body type or gender?") as string}
            answer={t("はい、体型・年齢・性別を問わず、どなたでも大歓迎です。LGBTQの方も安心してご参加いただけます。Y-de-ONEは、すべての方が自分らしく踊れる環境づくりを大切にしています。", "Yes. Everyone is welcome, whatever their body type, age or gender, and LGBTQ people can join with peace of mind. We care about creating a place where everyone can dance as themselves.")}
          />
          <FaqItem
            question={t("古典バレエのレッスンはありますか？", "Do you teach classical ballet?") as string}
            answer={t("Y-de-ONEでは古典バレエのレッスンは一切行っていません。バレエもモダンもすべて先生が振り付けたオリジナル作品でレッスンを行います。「白鳥の湖」などの古典演目を踊りたい方には、残念ながら合わない教室です。申し訳ございません。", "No. We do not teach classical ballet repertoire at all. Our ballet and modern lessons all use original choreography by our teachers. If you want to dance classical works such as Swan Lake, we are sorry to say this is not the right school for you.")}
          />
        </dl>
        <div className={styles.salesText}>
          <p>
            {t(<>まだ不安がありますか？<br /><br />
            他にもご質問がございましたら、お気軽にお問い合わせください。<br />
            まずは体験レッスンで雰囲気を感じてみませんか？</>, <>Still feeling unsure?<br /><br />
            If you have any other questions, please feel free to ask.<br />
            Why not come and feel the atmosphere at a trial lesson?</>)}
          </p>
          <Image
            className={styles.ballerinaFamily1Icon}
            src="/images/home/ballerina-family1-icon.png"
            alt={t("家族みんなでバレエを楽しんでいるアイコン1", "Family enjoying ballet") as string}
            width={554}
            height={320}
          />
          <Image
            className={styles.ballerinaFamily2Icon}
            src="/images/home/ballerina-family2-icon.png"
            alt={t("家族みんなでバレエを楽しんでいるアイコン2", "Family enjoying ballet") as string}
            width={364}
            height={349}
          />
        </div>
        <div className={ctaStyles.centerBtn}>
          <a href={TRIAL_ENTRY_URL} className={styles.lastBtn}>{t("体験レッスンはこちら", "Book a trial lesson")} <i className="fa-solid fa-arrow-up-right-from-square"></i></a>
          <span className={ctaStyles.lineAddText}>
            <i className="fa-brands fa-line"></i>
            {t("LINEから簡単に予約できます", "Book in a minute through LINE, Japan's main messaging app")}
          </span>
          <span className={ctaStyles.lineSubText}>{t("見学（無料）もお申込みいただけます", "Free studio visits are welcome too")}</span>
          <span className={ctaStyles.lineNotText}>
            {t(<>LINEをお持ちでない方は<a href="/contact" className={ctaStyles.lineNotLink}>こちら</a></>,
              <>No LINE account? <a href={localePath(lang, "/contact")} className={ctaStyles.lineNotLink}>Contact us here</a></>)}
          </span>
        </div>
      </div>
    </section>
  );
}
