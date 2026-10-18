import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DEMO_LANG_COOKIE, DEMO_MODE } from "@/lib/demo";
import styles from "./phone.module.css";

export const metadata: Metadata = { title: "Y-de-ONE Demo" };

// 許可する画面（外部のURLや別の画面は枠に入れない）
const ALLOWED = /^\/(admin|mypage|trial|register)(\?[\w=&%.-]*)?$/;

const COPY = {
  ja: {
    badge: "スマホ表示",
    title: "スマートフォンでの閲覧がおすすめです",
    text: "実際にはスマートフォンの LINE アプリの中で開く画面なので、スマホ専用に作っています。パソコンではスマホ幅の枠に入れて表示しています。",
    tip: "いちばん見やすいのは、スマートフォンで開いたときです。",
    back: "デモのメニューに戻る",
    backHref: "/",
    frameTitle: "スマホ幅の枠で表示した Y-de-ONE アプリ",
  },
  en: {
    badge: "Smartphone view",
    title: "Best viewed on a smartphone",
    text: "In real life this screen opens inside the LINE app on a phone, so it is designed for phones only. On a computer we show it in a phone-sized frame.",
    tip: "For the best experience, open this demo on your phone.",
    back: "Back to the demo menu",
    backHref: "/en",
    frameTitle: "Y-de-ONE app in a phone frame",
  },
} as const;

export default async function PhonePage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  if (!DEMO_MODE) notFound();
  const { path } = await searchParams;
  if (!path || !ALLOWED.test(path)) notFound();
  const lang = (await cookies()).get(DEMO_LANG_COOKIE)?.value === "en" ? "en" : "ja";
  const c = COPY[lang];

  return (
    <main className={styles.page} lang={lang}>
      <div className={styles.side}>
        <p className={styles.badge}>{c.badge}</p>
        <h1 className={styles.title}>{c.title}</h1>
        <p className={styles.text}>{c.text}</p>
        <p className={styles.text}>{c.tip}</p>
        <Link className={styles.back} href={c.backHref}>
          {c.back}
        </Link>
      </div>
      <div className={styles.phone}>
        {/* 実機と同じく、上にステータスバー・下にホームバーの帯を置き、角の丸みに中身がかからないようにする */}
        <div className={styles.screenWrap}>
          <div className={styles.statusBar} aria-hidden="true">
            <span>9:41</span>
            <span className={styles.statusIcons}>
              <i className="fa-solid fa-signal" />
              <i className="fa-solid fa-wifi" />
              <i className="fa-solid fa-battery-full" />
            </span>
          </div>
          <iframe className={styles.screen} src={path} title={c.frameTitle} />
          <div className={styles.homeBar} aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    </main>
  );
}
