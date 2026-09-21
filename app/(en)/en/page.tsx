import type { Metadata } from "next";
import Hero from "../../_components/sections/top/Hero";
import Features from "../../_components/sections/top/Features";
import ModernBalletFloat from "../../_components/sections/top/ModernBalletFloat";
import Compare from "../../_components/sections/top/Compare";
import Flow from "../../_components/sections/top/Flow";
import About from "../../_components/sections/top/About";
import Access from "../../_components/sections/top/Access";
import Faq from "../../_components/sections/top/Faq";
import styles from "../../(site)/page.module.css";

export const metadata: Metadata = {
  title: "Y-de-ONE | Adult ballet & modern ballet school in Tokyo (Takadanobaba, Shinjuku)",
  description:
    "Y-de-ONE is an adult ballet school in Takadanobaba, Shinjuku, Tokyo. No joining fee, beginners welcome, students from their teens to their 80s. Trial lessons are ¥3,500.",
};

export default function EnglishTopPage() {
  return (
    <>
      <main className={styles.topPageMain}>
        <Hero lang="en" />
        <Features lang="en" />
        <Compare lang="en" />
        <Flow lang="en" />
        <About lang="en" />
        <Access lang="en" />
        <Faq lang="en" />
      </main>
      <ModernBalletFloat lang="en" />
    </>
  );
}
