"use strict";

import type { CSSProperties } from "react";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Access.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

export default function Access({ variant, lang = "ja" }: { variant?: "modern-ballet"; lang?: Lang }) {
  const t = makeT(lang);
  const isModernBallet = variant === "modern-ballet";

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
            isModernBallet ? (
              t(<>
                アクセス｜モダンバレエ教室
                <br className={styles.mobileOnlyBreak} />
                Y-de-ONEへの行き方
              </>, <>
                Access | Modern ballet school{" "}
                <br className={styles.mobileOnlyBreak} />
                How to get to Y-de-ONE
              </>)
            ) : (
              t(<>
                アクセス｜大人バレエ教室
                <br className={styles.mobileOnlyBreak} />
                Y-de-ONEへの行き方
              </>, <>
                Access | Adult ballet school{" "}
                <br className={styles.mobileOnlyBreak} />
                How to get to Y-de-ONE
              </>)
            )
          }
          lead={
            isModernBallet ? (
              t(<>
                Y-de-ONEは、新宿・高田馬場・東中野・落合<br />
                エリアからアクセスしやすいモダンバレエ教室です。
              </>, <>
                A modern ballet school that is easy to reach<br />
                from Shinjuku, Takadanobaba, Higashi-Nakano and Ochiai.
              </>)
            ) : (
              t(<>
                Y-de-ONEは、新宿・高田馬場・東中野・落合<br />
                エリアからアクセスしやすい大人バレエ教室です。
              </>, <>
                An adult ballet school that is easy to reach<br />
                from Shinjuku, Takadanobaba, Higashi-Nakano and Ochiai.
              </>)
            )
          }
          leftSrc="pin-icon.png"
          leftAlt={t("ワイデワンの場所を指すピンアイコン", "Map pin icon") as string}
          leftStyle={pinIconStyle}
          width={194}
          height={249}
          {...(isModernBallet && {
            rightSrc: "/images/modern-ballet/dog-walk-icon.png",
            rightAlt: "",
            rightWidth: 400,
            rightHeight: 400,
          })}
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
              📍{isModernBallet ? t("Y-de-ONE モダンバレエ教室", "Y-de-ONE Modern Ballet School") : t("Y-de-ONE バレエ教室", "Y-de-ONE Ballet School")}<br />
              {t(<>　〒169-0075<br />
              　東京都新宿区高田馬場3-36-6<br />
              　兼子ビル2階</>, <>Kaneko Bldg. 2F, 3-36-6 Takadanobaba,<br />
              Shinjuku-ku, Tokyo 169-0075</>)}
            </h3>
            <div className={styles.accessFlexGrid}>
              {[
                ["#takadanobaba", t("高田馬場駅からの", "Takadanobaba"), "Station"],
                ["#higashinakano", t("東中野駅からの", "Higashi-Nakano"), "Station"],
                ["#ochiai", t("落合駅からの", "Ochiai"), "Station"],
                ["#shinjuku", t("新宿駅からの", "Shinjuku"), "Station"],
              ].map(([hash, label]) => (
                <div key={hash as string} className={`${styles.accessBox}${isModernBallet ? ` ${styles.accessBoxModernBallet}` : ""}`}>
                  <a href={localePath(lang, `/access${hash}`)}>{label}<br />{t("アクセスを見る", "Directions")} <i className="fa-solid fa-arrow-up-right-from-square"></i></a>
                </div>
              ))}
            </div>
          </div>
        </div>
        {!isModernBallet && <SectionCtaButton lang={lang} />}
      </div>
    </section>
  );
}
