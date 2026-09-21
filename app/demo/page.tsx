import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMO_MODE } from "@/lib/demo";
import styles from "./demo.module.css";

export const metadata: Metadata = {
  title: "Y-de-ONE Demo",
  description: "Sandbox of the Y-de-ONE ballet school app. Try the admin panel and the student My Page without LINE.",
};

// 役割の切り替えは Cookie を書き換える API への GET。Link のプリフェッチで動かないよう <a> を使う。
const ENTRIES = [
  {
    title: "Admin panel",
    body: "Record attendance, review monthly ledgers, manage members, badges and announcements.",
    href: "/api/demo/enter?role=admin&next=/admin",
    cta: "Open as admin",
    accent: "pink",
  },
  {
    title: "Student My Page",
    body: "See a member's attendance history, badge progress and the school's announcements.",
    href: "/api/demo/enter?role=member&next=/mypage",
    cta: "Open as a student",
    accent: "blue",
  },
  {
    title: "Trial lesson form",
    body: "Book a trial lesson as a new visitor. Your entry appears in the admin panel.",
    href: "/api/demo/enter?role=guest&next=/trial",
    cta: "Try the form",
    accent: "yellow",
  },
] as const;

export default function DemoPage() {
  if (!DEMO_MODE) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>PORTFOLIO DEMO</p>
        <h1 className={styles.title}>Y-de-ONE Ballet School</h1>
        <p className={styles.lead}>
          A sandbox of the school&apos;s LINE mini-app. Sign-in with LINE is replaced by the role you pick below,
          so you can explore everything without an account.
        </p>

        <ul className={styles.grid}>
          {ENTRIES.map((entry) => (
            <li key={entry.title} className={`${styles.card} ${styles[entry.accent]}`}>
              <h2 className={styles.cardTitle}>{entry.title}</h2>
              <p className={styles.cardBody}>{entry.body}</p>
              <a className={styles.cta} href={entry.href}>
                {entry.cta}
              </a>
            </li>
          ))}
        </ul>

        <section className={styles.notes}>
          <h2 className={styles.notesTitle}>About this sandbox</h2>
          <ul className={styles.notesList}>
            <li>All people, attendance and announcements are fictional sample data.</li>
            <li>LINE messages and emails are switched off. Nothing you do reaches a real person.</li>
            <li>Feel free to edit, add or delete. The data resets every day.</li>
            <li>Uploads are limited to images up to 2 MB.</li>
          </ul>
          <p className={styles.siteLink}>
            <Link href="/">Go to the school website</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
