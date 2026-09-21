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

        <div className={styles.phoneNotice} role="note">
          <span className={styles.phoneIcon} aria-hidden="true">
            <i className="fa-solid fa-mobile-screen-button" />
          </span>
          <div>
            <p className={styles.phoneNoticeTitle}>Best viewed on a smartphone</p>
            <p className={styles.phoneNoticeText}>
              The admin panel and My Page are used inside the LINE app on a phone, so they are designed for smartphones
              only. Please open this demo on your phone. On a computer, we show them in a phone-sized frame.
            </p>
          </div>
        </div>

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

        <section className={styles.website}>
          <div className={styles.websiteText}>
            <h2 className={styles.websiteTitle}>The school website</h2>
            <p className={styles.websiteBody}>
              The public website of Y-de-ONE, with classes, prices, the studio and access. Read it in English or in the
              original Japanese.
            </p>
          </div>
          <div className={styles.websiteLinks}>
            <Link className={styles.websitePrimary} href="/en">
              Website in English
            </Link>
            <Link className={styles.websiteSecondary} href="/">
              Website in Japanese (日本語)
            </Link>
          </div>
        </section>

        <section id="about-line" className={styles.line}>
          <h2 className={styles.lineTitle}>
            <i className={`fa-brands fa-line ${styles.lineLogo}`} aria-hidden="true" />
            What is LINE?
          </h2>
          <p className={styles.lineLead}>
            LINE is the messaging app most people in Japan use every day, for chatting, calling and paying.
            Many Japanese businesses, including this school, run their customer service inside it.
          </p>
          <ol className={styles.lineSteps}>
            <li>
              <strong>Students add the school on LINE.</strong> The school has an official account, which is a business
              account inside the app.
            </li>
            <li>
              <strong>The web app opens inside the chat.</strong> Booking a trial lesson, the My Page and the admin
              panel are web pages that run within LINE (built with LIFF, the LINE Front-end Framework). Nothing to
              install and no separate password: LINE itself signs the person in.
            </li>
            <li>
              <strong>Messages arrive in the same chat.</strong> Booking confirmations and announcements are sent as LINE
              messages, and the teachers manage everything from the admin panel.
            </li>
          </ol>
          <p className={styles.lineNote}>
            In this demo, sign-in with LINE is replaced by the role picker above, and no messages are sent.
          </p>
        </section>

        <section className={styles.notes}>
          <h2 className={styles.notesTitle}>About this sandbox</h2>
          <ul className={styles.notesList}>
            <li>All people, attendance and announcements are fictional sample data.</li>
            <li>LINE messages and emails are switched off. Nothing you do reaches a real person.</li>
            <li>Feel free to edit, add or delete. The data resets every day.</li>
            <li>Uploads are limited to images up to 2 MB.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
