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

type StepStation = {
  id: string;
  station: string;
  line: string;
  time: string;
  steps: { step: number; label: string; photo: string | null }[];
  redirects?: never;
};

type RedirectStation = {
  id: string;
  station: string;
  line?: never;
  time?: never;
  steps?: never;
  redirects: { line: string; instruction: string; targetId?: string; targetLabel?: string; accent?: string }[];
};

type Station = StepStation | RedirectStation;

const STATIONS: Station[] = [
  {
    id: "takadanobaba",
    station: "高田馬場駅",
    line: "JR山手線・西武新宿線・東京メトロ東西線",
    time: "徒歩約12分",
    steps: [
      { step: 1, label: "高田馬場駅 早稲田口を出て左へ", photo: "/images/access/takadanobaba-station-1.jpg" },
      { step: 2, label: "高架下をくぐり、早稲田通りをまっすぐ進む", photo: "/images/access/takadanobaba-station-2.jpg" },
      { step: 3, label: "みずほ銀行を右手にまっすぐ進む", photo: "/images/access/takadanobaba-station-3.jpg" },
      { step: 4, label: "郵便局を左手にまっすぐ進む", photo: "/images/access/takadanobaba-station-4.jpg" },
      { step: 5, label: "オオゼキを右手にまっすぐ進む", photo: "/images/access/takadanobaba-station-5.jpg" },
      { step: 6, label: "そのまままっすぐ進む", photo: "/images/access/takadanobaba-station-6.jpg" },
      { step: 7, label: "さらにまっすぐ進む", photo: "/images/access/takadanobaba-station-7.jpg" },
      { step: 8, label: "セブンイレブンの向かいに「MEIJI」の看板があるビルが見える", photo: "/images/access/takadanobaba-station-8.jpg" },
      { step: 9, label: "「MEIJI」の看板がある兼子ビル2階にY-de-ONE（ワイデワン）があります", photo: "/images/access/ochiai-station-7.JPG" },
      { step: 10, label: "階段から2階にお上りください", photo: "/images/access/ochiai-station-8.JPG" },
    ],
  },
  {
    id: "higashinakano",
    station: "東中野駅",
    line: "JR総武線（STEP4から）・都営大江戸線（STEP1から）",
    time: "徒歩約15分",
    steps: [
      { step: 1, label: "都営大江戸線東中野駅A1出口をでる", photo: "/images/access/higashinakano-station-1.jpg" },
      { step: 2, label: "正面にUFJ銀行が見えたら、右に曲がる", photo: "/images/access/higashinakano-station-2.jpg" },
      { step: 3, label: "ずっと直進（STEP5へ）", photo: "/images/access/higashinakano-station-3.jpg" },
      { step: 4, label: "JR総武線東中野駅東口（改札を出て左に進んだ出口）をでる", photo: "/images/access/higashinakano-station-4.jpg" },
      { step: 5, label: "左カーブの道を道なりずっとまっすぐ進む", photo: "/images/access/higashinakano-station-5.jpg" },
      { step: 6, label: "まいばすけっとを左手に見ながら、そのまま直進します", photo: "/images/access/higashinakano-station-6.jpg" },
      { step: 7, label: "セブンイレブンがある交差点を右に曲がる", photo: "/images/access/higashinakano-station-7.jpg" },
      { step: 8, label: "さらに直進", photo: "/images/access/higashinakano-station-8.jpg" },
      { step: 9, label: "小滝橋五差路を左へ（左に曲がるとフラワーマスダ、セオサイクルがあります）", photo: "/images/access/higashinakano-station-9.jpg" },
      { step: 10, label: "セブンイレブンの向かいに「MEIJI」の看板があるビルが見える", photo: "/images/access/higashinakano-station-10.jpg" },
      { step: 11, label: "「MEIJI」の看板がある兼子ビル2階にY-de-ONE（ワイデワン）があります", photo: "/images/access/higashinakano-station-11.JPG" },
      { step: 12, label: "階段から2階にお上りください", photo: "/images/access/higashinakano-station-12.JPG" },
    ],
  },
  {
    id: "ochiai",
    station: "落合駅",
    line: "東京メトロ東西線",
    time: "徒歩約8分",
    steps: [
      { step: 1, label: "落合駅4番出口をでる", photo: "/images/access/ochiai-station-1.jpg" },
      { step: 2, label: "正面に郵便局が見えたら、左に曲がる", photo: "/images/access/ochiai-station-2.jpg" },
      { step: 3, label: "セブンイレブンがある交差点を直進", photo: "/images/access/ochiai-station-3.jpg" },
      { step: 4, label: "さらに直進", photo: "/images/access/ochiai-station-4.jpg" },
      { step: 5, label: "小滝橋五差路を左へ（左に曲がるとフラワーマスダ、セオサイクルがあります）", photo: "/images/access/ochiai-station-5.jpg" },
      { step: 6, label: "セブンイレブンの向かいに「MEIJI」の看板があるビルが見える", photo: "/images/access/ochiai-station-6.jpg" },
      { step: 7, label: "「MEIJI」の看板がある兼子ビル2階にY-de-ONE（ワイデワン）があります", photo: "/images/access/ochiai-station-7.JPG" },
      { step: 8, label: "階段から2階にお上りください", photo: "/images/access/ochiai-station-8.JPG" },
    ],
  },
  {
    id: "shinjuku",
    station: "新宿駅",
    redirects: [
      { line: "JR山手線・西武新宿線", instruction: "高田馬場駅で下車\n徒歩12分（900m）", targetId: "takadanobaba", targetLabel: "高田馬場駅からのアクセスを見る" },
      { line: "JR総武線", instruction: "東中野駅で下車\n徒歩15分（1km）", targetId: "higashinakano", targetLabel: "東中野駅からのアクセスを見る" },
      { line: "宿02・宿08", instruction: "新宿駅西口バス停から乗車\n小滝橋バス停で下車\n徒歩4分（250m）", accent: "#de4e8c" },
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
            title={<>Y-de-ONE（ワイデワン）<br />へのアクセス</>}
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
                <i className={s.id === "shinjuku-bus" ? "fa-solid fa-bus" : "fa-solid fa-train"}></i>
                {s.station}からのアクセス
              </h2>
              {s.line && <p className={styles.stationMeta}>{s.line}｜{s.time}</p>}
            </div>

            {s.redirects ? (
              <div className={styles.redirectGrid}>
                {s.redirects.map((r) => {
                  const accent = r.accent ?? "#0090e8";
                  const bg = r.accent ? "#fde8f0" : "#e8f4fd";
                  const icon = r.accent ? "fa-solid fa-bus" : "fa-solid fa-train";
                  return (
                    <div key={r.line} className={styles.redirectCard} style={{ background: bg }}>
                      <p className={styles.redirectLine} style={{ color: accent }}>
                        <i className={icon}></i>{r.line}
                      </p>
                      <p className={styles.redirectInstruction} style={{ whiteSpace: "pre-line" }}>{r.instruction}</p>
                      {r.targetId && (
                        <button
                          className={styles.redirectButton}
                          style={{ background: accent }}
                          onClick={() => {
                            setTimeout(() => {
                              document.getElementById(r.targetId!)?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 100);
                          }}
                        >
                          {r.targetLabel}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.stepsGrid}>
                {s.steps.map((step) => (
                  <div key={step.step} className={styles.stepCard}>
                    <div className={styles.stepPhoto}>
                      {step.photo ? (
                        <Image
                          src={step.photo}
                          alt={step.label}
                          width={600}
                          height={400}
                          className={styles.stepPhotoImg}
                        />
                      ) : (
                        <span className={styles.stepPhotoPlaceholder}>Photo</span>
                      )}
                    </div>
                    <div className={styles.stepBody}>
                      <span className={styles.stepNum}>STEP {step.step}</span>
                      <p className={styles.stepLabel}>{step.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      <div className={styles.ctaWrapper}>
        <SectionCtaButton />
      </div>
    </>
  );
}
