import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getVerifiedLineUserId } from "@/lib/lineAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const lineUserId = await getVerifiedLineUserId(req);
    if (!lineUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { mypage_name, mypage_picture_url } = await req.json();

    const updates: Record<string, string> = {};
    if (mypage_name !== undefined) updates.mypage_name = mypage_name;
    if (mypage_picture_url !== undefined) updates.mypage_picture_url = mypage_picture_url;

    const { error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("line_user_id", lineUserId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
