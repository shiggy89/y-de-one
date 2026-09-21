"use client";

import { type CSSProperties } from "react";
import Image from "next/image";
import Heading2 from "../common/Heading2";
import styles from "./About.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

export default function About({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  const universeDanceStyle = {
    "--heading-icon-width": "220px",
    "--heading-icon-radius": "999px",
    "--heading-icon-width-mobile": "180px",
    "--heading-left-top-mobile": "-100px",
    "--heading-left-left-mobile": "48%",
  } as CSSProperties;
  const contemporaryDanceStyle = {
    "--heading-icon-width": "214px",
    "--heading-right-top": "168px",
    "--heading-icon-width-mobile": "180px",
    "--heading-right-top-mobile": "150px",
    "--heading-icon-opacity": "0.8",
  } as CSSProperties;

  return (
    <section>
      <div className="inner">
        <Heading2
          title={t("Y-de-ONE | ワイデワンとは？", "About Y-de-ONE")}
          leftSrc="universe-dance.png"
          leftAlt={t("宇宙の中でバレエを踊っているアイコン", "Dancer in space") as string}
          leftStyle={universeDanceStyle}
          rightSrc="contemporary-dance-icon.png"
          rightAlt={t("コンテンポラリーダンスをしているアイコン", "Contemporary dancer") as string}
          rightStyle={contemporaryDanceStyle}
          width={500}
          height={500}
        />
        <div className={styles.mainText}>
          <p>
            {t(<>10代から80代まで通う<br />
            “大人のためのバレエ教室”。<br /><br />
            初心者の方でも安心して通えるように、<br />
            基礎から丁寧に指導しています。<br /><br />
            心と身体を自由に解き放ち、<br />
            踊ることで自分を表現できる<br />
            “<span>魔法のようなダンススタジオ</span>”です。</>,
            <>A ballet school for adults, with students from their teens to their 80s.<br /><br />
            We teach from the very basics, so that even beginners feel at home.<br /><br />
            A <span>magical dance studio</span> where you can free your mind and body
            and express yourself through dance.</>)}
          </p>
          <h3>
            {t(<>🩰 バレエ・モダン・
            <br className={styles.mobileOnlyBreak} />
            コンテンポラリー</>, <>🩰 Ballet, modern{" "}
            <br className={styles.mobileOnlyBreak} />
            and contemporary</>)}
          </h3>
          <p>
            {t(<>「<span>踊ってみたい</span>」「<span>表現したい</span>」<br />
            —— その気持ちを大切に。<br /><br />
            Y-de-ONEでは、バレエの基礎をベースに<br />
            モダンやコンテンポラリーの要素を取り入れ、<br />
            音楽に合わせて自然に身体が動くよう導きます。<br /><br />
            初心者から経験者まで、身体が硬くても<br />
            <span>年齢に関係なく始められるの</span>が特徴。<br /><br />
            50代・60代からバレエを始める方も多いです。</>,
            <>“<span>I want to dance</span>”, “<span>I want to express myself</span>”:<br />
            we treasure that feeling.<br /><br />
            Built on a foundation of classical technique, our lessons bring in elements of modern
            and contemporary dance, guiding your body to move naturally with the music.<br /><br />
            From beginners to experienced dancers, even if you are stiff,
            <span> you can start at any age</span>.<br /><br />
            Many of our students begin ballet in their 50s and 60s.</>)}
          </p>
          <h3>{t("🎵 主宰：青山佳樹　　", "🎵 Founder: Yoshiki Aoyama")}</h3>
          <p>
            {t(<>元ホルン奏者。<br />
            音楽と身体の一体感に魅せられ、<br />
            自らの表現を求めて“ダンス”という新たな道へ。<br /><br />
            舞台・テレビ出演を経て、<br />
            音と身体の融合による<br />
            「<span>心が軽くなる時間</span>」を追求。<br /><br />
            唯一無二のダンスクリエイターとして、<br />
            年齢や経験を問わず指導にあたる。</>,
            <>A former horn player.<br />
            Drawn to the unity of music and body, he turned to dance in search of his own expression.<br /><br />
            After performing on stage and on television, he pursues
            “<span>time that makes your heart feel lighter</span>” through the fusion of sound and movement.<br /><br />
            A one-of-a-kind dance creator, he teaches students of any age and experience.</>)}
          </p>
          {lang === "en" && (
            <div className={styles.enPhotos}>
              <Image className={styles.enPortrait} src="/images/home/yoshiki-profile-2.jpg" alt="Portrait of Yoshiki Aoyama" width={720} height={997} />
              <Image className={styles.enHorn} src="/images/home/horn-icon.png" alt="French horn icon" width={1024} height={1024} />
            </div>
          )}
          <h3>
            {t(<>🕺✨ 大人から始める人を
            <br className={styles.mobileOnlyBreak} />
            一番理解できる講師たち</>, <>🕺✨ Teachers who best understand{" "}
            <br className={styles.mobileOnlyBreak} />
            people who start as adults</>)}
          </h3>
          <p>
            {t(<>Y-de-ONEの男性講師2人も、<br />
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
            私たちの何よりの喜びです。</>,
            <>Both of our male teachers also started dancing <span>as adults</span>, not as children.<br /><br />
            That is why we understand better than anyone
            <span> the courage it takes to try something new</span> and
            <span> the frustration of a body that will not move the way you want</span>.<br /><br />
            We choose our words to suit each student&apos;s pace, and shape classes around each person&apos;s
            character and goals.<br /><br />
            <span>Most of our current students also started as adults.</span><br /><br />
            We laugh, we take it seriously at times, and we never cut corners.<br /><br />
            Nothing makes us happier than watching everyone improve while enjoying themselves.</>)}
          </p>
          {lang === "en" && (
            <div className={styles.enPhotos}>
              <Image className={styles.enDuo} src="/images/home/yoshiki-kazuki-profile.jpg" alt="Yoshiki Aoyama and Kazuki Monma" width={720} height={480} />
            </div>
          )}
          {lang === "ja" && (
            <>
              <Image
                className={styles.yoshikiProfile}
                src="/images/home/yoshiki-profile-2.jpg"
                alt="佳樹先生のプロフィール写真"
                width={720}
                height={997}
              />
              <Image
                className={styles.hornIcon}
                src="/images/home/horn-icon.png"
                alt="ホルンのアイコン"
                width={1024}
                height={1024}
              />
              <Image
                className={styles.yoshikiKazukiProfile}
                src="/images/home/yoshiki-kazuki-profile.jpg"
                alt="佳樹先生と和樹先生のプロフィール写真"
                width={720}
                height={480}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
} 
