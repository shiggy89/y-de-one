import type { Metadata } from "next";
import styles from "./page.module.css";
import ModernBalletHero from "../../_components/sections/modern-ballet/Hero";
import ModernBalletFeatures from "../../_components/sections/modern-ballet/Features";
import ModernBalletClass from "../../_components/sections/modern-ballet/Class";
import ModernBalletInstructor from "../../_components/sections/modern-ballet/Instructor";
import ModernBalletFaq from "../../_components/sections/modern-ballet/Faq";
import Flow from "../../_components/sections/top/Flow";
import Access from "../../_components/sections/top/Access";
import SectionCtaButton from "../../_components/sections/common/SectionCtaButton";

export const metadata: Metadata = {
  title: "モダンバレエ | Y-de-ONE バレエ教室",
  description: "東京・高田馬場でモダンバレエが学べるY-de-ONE。初心者向けプレモダンクラスから本格的なモダンバレエクラスまで週5回開講。バレエと一緒に楽しめます。",
};

export default function ModernBalletPage() {
  return (
    <main className={styles.page}>
      <ModernBalletHero />
      <ModernBalletFeatures />
      <ModernBalletClass />
      <ModernBalletInstructor />
      <Flow hideIcons variant="modern-ballet" />
      <div className={styles.accessWrapper}>
        <Access variant="modern-ballet" />
      </div>
      <ModernBalletFaq />
      <SectionCtaButton className={styles.lastCta} />
    </main>
  );
}
