import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMO_MODE, type DemoLang } from "@/lib/demo";
import { homePath } from "@/lib/i18n";
import styles from "./demo.module.css";

// デモの入口ページ。日本語は demo.y-de-one.com/、英語は /en で表示する（middleware で振り分け）。
// 役割の切り替えは Cookie を書き換える API への GET。Link のプリフェッチで動かないよう <a> を使う。
const COPY = {
  ja: {
    switchLabel: "English",
    switchHref: "/en",
    switchHrefLang: "en",
    eyebrow: "PORTFOLIO DEMO",
    title: "Y-de-ONE バレエ教室",
    lead: "教室の LINE ミニアプリを、誰でも触れるように再現したデモです。LINE ログインの代わりに下の役割を選ぶだけで、アカウントなしですべての画面を試せます。",
    phoneTitle: "スマートフォンでの閲覧がおすすめです",
    phoneText:
      "管理画面とマイページは、スマートフォンの LINE アプリの中で使う画面なので、スマホ専用に作っています。できればスマートフォンで開いてください。パソコンではスマホ幅の枠に入れて表示します。",
    entries: [
      {
        title: "管理画面",
        body: "出席の記録、月ごとの売上の確認、会員・バッジ・お知らせの管理ができます。",
        role: "admin",
        next: "/admin",
        cta: "管理者として開く",
        accent: "pink",
      },
      {
        title: "生徒のマイページ",
        body: "生徒の出席履歴、バッジの進み具合、教室からのお知らせを確認できます。",
        role: "member",
        next: "/mypage",
        cta: "生徒として開く",
        accent: "blue",
      },
      {
        title: "体験レッスンの申込みフォーム",
        body: "初めての方として体験レッスンを申し込めます。申し込んだ内容は管理画面に表示されます。",
        role: "guest",
        next: "/trial",
        cta: "フォームを試す",
        accent: "yellow",
      },
    ],
    websiteTitle: "教室のホームページ",
    websiteBody: "クラス・料金・スタジオ・アクセスなどを載せた、Y-de-ONE の公式ホームページです。",
    websitePrimary: { label: "日本語のホームページ", href: homePath("ja") },
    websiteSecondary: null,
    lineTitle: "LINE ミニアプリの仕組み",
    lineLead: "生徒さんとのやりとりは、すべて教室の LINE 公式アカウントの中で完結します。",
    lineSteps: [
      { strong: "生徒さんが教室を友だち追加します。", text: "教室の LINE 公式アカウントが入口です。" },
      {
        strong: "トークの中で Web アプリが開きます。",
        text: "体験レッスンの申込み・マイページ・管理画面は、LINE の中で動く Web ページです（LIFF で作っています）。インストールもパスワードも不要で、LINE がそのままログインの代わりになります。",
      },
      {
        strong: "通知も同じトークに届きます。",
        text: "予約の確認やお知らせは LINE のメッセージで届き、先生は管理画面からすべてを管理します。",
      },
    ],
    lineNote: "このデモでは、LINE ログインの代わりに上の役割選びを使い、メッセージは送信しません。",
    notesTitle: "このデモについて",
    notes: [
      "登場する人物・出席記録・お知らせは、すべて架空のサンプルデータです。",
      "LINE メッセージとメールの送信は止めてあります。操作しても実在の人には何も届きません。",
      "自由に編集・追加・削除してかまいません。データは毎日リセットされます。",
      "アップロードできるのは 2MB までの画像だけです。",
    ],
  },
  en: {
    switchLabel: "日本語",
    switchHref: "/",
    switchHrefLang: "ja",
    eyebrow: "PORTFOLIO DEMO",
    title: "Y-de-ONE Ballet School",
    lead: "A sandbox of the school's LINE mini-app. Sign-in with LINE is replaced by the role you pick below, so you can explore everything without an account.",
    phoneTitle: "Best viewed on a smartphone",
    phoneText:
      "The admin panel and My Page are used inside the LINE app on a phone, so they are designed for smartphones only. Please open this demo on your phone. On a computer, we show them in a phone-sized frame.",
    entries: [
      {
        title: "Admin panel",
        body: "Record attendance, review monthly ledgers, manage members, badges and announcements.",
        role: "admin",
        next: "/admin",
        cta: "Open as admin",
        accent: "pink",
      },
      {
        title: "Student My Page",
        body: "See a member's attendance history, badge progress and the school's announcements.",
        role: "member",
        next: "/mypage",
        cta: "Open as a student",
        accent: "blue",
      },
      {
        title: "Trial lesson form",
        body: "Book a trial lesson as a new visitor. Your entry appears in the admin panel.",
        role: "guest",
        next: "/trial",
        cta: "Try the form",
        accent: "yellow",
      },
    ],
    websiteTitle: "The school website",
    websiteBody:
      "The public website of Y-de-ONE, with classes, prices, the studio and access. Read it in English or in the original Japanese.",
    websitePrimary: { label: "Website in English", href: homePath("en") },
    websiteSecondary: { label: "Website in Japanese (日本語)", href: homePath("ja") },
    lineTitle: "What is LINE?",
    lineLead:
      "LINE is the messaging app most people in Japan use every day, for chatting, calling and paying. Many Japanese businesses, including this school, run their customer service inside it.",
    lineSteps: [
      {
        strong: "Students add the school on LINE.",
        text: "The school has an official account, which is a business account inside the app.",
      },
      {
        strong: "The web app opens inside the chat.",
        text: "Booking a trial lesson, the My Page and the admin panel are web pages that run within LINE (built with LIFF, the LINE Front-end Framework). Nothing to install and no separate password: LINE itself signs the person in.",
      },
      {
        strong: "Messages arrive in the same chat.",
        text: "Booking confirmations and announcements are sent as LINE messages, and the teachers manage everything from the admin panel.",
      },
    ],
    lineNote: "In this demo, sign-in with LINE is replaced by the role picker above, and no messages are sent.",
    notesTitle: "About this sandbox",
    notes: [
      "All people, attendance and announcements are fictional sample data.",
      "LINE messages and emails are switched off. Nothing you do reaches a real person.",
      "Feel free to edit, add or delete. The data resets every day.",
      "Uploads are limited to images up to 2 MB.",
    ],
  },
} as const;

export default function DemoEntry({ lang }: { lang: DemoLang }) {
  if (!DEMO_MODE) notFound();
  const c = COPY[lang];

  return (
    <main className={styles.page} lang={lang}>
      <div className={styles.inner}>
        <div className={styles.langBar}>
          <Link className={styles.langSwitch} href={c.switchHref} hrefLang={c.switchHrefLang}>
            {c.switchLabel}
          </Link>
        </div>
        <p className={styles.eyebrow}>{c.eyebrow}</p>
        <h1 className={styles.title}>{c.title}</h1>
        <p className={styles.lead}>{c.lead}</p>

        <div className={styles.phoneNotice} role="note">
          <span className={styles.phoneIcon} aria-hidden="true">
            <i className="fa-solid fa-mobile-screen-button" />
          </span>
          <div>
            <p className={styles.phoneNoticeTitle}>{c.phoneTitle}</p>
            <p className={styles.phoneNoticeText}>{c.phoneText}</p>
          </div>
        </div>

        <ul className={styles.grid}>
          {c.entries.map((entry) => (
            <li key={entry.role} className={`${styles.card} ${styles[entry.accent]}`}>
              <h2 className={styles.cardTitle}>{entry.title}</h2>
              <p className={styles.cardBody}>{entry.body}</p>
              <a className={styles.cta} href={`/api/demo/enter?role=${entry.role}&next=${entry.next}&lang=${lang}`}>
                {entry.cta}
              </a>
            </li>
          ))}
        </ul>

        <section className={styles.website}>
          <div className={styles.websiteText}>
            <h2 className={styles.websiteTitle}>{c.websiteTitle}</h2>
            <p className={styles.websiteBody}>{c.websiteBody}</p>
          </div>
          <div className={styles.websiteLinks}>
            <Link className={styles.websitePrimary} href={c.websitePrimary.href}>
              {c.websitePrimary.label}
            </Link>
            {c.websiteSecondary && (
              <Link className={styles.websiteSecondary} href={c.websiteSecondary.href}>
                {c.websiteSecondary.label}
              </Link>
            )}
          </div>
        </section>

        <section id="about-line" className={styles.line}>
          <h2 className={styles.lineTitle}>
            <i className={`fa-brands fa-line ${styles.lineLogo}`} aria-hidden="true" />
            {c.lineTitle}
          </h2>
          <p className={styles.lineLead}>{c.lineLead}</p>
          <ol className={styles.lineSteps}>
            {c.lineSteps.map((step) => (
              <li key={step.strong}>
                <strong>{step.strong}</strong>
                {lang === "en" ? " " : ""}
                {step.text}
              </li>
            ))}
          </ol>
          <p className={styles.lineNote}>{c.lineNote}</p>
        </section>

        <section className={styles.notes}>
          <h2 className={styles.notesTitle}>{c.notesTitle}</h2>
          <ul className={styles.notesList}>
            {c.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
