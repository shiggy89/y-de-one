import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./DownSyndromeContent.module.css";

const FEATURES = [
  {
    icon: "fa-solid fa-users",
    title: "少人数制（定員8名）",
    desc: "1クラス最大8名の少人数で、一人ひとりに寄り添った丁寧な指導を行います。",
  },
  {
    icon: "fa-solid fa-eye",
    title: "視覚的なわかりやすい説明",
    desc: "動きをゆっくり見せながら説明します。言葉だけでなく、見て理解できるよう工夫しています。",
  },
  {
    icon: "fa-solid fa-heart",
    title: "評価なし・競争なし",
    desc: "できた！という達成感を大切にします。比較や評価はなく、それぞれのペースで楽しめます。",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "安全第一の環境",
    desc: "転倒防止・適切な休憩など、安全を最優先にしたプログラム設計です。保護者の参加も歓迎します。",
  },
];

const CLASS_INFO = [
  { label: "対象", value: "ダウン症のある方（年齢問わず）" },
  { label: "定員", value: "8名（少人数制）" },
  { label: "日時", value: "月2回・火曜日 16:00〜17:00（60分）" },
  { label: "場所", value: "新宿区内コミュニティセンター\n（主に戸塚コミュニティセンター）" },
  { label: "料金", value: "1,000円〜1,500円 / 回\n（保護者参加の場合：1,500円）" },
  { label: "内容", value: "ストレッチ・リズム運動・バレエ/コンテンポラリーの簡易動作" },
];

export default function DownSyndromeContent() {
  return (
    <>
      <section className={styles.section}>
        <div className="inner">
          <Heading2
            title={<>ダウン症のある方のための<br />ダンスクラス</>}
            lead="音楽と身体表現を安全な環境で楽しむことを目的としたクラスです。身体機能の向上・自己肯定感・社会参加の機会を広げることを目指しています。"
          />

          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <i className={f.icon} />
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.infoSection}>
        <div className="inner">
          <Heading2
            title="クラス詳細"
          />
          <div className={styles.infoTable}>
            {CLASS_INFO.map((item) => (
              <div key={item.label} className={styles.infoRow}>
                <dt className={styles.infoLabel}>{item.label}</dt>
                <dd className={styles.infoValue} style={{ whiteSpace: "pre-line" }}>{item.value}</dd>
              </div>
            ))}
          </div>

          <div className={styles.noteBox}>
            <i className="fa-solid fa-circle-info" />
            <p>
              体験参加を随時受け付けています。お気軽にLINEよりお問い合わせください。
            </p>
          </div>

          <SectionCtaButton />
        </div>
      </section>
    </>
  );
}
