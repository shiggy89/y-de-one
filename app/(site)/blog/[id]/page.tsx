import Image from "next/image";
import Link from "next/link";
import { client } from "../../../../lib/microcms";
import type { Blog } from "../../../../lib/microcms";
import Heading2 from "../../../_components/sections/common/Heading2";
import styles from "../blog.module.css";

export const revalidate = 60;

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await client.get<Blog>({
    endpoint: "blog",
    contentId: id,
  });

  const html = typeof item.content === "string"
    ? item.content
    : (item.content as { html?: string })?.html ?? "";

  return (
    <>
      <main>
        <div className={`inner ${styles.blogPage}`}>
          <Heading2 title="ブログ" />
          <Link href="/blog" className={styles.backLink}>← ブログ一覧へ</Link>
          <article className={styles.article}>
            <time className={styles.blogDate}>
              {new Date(item.publishedAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <h1 className={styles.articleTitle}>{item.title}</h1>
            {item.eyecatch && (
              <div className={styles.articleEyecatch}>
                <Image
                  src={item.eyecatch.url}
                  alt={item.title}
                  width={item.eyecatch.width}
                  height={item.eyecatch.height}
                  className={styles.eyecatchImg}
                />
              </div>
            )}
            <div
              className={styles.articleBody}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </article>
        </div>
      </main>
    </>
  );
}
