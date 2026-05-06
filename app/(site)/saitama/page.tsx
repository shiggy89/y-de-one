import type { Metadata } from "next";
import Hero from "../../_components/sections/class/Hero";
import SaitamaContent from "../../_components/sections/saitama/SaitamaContent";

export const metadata: Metadata = {
  title: "埼玉クラス（大宮・朝霞） | 大人バレエ教室 Y-de-ONE",
  description: "Y-de-ONEの埼玉クラス。大宮・朝霞の2拠点でレッスン開催。バレエ歴1年程度の方向けクラスです。",
};

export default function SaitamaPage() {
  return (
    <>
      <Hero
        title="大人バレエ教室 Y-de-ONE"
        subtitle="埼玉クラス -Saitama-"
      />
      <SaitamaContent />
    </>
  );
}
