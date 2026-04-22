import { NextResponse } from "next/server";
import { Resend } from "resend";

const LINE_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const ADMIN_EMAIL = "shigeru.1222@gmail.com";
const FROM_ADDRESS = "onboarding@resend.dev";

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

    // ① ユーザーへの受付確認メール
    // ② 管理者への通知メール（Reply-To = ユーザーのメアド）
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const categoryText = category ? `\nお問い合わせ種別：${category}` : "";

      await Promise.all([
        // ① ユーザーへ確認メール
        resend.emails.send({
          from: FROM_ADDRESS,
          to: email,
          subject: "【Y-de-ONE】お問い合わせありがとうございます",
          text:
            `${name} 様\n\n` +
            `この度はY-de-ONEバレエ教室へお問い合わせいただきありがとうございます。\n` +
            `以下の内容でお問い合わせを受け付けました。\n\n` +
            `─────────────────────\n` +
            `お名前：${name}${categoryText}\n` +
            `内容：\n${message}\n` +
            `─────────────────────\n\n` +
            `担当者より順次ご連絡いたします。\n` +
            `今しばらくお待ちください。\n\n` +
            `Y-de-ONEバレエ教室`,
        }),
        // ② 管理者へ通知メール（Reply-To でユーザーへ直接返信可能）
        resend.emails.send({
          from: FROM_ADDRESS,
          to: ADMIN_EMAIL,
          replyTo: email,
          subject: `【お問い合わせ】${name} 様より`,
          text:
            `新しいお問い合わせが届きました。\n\n` +
            `▼ お問い合わせ内容\n` +
            `・お名前：${name}\n` +
            `・メール：${email}\n` +
            (category ? `・種別：${category}\n` : "") +
            `・内容：\n${message}\n\n` +
            `このメールに「返信」を押すと ${name} 様へ直接返信できます。`,
        }),
      ]);
    } else {
      console.warn("RESEND_API_KEY が設定されていないため、メール送信をスキップします。");
    }

    // LINE 管理者通知
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const adminIdsEnv = process.env.LINE_ADMIN_USER_IDS;

    if (channelAccessToken && adminIdsEnv) {
      const adminUserIds = adminIdsEnv
        .split(",")
        .map((id) => id.trim())
        .filter((id) => isValidLineUserId(id));

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
