import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { client } from "../../../lib/microcms";
import type { Blog } from "../../../lib/microcms";
import Heading2 from "../../_components/sections/common/Heading2";
import styles from "./blog.module.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "ブログ | 大人バレエ教室 Y-de-ONE",
  description: "大人バレエ教室 Y-de-ONE（ワイデワン）のブログ。レッスンの様子や日々の出来事をお届けします。",
};

export default async function BlogPage() {
  const data = await client.getList<Blog>({
    endpoint: "blog",
    queries: { limit: 100, orders: "-publishedAt" },
  });

  return (
    <>
      <main>
        <div className={`inner ${styles.blogPage}`}>
          <Heading2
            title="ブログ"
            lead={<>Y-de-ONEのレッスンや<br className={styles.mobileBreak} />日々の出来事をお届けします。</>}
          />
          {data.contents.length === 0 ? (
            <p className={styles.empty}>まだ記事がありません。</p>
          ) : (
            <ul className={styles.blogList}>
              {data.contents.map((item) => (
                <li key={item.id} className={styles.blogCard}>
                  <Link href={`/blog/${item.id}`} className={styles.blogLink}>
                    <div className={styles.blogThumb}>
                      {item.eyecatch ? (
                        <Image
                          src={item.eyecatch.url}
                          alt={item.title}
                          width={item.eyecatch.width}
                          height={item.eyecatch.height}
                          className={styles.thumbImg}
                        />
                      ) : (
                        <div className={styles.thumbPlaceholder}>
                          <i className="fa-solid fa-image"></i>
                        </div>
                      )}
                    </div>
                    <div className={styles.blogInfo}>
                      <time className={styles.blogDate}>
                        {new Date(item.publishedAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                      <p className={styles.blogTitle}>{item.title}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
