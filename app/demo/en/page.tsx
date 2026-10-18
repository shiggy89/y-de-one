import type { Metadata } from "next";
import DemoEntry from "../DemoEntry";

export const metadata: Metadata = {
  title: "Y-de-ONE Demo",
  description: "Sandbox of the Y-de-ONE ballet school app. Try the admin panel and the student My Page without LINE.",
};

// demo.y-de-one.com/en で表示する英語の入口ページ
export default function DemoEnPage() {
  return <DemoEntry lang="en" />;
}
