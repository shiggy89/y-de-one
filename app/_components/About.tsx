"use client";

import Image from "next/image";
import Heading2 from "./Heading2";

export default function About() {
  return (
    <section>
      <div className="inner inner-about">
        <Heading2
          title="Y-de-ONE - ワイデワンとは？"
          leftClassName="universe-dance-icon heading2-icon-left"
          leftSrc="universe-dance.png"
          leftAlt="宇宙の中でバレエを踊っているアイコン"
          rightClassName="contemporary-dance-icon heading2-icon-right"
          rightSrc="contemporary-dance-icon.png"
          rightAlt="コンテンポラリーダンスをしているアイコン"
          width={500}
          height={500}
        />
        <div className="main-text">
          <p>
            10代から80代まで通う<br />
            “大人のためのバレエ教室”。<br /><br />
            初心者の方でも安心して通えるように、<br />
            基礎から丁寧に指導しています。<br /><br />
            心と身体を自由に解き放ち、<br />
            踊ることで自分を表現できる<br />
            “<span>魔法のようなダンススタジオ</span>”です。
          </p>
          <h3>🩰 バレエ・モダン・コンテンポラリー</h3>
          <p>
            「<span>踊ってみたい</span>」「<span>表現したい</span>」<br />
            —— その気持ちを大切に。<br /><br />
            Y-de-ONEでは、バレエの基礎をベースに<br />
            モダンやコンテンポラリーの要素を取り入れ、<br />
            音楽に合わせて自然に身体が動くよう導きます。<br /><br />
            初心者から経験者まで、身体が硬くても<br />
            <span>年齢に関係なく始められるの</span>が特徴。<br /><br />
            50代・60代からバレエを始める方も多いです。
          </p>
          <h3>🎵 主宰：青山佳樹　　</h3>
          <p>
            元ホルン奏者。<br />
            音楽と身体の一体感に魅せられ、<br />
            自らの表現を求めて“ダンス”という新たな道へ。<br /><br />
            舞台・テレビ出演を経て、<br />
            音と身体の融合による<br />
            「<span>心が軽くなる時間</span>」を追求。<br /><br />
            唯一無二のダンスクリエイターとして、<br />
            年齢や経験を問わず指導にあたる。
          </p>
          <h3>🕺✨ 大人から始める人を一番理解できる講師たち</h3>
          <p>
            Y-de-ONEの男性講師2人も、<br />
            子どもの頃ではなく“<span>大人になってから</span>”<br />
            ダンスを始めました。<br /><br />
            だからこそ、<br />
            「<span>新しいことに挑戦する勇気</span>」や<br />
            「<span>思うように体が動かないもどかしさ</span>」を<br />
            誰よりも理解しています。<br /><br />
            私たちは、生徒さん一人ひとりのペースに<br />
            合わせた言葉のかけ方、<br />
            その人の個性や目的に寄り添った<br />
            クラスづくりを大切にしています。<br /><br />
            現在通ってくださっている生徒さんも、<br />
            <span>ほとんどが大人になってから始めた方々</span>。<br /><br />
            笑いながら、時に真剣に、そして<br />
            妥協せずにレッスンを重ねています。<br /><br />
            来てくださる皆さんが楽しみながら<br />
            上達していく姿を見られることが、<br />
            私たちの何よりの喜びです。
          </p>
          <Image
            className="yoshiki-profile"
            src="/images/yoshiki-profile.jpg"
            alt="佳樹先生のプロフィール写真"
            width={720}
            height={997}
          />
          <Image
            className="horn-icon"
            src="/images/horn-icon.png"
            alt="ホルンのアイコン"
            width={1024}
            height={1024}
          />
          <Image
            className="yoshiki-kazuki-profile"
            src="/images/yoshiki-kazuki-profile.jpg"
            alt="佳樹先生と和樹先生のプロフィール写真"
            width={720}
            height={480}
          />
        </div>
      </div>
    </section>
  );
} 