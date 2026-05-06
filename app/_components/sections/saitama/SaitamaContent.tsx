import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./SaitamaContent.module.css";

const STUDIOS = [
  {
    id: "omiya",
    name: "大宮スタジオ",
    location: "埼玉県さいたま市大宮区",
    access: "JR大宮駅 東口より徒歩約5分",
    building: "大和ビル 3F",
    teacher: "門馬和樹",
    schedule: [
      { day: "月曜日", time: "11:15〜12:30" },
    ],
    price: [
      { label: "月謝（4回）", amount: "8,800円" },
      { label: "都度払い（1回）", amount: "2,600円" },
      { label: "施設費", amount: "500円 / 月" },
    ],
  },
  {
    id: "asaka",
    name: "朝霞スタジオ",
    location: "埼玉県朝霞市",
    access: "東武東上線 朝霞駅より徒歩約1分",
    building: "キューズビル",
    teacher: "",
    schedule: [
      { day: "日曜日（隔週）", time: "12:45〜14:10" },
    ],
    price: [
      { label: "月謝（2回）", amount: "6,000円" },
      { label: "都度払い（1回）", amount: "3,500円" },
    ],
  },
];

export default function SaitamaContent() {
  return (
    <section className={styles.section}>
      <div className="inner">
        <Heading2
          title={<>埼玉エリアの<br />バレエクラスご案内</>}
          lead="大宮・朝霞の2拠点でレッスンを開催しています。バレエ歴1年程度の方を対象とした中級クラスです。楽しみながら技術を磨ける環境をご用意しています。"
        />

        <div className={styles.grid}>
          {STUDIOS.map((s) => (
            <div key={s.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.studioName}>{s.name}</h3>
                <p className={styles.location}>
                  <i className="fa-solid fa-location-dot" />
                  {s.location}
                </p>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <i className="fa-solid fa-building" />
                  <span>{s.building}</span>
                </div>
                <div className={styles.infoRow}>
                  <i className="fa-solid fa-train" />
                  <span>{s.access}</span>
                </div>
                {s.teacher && (
                  <div className={styles.infoRow}>
                    <i className="fa-solid fa-user" />
                    <span>担当：{s.teacher}</span>
                  </div>
                )}

                <div className={styles.subSection}>
                  <p className={styles.subTitle}>
                    <i className="fa-solid fa-calendar" />
                    スケジュール
                  </p>
                  {s.schedule.map((sc) => (
                    <div key={sc.day} className={styles.scheduleRow}>
                      <span className={styles.day}>{sc.day}</span>
                      <span className={styles.time}>{sc.time}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.subSection}>
                  <p className={styles.subTitle}>
                    <i className="fa-solid fa-yen-sign" />
                    料金
                  </p>
                  <ul className={styles.priceList}>
                    {s.price.map((p) => (
                      <li key={p.label} className={styles.priceItem}>
                        <span className={styles.priceLabel}>{p.label}</span>
                        <span className={styles.priceAmount}>{p.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.note}>
          <i className="fa-solid fa-circle-info" />
          <p>入会金不要。体験レッスンも随時受付中です。</p>
        </div>

        <SectionCtaButton />
      </div>
    </section>
  );
}
