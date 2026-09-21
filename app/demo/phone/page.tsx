import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMO_MODE } from "@/lib/demo";
import styles from "./phone.module.css";

export const metadata: Metadata = { title: "Y-de-ONE Demo" };

// 許可する画面（外部のURLや別の画面は枠に入れない）
const ALLOWED = /^\/(admin|mypage|trial|register)(\?[\w=&%.-]*)?$/;

export default async function PhonePage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  if (!DEMO_MODE) notFound();
  const { path } = await searchParams;
  if (!path || !ALLOWED.test(path)) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.side}>
        <p className={styles.badge}>Smartphone view</p>
        <h1 className={styles.title}>Best viewed on a smartphone</h1>
        <p className={styles.text}>
          In real life this screen opens inside the LINE app on a phone, so it is designed for phones only.
          On a computer we show it in a phone-sized frame.
        </p>
        <p className={styles.text}>For the best experience, open this demo on your phone.</p>
        <Link className={styles.back} href="/demo">
          Back to the demo menu
        </Link>
      </div>
      <div className={styles.phone}>
        <iframe className={styles.screen} src={path} title="Y-de-ONE app in a phone frame" />
      </div>
    </main>
  );
}
