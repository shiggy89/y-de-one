import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const LINE_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const LINE_PROFILE_ENDPOINT = "https://api.line.me/v2/bot/profile";

async function getLineProfile(userId: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const res = await fetch(`${LINE_PROFILE_ENDPOINT}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ displayName: string; pictureUrl?: string }>;
}

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

        // LINEプロフィール取得
        const profile = await getLineProfile(lineUserId);

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
            line_display_name: profile?.displayName ?? null,
            line_picture_url: profile?.pictureUrl ?? null,
            status: "trial",
            is_admin: false,
          });
        } else {
          // 既存ユーザーはプロフィールだけ更新
          await supabaseAdmin.from("users").update({
            line_display_name: profile?.displayName ?? null,
            line_picture_url: profile?.pictureUrl ?? null,
          }).eq("line_user_id", lineUserId);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
