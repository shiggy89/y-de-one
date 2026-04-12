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

        if (ref === "member") {
          // 既存生徒向け：会員登録フォームURLを送る
          const registerUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/register`;
          await sendMessage(
            lineUserId,
            `Y-de-ONE（ワイデワン）へようこそ！\n\n以下のリンクから会員登録をお願いします。\n${registerUrl}`
          );
        } else {
          // 一般向け：体験レッスン申込みURLを送る
          const trialUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/trial`;
          await sendMessage(
            lineUserId,
            `Y-de-ONE（ワイデワン）へようこそ！\n\n体験レッスンのお申込みはこちらから👇\n${trialUrl}`
          );
        }

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
