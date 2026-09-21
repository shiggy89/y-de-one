import type { Metadata } from "next";
import { supabaseAdmin } from "../../../../lib/supabase";
import Heading2 from "../../../_components/sections/common/Heading2";
import styles from "../../../(site)/lesson-info/lesson-info.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule changes & closures | Y-de-ONE adult ballet school",
  description: "Public holiday, changed and irregular lessons and closures at Y-de-ONE adult ballet school.",
};

// お知らせの本文は管理画面から入力された内容をそのまま表示する
export default async function EnglishLessonInfoPage() {
  const { data } = await supabaseAdmin.from("lesson_info").select("section, content");
  const items = data ?? [];
  const changeContent = items.find((r) => r.section === "change")?.content ?? "";
  const closedContent = items.find((r) => r.section === "closed")?.content ?? "";

  return (
    <main>
      <div className={`inner ${styles.page}`}>
        <section className={styles.section}>
          <Heading2 title="Public holiday, changed and irregular lessons" />
          {changeContent.trim() ? (
            <p className={styles.content}>{changeContent}</p>
          ) : (
            <p className={styles.empty}>There are no announcements at the moment.</p>
          )}
        </section>

        <hr className={styles.divider} />

        <section className={styles.section}>
          <Heading2 title="Closures" />
          {closedContent.trim() ? (
            <p className={styles.content}>{closedContent}</p>
          ) : (
            <p className={styles.empty}>There are no announcements at the moment.</p>
          )}
        </section>
      </div>
    </main>
  );
}
