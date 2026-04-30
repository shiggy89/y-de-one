import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "../../../../lib/supabase";
import Heading2 from "../../../_components/sections/common/Heading2";
import styles from "../news.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin.from("hp_news").select("title").eq("id", id).single();
  return {
    title: `${data?.title ?? "お知らせ"} | 大人バレエ教室 Y-de-ONE`,
    description: "大人バレエ教室 Y-de-ONE（ワイデワン）からのお知らせです。",
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin.from("hp_news").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <main>
      <div className={`inner ${styles.newsPage}`}>
        <Heading2 title="お知らせ" />
        <Link href="/news" className={styles.backLink}>← 一覧へ戻る</Link>
        <article className={styles.article}>
          <div className={styles.articleMeta}>
            <time className={styles.newsDate}>
              {new Date(data.published_at).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {data.category && (
              <span className={styles.newsCategory} data-category={data.category}>
                {data.category}
              </span>
            )}
          </div>
          <h1 className={styles.articleTitle}>{data.title}</h1>
          {data.content && (
            <div className={styles.articleBody}>
              {data.content.split("\n").map((line: string, i: number) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
