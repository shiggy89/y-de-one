import Hero from "../../_components/sections/class/Hero";
import Class from "../../_components/sections/class/Class";
import Schedule from "../../_components/sections/class/Schedule";

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
