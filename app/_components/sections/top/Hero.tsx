"use client";

// import Link from "next/link";
import Image from "next/image"; 
import HeroCtaButton from "../common/HeroCtaButton";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section>
      <div className={`inner ${styles.innerHero}`}>
        <div className={styles.heroLeft}>
          <h1>
            質問できる<br />
            大人バレエ教室<br />
            Y-de-ONE
          </h1>

          <p>高田馬場・東中野・落合・新宿エリア</p>

          {/* <Link href="https://lin.ee/iz33eCM" className="cta-btn">
            体験レッスンはこちら{" "}
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </Link>
          <span className="line-add-text">
            <i className="fa-brands fa-line"></i>
            友だち追加をして体験レッスンにお申込み下さい
          </span> */}
          <HeroCtaButton className={styles.heroCtaWrap} />

          <Image
            className={styles.dogIcon}
            src="/images/home/dog-icon.png"
            alt="ワイデワンちゃんのアイコン"
            width={555}
            height={427}
          />
          <Image
            className={styles.balletWoman1Icon}
            src="/images/home/ballet-woman1-icon.png"
            alt="バレリーナ女性のアイコン1"
            width={532}
            height={469}
          />
        </div>

        <div className={styles.heroRight}>
          <p>
            10代から80代まで通ってます<br />
            <span>8割</span>の生徒が初心者から
          </p>
          <Image
            className={styles.familyIcon}
            src="/images/home/family-icon.png"
            alt="バレエの格好をした家族アイコン"
            width={722}
            height={345}
          />
        </div>
      </div>
    </section>
  );
}
