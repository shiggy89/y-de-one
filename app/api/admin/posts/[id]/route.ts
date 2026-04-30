import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabaseAdmin.from("posts").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { title, slug, content, type, status, thumbnail_url, meta_description, category_id } = await req.json();
  const now = new Date().toISOString();

  const { data: existing } = await supabaseAdmin.from("posts").select("status, published_at").eq("id", id).single();
  const wasPublished = existing?.status === "published";
  const isPublishing = status === "published";

  const { error } = await supabaseAdmin
    .from("posts")
    .update({
      title,
      slug: slug || null,
      content: content ?? "",
      type,
      status,
      thumbnail_url: thumbnail_url ?? null,
      meta_description: meta_description ?? null,
      category_id: category_id ?? null,
      published_at: isPublishing && !wasPublished ? now : existing?.published_at ?? null,
      updated_at: now,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
