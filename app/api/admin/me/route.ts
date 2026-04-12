import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lineUserId = searchParams.get("lineUserId");

  if (!lineUserId) {
    return NextResponse.json({ isAdmin: false });
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("line_user_id", lineUserId)
    .single();

  return NextResponse.json({ isAdmin: data?.is_admin ?? false });
}
