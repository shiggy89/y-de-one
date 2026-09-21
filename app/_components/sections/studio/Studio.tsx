"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Studio.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

const LESSON_VIDEOS = [
  "PECFK7ASmf4",
  "jT75y_DERNg",
  "ztdPe2ax838",
  "HDHvv0cZ958",
  "n-WFzTpG_LQ",
  "yBAJbu2JxwE",
  "8VbEot05PBo",
  "16e-QAcQeDg",
  "qlTojt2_APA",
];

const STUDIO_PHOTOS = [1, 2, 3, 4, 5, 6, 7, 8].map(
  (n) => `/images/studio/studio-${n}.jpg`
);

const NAV_ITEMS = [
  { icon: "/images/studio/studio-icon.png", label: "スタジオ紹介", labelEn: "The studio", href: "#studio" },
  { icon: "/images/studio/lesson-video-icon.png", label: "レッスン動画", labelEn: "Lesson videos", href: "#lesson-video" },
];

export default function Studio({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return (
    <>
      {/* ━━━ ページ内ナビ ━━━ */}
      <section className={styles.navSection}>
        <div className="inner">
          <div className={styles.navCards}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={styles.navCard}
                onClick={(e) => {
                  e.preventDefault();
                  const id = item.href.replace("#", "");
                  setTimeout(() => {
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 100);
                }}
              >
                <Image src={item.icon} alt={t(item.label, item.labelEn) as string} width={160} height={160} className={styles.navIcon} />
                <span className={styles.navLabel}>{t(item.label, item.labelEn)}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ スタジオ紹介 ━━━ */}
      <section id="studio" className={styles.studioSection}>
        <div className="inner">
          <Heading2
            className={styles.sectionHeading}
            title={t(<>Y-de-ONE | ワイデワン<br />スタジオ紹介</>, <>Y-de-ONE<br />The studio</>)}
            lead={t("高田馬場・東中野・落合・新宿エリアにある、広々とした鏡張りのスタジオ。バーレッスンからセンターまで、のびのびと動ける空間です。", "A spacious mirrored studio in Takadanobaba, close to Ochiai, Higashi-Nakano and Shinjuku, with room to move freely from barre work to centre work.")}
          />
          <div className={styles.photoGrid}>
            {STUDIO_PHOTOS.map((src, i) => (
              <div key={i} className={styles.photoItem}>
                <Image
                  src={src}
                  alt={t(`スタジオ写真${i + 1}`, `Studio photo ${i + 1}`) as string}
                  width={600}
                  height={400}
                  className={styles.photo}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ レッスン動画 ━━━ */}
      <section id="lesson-video" className={styles.videoSection}>
        <div className="inner">
          <Heading2
            className={styles.sectionHeading}
            title={t(<>Y-de-ONE | ワイデワン<br />レッスン動画</>, <>Y-de-ONE<br />Lesson videos</>)}
            lead={t("「どんな雰囲気のレッスンか気になる」——そんな方にぜひご覧いただきたい、実際のレッスン風景です。体験レッスンのご参考にどうぞ。", "Wondering what a lesson is really like? Here are real lesson scenes to help you decide on a trial lesson.")}
          />
          <div className={styles.videoGrid}>
            {LESSON_VIDEOS.map((id) => (
              <div key={id} className={styles.videoWrapper}>
                <iframe
                  src={`https://www.youtube.com/embed/${id}?playsinline=1`}
                  title={t("レッスン動画", "Lesson video") as string}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
          <SectionCtaButton lang={lang} />
        </div>
      </section>
    </>
  );
}
