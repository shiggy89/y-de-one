import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: Request) {
  try {
    const { lineUserId } = await req.json();
    if (!lineUserId) return NextResponse.json({ error: "lineUserId required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("users")
      .update({ badge_notified: true })
      .eq("line_user_id", lineUserId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
