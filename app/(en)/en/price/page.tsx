import type { Metadata } from "next";
import Hero from "../../../_components/sections/class/Hero";
import Price from "../../../_components/sections/price/Price";

export const metadata: Metadata = {
  title: "Price | Y-de-ONE adult ballet school, Tokyo",
  description:
    "Prices at Y-de-ONE adult ballet school. No joining fee, trial lesson ¥3,500, and a pay-as-you-go system where each lesson gets cheaper the more you come.",
};

export default function EnglishPricePage() {
  return (
    <>
      <Hero title={"Adult Ballet Y-de-ONE"} subtitle="Price" lang="en" />
      <Price lang="en" />
    </>
  );
}
