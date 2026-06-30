import type { Metadata } from "next";
import { supabaseAdmin } from "../../../lib/supabase";
import Heading2 from "../../_components/sections/common/Heading2";
import styles from "./lesson-info.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "レッスン変更・休講のお知らせ | 大人バレエ教室 Y-de-ONE",
  description: "大人バレエ教室 Y-de-ONE の祝日・変更・不定期レッスンと休講のお知らせ。",
};

export default async function LessonInfoPage() {
  const { data } = await supabaseAdmin.from("lesson_info").select("section, content");
  const items = data ?? [];
  const changeContent = items.find((r) => r.section === "change")?.content ?? "";
  const closedContent = items.find((r) => r.section === "closed")?.content ?? "";

  return (
    <main>
      <div className={`inner ${styles.page}`}>
        <section className={styles.section}>
          <Heading2 title="祝日・変更・不定期レッスン" />
          {changeContent.trim() ? (
            <p className={styles.content}>{changeContent}</p>
          ) : (
            <p className={styles.empty}>現在お知らせはありません。</p>
          )}
        </section>

        <hr className={styles.divider} />

        <section className={styles.section}>
          <Heading2 title="休講" />
          {closedContent.trim() ? (
            <p className={styles.content}>{closedContent}</p>
          ) : (
            <p className={styles.empty}>現在お知らせはありません。</p>
          )}
        </section>
      </div>
    </main>
  );
}
