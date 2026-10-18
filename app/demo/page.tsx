import type { Metadata } from "next";
import DemoEntry from "./DemoEntry";

export const metadata: Metadata = {
  title: "Y-de-ONE デモ",
  description: "Y-de-ONE バレエ教室アプリのデモ。LINE なしで管理画面と生徒のマイページを試せます。",
};

// demo.y-de-one.com/ で表示する日本語の入口ページ
export default function DemoPage() {
  return <DemoEntry lang="ja" />;
}
