import type { Metadata } from "next";
import Hero from "../../_components/sections/class/Hero";
import Class from "../../_components/sections/class/Class";
import Schedule from "../../_components/sections/class/Schedule";

export const metadata: Metadata = {
  title: "クラス・スケジュール | 大人バレエ教室 Y-de-ONE",
  description: "大人バレエ教室 Y-de-ONE（ワイデワン）のクラス紹介とレッスンスケジュール。バレエ入門〜モダンバレエまで6クラス。火〜日曜日、13時〜21時開講。",
};

export default function Page() {
  return (
    <>
      <Hero 
        title="大人バレエ教室 Y-de-ONE"
        subtitle="クラス -Class-"
      />
      <Class />
      <Schedule />
    </>
  );
}
