import type { Metadata } from "next";
import Hero from "../../_components/sections/class/Hero";
import Studio from "../../_components/sections/studio/Studio";

export const metadata: Metadata = {
  title: "スタジオ・レッスン動画 | 大人バレエ教室 Y-de-ONE",
  description: "高田馬場・東中野・落合・新宿エリアの大人バレエ教室 Y-de-ONE（ワイデワン）のスタジオ紹介と実際のレッスン動画。体験レッスン前にぜひご覧ください。",
};

export default function Page() {
  return (
    <>
      <Hero
        title="大人バレエ教室 Y-de-ONE"
        subtitle="スタジオ -Studio-"
      />
      <Studio />
    </>
  );
}
