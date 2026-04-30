import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "../../../../lib/supabase";
import Heading2 from "../../../_components/sections/common/Heading2";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin.from("posts").select("title, meta_description").eq("id", id).single();
  return {
    title: `${data?.title ?? "ブログ"} | 大人バレエ教室 Y-de-ONE`,
    description: data?.meta_description ?? "大人バレエ教室 Y-de-ONE（ワイデワン）のブログ記事です。",
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();
  if (!data) notFound();

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
          <div
            className={styles.articleBody}
            dangerouslySetInnerHTML={{ __html: data.content ?? "" }}
          />
        </article>
      </div>
    </main>
  );
}
