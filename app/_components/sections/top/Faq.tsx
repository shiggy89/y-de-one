"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Heading2 from "../common/Heading2";
import styles from "./Faq.module.css";
import ctaStyles from "../common/CtaButton.module.css";

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

export default function Faq() {
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
              服装・年齢・レベル…大人
              <br className={styles.mobileOnlyBreak} />
              バレエ初心者のよくある質問
            </>
          }
          lead="バレエが初めての方からよくいただく質問をまとめました。"
          leftSrc="dog-qa-icon.png"
          leftAlt="ワイデワンちゃんのQ&Aアイコン"
          leftStyle={dogQaIconStyle}
          rightClassName={styles.qaIcon}
          rightSrc="qa-icon.png"
          rightAlt="Q&Aアイコン"
          rightStyle={qaIconStyle}
          width={469}
          height={532}
        />
        <dl className={styles.faqList}>
          <FaqItem
            question="全くの初心者ですが、大丈夫ですか？"
            answer="もちろん大丈夫です。Y-de-ONEの生徒さんの約80%が初心者からスタートしています。最初から丁寧に指導しますので、安心してご参加ください。"
          />
          <FaqItem
            question="どんな服装で行けばいいですか？"
            answer="動きやすい服装であれば何でもOKです。Tシャツとレギンス、ジャージなどで構いません。バレエシューズは無料でレンタルできます。"
          />
          <FaqItem
            question="50代、60代から始めても大丈夫ですか？"
            answer="はい、Y-de-ONEには50代、60代から始められる方が多数いらっしゃいます。年齢に関係なく、ご自身のペースで楽しんでいただけます。実際に80代の生徒さんもいらっしゃいます。"
          />
          <FaqItem
            question="レッスンのレベルはどのくらいですか？"
            answer={<>「バレエ入門」「バレエ入門基礎」「バレエ基礎」「ポワント」「プレモダン」「モダンバレエ」の6クラスをご用意しています。全くの初心者から、ブランクがある方、経験者の方まで、それぞれのペースで取り組めます。詳しくは<a href="/class" style={{ color: "#0090e8", fontWeight: 700, textDecoration: "underline" }}>クラスページ</a>をご覧ください。</>}
          />
          <FaqItem
            question="月謝はどのくらいですか？"
            answer={<>月の1回目：3,300円、2回目：2,600円、3回目：2,400円...と通えば通うほど1回あたりの料金がお得になります。入会金は不要です。詳しくは<a href="/price" style={{ color: "#0090e8", fontWeight: 700, textDecoration: "underline" }}>料金ページ</a>をご覧ください。</>}
          />
          <FaqItem
            question="体が硬くても大丈夫ですか？"
            answer="問題ありません。バレエを続けることで、少しずつ柔軟性も向上していきます。無理のない範囲で、ご自身のペースで取り組んでいただけます。"
          />
          <FaqItem
            question="レッスン中に質問してもいいですか？"
            answer="はい、遠慮なく質問してください。Y-de-ONEでは、質問しやすい雰囲気づくりを大切にしています。わからないことは、その場で解決できるようサポートします。"
          />
          <FaqItem
            question="男性でも参加できますか？"
            answer="もちろんです。男性の生徒さんも多数通われています。年齢・性別問わず、どなたでも歓迎します。"
          />
        </dl>
        <div className={styles.salesText}>
          <p>
            まだ不安がありますか？<br /><br />
            他にもご質問がございましたら、お気軽にお問い合わせください。<br />
            まずは体験レッスンで雰囲気を感じてみませんか？
          </p>
          <Image
            className={styles.ballerinaFamily1Icon}
            src="/images/home/ballerina-family1-icon.png"
            alt="家族みんなでバレエを楽しんでいるアイコン1"
            width={554}
            height={320}
          />
          <Image
            className={styles.ballerinaFamily2Icon}
            src="/images/home/ballerina-family2-icon.png"
            alt="家族みんなでバレエを楽しんでいるアイコン2"
            width={364}
            height={349}
          />
        </div>
        <div className={ctaStyles.centerBtn}>
          <a href="https://lin.ee/iz33eCM" className={styles.lastBtn}>体験レッスンはこちら <i className="fa-solid fa-arrow-up-right-from-square"></i></a>
          <span className={ctaStyles.lineAddText}>
            <i className="fa-brands fa-line"></i>
            友だち追加をして体験レッスンにお申込み下さい
          </span>
          <span className={ctaStyles.lineSubText}>レッスン見学（無料）もお申込みいただけます</span>
        </div>
      </div>
    </section>
  );
}
