import type { MetadataRoute } from "next";
import { supabaseAdmin } from "../lib/supabase";

const BASE_URL = "https://y-de-one.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE_URL}/class`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE_URL}/price`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE_URL}/instructor`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/studio`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/access`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/modern-ballet`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/down-syndrome`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/saitama`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE_URL}/works`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE_URL}/lesson-info`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${BASE_URL}/blog`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${BASE_URL}/news`, priority: 0.6, changeFrequency: "weekly" },
    { url: `${BASE_URL}/contact`, priority: 0.6, changeFrequency: "yearly" },
    { url: `${BASE_URL}/trial`, priority: 0.8, changeFrequency: "monthly" },
  ];

  const [{ data: posts }, { data: newsItems }] = await Promise.all([
    supabaseAdmin
      .from("posts")
      .select("id, slug, published_at, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabaseAdmin
      .from("hp_news")
      .select("id, published_at")
      .order("published_at", { ascending: false }),
  ]);

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${BASE_URL}/blog/${post.slug ?? post.id}`,
    lastModified: post.updated_at ?? post.published_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const newsPages: MetadataRoute.Sitemap = (newsItems ?? [])
    .filter((item) => item.id)
    .map((item) => ({
      url: `${BASE_URL}/news/${item.id}`,
      lastModified: item.published_at,
      changeFrequency: "never",
      priority: 0.5,
    }));

  return [...staticPages, ...blogPages, ...newsPages];
}
