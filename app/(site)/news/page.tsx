import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "../../../lib/supabase";
import Heading2 from "../../_components/sections/common/Heading2";
import styles from "./news.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "お知らせ | 大人バレエ教室 Y-de-ONE",
  description: "大人バレエ教室 Y-de-ONE（ワイデワン）からの最新お知らせ。休講・振替情報、祝日レッスン、舞台・イベント情報を随時更新しています。",
};

export default async function NewsPage() {
  const { data } = await supabaseAdmin
    .from("hp_news")
    .select("*")
    .order("published_at", { ascending: false });

  const items = data ?? [];

  return (
    <main>
      <div className={`inner ${styles.newsPage}`}>
        <Heading2
          title="お知らせ"
          lead="Y-de-ONEからの最新情報をお届けします。"
        />
        {items.length === 0 ? (
          <p className={styles.empty}>お知らせはありません。</p>
        ) : (
          <ul className={styles.newsList}>
            {items.map((item) => (
              <li key={item.id} className={styles.newsItem}>
                <div className={styles.newsMeta}>
                  <time className={styles.newsDate}>
                    {new Date(item.published_at).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  {item.category && (
                    <span className={styles.newsCategory} data-category={item.category}>
                      {item.category}
                    </span>
                  )}
                </div>
                <p className={styles.newsTitle}>{item.title}</p>
                {item.content && item.content.trim() && (
                  <Link href={`/news/${item.id}`} className={styles.readMore}>
                    続きを読む →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
