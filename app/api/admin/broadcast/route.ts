import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const LINE_ENDPOINT = "https://api.line.me/v2/bot/message/push";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "メッセージを入力してください" }, { status: 400 });
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "LINE設定エラー" }, { status: 500 });
    }

    // trialユーザーのline_user_idを取得
    const { data: trialUsers } = await supabaseAdmin
      .from("users")
      .select("line_user_id")
      .eq("status", "trial");

    if (!trialUsers || trialUsers.length === 0) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    let count = 0;
    for (const user of trialUsers) {
      if (!user.line_user_id || !/^U[a-fA-F0-9]{16,64}$/.test(user.line_user_id)) continue;
      const res = await fetch(LINE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: user.line_user_id,
          messages: [{ type: "text", text: message }],
        }),
      });
      if (res.ok) count++;
    }

    return NextResponse.json({ ok: true, count });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
