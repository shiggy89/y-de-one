"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Studio.module.css";

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
  { icon: "/images/studio/studio-icon.png", label: "スタジオ紹介", href: "#studio" },
  { icon: "/images/studio/lesson-video-icon.png", label: "レッスン動画", href: "#lesson-video" },
];

export default function Studio() {
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
                <Image src={item.icon} alt={item.label} width={160} height={160} className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
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
            title={<>Y-de-ONE | ワイデワン<br />スタジオ紹介</>}
            lead="高田馬場・東中野・落合・新宿エリアにある、広々とした鏡張りのスタジオ。バーレッスンからセンターまで、のびのびと動ける空間です。"
          />
          <div className={styles.photoGrid}>
            {STUDIO_PHOTOS.map((src, i) => (
              <div key={i} className={styles.photoItem}>
                <Image
                  src={src}
                  alt={`スタジオ写真${i + 1}`}
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
            title={<>Y-de-ONE | ワイデワン<br />レッスン動画</>}
            lead="「どんな雰囲気のレッスンか気になる」——そんな方にぜひご覧いただきたい、実際のレッスン風景です。体験レッスンのご参考にどうぞ。"
          />
          <div className={styles.videoGrid}>
            {LESSON_VIDEOS.map((id) => (
              <div key={id} className={styles.videoWrapper}>
                <iframe
                  src={`https://www.youtube.com/embed/${id}?playsinline=1`}
                  title="レッスン動画"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
          <SectionCtaButton />
        </div>
      </section>
    </>
  );
}
