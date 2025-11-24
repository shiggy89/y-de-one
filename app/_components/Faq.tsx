"use client";

import { useState } from "react"; 
import Image from "next/image";
import Heading2 from "./Heading2";

type FaqItemProps = {
  question: string,
  answer: string,
};

export function FaqItem({
  question,
  answer,
}: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return(
    <div className="faq-item">
      <button 
        type="button"
        className="faq-q"
        onClick={()=>setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <p>
          <i className="fa-solid fa-q"></i>
          {question}
        </p>
        <span className={`angle-down ${isOpen ? "is-open" : ""}`}><i className="fa-solid fa-angle-down"></i></span>
      </button>
      <dd className={`faq-a ${isOpen ? "is-open" : ""}`}>{answer}</dd>
    </div>    
  );
}

export default function Faq() {
  return(
    <section>
      <div className="inner inner-faq">
        <Heading2
          title="服装・年齢・レベル…大人バレエ初心者のよくある質問"
          lead="バレエが初めての方からよくいただく質問をまとめました。"
          leftClassName="dog-qa-icon heading2-icon-left"
          leftSrc="dog-qa-icon.png"
          leftAlt="ワイデワンちゃんのQ&Aアイコン"
          rightClassName="qa-icon heading2-icon-right"
          rightSrc="qa-icon.png"
          rightAlt="Q&Aアイコン"
          width={469}
          height={532}
        />
        <dl className="faq-list">
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
            answer="はい、Y-de-ONEには50代、60代から始められる方が多数いらっしゃいます。年齢に関係なく、ご自分のペースで楽しんでいただけます。実際に80代の生徒さんもいらっしゃいます。"
          />
          <FaqItem
            question="レッスンのレベルはどのくらいですか？"
            answer="初心者クラスから経験者クラスまで、レベル別にクラスを設けています。体験レッスン時に、あなたに合ったクラスをご提案させていただきます。"
          />
          <FaqItem
            question="月謝はどのくらいですか？"
            answer="月の1回目：3,300円、2回目：2,600円、3回目：2,400円...と通えば通うほど1回あたりの料金がお得になります。入会金は不要です。詳しくは体験レッスン時にご説明します。"
          />
          <FaqItem
            question="体が硬くても大丈夫ですか？"
            answer="問題ありません。バレエを続けることで、少しずつ柔軟性も向上していきます。無理のない範囲で、ご自分のペースで取り組んでいただけます。"
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
        <div className="sales-text">
          <p>
            まだ不安がありますか？<br /><br />
            他にもご質問がございましたら、お気軽にお問い合わせください。<br />
            まずは体験レッスンで雰囲気を感じてみませんか？
          </p>
          <Image
            className="ballerina-family1-icon"
            src="/images/ballerina-family1-icon.png"
            alt="家族みんなでバレエを楽しんでいるアイコン1"
            width={554}
            height={320}
          />
          <Image
            className="ballerina-family2-icon"
            src="/images/ballerina-family2-icon.png"
            alt="家族みんなでバレエを楽しんでいるアイコン2"
            width={364}
            height={349}
          />
        </div>
        <div className="center-btn">
          <a href="https://liff.line.me/2008551653-JRwQxXrB" className="last-btn">体験レッスンはこちら <i className="fa-solid fa-arrow-up-right-from-square"></i></a>
        </div>
      </div>
    </section>
  );
}