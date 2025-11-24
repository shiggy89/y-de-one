"use strict";

import Image from "next/image";
import Link from "next/link";
import Heading2 from "./Heading2";

export default function Access() {
  return(
    <section>
      <div className="inner inner-access">
        <Heading2
          title="アクセス｜大人バレエ教室 Y-de-ONEへの行き方"
          lead={
            <>
              Y-de-ONEは、新宿・高田馬場・東中野・落合<br />
              エリアからアクセスしやすい大人バレエ教室です。
            </>
          }
          leftClassName="pin-icon heading2-icon-left"
          leftSrc="pin-icon.png"
          leftAlt="ワイデワンの場所を指すピンアイコン"
          width={194}
          height={249}
        />
        <div className="trial-card">
          <div className="y-de-one-map">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3239.645284115828!2d139.69241137643562!3d35.71034562837309!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188d35ca815555%3A0x4b7ea70498aadbb1!2z44Ov44Kk44OH44Ov44Oz!5e0!3m2!1sja!2sjp!4v1763296167778!5m2!1sja!2sjp"
              style={{border:0}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div className="access-card-right">
            <h3>
              📍Y-de-ONE バレエ教室<br />
              　〒169-0075<br />
              　東京都新宿区高田馬場3-36-6<br />
              　兼子ビル2階
            </h3>
            <div className="access-flex-grid">
              <div className="access-box"><a href="#">高田馬場駅からの<br />アクセスを見る <i
                    className="fa-solid fa-arrow-up-right-from-square"></i></a></div>
              <div className="access-box"><a href="#">東中野駅からの<br />アクセスを見る <i
                    className="fa-solid fa-arrow-up-right-from-square"></i></a></div>
              <div className="access-box"><a href="#">落合駅からの<br />アクセスを見る <i
                    className="fa-solid fa-arrow-up-right-from-square"></i></a></div>
              <div className="access-box"><a href="#">新宿駅からの<br />アクセスを見る <i
                    className="fa-solid fa-arrow-up-right-from-square"></i></a></div>
            </div>
          </div>
        </div>
        <div className="center-btn">
          <Link href="https://lin.ee/iz33eCM" className="cta-btn">体験レッスンはこちら <i className="fa-solid fa-arrow-up-right-from-square"></i></Link>
        </div>
      </div>
    </section>
  );
}