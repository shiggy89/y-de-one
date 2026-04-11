"use strict";

import type { CSSProperties } from "react";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Access.module.css";

export default function Access() {
  const pinIconStyle = {
    "--heading-left-top": "168px",
    "--heading-left-left": "8%",
    "--heading-icon-width": "140px",
    "--heading-left-top-mobile": "260px",
    "--heading-left-left-mobile": "12%",
    "--heading-icon-width-mobile": "60px",
  } as CSSProperties;

  return(
    <section>
      <div className="inner">
        <Heading2
          title={
            <>
              アクセス｜大人バレエ教室
              <br className={styles.mobileOnlyBreak} />
              Y-de-ONEへの行き方
            </>
          }
          lead={
            <>
              Y-de-ONEは、新宿・高田馬場・東中野・落合<br />
              エリアからアクセスしやすい大人バレエ教室です。
            </>
          }
          leftSrc="pin-icon.png"
          leftAlt="ワイデワンの場所を指すピンアイコン"
          leftStyle={pinIconStyle}
          width={194}
          height={249}
        />
        <div className={styles.trialCard}>
          <div className={styles.yDeOneMap}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3239.645284115828!2d139.69241137643562!3d35.71034562837309!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188d35ca815555%3A0x4b7ea70498aadbb1!2z44Ov44Kk44OH44Ov44Oz!5e0!3m2!1sja!2sjp!4v1763296167778!5m2!1sja!2sjp"
              style={{border:0}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div className={styles.accessCardRight}>
            <h3>
              📍Y-de-ONE バレエ教室<br />
              　〒169-0075<br />
              　東京都新宿区高田馬場3-36-6<br />
              　兼子ビル2階
            </h3>
            <div className={styles.accessFlexGrid}>
              <div className={styles.accessBox}><a href="/access#takadanobaba">高田馬場駅からの<br />アクセスを見る <i
                    className="fa-solid fa-arrow-up-right-from-square"></i></a></div>
              <div className={styles.accessBox}><a href="/access#higashinakano">東中野駅からの<br />アクセスを見る <i
                    className="fa-solid fa-arrow-up-right-from-square"></i></a></div>
              <div className={styles.accessBox}><a href="/access#ochiai">落合駅からの<br />アクセスを見る <i
                    className="fa-solid fa-arrow-up-right-from-square"></i></a></div>
              <div className={styles.accessBox}><a href="/access#shinjuku">新宿駅からの<br />アクセスを見る <i
                    className="fa-solid fa-arrow-up-right-from-square"></i></a></div>
            </div>
          </div>
        </div>
        <SectionCtaButton />
      </div>
    </section>
  );
}
