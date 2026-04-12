import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { lineUserId, lastName, firstName } = await req.json();

    if (!lineUserId || !lastName || !firstName) {
      return NextResponse.json(
        { ok: false, error: "必須項目が送信されていません。" },
        { status: 400 }
      );
    }

    const name = `${lastName} ${firstName}`;

    // 既に登録済みかチェック
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id, status")
      .eq("line_user_id", lineUserId)
      .single();

    if (existing) {
      // trial → member に昇格
      if (existing.status === "trial") {
        await supabaseAdmin
          .from("users")
          .update({ name, status: "member" })
          .eq("line_user_id", lineUserId);
      }
      return NextResponse.json({ ok: true });
    }

    // 新規登録
    const { error } = await supabaseAdmin.from("users").insert({
      line_user_id: lineUserId,
      name,
      status: "member",
      is_admin: false,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { ok: false, error: "登録に失敗しました。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
