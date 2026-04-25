import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, line_user_id, line_display_name, line_picture_url, status, is_admin");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const statusOrder: Record<string, number> = { teacher: 0, member: 1, trial: 2 };

  const sorted = (data ?? []).sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    const adminDiff = (b.is_admin ? 1 : 0) - (a.is_admin ? 1 : 0);
    if (adminDiff !== 0) return adminDiff;
    return (a.name ?? "").localeCompare(b.name ?? "", "ja");
  });

  return NextResponse.json({ users: sorted });
}

export async function PATCH(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { userId, ...updates } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
