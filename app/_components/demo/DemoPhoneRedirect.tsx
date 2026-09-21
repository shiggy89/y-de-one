"use client";

import { useEffect } from "react";
import { DEMO_MODE } from "@/lib/demo";

// 管理画面・マイページ・申込みフォームはスマホ専用（本番では LINE アプリの中で開く）。
// デモを PC で開いたときは、スマホ幅の枠（/demo/phone）に入れて表示する。
//
// 枠の中（iframe）では移動せず、縦スクロールバーだけを隠す。スクロールバーが常時表示の環境だと、
// 画面の幅が狭くなり、枠の右側だけ太く見えてしまうため（スクロール自体はできる）。
export default function DemoPhoneRedirect() {
  useEffect(() => {
    if (!DEMO_MODE) return;

    if (window.self !== window.top) {
      const style = document.createElement("style");
      style.textContent = "html{scrollbar-width:none}html::-webkit-scrollbar{display:none}";
      document.head.appendChild(style);
      return () => style.remove();
    }

    if (window.innerWidth <= 700) return;
    const path = window.location.pathname + window.location.search;
    window.location.replace(`/demo/phone?path=${encodeURIComponent(path)}`);
  }, []);
  return null;
}
