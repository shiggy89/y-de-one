"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Works.module.css";

const NAV_ITEMS = [
  { icon: "/images/works/stage-icon.png", label: "発表会・舞台出演情報", href: "#stage" },
  { icon: "/images/works/works-icon.png", label: "作品紹介", href: "#works" },
  { icon: "/images/works/activity-icon.png", label: "活動報告", href: "#activity" },
];

const STAGE_LIST = [
  {
    date: "2024年4月19日・20日",
    title: "ワイデワン祭 5th Dance Performance",
    venue: "野方区民ホール",
    body: `ワイデワン祭5th Dance Performance開催します！

野方区民ホールにて第5回目のワイデワン発表会を開催致します。
1部小品集、2部オリジナルストーリー「宇宙からの愛を信じて」の2部構成です。バレエありモダンあり全てワイデワンのオリジナルの作品です。
ご来場お待ちしております！！
ご興味のある方、お気軽にお問い合わせください。

2024年
4月19日（金）
公開ゲネプロ 開演18:00
4月20日（土）
昼の部 開場13:00 開演13:30
夜の部 開場17:30 開演18:00

野方区民ホール
チケット 1,000円（全席自由席）


第1部 小品集

1.オープニング
【出演】出演者全員

2.アンネンポルカ
【出演】杉本桂子 河田ゆり 松井毅彦
【振付】門馬和樹

3.風笛
【出演】山田恵
【振付】青山佳樹

4.ノクターン
【出演】大野葉子 青山佳樹
【振付】青山佳樹

5.Girl on Fire
【出演】河田仁美
【振付】門馬和樹

6.パガニーニの主題による狂詩曲18番
【出演】渡邊智美 淺原達也
【振付】青山佳樹

7.sadhana
【出演】松井眞琴
【振付】青山佳樹

〜 バレエ・モダンHow to コーナー 〜

8.メヌエット
【出演】植松洋子 小野公秀
【振付】青山佳樹

9.別れの曲
【出演】鶸田美帆 杉本桂子 淺原達也
【振付】青山佳樹

10.愛をこめて花束を
【出演】河田仁美 河田ゆり
【振付】門馬和樹

11.平和のパ・ド・トロワ
【出演】山田恵 竹内英里 大塚健太郎
【振付】青山佳樹

12.糸
【出演】高橋未彩 野口圭子 笠藍日
【振付】門馬和樹

13.月の光
【出演】松井眞琴 青山佳樹
【振付】青山佳樹

14.Alive
【出演・振付】門馬和樹

〜 〜 〜 休憩 〜 〜 〜

第2部 オリジナルストーリー
「宇宙の愛を信じて」

シーン1【出会う約束】
●音楽：リベラ 彼方の光

シーン2【冒険に向かって】
●音楽：ホルスト 木星

シーン3【降り立つ】
●音楽：ドボルザーク 家路

シーン4【愛の葛藤〜善悪とは】振付補佐 門馬和樹
●音楽：ペールギュント オーゼの死

シーン5【気付き、そして再会】
●音楽：リベラ 彼方の光

シーン6【5次元意識への目醒め】
●音楽：平原綾香 ジュピター

シーン7【上昇】振付補佐 門馬和樹
●音楽：ザバレエ

【出演】
青山佳樹 門馬和樹 松井眞琴
山田恵 竹内英里 河田仁美 野口圭子 鶸田美帆
植松洋子 大塚健太郎 小野公秀 河田ゆり

【振付・作演出】
青山佳樹`,
    photos: ["/images/works/stage-1-1.jpg", "/images/works/stage-1-2.png", "/images/works/stage-1-3.jpg"],
  },
  {
    date: "2023年1月28日・29日",
    title: "スタジオパフォーマンスvol.4.5",
    venue: "",
    body: `2023年1月
28(土)
●公開ゲネ
開場16:30 開演17:00

29(日)
●昼の部
開場12:30 開演13:00
●夜の部
開場16:30 開演17:00

チケット1,000円

公演は約110分の予定です。`,
    photos: ["/images/works/stage-2-1.jpg", "/images/works/stage-2-2.jpg"],
  },
  {
    date: "2022年12月17日・18日",
    title: "第4回スタジオパフォーマンス",
    venue: "",
    body: `2022年12月
17(土)
●公開ゲネ
開場16:30 開演17:00

18(日)
●昼の部
開場12:30 開演13:00
●夜の部
開場16:30 開演17:00

チケット1,000円

公演は約110分の予定です。`,
    photos: ["/images/works/stage-3-1.jpg", "/images/works/stage-3-2.jpg"],
  },
  {
    date: "2019年6月30日",
    title: "モンマカズキ祭 〜最初de最後!?〜",
    venue: "ワイデワン高田馬場スタジオ",
    body: `モンマカズキ祭
〜良い歳になったので自分でやっちゃいます〜

【日時】2019年6月30日（日）
開演時間
昼の部 13:30-
夜の部 17:00-
（開場は30分前からです）

【会場】ワイデワン高田馬場スタジオ

【チケット】500円
バレエ、モダンなど様々なパフォーマンスが楽しめます！`,
    photos: ["/images/works/stage-4-1.jpg"],
  },
  {
    date: "2019年2月16日",
    title: "ワイデワン祭 4th Dance Performance",
    venue: "野方区民ホール",
    body: `【日時】2019年2月16日（土）
開演時間
昼の部 13:30-
夜の部 18:00-
（開場は30分前からです）

【会場】野方区民ホール
西武新宿線「野方」駅南口より徒歩3分

【チケット】2,000円
クラシックバレエ、モダンバレエ、モダンジャズ
どうぞお楽しみに（^-^）`,
    photos: ["/images/works/stage-5-1.jpg", "/images/works/stage-5-2.jpg"],
  },
  {
    date: "2019年1月13日",
    title: "レザミ ダンスコンサート",
    venue: "彩の国さいたま芸術劇場・大ホール",
    body: `【日時】2019年1月13日（日）
16:00 開場 / 16:30 開演

【会場】彩の国さいたま芸術劇場・大ホール
JR埼京線「与野本町」駅 西口 下車 徒歩7分

【チケット】1,500円（全席自由）


★エルザの大聖堂への行列ー歌劇『ローエングリン』より
至福の鐘 やすらぎの奏で 一歩出ればはびこる悪
ふたりに課せられ ふたりにしか出来ない 終わりなき戦いを誓い
だが孤独ではない

【振付】青山佳樹
【出演】上川原雅子 青山佳樹


★スターズ アンド ストライプス
【出演】上川原雅子 門馬一樹`,
    photos: ["/images/works/stage-6-1.jpg"],
  },
  {
    date: "2018年8月18日",
    title: "YUJI SATO BALLET FESTA7",
    venue: "めぐろパーシモンホール 大ホール",
    body: `【日時】2018年8月18日（土）
16:30開演

エルザの大聖堂への行列ー歌劇『ローエングリン』より

至福の鐘 やすらぎの奏で 一歩出ればはびこる悪
ふたりに課せられ ふたりにしか出来ない 終わりなき戦いを誓い
だが孤独ではない

振付：青山佳樹
出演：上川原雅子 青山佳樹

【会場】めぐろパーシモンホール 大ホール
東急東横線「都立大学」駅より徒歩7分

【チケット】
A席（指定席）2,800円
B席（指定席）2,500円
C席（2階 自由席）2,000円`,
    photos: ["/images/works/stage-7-1.jpg", "/images/works/stage-7-2.jpg"],
  },
  {
    date: "2018年8月14日",
    title: "シェラトン夏祭り2018",
    venue: "シェラトン・グランデ・トーキョー・ベイホテル",
    body: `【日時】2018年8月14日（火）
19:30-（ワイデワンの出演は約30分）
会場には17:00-22:00まで滞在可能で、様々なダンスを楽しめます。

【会場】東京ディズニーリゾート
シェラトン・グランデ・トーキョー・ベイホテル
1階「ザ・クラブフジ」特設ステージ

JR京葉線・武蔵野線「舞浜駅（南口）より
「ディズニーリゾートライン」（モノレール）にて
2つ目の「ベイサイド・ステーション」下車・徒歩約1分。

【チケット】2,500円
事前予約チケットをお持ちでない方は、当日、会場受付にて購入可能です。
ホテルの美味しい屋台で、2,500円分の飲食が可能です。`,
    photos: ["/images/works/stage-8-1.jpg"],
  },
  {
    date: "2018年6月30日",
    title: "マーガレット・バレエ・コンサート",
    venue: "ルネこだいら 大ホール",
    body: `【日時】2018年6月30日（土）
17:00開場 / 17:30開演

『戦場の嘆（うた）』
振付：青山佳樹
出演：上川原雅子 青山佳樹

出演は19:30頃を予定。

【会場】ルネこだいら 大ホール
西武新宿線「小平」駅 南口より徒歩3分

【チケット】1,000円`,
    photos: ["/images/works/stage-9-1.jpg", "/images/works/stage-9-2.jpg"],
  },
];

const WORKS_LIST = [
  {
    date: "2016年7月6日〜8日",
    title: "幕張メッセ「第3回ライブ&イベント産業展」",
    body: `世界初のLED技術を用いた照明の実演として、エルテック様の企業ブースにて、ワイデワンダンスカンパニーがモダンバレエを披露しました。
最先端技術による発色性が抜群のLED照明のもと、芸術性あるしなやかなモダンバレエがみごとに融合し、LEDの高い技術水準を鮮明に演出しました。また、会場にあでやかな華をそえることができました。

ワイデワンダンスカンパニー
【振付】
青山佳樹 門馬和樹
【出演】
青山佳樹 門馬和樹 他`,
    youtube: "UEZLC14ycf0",
  },
  {
    date: "",
    title: "Modern Jazz",
    body: `ダンス動画撮影制作の依頼によるモダンジャズ作品

【振付・出演】
青山佳樹 門馬和樹`,
    youtube: "fmTVaDMUEs4",
  },
  {
    date: "2020年7月",
    title: "この哀しみの先に",
    body: `東京都主催『アートにエールを！東京プロジェクト』モダンバレエソロ作品

【振付・出演】
門馬和樹`,
    youtube: "Q6Qw6knwDkQ",
  },
  {
    date: "2016年4月23日",
    title: "スタジオパフォーマンスvol.1 さくら独唱",
    body: `スタジオオープン記念 スタジオパフォーマンスvol.1
モダンバレエ、生演奏のピアノ、ヴィオラとのコラボレーション作品

さくら独唱
【振付】
青山佳樹`,
    youtube: "Loci_SVNZ70",
  },
];

const ACTIVITY_LIST = [
  {
    date: "2026年1月7日",
    title: "ミュージカル「アミーゴ」",
    body: "吹田市民ホール シアターメイにて、青山佳樹が出演しました。",
  },
  {
    date: "2025年12月6日・7日",
    title: "ワイデワン設立15周年記念 スタジオパフォーマンスを開催しました。",
    body: "",
  },
  {
    date: "2025年3月・4月",
    title: "ミュージカル「昭和元禄落語心中」",
    body: "東急シアターオーブ、フェスティバルホール、福岡市民ホールにて、門馬和樹が出演しました。",
  },
  {
    date: "2024年4月19日・20日",
    title: "ワイデワン祭 5th Dance Performance開催しました。",
    body: "",
  },
  {
    date: "2023年11月・12月",
    title: "ミュージカル『刀剣乱舞』千子村正 蜻蛉切 双騎出陣 万の華うつす鏡",
    body: "IHI ステージアラウンド東京にて、門馬和樹が出演しました。",
  },
  {
    date: "2023年9月",
    title: "Netflix映画『赤ずきん、旅の途中で死体と出会う』",
    body: "9月14日より世界独占配信。門馬和樹が出演しました。",
  },
  {
    date: "2023年4月〜5月",
    title: "ミュージカル「ザ・ミュージック・マン」",
    body: "日生劇場、御園座、梅田芸術劇場、清水マリアート、博多座にて、門馬和樹が出演しました。",
  },
  {
    date: "2023年1月〜2月",
    title: "ミュージカル「ザ・ビューティフル・ゲーム」",
    body: "日生劇場、梅田芸術劇場にて、門馬和樹が出演しました。",
  },
  {
    date: "2023年1月29日",
    title: "ワイデワンダンススクール スタジオパフォーマンスvol.4.5開催いたしました。",
    body: "",
  },
  {
    date: "2022年12月18日",
    title: "ワイデワンダンススクール スタジオパフォーマンスvol.4開催いたしました。",
    body: "",
  },
  {
    date: "2022年10月25日〜27日",
    title: "第2回メタバース総合展秋 ブース映像作品",
    body: "青山佳樹が振付、門馬和樹がダンサー出演しました。",
  },
  {
    date: "2021年9月10日〜10月10日",
    title: "ARシアター サンリオピューロランド",
    body: "門馬和樹がモーションキャプチャーダンサーとして振付、映像出演しました。",
  },
  {
    date: "2020年12月12日",
    title: "柴草玲 クリスマススペシャルライブ『婦人・ド・ノエル 2020』",
    body: "門馬和樹が出演しました。",
  },
  {
    date: "2020年7月",
    title: "東京都主催『アートにエールを！東京プロジェクト』",
    body: "青山佳樹、門馬和樹、各々のソロ作品が掲載されました。",
  },
  {
    date: "2019年6月30日",
    title: "モンマカズキ祭",
    body: "ワイデワンスタジオにて開催いたしました。",
  },
  {
    date: "2019年2月16日",
    title: "ワイデワン祭 4th Dance Performance",
    body: "野方区民ホールにて開催しました。",
  },
  {
    date: "2018年8月14日",
    title: "シェラトン夏祭り2018",
    body: "ワイデワンカンパニー、スクール生が出演しました。",
  },
  {
    date: "2018年5月13日",
    title: "スタジオ設立2周年記念 スタジオパフォーマンスvol.3を開催しました。",
    body: "",
  },
  {
    date: "2017年8月3日",
    title: "シェラトン夏祭り2017",
    body: "ワイデワンカンパニー、スクール生が出演しました。",
  },
  {
    date: "2017年7月17日",
    title: "骨髄バンク登録推進運動「命のつどい」",
    body: "ワイデワンカンパニー、スクール生が出演しました。",
  },
  {
    date: "2017年5月28日",
    title: "スタジオ設立1周年記念 スタジオパフォーマンスvol.2を開催しました。",
    body: "",
  },
  {
    date: "2017年4月14日",
    title: "フライステーション越谷レイクタウン オープニングセレモニー",
    body: "ワイデワンカンパニーがダンス出演しました。",
  },
  {
    date: "2016年7月31日",
    title: "シェラトン夏祭り2016",
    body: "ワイデワンカンパニー、スクール生が出演しました。",
  },
  {
    date: "2016年7月6日〜8日",
    title: "幕張メッセ ライブ＆イベント産業展",
    body: "ワイデワンカンパニーがダンス出演しました。",
  },
  {
    date: "2016年4月23日",
    title: "ワイデワンダンススクール・カンパニー専用スタジオ オープン",
    body: "スタジオオープン記念 スタジオパフォーマンスvol.1を開催しました。",
  },
  {
    date: "2016年3月21日",
    title: "骨髄バンク登録推進運動「命のつどい」",
    body: "ワイデワンカンパニー、スクール生が出演しました。",
  },
];

export default function Works() {
  return (
    <>
      {/* ━━━ ページ内ナビ ━━━ */}
      <section className={styles.navSection}>
        <div className="inner">
          <div className={styles.navCards}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={styles.navCard}
                onClick={(e) => {
                  e.preventDefault();
                  const id = item.href.replace("#", "");
                  setTimeout(() => {
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 100);
                }}
              >
                <Image src={item.icon} alt={item.label} width={140} height={140} className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 舞台出演情報 ━━━ */}
      <section id="stage" className={styles.stageSection}>
        <div className="inner">
          <Heading2
            className={styles.sectionHeading}
            title={<>Y-de-ONE | ワイデワン<br />発表会・舞台出演情報</>}
            lead="年1〜2回、本格的な舞台での発表会を開催。野方区民ホールなど劇場での公演に、生徒さんも出演できます。「いつか舞台に立ってみたい」——その夢を一緒に叶えましょう。"
          />
          <div className={styles.stageCards}>
            {STAGE_LIST.map((item, i) => (
              <div key={i} className={styles.stageCard}>
                <div className={styles.stageCardHeader}>
                  <span className={styles.stageCardDate}>{item.date}</span>
                  <h3 className={styles.stageCardTitle}>{item.title}</h3>
                  <span className={styles.stageCardVenue}>{item.venue}</span>
                </div>
                <div className={styles.stageCardContent}>
                  <p className={styles.stageCardBody}>{item.body}</p>
                  {item.photos.length > 0 && (
                    <div className={styles.stagePhotoCol}>
                      {item.photos.map((src, j) => (
                        <div key={j} className={styles.stagePhotoItem}>
                          <Image src={src} alt={`${item.title} 写真${j + 1}`} width={600} height={400} className={styles.stagePhoto} loading="eager" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <hr className={styles.sectionDividerRed} />
        </div>
      </section>

      <SectionCtaButton />

      {/* ━━━ 作品紹介 ━━━ */}
      <section id="works" className={styles.worksSection}>
        <div className="inner">
          <Heading2
            className={styles.sectionHeading}
            title={<>Y-de-ONE | ワイデワン<br />作品紹介</>}
            lead="幕張メッセ・シェラトンホテル・さいたま芸術劇場など、様々なステージで披露してきたワイデワンの作品をご覧ください。"
          />
          <div className={styles.worksList}>
            {WORKS_LIST.map((work, i) => (
              <div key={i} className={styles.workCard}>
                <div className={styles.stageCardHeader}>
                  <span className={styles.stageCardDate}>{work.date}</span>
                  <h3 className={styles.stageCardTitle}>{work.title}</h3>
                </div>
                {work.youtube && (
                  <div className={styles.worksVideoWrapper}>
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${work.youtube}?playsinline=1`}
                      title={work.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                <p className={styles.worksCardBody}>{work.body}</p>
              </div>
            ))}
          </div>
          <hr className={styles.sectionDividerBlue} />
        </div>
      </section>

      <SectionCtaButton />

      {/* ━━━ 活動報告 ━━━ */}
      <section id="activity" className={styles.activitySection}>
        <div className="inner">
          <Heading2
            className={styles.sectionHeading}
            title={<>Y-de-ONE | ワイデワン<br />活動報告</>}
            lead="2010年のスタジオ開設から現在まで、舞台公演・企業イベント・テレビ・ミュージカル出演など、ワイデワンの歩みをまとめています。"
          />
          <div className={styles.activityGroups}>
          {Object.entries(
            ACTIVITY_LIST.reduce<Record<string, typeof ACTIVITY_LIST>>((acc, item) => {
              const year = item.date.match(/(\d{4})年/)?.[1] ?? "その他";
              if (!acc[year]) acc[year] = [];
              acc[year].push(item);
              return acc;
            }, {})
          ).sort(([a], [b]) => Number(b) - Number(a)).map(([year, items]) => (
            <div key={year} className={styles.stageGroup}>
              <h3 className={styles.stageYear}>{year}年</h3>
              <table className={styles.stageTable}>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className={styles.stageDate}>
                        {(() => {
                          const date = item.date.replace(/^\d{4}年/, "");
                          const parts = date.split("〜");
                          return parts.length > 1 && parts[0].includes("日") && parts[1].includes("月")
                            ? <>{parts[0]}<br className={styles.mobileDateBreak} />〜{parts.slice(1).join("〜")}</>
                            : date;
                        })()}
                      </td>
                      <td className={styles.stageTitle}>
                        {item.title}
                        {item.body && <><br /><span style={{ fontWeight: "normal", color: "#666" }}>{item.body}</span></>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          </div>
          <SectionCtaButton />
        </div>
      </section>
    </>
  );
}
