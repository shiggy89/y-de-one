import type { Metadata } from "next";
import Hero from "../../../_components/sections/class/Hero";
import Studio from "../../../_components/sections/studio/Studio";

export const metadata: Metadata = {
  title: "The studio & lesson videos | Y-de-ONE adult ballet school, Tokyo",
  description:
    "Photos of the Y-de-ONE studio in Takadanobaba, Tokyo, and videos of real lessons. Have a look before you book a trial lesson.",
};

export default function EnglishStudioPage() {
  return (
    <>
      <Hero title={"Adult\u00a0Ballet Y-de-ONE"} subtitle="The studio" lang="en" />
      <Studio lang="en" />
    </>
  );
}
