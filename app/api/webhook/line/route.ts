import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const LINE_ENDPOINT = "https://api.line.me/v2/bot/message/push";

async function sendMessage(to: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  await fetch(LINE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to, messages: [{ type: "text", text }] }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const events = body.events ?? [];

    for (const event of events) {
      // 友達追加イベント
      if (event.type === "follow") {
        const lineUserId = event.source?.userId;
        if (!lineUserId) continue;

        // ref パラメータを取得（既存生徒用リンクは ?ref=member）
        const ref = event.follow?.referral?.ref ?? "";

        const trialUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/trial`;
        const registerUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/register`;
        await sendMessage(
          lineUserId,
          `Y-de-ONE（ワイデワン）へようこそ！🩰\n\n` +
          `▼ 体験レッスンをご希望の方はこちら\n${trialUrl}\n\n` +
          `▼ すでに会員の方はこちらから登録をお願いします\n${registerUrl}`
        );

        // Supabaseにtrialで登録（未登録の場合のみ）
        const { data: existing } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("line_user_id", lineUserId)
          .single();

        if (!existing) {
          await supabaseAdmin.from("users").insert({
            line_user_id: lineUserId,
            name: null,
            status: "trial",
            is_admin: false,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
