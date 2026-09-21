"use client";

import { useEffect } from "react";
import { DEMO_MODE } from "@/lib/demo";

// 管理画面・マイページ・申込みフォームはスマホ専用（本番では LINE アプリの中で開く）。
// デモを PC で開いたときは、スマホ幅の枠（/demo/phone）に入れて表示する。
// 枠の中（iframe）では何もしないので、繰り返し移動することはない。
export default function DemoPhoneRedirect() {
  useEffect(() => {
    if (!DEMO_MODE || window.self !== window.top || window.innerWidth <= 700) return;
    const path = window.location.pathname + window.location.search;
    window.location.replace(`/demo/phone?path=${encodeURIComponent(path)}`);
  }, []);
  return null;
}
