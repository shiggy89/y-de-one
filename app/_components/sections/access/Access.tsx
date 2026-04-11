"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Access.module.css";

const NAV_ITEMS = [
  { label: "高田馬場駅", href: "#takadanobaba" },
  { label: "東中野駅", href: "#higashinakano" },
  { label: "落合駅", href: "#ochiai" },
  { label: "新宿駅", href: "#shinjuku" },
];

const STATIONS = [
  {
    id: "takadanobaba",
    station: "高田馬場駅",
    line: "JR山手線・西武新宿線・東京メトロ東西線",
    time: "徒歩約12分",
    steps: [
      { step: 1, label: "高田馬場駅 早稲田口を出て左へ", photo: null },
      { step: 2, label: "早稲田通りをまっすぐ進むとマツモトキヨシが見える（中間地点）", photo: null },
      { step: 3, label: "さらにまっすぐ進むとセブンイレブンが見える", photo: null },
      { step: 4, label: "セブンイレブンの向かいのビル2階がY-de-ONEです", photo: null },
    ],
  },
  {
    id: "higashinakano",
    station: "東中野駅",
    line: "JR総武線・都営大江戸線",
    time: "徒歩約10分",
    steps: [
      { step: 1, label: "東中野駅東口を出る", photo: null },
      { step: 2, label: "大久保通りを東へ直進", photo: null },
      { step: 3, label: "交差点を左折", photo: null },
      { step: 4, label: "兼子ビル2階が目印", photo: null },
    ],
  },
  {
    id: "ochiai",
    station: "落合駅",
    line: "東京メトロ東西線",
    time: "徒歩約8分",
    steps: [
      { step: 1, label: "落合駅2番出口を出る", photo: null },
      { step: 2, label: "目白通りを東へ直進", photo: null },
      { step: 3, label: "交差点を右折", photo: null },
      { step: 4, label: "兼子ビル2階が目印", photo: null },
    ],
  },
  {
    id: "shinjuku",
    station: "新宿駅",
    line: "各線",
    time: "徒歩約20分 / バス約10分",
    steps: [
      { step: 1, label: "新宿駅西口を出る", photo: null },
      { step: 2, label: "青梅街道を北西へ直進", photo: null },
      { step: 3, label: "高田馬場3丁目交差点を右折", photo: null },
      { step: 4, label: "兼子ビル2階が目印", photo: null },
    ],
  },
];

export default function Access() {
  return (
    <>
      {/* ━━━ 地図＋住所 ━━━ */}
      <section className={styles.mapSection}>
        <div className="inner">
          <Heading2
            title={<>Y-de-ONE | ワイデワン<br />へのアクセス</>}
            lead="JR山手線・JR総武線・東京メトロ東西線・西武新宿線など複数路線が利用可能です。高田馬場・東中野・落合の各駅から徒歩10〜20分圏内にあるワイデワンへぜひお越しください。"
          />
          <div className={styles.mapCard}>
            <div className={styles.mapEmbed}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3239.645284115828!2d139.69241137643562!3d35.71034562837309!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188d35ca815555%3A0x4b7ea70498aadbb1!2z44Ov44Kk44OH44Ov44Oz!5e0!3m2!1sja!2sjp!4v1763296167778!5m2!1sja!2sjp"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className={styles.mapInfo}>
              <p className={styles.mapAddress}>
                <i className="fa-solid fa-location-dot"></i>
                <span>
                  Y-de-ONE バレエ教室<br />
                  〒169-0075<br />
                  東京都新宿区高田馬場3-36-6<br />
                  兼子ビル2階
                </span>
              </p>
              <div className={styles.stationLinks}>
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={styles.stationLink}
                    onClick={(e) => {
                      e.preventDefault();
                      const id = item.href.replace("#", "");
                      setTimeout(() => {
                        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 100);
                    }}
                  >
                    <i className="fa-solid fa-train"></i>
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ 各駅からのアクセス ━━━ */}
      {STATIONS.map((s) => (
        <section key={s.id} id={s.id} className={styles.stationSection}>
          <div className="inner">
            <div className={styles.stationHeader}>
              <h2 className={styles.stationName}>
                <i className="fa-solid fa-train"></i>
                {s.station}からのアクセス
              </h2>
              <p className={styles.stationMeta}>{s.line}｜{s.time}</p>
            </div>
            <div className={styles.stepsGrid}>
              {s.steps.map((step) => (
                <div key={step.step} className={styles.stepCard}>
                  <div className={styles.stepPhoto}>
                    <span className={styles.stepPhotoPlaceholder}>Photo</span>
                  </div>
                  <div className={styles.stepBody}>
                    <span className={styles.stepNum}>STEP {step.step}</span>
                    <p className={styles.stepLabel}>{step.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <div className={styles.ctaWrapper}>
        <SectionCtaButton />
      </div>
    </>
  );
}
