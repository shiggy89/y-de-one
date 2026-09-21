// 英語版（デモ環境の /en 以下）のための最小限の多言語ヘルパー。
// 各コンポーネントは lang を受け取り、文言を t("日本語", "English") の形で並べて持つ。
// lang を渡さなければ日本語のまま表示されるので、日本語ページの表示は変わらない。

import type { ReactNode } from "react";

export type Lang = "ja" | "en";

export type T = (ja: ReactNode, en: ReactNode) => ReactNode;

export function makeT(lang: Lang = "ja"): T {
  return (ja, en) => (lang === "en" ? en : ja);
}

// 英語版がある URL。ない URL（ブログ・お知らせなど）は、英語版から日本語版へリンクする。
const EN_PAGES = new Set([
  "/",
  "/class",
  "/price",
  "/studio",
  "/modern-ballet",
  "/lesson-info",
]);

// 英語ページ内のリンクを /en 付きにする。外部リンクや英語版がないページはそのまま。
export function localePath(lang: Lang, path: string): string {
  if (lang !== "en" || !path.startsWith("/")) return path;
  const base = path.split(/[?#]/)[0];
  if (!EN_PAGES.has(base)) return path;
  return base === "/" ? `/en${path.slice(1)}` : `/en${path}`;
}

// 現在のパスの、もう一方の言語での URL（言語切り替えリンク用）
export function alternatePath(lang: Lang, pathname: string): string {
  if (lang === "en") {
    const stripped = pathname.replace(/^\/en(?=\/|$)/, "");
    return stripped === "" ? "/" : stripped;
  }
  return EN_PAGES.has(pathname) ? (pathname === "/" ? "/en" : `/en${pathname}`) : "/en";
}
