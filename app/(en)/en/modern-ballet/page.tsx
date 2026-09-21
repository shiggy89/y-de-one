import type { Metadata } from "next";
import styles from "../../../(site)/modern-ballet/page.module.css";
import ModernBalletHero from "../../../_components/sections/modern-ballet/Hero";
import ModernBalletFeatures from "../../../_components/sections/modern-ballet/Features";
import ModernBalletClass from "../../../_components/sections/modern-ballet/Class";
import ModernBalletInstructor from "../../../_components/sections/modern-ballet/Instructor";
import ModernBalletFaq from "../../../_components/sections/modern-ballet/Faq";
import Flow from "../../../_components/sections/top/Flow";
import Access from "../../../_components/sections/top/Access";
import SectionCtaButton from "../../../_components/sections/common/SectionCtaButton";

export const metadata: Metadata = {
  title: "Modern ballet | Y-de-ONE ballet school, Tokyo",
  description:
    "Learn modern ballet in Takadanobaba, Tokyo. From the beginner Pre-Modern class to full Modern Ballet classes, five days a week, alongside ballet.",
};

export default function EnglishModernBalletPage() {
  return (
    <main className={styles.page}>
      <ModernBalletHero lang="en" />
      <ModernBalletFeatures lang="en" />
      <ModernBalletClass lang="en" />
      <ModernBalletInstructor lang="en" />
      <Flow hideIcons variant="modern-ballet" lang="en" />
      <div className={styles.accessWrapper}>
        <Access variant="modern-ballet" lang="en" />
      </div>
      <ModernBalletFaq lang="en" />
      <SectionCtaButton className={styles.lastCta} lang="en" />
    </main>
  );
}
