import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SUPER_ADMIN_IDS } from "@/lib/superAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lineUserId = searchParams.get("lineUserId");

  if (!lineUserId) {
    return NextResponse.json({ isAdmin: false, isSuperAdmin: false, userId: null });
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("id, is_admin")
    .eq("line_user_id", lineUserId)
    .single();

  const isAdmin = data?.is_admin ?? false;
  const isSuperAdmin = isAdmin && SUPER_ADMIN_IDS.includes(data?.id);

  return NextResponse.json({ isAdmin, isSuperAdmin, userId: data?.id ?? null });
}
