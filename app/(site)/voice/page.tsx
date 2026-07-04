import type { Metadata } from "next";
import Hero from "../../_components/sections/class/Hero";
import Reviews from "../../_components/sections/voice/Reviews";

export const metadata: Metadata = {
  title: "生徒の声・口コミ・体験談 | 大人バレエ教室 Y-de-ONE（ワイデワン）レビュー",
  description: "大人バレエ教室 Y-de-ONE（ワイデワン）の生徒の声・口コミ・体験談。Google評価5.0。高田馬場で大人から始めるバレエ・モダンバレエ教室。初心者・50代からも安心して通えると好評です。",
};

export default function VoicePage() {
  return (
    <>
      <Hero
        title="大人バレエ教室 Y-de-ONE"
        subtitle="生徒の声 -Voice-"
      />
      <Reviews />
    </>
  );
}
