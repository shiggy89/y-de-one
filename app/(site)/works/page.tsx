import type { Metadata } from "next";
import Hero from "../../_components/sections/class/Hero";
import Works from "../../_components/sections/works/Works";

export const metadata: Metadata = {
  title: "発表会・活動実績 | 大人バレエ教室 Y-de-ONE",
  description: "ワイデワンの発表会・舞台出演情報・活動実績。年1〜2回、野方区民ホール等での本格公演を開催。生徒さんも舞台出演できます。",
};

export default function Page() {
  return (
    <>
      <Hero
        title="大人バレエ教室 Y-de-ONE"
        subtitle="作品・活動 -Works-"
      />
      <Works />
    </>
  );
}
