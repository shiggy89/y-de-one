"use client";

import { useSyncExternalStore } from "react";
import styles from "./DemoBanner.module.css";

// デモ環境だけに出る帯。ここが本番ではないこと、何も送信されないことを常に伝える。
// スマホ枠（iframe）の中では出さない（外側の帯だけで十分）。
const subscribe = () => () => {};

export default function DemoBanner() {
  // サーバー側の描画では常に表示し、ブラウザで枠の中と分かったときだけ隠す
  const framed = useSyncExternalStore(subscribe, () => window.self !== window.top, () => false);
  if (framed) return null;

  return (
    <div className={styles.banner} role="status">
      <span className={styles.badge}>DEMO</span>
      <span className={styles.text}>Sample data only. No LINE messages or emails are sent.</span>
      <a className={styles.link} href="/demo#about-line">
        What&apos;s LINE?
      </a>
      <a className={styles.link} href="/demo">
        Switch view
      </a>
    </div>
  );
}
