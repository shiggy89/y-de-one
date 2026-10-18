"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { DEMO_LANG_COOKIE } from "@/lib/demo";
import styles from "./DemoBanner.module.css";

// デモ環境だけに出る帯。ここが本番ではないこと、何も送信されないことを常に伝える。
// スマホ枠（iframe）の中では出さない（外側の帯だけで十分）。
const subscribe = () => () => {};

// アプリ画面（管理画面・マイページ・フォーム・スマホ枠）は、入口で選んだ言語（Cookie）に合わせる
const APP_PATH = /^\/(admin|mypage|trial|register|demo\/phone)(\/|$)/;

function readLangCookie(): string {
  return document.cookie.match(new RegExp(`(?:^|;\\s*)${DEMO_LANG_COOKIE}=(\\w+)`))?.[1] ?? "ja";
}

export default function DemoBanner() {
  const pathname = usePathname();
  // サーバー側の描画では常に表示し、ブラウザで枠の中と分かったときだけ隠す
  const framed = useSyncExternalStore(subscribe, () => window.self !== window.top, () => false);
  const cookieLang = useSyncExternalStore(subscribe, readLangCookie, () => "ja");
  if (framed) return null;

  const en = pathname.startsWith("/en") || (APP_PATH.test(pathname) && cookieLang === "en");
  const menu = en ? "/en" : "/";

  return (
    <div className={styles.banner} role="status" lang={en ? "en" : "ja"}>
      <span className={styles.badge}>DEMO</span>
      <span className={styles.text}>
        {en ? "Sample data only. No LINE messages or emails are sent." : "サンプルデータです。LINE やメールは送信されません。"}
      </span>
      <Link className={styles.link} href={`${menu}#about-line`}>
        {en ? "What's LINE?" : "LINE の仕組み"}
      </Link>
      <Link className={styles.link} href={menu}>
        {en ? "Switch view" : "デモメニュー"}
      </Link>
    </div>
  );
}
