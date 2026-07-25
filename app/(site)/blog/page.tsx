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

const PAGE_SIZE = 12;

type Post = {
  id: number;
  title: string;
  slug: string | null;
  thumbnail_url: string | null;
  content: string | null;
  published_at: string | null;
  type: string;
  category_id: number | null;
  meta_description: string | null;
};

const TYPE_TABS: { value: "seo" | "diary" | null; label: string }[] = [
  { value: null, label: "すべて" },
  { value: "seo", label: "お役立ち記事" },
  { value: "diary", label: "スタジオ日記" },
];

function extractFirstImage(html: string | null): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function excerptOf(post: Post): string {
  if (post.meta_description) return post.meta_description;
  const text = (post.content ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
}

function jstYearMonth(dateStr: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(dateStr));
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  return `${y}-${m}`;
}

function jstMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${Number(m)}月`;
}

function monthRangeUtc(ym: string): { start: string; end: string } {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1) - 9 * 60 * 60 * 1000).toISOString();
  const end = new Date(Date.UTC(y, m, 1) - 9 * 60 * 60 * 1000).toISOString();
  return { start, end };
}

function escapeOrValue(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/[,()]/g, (c) => `\\${c}`);
}

type HrefParams = {
  category?: string | null;
  type?: string | null;
  q?: string | null;
  month?: string | null;
  page?: number;
};

function buildHref(params: HrefParams): string {
  const usp = new URLSearchParams();
  if (params.category) usp.set("category", params.category);
  if (params.type) usp.set("type", params.type);
  if (params.q) usp.set("q", params.q);
  if (params.month) usp.set("month", params.month);
  if (params.page && params.page > 1) usp.set("page", String(params.page));
  const qs = usp.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; type?: string; q?: string; month?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const selectedSlug = sp.category ?? null;
  const selectedType = sp.type === "seo" || sp.type === "diary" ? sp.type : null;
  const q = sp.q?.trim() || null;
  const selectedMonth = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : null;
  const currentPage = Math.max(1, Number(sp.page) || 1);

  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug")
    .order("name");

  const selectedCategory = categories?.find((c) => c.slug === selectedSlug) ?? null;

  const { data: allDates } = await supabaseAdmin
    .from("posts")
    .select("published_at")
    .eq("status", "published")
    .not("published_at", "is", null);

  const archiveMap = new Map<string, number>();
  for (const row of allDates ?? []) {
    const key = jstYearMonth(row.published_at as string);
    archiveMap.set(key, (archiveMap.get(key) ?? 0) + 1);
  }
  const archive = Array.from(archiveMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  let query = supabaseAdmin
    .from("posts")
    .select("id, title, slug, thumbnail_url, content, published_at, type, category_id, meta_description", {
      count: "exact",
    })
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (selectedCategory) query = query.eq("category_id", selectedCategory.id);
  if (selectedType) query = query.eq("type", selectedType);
  if (selectedMonth) {
    const { start, end } = monthRangeUtc(selectedMonth);
    query = query.gte("published_at", start).lt("published_at", end);
  }
  if (q) {
    const esc = escapeOrValue(q);
    query = query.or(`title.ilike.%${esc}%,content.ilike.%${esc}%`);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);

  const items = (data ?? []) as Post[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const categoryNameOf = (id: number | null) =>
    id ? categories?.find((c) => c.id === id)?.name ?? null : null;

  const showFeatured = currentPage === 1 && items.length > 0 && !q;
  const featured = showFeatured ? items[0] : null;
  const gridItems = showFeatured ? items.slice(1) : items;

  const facets = { category: selectedSlug, type: selectedType, q, month: selectedMonth };

  return (
    <main>
      <div className={`inner ${styles.blogPage}`}>
        <Heading2
          title="ブログ"
          lead={<>Y-de-ONEのレッスンや<br className={styles.mobileBreak} />日々の出来事をお届けします。</>}
        />

        <form action="/blog" method="get" className={styles.searchForm}>
          {selectedSlug && <input type="hidden" name="category" value={selectedSlug} />}
          {selectedType && <input type="hidden" name="type" value={selectedType} />}
          {selectedMonth && <input type="hidden" name="month" value={selectedMonth} />}
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="キーワードで記事を検索"
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton} aria-label="検索">
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
        </form>

        <div className={styles.typeTabs} hidden>
          {TYPE_TABS.map((t) => (
            <Link
              key={t.label}
              href={buildHref({
                ...facets,
                type: t.value,
                category: t.value === "diary" ? null : facets.category,
                page: 1,
              })}
              className={`${styles.typeTab} ${selectedType === t.value ? styles.typeTabActive : ""}`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {selectedType !== "diary" && categories && categories.length > 0 && (
          <div className={styles.categoryChips}>
            <Link
              href={buildHref({ ...facets, category: null, page: 1 })}
              className={`${styles.chip} ${!selectedCategory ? styles.chipActive : ""}`}
            >
              すべてのカテゴリ
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={buildHref({ ...facets, category: c.slug, page: 1 })}
                className={`${styles.chip} ${selectedCategory?.id === c.id ? styles.chipActive : ""}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {archive.length > 0 && (
          <details className={styles.archive} open={!!selectedMonth}>
            <summary className={styles.archiveSummary}>月別アーカイブ</summary>
            <div className={styles.archiveList}>
              {archive.map(([ym, cnt]) => (
                <Link
                  key={ym}
                  href={buildHref({ ...facets, month: selectedMonth === ym ? null : ym, page: 1 })}
                  className={`${styles.archiveLink} ${selectedMonth === ym ? styles.archiveLinkActive : ""}`}
                >
                  {jstMonthLabel(ym)}（{cnt}）
                </Link>
              ))}
            </div>
          </details>
        )}

        {items.length === 0 ? (
          <p className={styles.empty}>
            {q ? `「${q}」に一致する記事が見つかりませんでした。` : "まだ記事がありません。"}
          </p>
        ) : (
          <>
            {featured && (
              <Link href={`/blog/${featured.slug ?? featured.id}`} className={styles.featuredCard}>
                <div className={styles.featuredThumb}>
                  {(() => {
                    const src = featured.thumbnail_url || extractFirstImage(featured.content);
                    return src ? (
                      <Image
                        src={src}
                        alt={featured.title}
                        width={640}
                        height={360}
                        className={styles.thumbImg}
                        priority
                      />
                    ) : (
                      <div className={styles.thumbPlaceholder}>
                        <i className="fa-solid fa-image"></i>
                      </div>
                    );
                  })()}
                </div>
                <div className={styles.featuredInfo}>
                  {categoryNameOf(featured.category_id) && (
                    <span className={styles.categoryBadge}>{categoryNameOf(featured.category_id)}</span>
                  )}
                  <time className={styles.blogDate}>{formatDate(featured.published_at)}</time>
                  <p className={styles.featuredTitle}>{featured.title}</p>
                  <p className={styles.featuredExcerpt}>{excerptOf(featured)}</p>
                </div>
              </Link>
            )}

            {gridItems.length > 0 && (
              <ul className={styles.blogList}>
                {gridItems.map((item) => (
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
                        {categoryNameOf(item.category_id) && (
                          <span className={styles.categoryBadge}>{categoryNameOf(item.category_id)}</span>
                        )}
                      </div>
                      <div className={styles.blogInfo}>
                        <time className={styles.blogDate}>{formatDate(item.published_at)}</time>
                        <p className={styles.blogTitle}>{item.title}</p>
                        <p className={styles.blogExcerpt}>{excerptOf(item)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <nav className={styles.pagination}>
                {currentPage > 1 ? (
                  <Link href={buildHref({ ...facets, page: currentPage - 1 })} className={styles.pageLink}>
                    前へ
                  </Link>
                ) : (
                  <span className={`${styles.pageLink} ${styles.pageLinkDisabled}`}>前へ</span>
                )}
                <span className={styles.pageStatus}>
                  {currentPage} / {totalPages}
                </span>
                {currentPage < totalPages ? (
                  <Link href={buildHref({ ...facets, page: currentPage + 1 })} className={styles.pageLink}>
                    次へ
                  </Link>
                ) : (
                  <span className={`${styles.pageLink} ${styles.pageLinkDisabled}`}>次へ</span>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
