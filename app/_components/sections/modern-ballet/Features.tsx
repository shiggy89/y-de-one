import Image from "next/image";
import Heading2 from "../common/Heading2";
import styles from "./Features.module.css";
import { makeT, type Lang } from "@/lib/i18n";

const items = [
  {
    h3: <>全てオリジナル<br />振付の創作ダンス</>,
    h3En: <>Creative dance,<br />all original choreography</>,
    icon: "/images/modern-ballet/feature-original-icon.png",
    p: "古典バレエは一切やりません。バレエもモダンもコンテンポラリーも、すべて先生が振り付けたオリジナル作品でレッスンをします。",
    pEn: "We never teach classical ballet. Ballet, modern and contemporary lessons all use original choreography created by our teachers.",
  },
  {
    h3: <>都内でも数少ない<br />モダンバレエ教室</>,
    h3En: <>One of the few modern<br />ballet schools in Tokyo</>,
    icon: "/images/modern-ballet/feature-rank-icon.png",
    p: "「モダンバレエ 教室」でGoogle検索1位。モダンバレエ教室を探してやっとたどり着いた方が多くいらっしゃいます。",
    pEn: "We rank No. 1 on Google for “モダンバレエ 教室” (modern ballet school). Many students tell us they searched for a long time before finding us.",
  },
  {
    h3: <>ダンス経験者も<br />初心者も一緒に楽しめる</>,
    h3En: <>Experienced dancers and<br />beginners enjoy it together</>,
    icon: "/images/modern-ballet/feature-together-icon.png",
    p: "ジャズダンスやクラシックバレエ経験者から、全くの初心者まで参加できます。「もっと自由に踊りたい」という気持ちを大切に。",
    pEn: "People with jazz or classical ballet experience and complete beginners can all join. We treasure the wish to dance more freely.",
  },
];

export default function ModernBalletFeatures({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return (
    <section>
      <div className="inner">
        <Heading2
          title={t(<>大人から始める<br className={styles.mobileOnlyBreak} />モダンバレエ・コンテンポラリー<br />Y-de-ONEが選ばれる3つの理由</>, <>Modern ballet and contemporary dance<br className={styles.mobileOnlyBreak} />{" "}for adult beginners:<br />three reasons to choose Y-de-ONE</>)}
        />
        <div className={styles.featureList}>
          {items.map((item, i) => (
            <div key={i} className={styles.featureItem}>
              <h3>{t(item.h3, item.h3En)}</h3>
              <Image
                src={item.icon}
                alt=""
                width={1024}
                height={1024}
                className={styles.featureIcon}
              />
              <p>{t(item.p, item.pEn)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
