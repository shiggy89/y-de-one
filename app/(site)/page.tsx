import Hero from "../_components/sections/top/Hero";
import Features from "../_components/sections/top/Features";
import Compare from "../_components/sections/top/Compare";
import Flow from "../_components/sections/top/Flow";
import About from "../_components/sections/top/About";
import Access from "../_components/sections/top/Access";
import Faq from "../_components/sections/top/Faq";
import styles from "./page.module.css";

export default function Page() {
  return (
    <>
      <main className={styles.topPageMain}>
        <Hero />
        <Features />
        <Compare />
        <Flow />
        <About />
        <Access />
        <Faq />
      </main>
    </>
  );
}
