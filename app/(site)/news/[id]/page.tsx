import { client } from "../../../../lib/microcms";
import type { Notice } from "../../../../lib/microcms";
import Heading2 from "../../../_components/sections/common/Heading2";
import styles from "../news.module.css";
import Link from "next/link";

export const revalidate = 60;

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await client.get<Notice>({
    endpoint: "news",
    contentId: id,
  });

  return (
    <main>
      <div className={`inner ${styles.newsPage}`}>
        <Heading2 title="お知らせ" />
        <Link href="/news" className={styles.backLink}>
          ← 一覧へ戻る
        </Link>
        <article className={styles.article}>
          <div className={styles.articleMeta}>
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
              <span className={styles.newsCategory} data-category={item.category.name}>
                {item.category.name}
              </span>
            )}
          </div>
          <h1 className={styles.articleTitle}>{item.title}</h1>
          <div
            className={styles.articleBody}
            dangerouslySetInnerHTML={{ __html: typeof item.content === "string" ? item.content : (item.content as { html?: string })?.html ?? "" }}
          />
        </article>
      </div>
    </main>
  );
}
