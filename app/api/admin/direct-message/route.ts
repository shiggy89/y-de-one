import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

const LINE_ENDPOINT = "https://api.line.me/v2/bot/message/push";

export async function POST(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { lineUserId, message } = await req.json();

    if (!lineUserId || !message?.trim()) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }
    if (!/^U[a-fA-F0-9]{16,64}$/.test(lineUserId)) {
      return NextResponse.json({ error: "無効なLINEユーザーIDです" }, { status: 400 });
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "LINE設定エラー" }, { status: 500 });
    }

    const res = await fetch(LINE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("LINE push error:", err);
      return NextResponse.json({ error: "LINE送信に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
