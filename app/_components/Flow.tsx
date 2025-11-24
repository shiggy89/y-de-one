"use client";

import Image from "next/image";
import Heading2 from "./Heading2";

export default function Flow() {
  return (
    <section>
      <div className="inner inner-flow">
        <Heading2
          title="初心者歓迎！バレエ体験レッスンの流れと予約方法"
          lead={
            <>
              初めての方でも安心してご参加いただけます。<br />
              まずは体験レッスンから始めましょう。
            </>
          }
          leftClassName="ballet-woman-icon heading2-icon-left"
          leftSrc="ballet-woman2-icon.png"
          leftAlt="女性バレリーナ2のアイコン"
          rightClassName="ballet-woman-icon heading2-icon-right"
          rightSrc="ballet-woman3-icon.png"
          rightAlt="女性バレリーナ3のアイコン"
          width={532}
          height={469}
        />
        <div className="flow-list">
          <div className="flow-item">
            <Image
              className="step1-icon"
              src="/images/step1-icon.png"
              alt="STEP1:予約するを表したアイコン"
              width={340}
              height={272}
            />
            <h3>STEP1<br />予約する</h3>
            <p>お問い合わせフォームまたはお電話でご予約ください。ご希望の日時をお伺いします。</p>
          </div>
          <div className="flow-item">
            <Image
              className="step2-icon"
              src="/images/step2-icon.png"
              alt="STEP2:体験レッスンを受けるを表したアイコン"
              width={324}
              height={317}
            />
            <h3>STEP2<br />体験レッスンを受ける</h3>
            <p>動きやすい服装でお越しください。バレエシューズのレンタルもあります（無料）。</p>
          </div>
          <div className="flow-item">
            <Image
              className="step3-icon"
              src="/images/step3-icon.png"
              alt="STEP3:ご自身のペースでスタートを表したアイコン"
              width={271}
              height={297}
            />
            <h3>STEP3<br />ご自身のペースでスタート</h3>
            <p>体験後、ご納得いただけたら次回以降お好きなレッスンを受講ください。入会制度はありません。</p>
          </div>
          <Image
           className="arrow-pink-left"
           src="/images/arrow-pink.png"
           alt="右向きのピンクの矢印アイコン"
           width={112}
           height={24}
          />
          <Image
           className="arrow-pink-right"
           src="/images/arrow-pink.png"
           alt="右向きのピンクの矢印アイコン"
           width={112}
           height={24}
          />
          <Image
           className="arrow-down-up"
           src="/images/arrow-down.png"
           alt="下向きのピンクの矢印アイコン"
           width={24}
           height={112}
          />
          <Image
           className="arrow-down-down"
           src="/images/arrow-down.png"
           alt="右向きのピンクの矢印アイコン"
           width={24}
           height={112}
          />
        </div>
        <div className="trial-card">
          <Image
            className="studio1-photo"
            src="/images/studio1-photo.jpg"
            alt="ワイデワンバレエスタジオの1枚目の写真"
            width={1200}
            height={667}
          />
          <div className="trial-card-text">
            <h3>
              体験レッスン料金<br />
              <span>¥3,300</span>
            </h3>
            <p>(通常レッスン1回分)</p>
            <ul>
              <li><span className="ok">✓</span>動きやすい服装でOK</li>
              <li><span className="ok">✓</span>バレエシューズ無料レンタル</li>
              <li><span className="ok">✓</span>手ぶらでお越しいただけます</li>
            </ul>
          </div>
        </div>
        <div className="center-btn">
          <a href="https://liff.line.me/2008551653-JRwQxXrB" className="cta-btn">体験レッスンはこちら <i className="fa-solid fa-arrow-up-right-from-square"></i></a>
        </div>
      </div>
    </section>
  );
}