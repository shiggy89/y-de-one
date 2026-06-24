import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const LINE_REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply";
const LINE_PROFILE_ENDPOINT = "https://api.line.me/v2/bot/profile";

async function getLineProfile(userId: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const res = await fetch(`${LINE_PROFILE_ENDPOINT}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ displayName: string; pictureUrl?: string }>;
}

// 返信API（無料・replyTokenを使う）
async function replyMessage(replyToken: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  await fetch(LINE_REPLY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
  });
}

// プッシュAPI（カウントされる・管理者通知や友達追加時に使う）
async function pushMessage(to: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  await fetch(LINE_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to, messages: [{ type: "text", text }] }),
  });
}

// クイックリプライ付きプッシュAPI
async function pushMessageWithQuickReply(
  to: string,
  text: string,
  items: { label: string; text: string }[]
) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  await fetch(LINE_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to,
      messages: [{
        type: "text",
        text,
        quickReply: {
          items: items.map((item) => ({
            type: "action",
            action: { type: "message", label: item.label, text: item.text },
          })),
        },
      }],
    }),
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
      fetch(LINE_PUSH_ENDPOINT, {
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
      // 「はい」「いいえ」への返信
      if (event.type === "message" && event.message?.type === "text") {
        const replyToken: string = event.replyToken;
        const text: string = event.message.text ?? "";
        const LIFF_URL = "https://liff.line.me/2008551653-JRwQxXrB";

        if (text === "はい") {
          await replyMessage(
            replyToken,
            `ぜひお待ちしております🩰\n\n👇体験レッスンのお申込みはこちら\n${LIFF_URL}/trial`
          );
        } else if (text === "いいえ") {
          await replyMessage(
            replyToken,
            `見学も大歓迎です😊\n無料なのでお気軽にお越しください🩰\n\n👇見学のお申込みはこちら\n${LIFF_URL}/trial?type=visit`
          );
        }
      }

      // // テキストメッセージイベント（一時無効化）
      // if (event.type === "message" && event.message?.type === "text") {
      //   const lineUserId = event.source?.userId;
      //   const replyToken: string = event.replyToken;
      //   const text: string = event.message.text ?? "";
      //   if (!lineUserId) continue;

      //   if (containsAlertKeyword(text)) {
      //     // キーワードあり → 返信API（無料）+ 管理者にプッシュ通知
      //     await replyMessage(
      //       replyToken,
      //       `ご不便をおかけして申し訳ありません🙇‍♂️\n担当者に確認して、すぐに返信いたします。\n少しお待ちください。`
      //     );
      //     const profile = await getLineProfile(lineUserId);
      //     const displayName = profile?.displayName ?? "不明なユーザー";
      //     await notifyAdmins([
      //       {
      //         type: "text",
      //         text:
      //           `⚠️ お問い合わせ未返信の連絡あり\n\n` +
      //           `👤 ${displayName}\n` +
      //           `💬 「${text}」\n\n` +
      //           `公式LINEから返信をお願いします。`,
      //       },
      //     ]);
      //   } else {
      //     // キーワードなし → 返信API（無料）
      //     await replyMessage(
      //       replyToken,
      //       `こちらでは返信していません🙇‍♂️\nメニューの「お問い合わせ」からお願いします！\n返信がない場合のみ、ここへメッセージをください。`
      //     );
      //   }
      // }

      // 友達追加イベント（replyTokenなし → プッシュAPI）
      if (event.type === "follow") {
        const lineUserId = event.source?.userId;
        if (!lineUserId) continue;

        const LIFF_URL = "https://liff.line.me/2008551653-JRwQxXrB";
        // LINEプロフィール取得
        const profile = await getLineProfile(lineUserId);
        const displayName = profile?.displayName ?? "はじめまして";
        await pushMessageWithQuickReply(
          lineUserId,
          `${displayName}さん\n友だち追加ありがとうございます😊\n\nY-de-ONEは初心者の方でも安心して楽しめる「質問できる大人バレエの教室」です。\n\n体験レッスンのお申込みですか？`,
          [
            { label: "はい", text: "はい" },
            { label: "いいえ", text: "いいえ" },
          ]
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
