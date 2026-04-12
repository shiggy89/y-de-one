import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, line_user_id, status, is_admin")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

export async function PATCH(req: Request) {
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
