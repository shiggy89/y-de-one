import { NextResponse } from "next/server";

const LINE_ENDPOINT = "https://api.line.me/v2/bot/message/push";

function isValidLineUserId(id: string) {
  return /^U[a-fA-F0-9]{16,64}$/.test(id);
}

export async function POST(req: Request) {
  try {
    const { name, email, category, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "必須項目が不足しています。" },
        { status: 400 }
      );
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const adminIdsEnv = process.env.LINE_ADMIN_USER_IDS;

    if (!channelAccessToken || !adminIdsEnv) {
      console.error("LINE環境変数が設定されていません。");
      return NextResponse.json({ ok: true }); // フロントはサンクスページへ進む
    }

    const adminUserIds = adminIdsEnv
      .split(",")
      .map((id) => id.trim())
      .filter((id) => isValidLineUserId(id));

    if (adminUserIds.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const text =
      `【お問い合わせ通知】\n\n` +
      `▼ お問い合わせ内容\n` +
      `・お名前：${name}\n` +
      `・メール：${email}\n` +
      (category ? `・種別：${category}\n` : "") +
      `・内容：\n${message}`;

    for (const adminId of adminUserIds) {
      const res = await fetch(LINE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${channelAccessToken}`,
        },
        body: JSON.stringify({
          to: adminId,
          messages: [{ type: "text", text }],
        }),
      });

      if (!res.ok) {
        console.error("LINE admin push error:", await res.text());
      }
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
