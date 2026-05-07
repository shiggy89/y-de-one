import type { Metadata } from "next";
import Hero from "../../_components/sections/class/Hero";
import SaitamaContent from "../../_components/sections/saitama/SaitamaContent";

export const metadata: Metadata = {
  title: "埼玉クラス（大宮・朝霞） | 大人バレエ教室 Y-de-ONE",
  description: "埼玉エリア（大宮・朝霞台）でバレエを楽しみたい方へ。ワイデワン講師・門馬和樹が担当するバレエクラスです。初心者・ブランクのある方も歓迎。月謝制・単発参加どちらも対応しています。",
};

export default function SaitamaPage() {
  return (
    <>
      <Hero
        title="埼玉エリアでバレエを楽しみたい方へ"
        subtitle="門馬和樹クラス"
      />
      <SaitamaContent />
    </>
  );
}
