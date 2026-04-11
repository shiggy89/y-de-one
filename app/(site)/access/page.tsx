import type { Metadata } from "next";
import Hero from "../../_components/sections/class/Hero";
import Access from "../../_components/sections/access/Access";

export const metadata: Metadata = {
  title: "アクセス | 大人バレエ教室 Y-de-ONE｜高田馬場・東中野・落合・新宿",
  description: "大人バレエ教室 Y-de-ONE（ワイデワン）へのアクセス。東京都新宿区高田馬場3丁目。高田馬場・東中野・落合・新宿の各駅から徒歩圏内。",
};

export default function Page() {
  return (
    <>
      <Hero
        title="大人バレエ教室 Y-de-ONE"
        subtitle="アクセス -Access-"
      />
      <Access />
    </>
  );
}
