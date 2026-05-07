import Image from "next/image";
import Heading2 from "../common/Heading2";
import styles from "./Features.module.css";

const items = [
  {
    h3: <>全てオリジナル<br />振付の創作ダンス</>,
    icon: "/images/modern-ballet/feature-original-icon.png",
    p: "古典バレエは一切やりません。バレエもモダンもコンテンポラリーも、すべて先生が振り付けたオリジナル作品でレッスンをします。",
  },
  {
    h3: <>都内でも数少ない<br />モダンバレエ教室</>,
    icon: "/images/modern-ballet/feature-rank-icon.png",
    p: "「モダンバレエ 教室」でGoogle検索1位。モダンバレエ教室を探してやっとたどり着いた方が多くいらっしゃいます。",
  },
  {
    h3: <>ダンス経験者も<br />初心者も一緒に楽しめる</>,
    icon: "/images/modern-ballet/feature-together-icon.png",
    p: "ジャズダンスやクラシックバレエ経験者から、全くの初心者まで参加できます。「もっと自由に踊りたい」という気持ちを大切に。",
  },
];

export default function ModernBalletFeatures() {
  return (
    <section>
      <div className="inner">
        <Heading2
          title={<>大人から始める<br className={styles.mobileOnlyBreak} />モダンバレエ・コンテンポラリー<br />Y-de-ONEが選ばれる3つの理由</>}
        />
        <div className={styles.featureList}>
          {items.map((item, i) => (
            <div key={i} className={styles.featureItem}>
              <h3>{item.h3}</h3>
              <Image
                src={item.icon}
                alt=""
                width={1024}
                height={1024}
                className={styles.featureIcon}
              />
              <p>{item.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
