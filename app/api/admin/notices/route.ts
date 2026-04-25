import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// 一覧取得
export async function GET(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data, error } = await supabaseAdmin
      .from("notices")
      .select("id, title, body, author, created_at, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ notices: data ?? [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}

// 新規作成
export async function POST(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { title, body, author } = await req.json();
    if (!body) return NextResponse.json({ error: "bodyは必須です" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("notices")
      .insert({ title: title ?? "", body, author: author ?? null, is_active: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}

// 削除（is_active = false）
export async function DELETE(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await req.json();
    const { error } = await supabaseAdmin
      .from("notices")
      .update({ is_active: false })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
