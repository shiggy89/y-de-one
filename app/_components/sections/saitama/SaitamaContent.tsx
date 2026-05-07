import Image from "next/image";
import ContactCtaButton from "../common/ContactCtaButton";
import Heading2 from "../common/Heading2";
import styles from "./SaitamaContent.module.css";

const STUDIOS = [
  {
    id: "omiya",
    name: "大宮スタジオ",
    location: "〒330-0846\n埼玉県さいたま市大宮区大門町3-82-3\n大和（やまと）ビル3F",
    access: "JR大宮駅 東口より徒歩約5分",
    building: "〒330-0846\n埼玉県さいたま市大宮区大門町3-82-3\n大和（やまと）ビル3F",
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
    access: "東武東上線 朝霞駅、JR北朝霞駅より徒歩約1分",
    building: "〒351-0033\n埼玉県朝霞市浜崎1-4-12\n保第二ビル102",
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
    <>
    <section className={styles.section}>
      <div className="inner">
        <Heading2
          title="埼玉エリアバレエクラス"
          lead="大宮・朝霞の2拠点でレッスンを開催しています。バレエ歴1年程度の方を対象とした中級クラスです。楽しみながら技術を磨ける環境をご用意しています。"
        />

        <div className={styles.grid}>
          {STUDIOS.map((s) => (
            <div key={s.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.studioName}>{s.name}</h3>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <i className="fa-solid fa-location-dot" />
                  <span>{s.building.split("\n")[0]}</span>
                </div>
                {s.building.split("\n").slice(1).map((line) => (
                  <div key={line} className={styles.infoRowIndented}>
                    <span>{line}</span>
                  </div>
                ))}
                <div className={styles.infoRow}>
                  <i className="fa-solid fa-train" />
                  <span>{s.access}</span>
                </div>

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
          <p>興味のある方はお気軽にお問い合わせください。</p>
        </div>
        <ContactCtaButton />
      </div>
    </section>

    <section className={styles.instructorSection}>
      <div className="inner">
        <Heading2 title={<>埼玉エリアバレエクラス<br />担当講師：門馬和樹</>} />
        <div className={styles.instructorRow}>
          <div className={styles.instructorPhotoWrap}>
            <Image
              src="/images/saitama/kazuki-profile.jpg"
              alt="門馬和樹"
              width={400}
              height={500}
              className={styles.instructorPhoto}
            />
          </div>
          <div className={styles.instructorInfo}>
            <p className={styles.instructorName}>門馬 和樹</p>
            <p className={styles.instructorKana}>もんま かずき</p>
            <p className={styles.instructorMessage}>
              バレエの基本的なポジションやパの動きに慣れてきた、バレエ経験1年以上を目安に、入門クラスから少し上の応用した動きに挑戦していきます。「楽しみながら無理しすぎず、けれど妥協もし過ぎず」バレエに必要な動きを学んでいきましょう。ブランクのある方や、初心者の方でも興味のある方は大歓迎です！
            </p>
          </div>
        </div>
        <div className={styles.studioPhotos}>
          <Image
            src="/images/saitama/studio-1.jpg"
            alt="スタジオ風景"
            width={800}
            height={600}
            className={styles.studioPhoto}
          />
          <Image
            src="/images/saitama/studio-2.jpg"
            alt="スタジオ風景"
            width={800}
            height={600}
            className={styles.studioPhoto}
          />
        </div>

        <ContactCtaButton />
      </div>
    </section>
    </>
  );
}
