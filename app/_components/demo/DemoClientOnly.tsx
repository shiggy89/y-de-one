"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { DEMO_MODE } from "@/lib/demo";

// デモのアプリ画面は、表示言語を Cookie（ブラウザ側）で決めるため、ブラウザでだけ描画する。
// サーバーで描くと、言語が分からず日本語と英語が食い違う。本番ではそのまま描画する。
const subscribe = () => () => {};

export default function DemoClientOnly({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (DEMO_MODE && !mounted) return null;
  return <>{children}</>;
}
