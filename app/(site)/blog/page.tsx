import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "../../../lib/supabase";
import Heading2 from "../../_components/sections/common/Heading2";
import styles from "./blog.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ブログ | 大人バレエ教室 Y-de-ONE",
  description: "大人バレエ教室 Y-de-ONE（ワイデワン）のブログ。レッスンの様子や日々の出来事をお届けします。",
};

export default async function BlogPage() {
  const { data } = await supabaseAdmin
    .from("posts")
    .select("id, title, thumbnail_url, published_at, type")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const items = data ?? [];

  return (
    <main>
      <div className={`inner ${styles.blogPage}`}>
        <Heading2
          title="ブログ"
          lead={<>Y-de-ONEのレッスンや<br className={styles.mobileBreak} />日々の出来事をお届けします。</>}
        />
        {items.length === 0 ? (
          <p className={styles.empty}>まだ記事がありません。</p>
        ) : (
          <ul className={styles.blogList}>
            {items.map((item) => (
              <li key={item.id} className={styles.blogCard}>
                <Link href={`/blog/${item.id}`} className={styles.blogLink}>
                  <div className={styles.blogThumb}>
                    {item.thumbnail_url ? (
                      <Image
                        src={item.thumbnail_url}
                        alt={item.title}
                        width={400}
                        height={300}
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
                      {item.published_at
                        ? new Date(item.published_at).toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : ""}
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
  );
}
