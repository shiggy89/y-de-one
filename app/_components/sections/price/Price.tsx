"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Price.module.css";

const LESSON_PRICES = [
  { times: "月1回",  total: "3,300",  perLesson: "2,800", note: null },
  { times: "月2回",  total: "5,900",  perLesson: "2,600", note: null },
  { times: "月3回",  total: "8,300",  perLesson: "2,400", note: null },
  { times: "月4回",  total: "10,100", perLesson: "1,800", note: null },
  { times: "月5回",  total: "12,300", perLesson: "2,200", note: null },
  { times: "月6回",  total: "14,500", perLesson: "2,200", note: null },
  { times: "月7回",  total: "16,700", perLesson: "2,200", note: null },
  { times: "月8回",  total: "18,100", perLesson: "1,400", note: null },
];

export default function Price() {
  return (
    <>
      {/* ━━━ 料金サマリー ━━━ */}
      <section className={styles.summarySection}>
        <div className="inner">
          <Heading2
            className={styles.priceHeading}
            title={
              <>
                大人バレエ教室
                <br className={styles.mobileOnlyBreak} />
                {" "}ワイデワンの初期費用
              </>
            }
            lead="「入会金が高い」「チケットが余って損した」——そんな心配はいりません。ワイデワンは通った分だけ支払うシンプルな料金システムです。"
          />

          <div className={styles.summaryCards}>
            <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
              <Image
                className={styles.summaryIconFloat}
                src="/images/price/nyuukai-icon.png"
                alt="入会金0円のアイコン"
                width={200}
                height={200}
              />
              <p className={styles.summaryLabel}>入会金</p>
              <p className={styles.summaryPrice}>
                <span className={styles.summaryNum}>0</span>円
              </p>
              <p className={styles.summaryNote}>更新料もありません</p>
            </div>

            <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
              <Image
                className={styles.summaryIconFloat}
                src="/images/price/maintenance-icon.png"
                alt="維持費のアイコン"
                width={200}
                height={200}
              />
              <p className={styles.summaryLabel}>維持費</p>
              <p className={styles.summaryPrice}>
                <span className={styles.summaryNum}>500</span>
                <span className={styles.summaryUnit}>円/月</span>
              </p>
              <p className={styles.summaryNote}>月の最初のレッスン時にお支払いください</p>
            </div>

            <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
              <Image
                className={`${styles.summaryIconFloat} ${styles.summaryIconFloatLarge}`}
                src="/images/price/trial-icon.png"
                alt="初回体験のアイコン"
                width={200}
                height={200}
              />
              <p className={styles.summaryLabel}>初回体験</p>
              <p className={styles.summaryPrice}>
                <span className={styles.summaryNum}>3,300</span>円
              </p>
              <p className={styles.summaryNote}>通常レッスン1回分と同じです</p>
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
              <>
                Y-de-ONE | ワイデワン
                <br />
                月謝・レッスン料金一覧
              </>
            }
            lead="通うほど1回あたりのレッスン料金がお得になります。回数は後からいつでも追加できます。"
          />

          <div className={styles.priceGrid}>
            {LESSON_PRICES.map((item) => (
              <div key={item.times} className={styles.priceCard}>
                <p className={styles.priceTimesLabel}>{item.times}</p>
                <p className={styles.priceTotal}>
                  <span className={styles.priceYen}>¥</span>
                  {item.total}
                </p>
                {item.perLesson ? (
                  <p className={styles.perLesson}>
                    {item.times.replace("月", "").replace("回", "")}回目：{item.perLesson}円
                  </p>
                ) : (
                  <p className={styles.perLesson}>&nbsp;</p>
                )}
              </div>
            ))}
            <div className={styles.priceCard}>
              <p className={styles.priceTimesLabel}>月9回目以降ずっと</p>
              <p className={styles.priceTotal}>
                <span className={styles.priceYen}>¥</span>2,000<span className={styles.priceYen}> / 回</span>
              </p>
              <p className={styles.perLesson}>&nbsp;</p>
            </div>
            <div className={styles.priceCardYellow}>
              <p className={styles.priceTimesLabel}>35分レッスン</p>
              <p className={styles.priceTotal}>
                <span className={styles.priceYen}>¥</span>1,100<span className={styles.priceYen}> / 回</span>
              </p>
              <p className={styles.perLesson}>&nbsp;</p>
            </div>
            <div className={styles.priceCardBlue}>
              <p className={styles.priceTimesLabel}>特別レッスン</p>
              <p className={styles.priceTotal}>
                <span className={styles.priceYen}>¥</span>3,000<span className={styles.priceYen}> / 回</span>
              </p>
              <p className={styles.perLesson}>&nbsp;</p>
            </div>
            <div className={styles.priceCardAccent}>
              <p className={styles.priceTimesLabel}>個人レッスン</p>
              <p className={styles.priceTotal}>
                <span className={styles.priceYen}>¥</span>2,500<span className={styles.priceYen}> / 15分</span>
              </p>
              <p className={styles.perLesson}>&nbsp;</p>
            </div>
          </div>
          <SectionCtaButton />
        </div>
      </section>

      {/* ━━━ システム説明 ━━━ */}
      <section className={styles.systemSection}>
        <div className="inner">
          <Heading2
            className={styles.priceHeading}
            title={<>通えば通うほどお得！<br />ワイデワンの都度払いシステム</>}
            lead="チケット制ではないから期限切れもなし。ご自身のペースで安心してバレエを続けられます。"
          />

          <div className={styles.systemCards}>
            <div className={styles.systemCard}>
              <h3 className={styles.systemCardTitle}>通うほど1回あたりが安くなる</h3>
              <Image
                className={styles.systemIcon}
                src="/images/price/discount-icon.png"
                alt="通うほど1回あたりの料金が安くなるイメージのアイコン"
                width={300}
                height={300}
              />
              <p>月に通う回数が増えるほど、1回あたりのレッスン料金がどんどんお得になります。</p>
            </div>
            <div className={styles.systemCard}>
              <h3 className={styles.systemCardTitle}>期限切れで損しない</h3>
              <Image
                className={styles.systemIcon}
                src="/images/price/noexpiry-icon.png"
                alt="期限切れがないイメージのアイコン"
                width={300}
                height={300}
              />
              <p>チケット制ではないので、期限切れでお金が無駄になることがありません。</p>
            </div>
            <div className={styles.systemCard}>
              <h3 className={styles.systemCardTitle}>途中から何回でも追加できる</h3>
              <Image
                className={styles.systemIcon}
                src="/images/price/addlesson-icon.png"
                alt="後から回数追加ができるイメージのアイコン"
                width={300}
                height={300}
              />
              <p>回数は決めなくてOK！通いたいときに通った分だけお支払いください。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ 注意事項 ━━━ */}
      <section className={styles.noteSection}>
        <div className="inner">
          <ul className={styles.noteList}>
            <li>記載金額はすべて税込価格です。お支払いは当月のレッスン受講前までに現金にてお願いします。</li>
            <li>維持費500円は、月の最初のレッスン受講時にお支払いください。</li>
            <li>個人レッスンのキャンセル料金は、2日前まで半額、前日・当日は全額となります。</li>
          </ul>
          <SectionCtaButton />
        </div>
      </section>
    </>
  );
}
