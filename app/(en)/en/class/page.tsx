import type { Metadata } from "next";
import Hero from "../../../_components/sections/class/Hero";
import Class from "../../../_components/sections/class/Class";
import Schedule from "../../../_components/sections/class/Schedule";

export const metadata: Metadata = {
  title: "Classes & schedule | Y-de-ONE adult ballet school, Tokyo",
  description:
    "Six adult ballet and modern ballet classes at Y-de-ONE in Takadanobaba, Tokyo, from Ballet Introduction to Pointe. Open Tuesday to Sunday, 13:00 to 21:00.",
};

export default function EnglishClassPage() {
  return (
    <>
      <Hero title={"Adult Ballet Y-de-ONE"} subtitle="Classes" lang="en" />
      <Class lang="en" />
      <Schedule lang="en" />
    </>
  );
}
