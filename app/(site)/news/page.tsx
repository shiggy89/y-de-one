import type { Metadata } from "next";
import Link from "next/link";
import { client } from "../../../lib/microcms";
import type { Notice } from "../../../lib/microcms";
import Heading2 from "../../_components/sections/common/Heading2";
import styles from "./news.module.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "お知らせ | 大人バレエ教室 Y-de-ONE",
  description: "大人バレエ教室 Y-de-ONE（ワイデワン）からの最新お知らせ。休講・振替情報、祝日レッスン、舞台・イベント情報を随時更新しています。",
};

export default async function NewsPage() {
  const data = await client.getList<Notice>({
    endpoint: "news",
    queries: { limit: 100, orders: "-publishedAt" },
  });

  return (
    <>
      <main>
        <div className={`inner ${styles.newsPage}`}>
          <Heading2
            title="お知らせ"
            lead="Y-de-ONEからの最新情報をお届けします。"
          />
          <ul className={styles.newsList}>
            {data.contents.map((item) => (
              <li key={item.id} className={styles.newsItem}>
                <div className={styles.newsMeta}>
                  <time className={styles.newsDate}>
                    {new Date(item.createdAt).toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  {item.category && (
                    <span
                      className={styles.newsCategory}
                      data-category={item.category.name}
                    >
                      {item.category.name}
                    </span>
                  )}
                </div>
                <p className={styles.newsTitle}>{item.title}</p>
                {(() => {
                  const html = typeof item.content === "string" ? item.content : (item.content as { html?: string })?.html ?? "";
                  const hasContent = html.replace(/<[^>]*>/g, "").trim().length > 0;
                  return hasContent ? (
                    <Link href={`/news/${item.id}`} className={styles.readMore}>続きを読む →</Link>
                  ) : null;
                })()}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
