import type { Metadata } from "next";
import Hero from "../../_components/sections/class/Hero";
import Price from "../../_components/sections/price/Price";

export const metadata: Metadata = {
  title: "料金 | 大人バレエ教室 Y-de-ONE",
  description: "大人バレエ教室 Y-de-ONE（ワイデワン）の料金案内。入会金なし・体験レッスン3,300円。通えば通うほど1回あたりの料金がお得になる都度払いシステム。",
};

export default function Page() {
  return (
    <>
      <Hero
        title="大人バレエ教室 Y-de-ONE"
        subtitle="料金 -Price-"
      />
      <Price />
    </>
  );
}
