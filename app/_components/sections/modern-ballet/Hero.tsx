import Image from "next/image";
import HeroCtaButton from "../common/HeroCtaButton";
import styles from "./Hero.module.css";
import { makeT, type Lang } from "@/lib/i18n";

export default function ModernBalletHero({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return (
    <section>
      <div className={`inner ${styles.innerHero}`}>
        <div className={styles.heroLeft}>
          <h1>
            {t(<>やっと見つけた！東京で<br />
            モダンバレエが学べる教室<br />
            Y-de-ONE（ワイデワン）</>, <>Found it at last!<br />
            A school in Tokyo where you can<br />
            learn modern ballet: Y-de-ONE</>)}
          </h1>
          <p className={styles.lead}>
            {t("高田馬場・東中野・落合・新宿エリア", "Takadanobaba · Higashi-Nakano · Ochiai · Shinjuku, Tokyo")}
          </p>
          <HeroCtaButton className={styles.heroCtaWrap} lang={lang} />
        </div>
        <div className={styles.catchCopy}>
          <Image
            src="/images/modern-ballet/dog-ballet.png"
            alt={t("モダンバレエを踊るワイデわんちゃん", "Mascot dog dancing modern ballet") as string}
            width={500}
            height={500}
            className={styles.dogImg}
            priority
          />
          <p className={styles.searchResult}>
            <span style={{color:"#4285F4"}}>G</span><span style={{color:"#EA4335"}}>o</span><span style={{color:"#FBBC04"}}>o</span><span style={{color:"#4285F4"}}>g</span><span style={{color:"#34A853"}}>l</span><span style={{color:"#EA4335"}}>e</span><span className={styles.searchText}>{t("検索", " search")}</span>
            <span className={styles.rank}>
              <i className="fa-solid fa-trophy" />
              <span>{t("1位", "No. 1")}</span>
            </span>
          </p>
          <div className={styles.searchBar}>
            <i className="fa-solid fa-magnifying-glass" />
            {t("モダンバレエ 教室", "モダンバレエ 教室 (modern ballet school)")}
          </div>
        </div>
        <div className={styles.heroRight}>
          <Image
            src="/images/modern-ballet/students-dance-icon.png"
            alt={t("モダンバレエを楽しむ生徒たちのイラスト", "Students enjoying modern ballet") as string}
            width={600}
            height={287}
            className={styles.studentsDanceIcon}
          />
          <Image
            src="/images/modern-ballet/dog-ballet.png"
            alt={t("モダンバレエを踊るワイデわんちゃん", "Mascot dog dancing modern ballet") as string}
            width={500}
            height={500}
            className={styles.dogImgMobile}
          />
        </div>
      </div>
    </section>
  );
}
