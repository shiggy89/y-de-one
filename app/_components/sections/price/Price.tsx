"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Price.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

const LESSON_PRICES = [
  { times: "月1回", timesEn: "1 lesson",  total: "3,500",  perLesson: "3,000", note: null },
  { times: "月2回", timesEn: "2 lessons",  total: "6,300",  perLesson: "2,800", note: null },
  { times: "月3回", timesEn: "3 lessons",  total: "8,900",  perLesson: "2,600", note: null },
  { times: "月4回", timesEn: "4 lessons",  total: "11,300", perLesson: "2,400", note: null },
  { times: "月5回", timesEn: "5 lessons",  total: "13,700", perLesson: "2,400", note: null },
  { times: "月6回", timesEn: "6 lessons",  total: "16,100", perLesson: "2,400", note: null },
  { times: "月7回", timesEn: "7 lessons",  total: "18,500", perLesson: "2,400", note: null },
  { times: "月8回", timesEn: "8 lessons",  total: "20,900", perLesson: "2,400", note: null },
];

export default function Price({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  return (
    <>
      {/* ━━━ 料金サマリー ━━━ */}
      <section className={styles.summarySection}>
        <div className="inner">
          <Heading2
            className={styles.priceHeading}
            title={
              t(<>
                大人バレエ教室
                <br className={styles.mobileOnlyBreak} />
                {" "}ワイデワンの初期費用
              </>, <>
                Starting costs at Y-de-ONE
                <br className={styles.mobileOnlyBreak} />
                {" "}adult ballet school
              </>)
            }
            lead={t("「入会金が高い」「チケットが余って損した」——そんな心配はいりません。ワイデワンは通った分だけ支払うシンプルな料金システムです。", "No expensive joining fee, and no unused tickets going to waste. At Y-de-ONE you simply pay for the lessons you attend.")}
          />

          <div className={styles.summaryCards}>
            <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
              <Image
                className={styles.summaryIconFloat}
                src="/images/price/nyuukai-icon.png"
                alt={t("入会金0円のアイコン", "No joining fee icon") as string}
                width={200}
                height={200}
              />
              <p className={styles.summaryLabel}>{t("入会金", "Joining fee")}</p>
              <p className={styles.summaryPrice}>
                <span className={styles.summaryNum}>0</span>{t("円", " yen")}
              </p>
              <p className={styles.summaryNote}>{t("更新料もありません", "No renewal fee either")}</p>
            </div>

            <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
              <Image
                className={styles.summaryIconFloat}
                src="/images/price/maintenance-icon.png"
                alt={t("維持費のアイコン", "Studio fee icon") as string}
                width={200}
                height={200}
              />
              <p className={styles.summaryLabel}>{t("維持費", "Studio fee")}</p>
              <p className={styles.summaryPrice}>
                <span className={styles.summaryNum}>500</span>
                <span className={styles.summaryUnit}>{t("円/月", " yen/month")}</span>
              </p>
              <p className={styles.summaryNote}>{t("月の最初のレッスン時にお支払いください", "Paid at your first lesson of the month")}</p>
            </div>

            <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
              <Image
                className={`${styles.summaryIconFloat} ${styles.summaryIconFloatLarge}`}
                src="/images/price/trial-icon.png"
                alt={t("初回体験のアイコン", "Trial lesson icon") as string}
                width={200}
                height={200}
              />
              <p className={styles.summaryLabel}>{t("初回体験", "Trial lesson")}</p>
              <p className={styles.summaryPrice}>
                <span className={styles.summaryNum}>3,500</span>{t("円", " yen")}
              </p>
              <p className={styles.summaryNote}>{t("通常レッスン1回分と同じです", "Same as one regular lesson")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ レッスン料金テーブル ━━━ */}
      <section className={styles.lessonSection}>
        <div className="inner">
          <Heading2
            className={styles.priceHeading}
            title={
              t(<>
                Y-de-ONE | ワイデワン
                <br />
                月謝・レッスン料金一覧
              </>, <>
                Y-de-ONE
                <br />
                Lesson prices
              </>)
            }
            lead={t("通うほど1回あたりのレッスン料金がお得になります。回数は後からいつでも追加できます。", "The more you come, the less each lesson costs. You can add more lessons at any time.")}
          />

          <div className={styles.priceGrid}>
            {LESSON_PRICES.map((item) => (
              <div key={item.times} className={styles.priceCard}>
                <p className={styles.priceTimesLabel}>{t(item.times, item.timesEn)}</p>
                <p className={styles.priceTotal}>
                  <span className={styles.priceYen}>¥</span>
                  {item.total}
                </p>
                {item.perLesson ? (
                  <p className={styles.perLesson}>
                    {t(<>{item.times.replace("月", "").replace("回", "")}回目：{item.perLesson}円</>,
                      <>Lesson {item.times.replace("月", "").replace("回", "")}: ¥{item.perLesson}</>)}
                  </p>
                ) : (
                  <p className={styles.perLesson}>&nbsp;</p>
                )}
              </div>
            ))}
            <div className={styles.priceCard}>
              <p className={styles.priceTimesLabel}>{t("月9回目以降ずっと", "9th lesson onward")}</p>
              <p className={styles.priceTotal}>
                <span className={styles.priceYen}>¥</span>2,200<span className={styles.priceYen}>{t(" / 回", " / lesson")}</span>
              </p>
              <p className={styles.perLesson}>&nbsp;</p>
            </div>
            <div className={styles.priceCardYellow}>
              <p className={styles.priceTimesLabel}>{t("35分レッスン", "35-minute lesson")}</p>
              <p className={styles.priceTotal}>
                <span className={styles.priceYen}>¥</span>1,200<span className={styles.priceYen}>{t(" / 回", " / lesson")}</span>
              </p>
              <p className={styles.perLesson}>&nbsp;</p>
            </div>
            <div className={styles.priceCardBlue}>
              <p className={styles.priceTimesLabel}>{t("特別レッスン", "Special lesson")}</p>
              <p className={styles.priceTotal}>
                <span className={styles.priceYen}>¥</span>3,000<span className={styles.priceYen}>{t(" / 回", " / lesson")}</span>
              </p>
              <p className={styles.perLesson}>&nbsp;</p>
            </div>
            <div className={styles.priceCardAccent}>
              <p className={styles.priceTimesLabel}>{t("個人レッスン", "Private lesson")}</p>
              <p className={styles.priceTotal}>
                <span className={styles.priceYen}>¥</span>2,500<span className={styles.priceYen}>{t(" / 15分", " / 15 min")}</span>
              </p>
              <p className={styles.perLesson}>&nbsp;</p>
            </div>
          </div>
          <SectionCtaButton lang={lang} />
        </div>
      </section>

      {/* ━━━ システム説明 ━━━ */}
      <section className={styles.systemSection}>
        <div className="inner">
          <Heading2
            className={styles.priceHeading}
            title={t(<>通えば通うほどお得！<br />ワイデワンの都度払いシステム</>, <>The more you come, the more you save!<br />Our pay-as-you-go system</>)}
            lead={t("チケット制ではないから期限切れもなし。ご自身のペースで安心してバレエを続けられます。", "There are no tickets, so nothing expires. Keep dancing at your own pace, with peace of mind.")}
          />

          <div className={styles.systemCards}>
            <div className={styles.systemCard}>
              <h3 className={styles.systemCardTitle}>{t("通うほど1回あたりが安くなる", "Each lesson gets cheaper")}</h3>
              <Image
                className={styles.systemIcon}
                src="/images/price/discount-icon.png"
                alt={t("通うほど1回あたりの料金が安くなるイメージのアイコン", "Price per lesson goes down") as string}
                width={300}
                height={300}
              />
              <p>{t("月に通う回数が増えるほど、1回あたりのレッスン料金がどんどんお得になります。", "The more lessons you take in a month, the cheaper each one becomes.")}</p>
            </div>
            <div className={styles.systemCard}>
              <h3 className={styles.systemCardTitle}>{t("期限切れで損しない", "Nothing expires")}</h3>
              <Image
                className={styles.systemIcon}
                src="/images/price/noexpiry-icon.png"
                alt={t("期限切れがないイメージのアイコン", "No expiry") as string}
                width={300}
                height={300}
              />
              <p>{t("チケット制ではないので、期限切れでお金が無駄になることがありません。", "There are no tickets, so you never lose money to an expiry date.")}</p>
            </div>
            <div className={styles.systemCard}>
              <h3 className={styles.systemCardTitle}>{t("途中から何回でも追加できる", "Add lessons whenever you like")}</h3>
              <Image
                className={styles.systemIcon}
                src="/images/price/addlesson-icon.png"
                alt={t("後から回数追加ができるイメージのアイコン", "Add lessons later") as string}
                width={300}
                height={300}
              />
              <p>{t("回数は決めなくてOK！通いたいときに通った分だけお支払いください。", "No need to decide a number in advance. Come when you want and pay only for the lessons you attend.")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ 注意事項 ━━━ */}
      <section className={styles.noteSection}>
        <div className="inner">
          <ul className={styles.noteList}>
            <li>{t("記載金額はすべて税込価格です。お支払いは当月のレッスン受講前までに現金にてお願いします。", "All prices include tax. Please pay in cash before you take the month's lessons.")}</li>
            <li>{t("維持費500円は、月の最初のレッスン受講時にお支払いください。", "The ¥500 studio fee is paid at your first lesson of the month.")}</li>
            <li>{t("個人レッスンのキャンセル料金は、2日前まで半額、前日・当日は全額となります。", "Private lesson cancellation fees: half the price up to 2 days before, and the full price the day before or on the day.")}</li>
          </ul>
          <SectionCtaButton lang={lang} />
        </div>
      </section>
    </>
  );
}
