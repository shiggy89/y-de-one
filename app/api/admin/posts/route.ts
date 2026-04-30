import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("id, title, slug, type, status, thumbnail_url, published_at, created_at, category_id, categories(name)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, slug, content, type, status, thumbnail_url, meta_description, category_id } = await req.json();
  if (!title) return NextResponse.json({ error: "titleは必須です" }, { status: 400 });
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({
      title,
      slug: slug || null,
      content: content ?? "",
      type: type ?? "diary",
      status: status ?? "draft",
      thumbnail_url: thumbnail_url ?? null,
      meta_description: meta_description ?? null,
      category_id: category_id ?? null,
      published_at: status === "published" ? now : null,
      updated_at: now,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
