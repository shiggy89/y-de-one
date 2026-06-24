import Image from "next/image";
import Link from "next/link";
import ContactCtaButton from "../common/ContactCtaButton";
import Heading2 from "../common/Heading2";
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
  { label: "場所", value: "新宿区内コミュニティセンター\n（主に戸塚コミュニティセンター）\n※8月はY-de-ONE バレエ教室" },
  { label: "料金", value: "1,000円 / 回（当事者のみ）\n1,500円 / 回（保護者と一緒）" },
  { label: "内容", value: "ストレッチ・リズム運動・バレエ/コンテンポラリーの簡易動作" },
];

const INSTRUCTORS = [
  {
    id: "yoshiki",
    name: "青山 佳樹",
    kana: "あおやま よしき",
    photo: "/images/instructor/yoshiki-profile-1.jpg",
    href: "/instructor#yoshiki",
    objectPosition: "center",
  },
  {
    id: "kazuki",
    name: "門馬 和樹",
    kana: "もんま かずき",
    photo: "/images/instructor/kazuki-profile-1.jpg",
    href: "/instructor#kazuki",
    objectPosition: "center",
  },
  {
    id: "makoto",
    name: "松井 眞琴",
    kana: "まつい まこと",
    photo: "/images/instructor/makoto-profile-1.jpg",
    href: "/instructor#makoto",
    objectPosition: "top",
  },
];

const ACTIVITY_PHOTOS = [
  { src: "/images/down-syndrome/activity-1.jpg", alt: "クラスの様子1" },
  { src: "/images/down-syndrome/activity-2.jpg", alt: "クラスの様子2" },
  { src: "/images/down-syndrome/activity-3.jpg", alt: "クラスの様子3" },
];

export default function DownSyndromeContent() {
  return (
    <>
      <section className={styles.photoStrip}>
        <div className="inner">
          <div className={styles.photoGrid}>
            {ACTIVITY_PHOTOS.map((p) => (
              <div key={p.src} className={styles.photoItem}>
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  className={styles.photoImg}
                  sizes="(max-width: 576px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="inner">
          <Heading2
            title="ダウン症の方向けダンスクラス"
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
          <Heading2 title="クラス詳細" lead="ダウン症の方向けダンスクラスの詳細です。" />
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
            <p>下記よりお気軽にお問い合わせください。</p>
          </div>

          <ContactCtaButton />
          <p className={styles.grantNote}>※本事業は、新宿区障害者福祉活動助成金の助成を受けて実施しています。</p>
        </div>
      </section>

      <section className={styles.instructorSection}>
        <div className="inner">
          <Heading2 title="担当講師" lead={<>ダウン症の方向けダンスクラスの<br className={styles.mobileBr} />担当講師を紹介します。</>} />
          <div className={styles.instructorGrid}>
            {INSTRUCTORS.map((inst) => (
              <div key={inst.id} className={styles.instructorCard}>
                <Image
                  src={inst.photo}
                  alt={inst.name}
                  width={300}
                  height={380}
                  className={styles.instructorPhoto}
                  style={{ objectPosition: inst.objectPosition }}
                />
                <p className={styles.instructorName}>{inst.name}</p>
                <p className={styles.instructorKana}>{inst.kana}</p>
                <Link href={inst.href} className={styles.instructorLink}>
                  プロフィール詳細はこちら <i className="fa-solid fa-arrow-right" />
                </Link>
              </div>
            ))}
          </div>
          <ContactCtaButton />
        </div>
      </section>
    </>
  );
}
