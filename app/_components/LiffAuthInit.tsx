"use client";

import { useEffect } from "react";
import liff from "@line/liff";

export default function LiffAuthInit() {
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const code = search.get("code");
    if (!code) return;

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) return;

    // LINEログイン後の認証コールバック。liff.init()でコードを処理し、
    // LIFF SDKが自動的にliff.stateのパスへリダイレクトする。
    liff.init({ liffId }).catch(console.error);
  }, []);

  return null;
}
