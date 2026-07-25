import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "../../../../lib/supabase";
import Heading2 from "../../../_components/sections/common/Heading2";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

function extractHeadings(html: string): { id: string; text: string }[] {
  const headings: { id: string; text: string }[] = [];
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(html))) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text) headings.push({ id: `heading-${i}`, text });
    i++;
  }
  return headings;
}

function injectHeadingIds(html: string): string {
  let i = 0;
  return html.replace(/<h2([^>]*)>/gi, (_, attrs) => `<h2${attrs} id="heading-${i++}">`);
}

function extractFirstImage(html: string | null): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const numId = Number(slug);
  const query = supabaseAdmin.from("posts").select("title, meta_description").eq("status", "published");
  const { data } = await (numId ? query.eq("id", numId) : query.eq("slug", slug)).single();
  return {
    title: `${data?.title ?? "ブログ"} | 大人バレエ教室 Y-de-ONE`,
    description: data?.meta_description ?? "大人バレエ教室 Y-de-ONE（ワイデワン）のブログ記事です。",
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const numId = Number(slug);
  const query = supabaseAdmin.from("posts").select("*").eq("status", "published");
  const { data } = await (numId ? query.eq("id", numId) : query.eq("slug", slug)).single();
  if (!data) notFound();

  const headings = extractHeadings(data.content ?? "");
  const contentWithIds = injectHeadingIds(data.content ?? "");

  const relatedCols = "id, title, slug, thumbnail_url, content, published_at, category_id";
  let related: { id: number; title: string; slug: string | null; thumbnail_url: string | null; content: string | null; published_at: string | null; category_id: number | null }[] = [];

  if (data.category_id) {
    const { data: byCategory } = await supabaseAdmin
      .from("posts")
      .select(relatedCols)
      .eq("status", "published")
      .eq("category_id", data.category_id)
      .neq("id", data.id)
      .order("published_at", { ascending: false })
      .limit(3);
    related = byCategory ?? [];
  }
  if (related.length === 0) {
    const { data: byType } = await supabaseAdmin
      .from("posts")
      .select(relatedCols)
      .eq("status", "published")
      .eq("type", data.type)
      .neq("id", data.id)
      .order("published_at", { ascending: false })
      .limit(3);
    related = byType ?? [];
  }

  return (
    <main>
      <div className={`inner ${styles.blogPage}`}>
        <Heading2 title="ブログ" />
        <Link href="/blog" className={styles.backLink}>← ブログ一覧へ</Link>
        <article className={styles.article}>
          <time className={styles.blogDate}>
            {data.published_at
              ? new Date(data.published_at).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "Asia/Tokyo",
                })
              : ""}
          </time>
          <h1 className={styles.articleTitle}>{data.title}</h1>
          {data.thumbnail_url && (
            <div className={styles.articleEyecatch}>
              <Image
                src={data.thumbnail_url}
                alt={data.title}
                width={800}
                height={600}
                className={styles.eyecatchImg}
              />
            </div>
          )}
          {headings.length > 1 && (
            <nav className={styles.toc}>
              <p className={styles.tocTitle}>目次</p>
              <ol className={styles.tocList}>
                {headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`}>{h.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div
            className={styles.articleBody}
            dangerouslySetInnerHTML={{ __html: contentWithIds }}
          />
        </article>

        {related.length > 0 && (
          <div className={styles.relatedSection}>
            <p className={styles.relatedTitle}>この記事も読まれています</p>
            <ul className={styles.blogList}>
              {related.map((item) => (
                <li key={item.id} className={styles.blogCard}>
                  <Link href={`/blog/${item.slug ?? item.id}`} className={styles.blogLink}>
                    <div className={styles.blogThumb}>
                      {(() => {
                        const src = item.thumbnail_url || extractFirstImage(item.content);
                        return src ? (
                          <Image
                            src={src}
                            alt={item.title}
                            width={400}
                            height={300}
                            className={styles.thumbImg}
                          />
                        ) : (
                          <div className={styles.thumbPlaceholder}>
                            <i className="fa-solid fa-image"></i>
                          </div>
                        );
                      })()}
                    </div>
                    <div className={styles.blogInfo}>
                      <time className={styles.blogDate}>
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString("ja-JP", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              timeZone: "Asia/Tokyo",
                            })
                          : ""}
                      </time>
                      <p className={styles.blogTitle}>{item.title}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
