import type { Metadata } from "next";
import Hero from "../../_components/sections/class/Hero";
import DownSyndromeContent from "../../_components/sections/down-syndrome/DownSyndromeContent";

export const metadata: Metadata = {
  title: "ダウン症ダンスクラス | 大人バレエ教室 Y-de-ONE",
  description: "Y-de-ONEのダウン症ダンスクラス。ダウン症のある方を対象とした少人数制の特別クラス。ストレッチ・リズム・バレエの動きを安全な環境で楽しめます。",
};

export default function DownSyndromePage() {
  return (
    <>
      <Hero
        title="Y-de-ONE"
        subtitle={<>ダウン症の方向け<br />ダンスクラス</>}
      />
      <DownSyndromeContent />
    </>
  );
}
