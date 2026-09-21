"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Flow.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

export default function Flow({ hideIcons = false, variant, lang = "ja" }: { hideIcons?: boolean; variant?: "modern-ballet"; lang?: Lang }) {
  const t = makeT(lang);
  const balletWomanStyle = {
    "--heading-icon-width": "172px",
  } as CSSProperties;

  return (
    <section>
      <div className={`inner ${styles.innerFlow}`}>
        <Heading2
          className={styles.flowHeading}
          title={
            variant === "modern-ballet" ? (
              <>
                {t(<>初心者歓迎！モダンバレエ体験
                <br className={styles.mobileOnlyBreak} />
                レッスンの流れと予約方法</>, <>Beginners welcome! Modern ballet{" "}
                <br className={styles.mobileOnlyBreak} />
                trial lesson: how it works and how to book</>)}
              </>
            ) : (
              <>
                {t(<>初心者歓迎！バレエ体験
                <br className={styles.mobileOnlyBreak} />
                レッスンの流れと予約方法</>, <>Beginners welcome! Ballet{" "}
                <br className={styles.mobileOnlyBreak} />
                trial lesson: how it works and how to book</>)}
              </>
            )
          }
          lead={
            t(<>
              初めての方でも安心してご参加いただけます。<br />
              まずは体験レッスンから始めましょう。
            </>, <>
              First-timers are very welcome.<br />
              Start with a trial lesson.
            </>)
          }
          {...(variant === "modern-ballet" && {
            leftSrc: "/images/modern-ballet/dog-jump-icon.png",
            leftStyle: { "--heading-left-left": "5%", "--heading-left-left-mobile": "50%" } as CSSProperties,
            width: 400,
            height: 400,
          })}
          {...(!hideIcons && {
            leftSrc: "ballet-woman2-icon.png",
            leftAlt: t("女性バレリーナ2のアイコン", "Ballerina illustration") as string,
            leftStyle: balletWomanStyle,
            rightSrc: "ballet-woman3-icon.png",
            rightAlt: t("女性バレリーナ3のアイコン", "Ballerina illustration") as string,
            rightStyle: balletWomanStyle,
            width: 532,
            height: 469,
          })}
        />
        <div className={styles.flowList}>
          <div className={styles.flowItem}>
            <div className={styles.iconWrapper}>
              <Image
                className={styles.step1Icon}
                src="/images/home/step1-1-icon.png"
                alt={t("STEP1:予約するを表したアイコン", "Step 1: book") as string}
                width={340}
                height={272}
              />
            </div>
            <h3>{t(<>STEP1<br />LINEで予約する</>, <>STEP 1<br />Book through LINE</>)}</h3>
            <p>
              {t("LINEの友だち追加をしていただき、体験レッスン申込みフォームよりご希望の日時をお送りください。",
                <>LINE is the messaging app used across Japan. Add the school as a friend, then send your preferred date and time with the trial lesson form.{" "}
                  <a href="/#about-line">What is LINE?</a></>)}
            </p>
          </div>
          <div className={styles.flowItem}>
            <div className={styles.iconWrapper}>
              <Image
                className={styles.step2Icon}
                src="/images/home/step2-icon.png"
                alt={t("STEP2:体験レッスンを受けるを表したアイコン", "Step 2: take the trial lesson") as string}
                width={324}
                height={317}
              />
            </div>
            <h3>{t(<>STEP2<br />体験レッスンを受ける</>, <>STEP 2<br />Take the trial lesson</>)}</h3>
            <p>{t("動きやすい服装でお越しください。バレエシューズのレンタルもあります（無料）。", "Come in clothes you can move in. Ballet shoes are available to borrow for free.")}</p>
          </div>
          <div className={styles.flowItem}>
            <div className={styles.iconWrapper}>
              <Image
                className={styles.step3Icon}
                src="/images/home/step3-icon.png"
                alt={t("STEP3:ご自身のペースでスタートを表したアイコン", "Step 3: start at your own pace") as string}
                width={271}
                height={297}
              />
            </div>
            <h3>{t(<>STEP3<br />ご自身のペースでスタート</>, <>STEP 3<br />Start at your own pace</>)}</h3>
            <p>{t("体験後、ご納得いただけたら次回以降お好きなレッスンを受講ください。入会制度はありません。", "If you like it, just join any lesson you like next time. There is no membership to sign up for.")}</p>
          </div>
          <Image
           className={styles.arrowPinkLeft}
           src="/images/home/arrow-pink.png"
           alt=""
           width={112}
           height={24}
          />
          <Image
           className={styles.arrowPinkRight}
           src="/images/home/arrow-pink.png"
           alt=""
           width={112}
           height={24}
          />
          <Image
           className={styles.arrowDownUp}
           src="/images/home/arrow-down.png"
           alt=""
           width={24}
           height={112}
          />
          <Image
           className={styles.arrowDownDown}
           src="/images/home/arrow-down.png"
           alt=""
           width={24}
           height={112}
          />
        </div>
        <div className={styles.trialCard}>
          <Image
            className={styles.studio1Photo}
            src="/images/home/studio1-photo.jpg"
            alt={t("ワイデワンバレエスタジオの1枚目の写真", "The Y-de-ONE studio") as string}
            width={1200}
            height={667}
          />
          <div className={styles.trialCardText}>
            <h3>
              {t(<>体験レッスン料金<br />
              <span>¥3,500</span></>, <>Trial lesson fee<br />
              <span>¥3,500</span></>)}
            </h3>
            <p>{t("(通常レッスン1回分)", "(the price of one regular lesson)")}</p>
            <ul>
              <li><span className={styles.ok}>✓</span>{t("動きやすい服装でOK", "Wear anything you can move in")}</li>
              <li><span className={styles.ok}>✓</span>{t("バレエシューズ無料レンタル", "Free ballet shoe rental")}</li>
              <li><span className={styles.ok}>✓</span>{t("手ぶらでお越しいただけます", "Just bring yourself")}</li>
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
        {variant === "modern-ballet" && (
          <div className={styles.priceLink}>
            <Link href={localePath(lang, "/price")}>{t("レッスン料金はこちら →", "See lesson prices →")}</Link>
          </div>
        )}
        <SectionCtaButton lang={lang} />
      </div>
    </section>
  );
}
