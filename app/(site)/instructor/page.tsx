import type { Metadata } from "next";
import Hero from "../../_components/sections/class/Hero";
import Instructor from "../../_components/sections/instructor/Instructor";

export const metadata: Metadata = {
  title: "講師紹介 | 大人バレエ教室 Y-de-ONE",
  description: "大人バレエ教室 Y-de-ONE（ワイデワン）の講師紹介。青山佳樹・門馬和樹・松井眞琴。全員が大人になってからバレエを始めた経歴を持つ講師陣です。",
};

export default function Page() {
  return (
    <>
      <Hero
        title="大人バレエ教室 Y-de-ONE"
        subtitle="講師 -Dancer-"
      />
      <Instructor />
    </>
  );
}
