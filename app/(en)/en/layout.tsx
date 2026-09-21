import { notFound } from "next/navigation";
import Header from "../../_components/layout/Header/Header";
import Footer from "../../_components/layout/Footer/Footer";
import { DEMO_MODE } from "@/lib/demo";

// 英語版のホームページ。デモ環境だけで公開する（本番の日本語サイトには影響しない）。
export default function EnglishSiteLayout({ children }: { children: React.ReactNode }) {
  if (!DEMO_MODE) notFound();
  return (
    <>
      <div data-lang="en">
        <Header lang="en" />
        {children}
        <Footer lang="en" />
      </div>
    </>
  );
}
