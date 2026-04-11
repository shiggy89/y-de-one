"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Flow.module.css";

export default function Flow() {
  const balletWomanStyle = {
    "--heading-icon-width": "172px",
  } as CSSProperties;

  return (
    <section>
      <div className={`inner ${styles.innerFlow}`}>
        <Heading2
          className={styles.flowHeading}
          title={
            <>
              初心者歓迎！バレエ体験
              <br className={styles.mobileOnlyBreak} />
              レッスンの流れと予約方法
            </>
          }
          lead={
            <>
              初めての方でも安心してご参加いただけます。<br />
              まずは体験レッスンから始めましょう。
            </>
          }
          leftSrc="ballet-woman2-icon.png"
          leftAlt="女性バレリーナ2のアイコン"
          leftStyle={balletWomanStyle}
          rightSrc="ballet-woman3-icon.png"
          rightAlt="女性バレリーナ3のアイコン"
          rightStyle={balletWomanStyle}
          width={532}
          height={469}
        />
        <div className={styles.flowList}>
          <div className={styles.flowItem}>
            <div className={styles.iconWrapper}>
              <Image
                className={styles.step1Icon}
                src="/images/home/step1-1-icon.png"
                alt="STEP1:予約するを表したアイコン"
                width={340}
                height={272}
              />
            </div>
            <h3>STEP1<br />LINEで予約する</h3>
            <p>LINEの友だち追加をしていただき、体験レッスン申込みフォームよりご希望の日時をお送りください。</p>
          </div>
          <div className={styles.flowItem}>
            <div className={styles.iconWrapper}>
              <Image
                className={styles.step2Icon}
                src="/images/home/step2-icon.png"
                alt="STEP2:体験レッスンを受けるを表したアイコン"
                width={324}
                height={317}
              />
            </div>
            <h3>STEP2<br />体験レッスンを受ける</h3>
            <p>動きやすい服装でお越しください。バレエシューズのレンタルもあります（無料）。</p>
          </div>
          <div className={styles.flowItem}>
            <div className={styles.iconWrapper}>
              <Image
                className={styles.step3Icon}
                src="/images/home/step3-icon.png"
                alt="STEP3:ご自身のペースでスタートを表したアイコン"
                width={271}
                height={297}
              />
            </div>
            <h3>STEP3<br />ご自身のペースでスタート</h3>
            <p>体験後、ご納得いただけたら次回以降お好きなレッスンを受講ください。入会制度はありません。</p>
          </div>
          <Image
           className={styles.arrowPinkLeft}
           src="/images/home/arrow-pink.png"
           alt="右向きのピンクの矢印アイコン"
           width={112}
           height={24}
          />
          <Image
           className={styles.arrowPinkRight}
           src="/images/home/arrow-pink.png"
           alt="右向きのピンクの矢印アイコン"
           width={112}
           height={24}
          />
          <Image
           className={styles.arrowDownUp}
           src="/images/home/arrow-down.png"
           alt="下向きのピンクの矢印アイコン"
           width={24}
           height={112}
          />
          <Image
           className={styles.arrowDownDown}
           src="/images/home/arrow-down.png"
           alt="右向きのピンクの矢印アイコン"
           width={24}
           height={112}
          />
        </div>
        <div className={styles.trialCard}>
          <Image
            className={styles.studio1Photo}
            src="/images/home/studio1-photo.jpg"
            alt="ワイデワンバレエスタジオの1枚目の写真"
            width={1200}
            height={667}
          />
          <div className={styles.trialCardText}>
            <h3>
              体験レッスン料金<br />
              <span>¥3,300</span>
            </h3>
            <p>(通常レッスン1回分)</p>
            <ul>
              <li><span className={styles.ok}>✓</span>動きやすい服装でOK</li>
              <li><span className={styles.ok}>✓</span>バレエシューズ無料レンタル</li>
              <li><span className={styles.ok}>✓</span>手ぶらでお越しいただけます</li>
            </ul>
          </div>
        </div>
        {/* <div className="center-btn">
          <a href="https://lin.ee/iz33eCM" className="cta-btn">体験レッスンはこちら <i className="fa-solid fa-arrow-up-right-from-square"></i></a>
          <span className="line-add-text">
            <i className="fa-brands fa-line"></i>
            友だち追加をして体験レッスンにお申込み下さい
          </span>
        </div> */}
        <SectionCtaButton />
      </div>
    </section>
  );
}
