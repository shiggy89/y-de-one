import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSuperAdmin } from "@/lib/superAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("lesson_info")
    .select("section, content, updated_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function PUT(req: Request) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { section, content } = await req.json();
  if (!section || !["change", "closed"].includes(section)) {
    return NextResponse.json({ error: "section は change か closed のみ" }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("lesson_info")
    .upsert({ section, content: content ?? "", updated_at: new Date().toISOString() }, { onConflict: "section" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
