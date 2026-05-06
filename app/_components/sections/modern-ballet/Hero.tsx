import Image from "next/image";
import HeroCtaButton from "../common/HeroCtaButton";
import styles from "./Hero.module.css";

export default function ModernBalletHero() {
  return (
    <section>
      <div className={`inner ${styles.innerHero}`}>
        <div className={styles.heroLeft}>
          <h1>
            やっと見つけた！東京で<br />
            モダンバレエが学べる教室<br />
            Y-de-ONE（ワイデワン）
          </h1>
          <p className={styles.lead}>
            高田馬場・東中野・落合・新宿エリア
          </p>
          <HeroCtaButton className={styles.heroCtaWrap} />
        </div>
        <div className={styles.catchCopy}>
          <Image
            src="/images/modern-ballet/dog-ballet.png"
            alt="モダンバレエを踊るワイデわんちゃん"
            width={500}
            height={500}
            className={styles.dogImg}
            priority
          />
          <p className={styles.searchResult}>
            <span style={{color:"#4285F4"}}>G</span><span style={{color:"#EA4335"}}>o</span><span style={{color:"#FBBC04"}}>o</span><span style={{color:"#4285F4"}}>g</span><span style={{color:"#34A853"}}>l</span><span style={{color:"#EA4335"}}>e</span><span className={styles.searchText}>検索</span>
            <span className={styles.rank}>
              <i className="fa-solid fa-trophy" />
              <span>1位</span>
            </span>
          </p>
          <div className={styles.searchBar}>
            <i className="fa-solid fa-magnifying-glass" />
            モダンバレエ 教室
          </div>
        </div>
        <div className={styles.heroRight}>
          <Image
            src="/images/modern-ballet/students-dance-icon.png"
            alt="モダンバレエを楽しむ生徒たちのイラスト"
            width={600}
            height={287}
            className={styles.studentsDanceIcon}
          />
          <Image
            src="/images/modern-ballet/dog-ballet.png"
            alt="モダンバレエを踊るワイデわんちゃん"
            width={500}
            height={500}
            className={styles.dogImgMobile}
          />
        </div>
      </div>
    </section>
  );
}
