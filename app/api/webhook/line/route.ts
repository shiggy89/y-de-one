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

// お問い合わせ未返信を示すキーワード
const ALERT_KEYWORDS = [
  "返信", "連絡", "届いていない", "届かない", "返ってこない",
  "来ない", "こない", "問い合わせ", "メール",
];

function containsAlertKeyword(text: string): boolean {
  return ALERT_KEYWORDS.some((kw) => text.includes(kw));
}

async function notifyAdmins(messages: { type: string; text: string }[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const adminIds = (process.env.LINE_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  await Promise.all(
    adminIds.map((adminId) =>
      fetch(LINE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: adminId, messages }),
      })
    )
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const events = body.events ?? [];

    for (const event of events) {
      // テキストメッセージイベント
      if (event.type === "message" && event.message?.type === "text") {
        const lineUserId = event.source?.userId;
        const text: string = event.message.text ?? "";
        if (!lineUserId) continue;

        // 自動返信
        await sendMessage(
          lineUserId,
          `こちらのトークは返信していません🙇‍♂️\nメニューの「お問い合わせ」からお願いします！\n※返信がない場合のみ、ここで対応します。`
        );

        // キーワード検知 → 管理者に通知
        if (containsAlertKeyword(text)) {
          const profile = await getLineProfile(lineUserId);
          const displayName = profile?.displayName ?? "不明なユーザー";
          await notifyAdmins([
            {
              type: "text",
              text:
                `⚠️ お問い合わせ未返信の連絡あり\n\n` +
                `👤 ${displayName}\n` +
                `💬 「${text}」\n\n` +
                `お問い合わせフォームへの返信を確認してください。`,
            },
          ]);
        }
      }

      // 友達追加イベント
      if (event.type === "follow") {
        const lineUserId = event.source?.userId;
        if (!lineUserId) continue;

        // ref パラメータを取得（既存生徒用リンクは ?ref=member）
        const ref = event.follow?.referral?.ref ?? "";

        const LIFF_URL = "https://liff.line.me/2008551653-JRwQxXrB";
        await sendMessage(
          lineUserId,
          `Y-de-ONE（ワイデワン）へようこそ！🩰\n\n` +
          `▼ 体験レッスンをご希望の方はこちら\n${LIFF_URL}/trial\n\n` +
          `▼ すでに会員の方はこちらから登録をお願いします\n${LIFF_URL}/register`
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
