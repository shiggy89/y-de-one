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
        title="埼玉エリアで バレエを楽しみたい方へ"
        subtitle="門馬和樹クラス"
      />
      <SaitamaContent />
    </>
  );
}
