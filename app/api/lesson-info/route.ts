import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("lesson_info")
    .select("section, content, updated_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const change = (data ?? []).find((r) => r.section === "change")?.content ?? "";
  const closed = (data ?? []).find((r) => r.section === "closed")?.content ?? "";
  return NextResponse.json({ change, closed });
}
