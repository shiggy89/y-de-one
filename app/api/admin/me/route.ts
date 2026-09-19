import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SUPER_ADMIN_IDS } from "@/lib/superAdmin";
import { getVerifiedLineUserId } from "@/lib/lineAuth";

export async function GET(req: Request) {
  const lineUserId = await getVerifiedLineUserId(req);

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
