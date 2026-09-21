import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Heading2 from "../common/Heading2";
import styles from "./Instructor.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

const INSTRUCTORS = [
  {
    name: "青山佳樹",
    kana: "Yoshiki Aoyama",
    photo: "/images/instructor/yoshiki-profile-3.jpg",
    descEn: "A performer who combines delicacy with strength.",
    desc: "繊細さと力強さを兼ね備えた表現者。",
    bullets: [
      "劇団四季を経て、現在ワイデワン主宰",
      "新国立劇場・稲葉浩志MV・水樹奈々MV出演",
      "JDAダンスコンクール 1位受賞",
    ],
    bulletsEn: [
      "Formerly with Shiki Theatre Company; now the head of Y-de-ONE",
      "Appeared at the New National Theatre, Tokyo, and in music videos for Koshi Inaba and Nana Mizuki",
      "1st place at the JDA Dance Competition",
    ],
    href: "/instructor#yoshiki",
  },
  {
    name: "門馬和樹",
    kana: "Kazuki Monma",
    photo: "/images/instructor/kazuki-profile-2.jpg",
    descEn: "An artist who gives shape to the energy of the moment.",
    desc: "瞬間のエネルギーを形にするアーティスト。",
    bullets: [
      "新国立劇場オペラ・宮藤官九郎監督映画出演",
      "ミュージカル「刀剣乱舞」出演",
      "東京海上日動TVCM出演",
    ],
    bulletsEn: [
      "Appeared in opera at the New National Theatre, Tokyo, and in a film directed by Kankuro Kudo",
      "Appeared in the musical “Touken Ranbu”",
      "Appeared in a Tokio Marine & Nichido TV commercial",
    ],
    href: "/instructor#kazuki",
  },
];

export default function ModernBalletInstructor({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return (
    <section className={styles.section}>
      <div className="inner">
        <Heading2
          className="h2SmallMargin"
          title={t(<>モダンバレエを教える講師紹介<br />青山佳樹・門馬和樹</>, <>Meet your modern ballet teachers<br />Yoshiki Aoyama and Kazuki Monma</>)}
          lead={t("Y-de-ONEのモダンバレエクラスを担当する2人の講師を紹介します。どちらも第一線で活躍するダンサーであり、大人になってからダンスを始めた指導者です。", "Meet the two teachers of our modern ballet classes. Both are working dancers, and both started dancing as adults.")}
          rightSrc="/images/modern-ballet/dog-perform-icon.png"
          rightAlt=""
          width={400}
          height={400}
          rightStyle={{ "--heading-right-left-mobile": "50%" } as CSSProperties}
        />
        <div className={styles.grid}>
          {INSTRUCTORS.map((inst) => (
            <div key={inst.name} className={styles.card}>
              <Image
                src={inst.photo}
                alt={t(inst.name, inst.kana) as string}
                fill
                className={styles.photo}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className={styles.overlay}>
                <p className={styles.kana}>{inst.kana}</p>
                <h3 className={styles.name}>{t(inst.name, inst.kana)}</h3>
                <p className={styles.desc}>{t(inst.desc, inst.descEn)}</p>
                <ul className={styles.bullets}>
                  {(lang === "en" ? inst.bulletsEn : inst.bullets).map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <Link href={inst.href} className={styles.detailBtn}>
                  {t("プロフィール詳細を見る →", "See the full profile →")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
