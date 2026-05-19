"use client";

import Image from "next/image";
import { useState } from "react";
import type { CSSProperties } from "react";
import Heading2 from "../common/Heading2";
import ContactCtaButton from "../common/ContactCtaButton";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Instructor.module.css";

const YOSHIKI_PHOTOS = [1, 2, 3, 4].map(
  (n) => `/images/instructor/yoshiki-profile-${n}.jpg`
);

type PhotoItem = string | { src: string; style?: CSSProperties };

function PhotoCarousel({ photos }: { photos: PhotoItem[] }) {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const prev = () => setCurrent((c) => (c - 1 + photos.length) % photos.length);
  const next = () => setCurrent((c) => (c + 1) % photos.length);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    setTouchStart(null);
  };

  const currentPhoto = photos[current];
  const src = typeof currentPhoto === "string" ? currentPhoto : currentPhoto.src;
  const photoStyle = typeof currentPhoto === "object" ? currentPhoto.style : undefined;

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselMain}>
        <button className={`${styles.carouselBtn} ${styles.carouselBtnPrev}`} onClick={prev}>‹</button>
        <div
          className={styles.carouselTrack}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={src}
            alt={`写真${current + 1}`}
            width={800}
            height={1000}
            className={styles.carouselPhoto}
            style={photoStyle}
          />
        </div>
        <button className={`${styles.carouselBtn} ${styles.carouselBtnNext}`} onClick={next}>›</button>
      </div>
      <div className={styles.carouselDots}>
        {photos.map((_, i) => (
          <button
            key={i}
            className={`${styles.carouselDot} ${i === current ? styles.carouselDotActive : ""}`}
            onClick={() => setCurrent(i)}
            aria-label={`写真${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ icon, alt, label }: { icon: string; alt: string; label: string }) {
  return (
    <div className={styles.sectionHeading}>
      <Image
        className={styles.sectionIcon}
        src={`/images/instructor/${icon}`}
        alt={alt}
        width={48}
        height={48}
      />
      <h4 className={styles.sectionLabel}>{label}</h4>
    </div>
  );
}

const YOSHIKI_VIDEOS = [
  "K01vqxDqEaQ",
  "p5fbRxoFQXI",
  "65KQsHLHDxk",
  "JxYFitBteLQ",
];

const KAZUKI_VIDEOS = [
  "HkQIl3LrAmo",
  "YJQn6xxCzCU",
  "Q6Qw6knwDkQ",
  "HrTU1bFWo_w",
];

const KAZUKI_PHOTOS = [1, 2, 3, 4].map(
  (n) => `/images/instructor/kazuki-profile-${n}.jpg`
);

const MAKOTO_PHOTOS = [1, 2, 3].map(
  (n) => `/images/instructor/makoto-profile-${n}.jpg`
);

const KARIN_PHOTOS: PhotoItem[] = [
  "/images/instructor/karin-profile-1.jpg",
  { src: "/images/instructor/karin-profile-2.jpg", style: { width: "auto", maxHeight: "340px", margin: "0 auto" } },
];

const KARIN_OPERA = [
  "『椿姫』 フローラ　池袋サンシャイン劇場",
  "『カルメンシータ』 メルセデウス役　都市センターホール",
  "『カルメン』 マヌエリータ役　大宮ソニックシティ大ホール",
];

const KARIN_MUSICAL = [
  "劇団東小『鶴の恩返し』 つる役　全国ツアー",
  "劇団東小『眠れる森の美女』 お妃役　三越劇場",
  "劇団東小『ごんぎつね』 薬屋役",
  "イマジン『トラップ一家物語』 修練長役（エステー化学）全国ツアー",
  "イマジン『小公子セディ』 ミンナ役（ハウス食品）全国ツアー",
  "舟木一夫主演『アイ・ラブ・ニューヨーク』 モニカ役　シアターアプル 神戸オリエンタル劇場",
  "エステー化学『赤毛のアン』 バリー夫人　全国ツアー",
];

const KARIN_DRAMA = [
  "森繁久弥主演『浪速の花道』 名古屋中日劇場",
  "森繁久弥主演『明治太平記』 帝国劇場",
  "森繁久弥主演『レインボー通りの人々』 歌手・花村順子役　東京宝塚劇場",
  "『紅弁天部隊上海へ行く』 張花役　シアターV赤坂",
  "中村玉緒主演『新・おんなたちの同窓会』 名古屋名鉄ホール",
  "山本富士子主演『舞化粧』 東京宝塚劇場",
  "山本富士子主演『浪花恋ごよみ』 帝国劇場",
  "十朱幸代主演『ヨコハマ物語』 帝国劇場・飛天・御園座",
  "浅岡ルリ子主演『カルメンと呼ばれた女』 帝国劇場",
  "浅岡ルリ子主演『にごり絵』 帝国劇場　蜷川幸雄演出",
  "浅岡ルリ子主演『鏡花幻想』 帝国劇場　蜷川幸雄演出",
  "山田五十鈴主演『花のうさぎ屋』 帝国劇場",
  "坂東八十助主演『近松心中物語』 御園座　蜷川幸雄演出",
  "舟木一夫主演『眠り狂四朗』 南座",
  "川中美幸主演『あばれ芸者』 明治座",
  "藤あや子特別公演　新歌舞伎座",
  "中条きよし特別公演　新歌舞伎座",
  "佐久間良子・平幹二郎主演『鹿鳴館』 ル・テアトル銀座",
  "大地真央主演『大江戸緋鳥808』 明治座",
  "友近主演『とんち尼将軍一休ねえさん』 明治座",
  "菊川怜主演『チャングムの誓い』 チャンドク役　日生劇場・御園座",
];

const KARIN_FILM_TV = [
  "【映画】片岡鶴太郎主演『Mr.レディー夜明けのシンデレラ』",
  "【テレビ】NHK大河ドラマ『太平記』",
  "【テレビ】クイズ番組『クイズ脳ベル SHOW』",
  "【テレビ】マツコ会議",
  "【CM】住友新築そっくりさん",
  "【ラジオ】立川志の輔ラジオ　落語DEテート",
];

const KARIN_OTHER = [
  "山梨芸術音楽部門優秀賞及びみのる賞受賞",
  "玄公祭り 湖衣姫役（信玄公役：宇津井健）",
  "平成11年度 山梨中央郵便局1日郵便局長",
  "CD『ワインで乾杯』発売（コロンビアレコード）",
];

const KARIN_ORIGINAL_MUSICAL = [
  "ウィーン物語",
  "ミルテの花",
  "水戸黄門",
  "地球を守ろう",
  "夢が叶った女の子",
  "レディになった花売り娘",
];

const KARIN_STUDENTS = [
  "宝塚音楽学校",
  "ハウステンボス歌劇団",
  "OSK歌劇団",
  "劇団四季",
  "アニー役 2名",
  "エリザベート子ルドルフ　他多数",
];

export default function Instructor() {
  return (
    <>
      <section className={styles.headingSection}>
        <div className="inner">
          <Heading2
            className={styles.instructorHeading}
            title={
              <>
                Y-de-ONE（ワイデワン）
                <br />
                講師紹介
              </>
            }
            lead="ワイデワンの講師は全員、大人になってからバレエを始めました。だからこそ、初めての方の気持ちに寄り添った丁寧な指導ができます。"
          />
        </div>
      </section>

      {/* ━━━ 青山佳樹 ━━━ */}
      <section id="yoshiki" className={styles.instructorSection}>
        <div className={"inner"}>

          {/* 名前ヘッダー */}
          <div className={styles.instructorHeader}>
            <span className={styles.instructorRoleMain}>主宰</span>
            <h3 className={styles.instructorName}>青山 佳樹</h3>
            <p className={styles.instructorNameKana}>あおやま よしき</p>
          </div>

          {/* プロフィール写真（カルーセル）+ 経歴 */}
          <div className={styles.profileRow}>
            <div className={styles.profilePhotoWrap}>
              <PhotoCarousel photos={YOSHIKI_PHOTOS} />
            </div>
            <div className={styles.profileContent}>
              <SectionHeading icon="career-icon.png" alt="経歴アイコン" label="経歴" />
              <div className={styles.bioBlock}>
                <p>奈良県立高円高等学校 音楽コース卒業。相愛大学 音楽学部 器楽学科卒業。劇団四季を経て、バレエ・モダンダンサーとして活動。現在はワイデワン ダンススクール・カンパニー主宰として、指導・振付・舞台活動を行っている。</p>
                <p>2014年10月〜2018年10月、中野区観光大使として活動。中野区観光協会認定「NAKANO LOVE DANCERS」としてイベント等に出演。</p>
                <p>稲葉浩志「oh my love」ミュージックビデオにモダンバレエのソロダンサーとして出演。アルバム「Singing Bird」のTVCMとして放映。また、東京事変「キラーチューン」、DJ OZMAなど多数のアーティストのミュージックビデオに出演。</p>
                <p>京都駅ビルマスコットキャラクター「テット&スカーラ」MCお兄さん役をはじめ、イベント、舞台、テレビ、CMなど幅広く出演。</p>
                <p>福岡スクールオブミュージック＆ダンス専門学校（FSM）にてモダンジャズクラス講師を務める（2006年〜2015年）。ワイデワンのオープンクラスのほか、よみうりカルチャー（読売・日本テレビ文化センター）、株式会社カルチャーセンター、セントラルウェルネスクラブにてクラシックバレエ講師として活動。雑誌「よみカル」2011年秋号に講師インタビュー掲載。男性初の表紙を飾る。</p>
                <p>主な出演作品として、新国立劇場「トゥーランドット」、日本バレエ協会公演「眠れる森の美女」、日本ジャズダンス芸術協会主催「ジャズダンスフェスティバル」、キリンビバレッジ主催某大手テーマパーク「ドリームパーティー全国ツアー」、舞浜シェラトンホテル主催イベント「シェラトン夏祭り」、「YUJI SATO BALLET FESTA」ほか多数出演。</p>
                <p>韓国・慶州世界文化エキスポ2011「世界ダンスフェスティバル」招聘出演。振付作品2作品を出品。演舞の様子は韓国の新聞3紙および「朝日新聞」に掲載され、現地関係者および観衆から高い評価を受ける。朝日新聞デジタル、AJW（Asia and Japan Watch）英文記事にも掲載。</p>
              </div>
            </div>
          </div>

          {/* 出演 */}
          <div className={styles.appearanceBlock}>
            <SectionHeading icon="stage-icon.png" alt="出演アイコン" label="出演" />
            <table className={styles.appearanceTable}>
              <tbody>
                <tr><td><span className={styles.yearCell}>2026年1月</span><br />ミュージカル「アミーゴ」出演。</td></tr>
                <tr><td><span className={styles.yearCell}>2022年10月</span><br />第2回メタバース総合展 秋 ブース映像作品へ振付参加。</td></tr>
                <tr><td><span className={styles.yearCell}>2020年7月</span><br />東京都主催「アートにエールを！東京プロジェクト」モダンバレエソロ作品（振付・出演）掲載。</td></tr>
                <tr><td><span className={styles.yearCell}>2018年</span><br />水樹奈々「粋恋」MV 男性ソロダンサーとして出演。</td></tr>
                <tr><td><span className={styles.yearCell}>2017年</span><br />日本初の屋内スカイダイビング施設「フライステーション」オープニングセレモニー 振付およびダンサー出演。</td></tr>
                <tr><td><span className={styles.yearCell}>2016年</span><br />幕張メッセ「第3回ライブ＆イベント産業展」振付およびダンサー出演。日本テレビ「NEWS ZERO」にて放映。</td></tr>
              </tbody>
            </table>
          </div>

          {/* 受賞歴 */}
          <div className={styles.awardBlock}>
            <SectionHeading icon="award-icon.png" alt="受賞歴アイコン" label="受賞歴" />
            <ul className={styles.awardList}>
              <li>日本ジャズダンス芸術協会主催 第15回JDAダンスコンクール 第1位 受賞</li>
              <li>日本ジャズダンス芸術協会主催 第17回JDAダンスコンクール 第2位 受賞</li>
            </ul>
          </div>

          {/* 動画紹介 */}
          <div className={styles.videoBlock}>
            <SectionHeading icon="video-icon.png" alt="動画紹介アイコン" label="動画紹介" />
            <div className={styles.videoGrid}>
              {YOSHIKI_VIDEOS.map((id) => (
                <div key={id} className={styles.videoWrapper}>
                  <iframe
                    src={`https://www.youtube.com/embed/${id}?playsinline=1`}
                    title="YouTube動画"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ━━━ 門馬和樹 ━━━ */}
      <section id="kazuki" className={styles.instructorSection}>
        <div className="inner">

          <div className={styles.instructorHeader}>
            <span className={styles.instructorRole}>講師</span>
            <h3 className={styles.instructorName}>門馬 和樹</h3>
            <p className={styles.instructorNameKana}>もんま かずき</p>
          </div>

          <div className={styles.profileRow}>
            <div className={styles.profilePhotoWrap}>
              <PhotoCarousel photos={KAZUKI_PHOTOS} />
            </div>
            <div className={styles.profileContent}>
              <SectionHeading icon="career-icon.png" alt="経歴アイコン" label="経歴" />
              <div className={styles.bioBlock}>
                <p>日本芸術学園卒業。バレエ、モダン、ジャズダンスなど、ダンサーとして舞台・イベント・CM・ミュージカルなど幅広く活動。また、モダンバレエやジャズダンスの振付をはじめ、モーションキャプチャー振付など、振付家としても幅広く活躍。元BESJマットピラティス指導資格を取得。</p>
                <p>現在はワイデワン ダンススクールのほか、よみうりカルチャー川崎、朝霞スタジオ、大宮ラージススタジオにて大人バレエクラスを開講している。</p>
                <p><a href="https://www.kazuki-dance.com" className={styles.externalLink} target="_blank" rel="noopener noreferrer">門馬和樹HPはこちらから →</a></p>
              </div>
            </div>
          </div>

          <div className={styles.appearanceBlock}>
            <SectionHeading icon="stage-icon.png" alt="出演アイコン" label="出演" />
            <table className={styles.appearanceTable}>
              <tbody>
                {[
                  ["2024年4〜5月", "ミュージカル「昭和元禄落語心中」出演。"],
                  ["2023年11〜12月", "ミュージカル「刀剣乱舞」千子村正 蜻蛉切 双騎出陣 万の華うつす鏡 出演。"],
                  ["2023年4〜5月", "ミュージカル「ザ・ミュージック・マン」出演。"],
                  ["2023年1〜2月", "ミュージカル「ザ・ビューティフル・ゲーム」出演。"],
                  ["2021年9月", "AR短編舞台「ARシアター」in サンリオピューロランド モーションキャプチャーダンサー・振付。"],
                  ["2020年12月", "柴草玲 クリスマススペシャルライブ「婦人・ド・ノエル 2020」出演（ソロダンサー・二人芝居）。"],
                  ["2020年7月", "東京都主催『アートにエールを！東京プロジェクト』モダンバレエソロ作品（振付・出演）掲載。"],
                  ["2020年2月", "テレビ東京「マジ歌ライブ 2020 in さいたまスーパーアリーナ」出演。"],
                  ["2019年7月", "アンリミテッド・チャリティー・コンサート ロシア・ウラジオストク公演 バレエ「レクイエム」ダンサー出演。"],
                  ["2019年", "東京海上日動火災「READY TO GO! 東京2020への挑戦」編 TVCMダンサー出演。某セキュリティー会社TVCM・WebCMダンサー出演。"],
                  ["2018年5月", "テレビ東京「マジ歌ライブ 2018 in 横浜アリーナ」ダンサー出演。"],
                  ["2017年3月", "テレビ東京「ゴッドタン マジ歌ライブ2017〜マジ武道館〜」（日本武道館）ダンサー出演。"],
                  ["2016年", "幕張メッセ「第3回ライブ＆イベント産業展」ダンサー出演。日本テレビ「NEWS ZERO」にて放映。"],
                  ["2015年", "中野区観光協会認定「NAKANO LOVE DANCERS」として活動。中野区観光大使の歌う「ナカノナノカナ」振付。"],
                  ["2014年", "稲葉浩志「oh my love」MV出演（アルバム「Singing Bird」収録）。ZENTプロモーションCM出演。セイコーエプソン株式会社「PULSENCE」オール媒体出演。"],
                  ["2013年", "劇団スタジオライフ 音楽劇 『アルセーヌ・ルパン カリオストロ伯爵夫人』"],
                  ["2011年", "韓国・慶州 世界文化エキスポ 『世界ダンスフェスティバル』招聘出演"],
                  ["2010年", "新国立劇場 オペラ『ニーベルングの指環』"],
                  ["2009年", "映画『少年メリケンサック』（監督：宮藤官九郎）"],
                  ["2008年", "新国立劇場 オペラ『アイーダ』"],
                ].map(([year, desc]) => (
                  <tr key={year}>
                    <td><span className={styles.yearCell}>{year}</span><br />{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.awardBlock}>
            <SectionHeading icon="award-icon.png" alt="受賞歴アイコン" label="受賞歴" />
            <ul className={styles.awardList}>
              <li>日本ジャズダンス芸術協会主催 第25回JDAダンスコンクール ソロ作品「My trajectory」奨励賞 受賞</li>
              <li>第26回JDAダンスコンクール ソロ作品「You Raise Me Up」入選</li>
              <li>第6回 座間全国ミュージカルコンクール ダンス創作部門 ソロ作品「So close〜そばにいて〜」入賞（6位）</li>
            </ul>
          </div>

          <div className={styles.videoBlock}>
            <SectionHeading icon="video-icon.png" alt="動画紹介アイコン" label="動画紹介" />
            <div className={styles.videoGrid}>
              {KAZUKI_VIDEOS.map((id) => (
                <div key={id} className={styles.videoWrapper}>
                  <iframe
                    src={`https://www.youtube.com/embed/${id}?playsinline=1`}
                    title="YouTube動画"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <div className="inner">
        <SectionCtaButton />
      </div>

      <section className={styles.headingSection}>
        <div className="inner">
          <Heading2
            title={<>Y-de-ONE（ワイデワン）<br />アーティスト紹介</>}
            lead="バレエダンサー・シンガーとして第一線で活躍するアーティストたち。それぞれが積み重ねてきた豊かな舞台経験と表現を、ワイデワンの公演や日々の指導に活かしています。"
          />
        </div>
      </section>

      {/* ━━━ 松井眞琴 ━━━ */}
      <section id="makoto" className={styles.instructorSection}>
        <div className="inner">

          <div className={styles.instructorHeader}>
            <span className={styles.instructorRole}>ダンサー</span>
            <h3 className={styles.instructorName}>松井 眞琴</h3>
            <p className={styles.instructorNameKana}>まつい まこと</p>
          </div>

          <div className={styles.profileRow}>
            <div className={styles.profilePhotoWrap}>
              <PhotoCarousel photos={MAKOTO_PHOTOS} />
            </div>
            <div className={styles.profileContent}>
              <SectionHeading icon="career-icon.png" alt="経歴アイコン" label="経歴" />
              <div className={styles.bioBlock}>
                <p>私立中学・高等学校の英語教員として15年間勤務。その間、指導教科のみでは真に生徒に寄り添うことができないことを痛感し、心理学に関心を持つ。働きながら心理学・臨床心理学を学び、公認心理師資格を取得。現在も国立病院にて認知症外来の予診や認知症カフェなどに8年間携わっている。</p>
                <p>幼少期よりクラシックバレエを約30年学び、現在はワイデワン ダンスカンパニーにてクラシックバレエ、モダンバレエなど幅広いジャンルに取り組んでいる。また、認知症の方や予防を目的としたバレエ・音楽講座を担当し、身体と心の両面からのアプローチによる指導を行っている。</p>
                <p>これまでの出演歴には、ワイデワン作品をはじめ、白鳥の湖、くるみ割り人形、眠れる森の美女、創作作品など幅広いジャンルの舞台に参加。</p>
                <p>幼少期よりクラシックピアノを学び、高校時代にはジャズやスタンダードミュージックに興味を持つ。大学時代は早稲田大学モダンジャズ研究会に所属し、ピアノおよびボーカルを担当。その傍ら、都内のバーやレストラン、クラブ、ホテルラウンジなどでピアノ演奏や弾き語りを行うなど、音楽活動にも積極的に取り組んできた。</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ━━━ 南かりん ━━━ */}
      <section id="karin" className={styles.instructorSection}>
        <div className="inner">

          <div className={styles.instructorHeader}>
            <span className={styles.instructorRole}>シンガー</span>
            <h3 className={styles.instructorName}>南 かりん</h3>
            <p className={styles.instructorNameKana}>みなみ かりん</p>
          </div>

          <div className={styles.profileRow}>
            <div className={styles.profilePhotoWrap}>
              <PhotoCarousel photos={KARIN_PHOTOS} />
            </div>
            <div className={styles.profileContent}>
              <SectionHeading icon="career-icon.png" alt="経歴アイコン" label="経歴" />
              <div className={styles.bioBlock}>
                <p>山梨県甲府市出身。東京音楽大学声楽科卒業。身長160cm。</p>
                <p>オペラ・ミュージカル・演劇など多彩な舞台で幅広く活躍。帝国劇場・東京宝塚劇場・明治座・帝劇など名だたる劇場での公演に多数出演し、森繁久弥・浅岡ルリ子・山本富士子・大地真央など著名な俳優と共演を重ねる。NHK大河ドラマ・クイズ番組・映画・CM・ラジオにも出演。CDをコロンビアレコードより発売。ミュージカル・シアター・アプローズ代表。</p>
                <p>特技：ソプラノ（ミュージカル・シャンソン・ポピュラーetc）、日本舞踊（藤間きち弥）、ピアノ・作詞・作曲。</p>
              </div>
            </div>
          </div>

          <div className={styles.appearanceBlock}>
            <SectionHeading icon="stage-icon.png" alt="出演アイコン" label="出演" />
            <table className={styles.appearanceTable}>
              <tbody>
                {(
                  [
                    ["オペラ", KARIN_OPERA],
                    ["ミュージカル", KARIN_MUSICAL],
                    ["演劇", KARIN_DRAMA],
                    ["映画 / TV / CM / ラジオ", KARIN_FILM_TV],
                    ["その他", KARIN_OTHER],
                    ["オリジナルミュージカル（作詞・作曲・演出）", KARIN_ORIGINAL_MUSICAL],
                    ["生徒合格実績", KARIN_STUDENTS],
                  ] as [string, string[]][]
                ).map(([label, items]) => (
                  <tr key={label}>
                    <td>
                      <span className={styles.yearCell}>{label}</span>
                      <br />
                      {items.map((item, i) => (
                        <span key={item}>{item}{i < items.length - 1 && <br />}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      <div className="inner">
        <ContactCtaButton className={styles.ctaWrap} />
      </div>
    </>
  );
}
