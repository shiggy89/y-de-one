"use client";

// import Link from "next/link";
import Image from "next/image"; 
import HeroCtaButton from "../common/HeroCtaButton";
import styles from "./Hero.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

export default function Hero({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return (
    <section>
      <div className={`inner ${styles.innerHero}`}>
        <div className={styles.heroLeft}>
          <h1>
            {t(<>質問できる<br />
            大人バレエ教室<br />
            Y-de-ONE</>, <>Ask questions.<br />
            Adult ballet school<br />
            Y-de-ONE</>)}
          </h1>

          <p>{t("高田馬場・東中野・落合・新宿エリア", "Takadanobaba · Higashi-Nakano · Ochiai · Shinjuku, Tokyo")}</p>

          {/* <Link href="https://lin.ee/iz33eCM" className="cta-btn">
            体験レッスンはこちら{" "}
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </Link>
          <span className="line-add-text">
            <i className="fa-brands fa-line"></i>
            友だち追加をして体験レッスンにお申込み下さい
          </span> */}
          <HeroCtaButton className={styles.heroCtaWrap} lang={lang} />

          <Image
            className={styles.dogIcon}
            src="/images/home/dog-icon.png"
            alt={t("ワイデワンちゃんのアイコン", "Y-de-ONE mascot dog") as string}
            width={555}
            height={427}
          />
          <Image
            className={styles.balletWoman1Icon}
            src="/images/home/ballet-woman1-icon.png"
            alt={t("バレリーナ女性のアイコン1", "Ballerina illustration") as string}
            width={532}
            height={469}
          />
        </div>

        <div className={styles.heroRight}>
          <p>
            {t(<>10代から80代まで通ってます<br />
            <span>8割</span>の生徒が初心者から</>, <>Students from their teens to their 80s.<br />
            <span>80%</span> started as beginners</>)}
          </p>
          <Image
            className={styles.familyIcon}
            src="/images/home/family-icon.png"
            alt={t("バレエの格好をした家族アイコン", "Family in ballet outfits") as string}
            width={722}
            height={345}
          />
        </div>
      </div>
    </section>
  );
}
