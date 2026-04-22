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

      const categoryRow = category ? `<tr><td style="padding:4px 0;color:#666;">種別</td><td style="padding:4px 0 4px 16px;">${category}</td></tr>` : "";
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://y-de-one.vercel.app";
      const userHtml = `<!DOCTYPE html>
<html lang="ja">
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="background:#e05080;padding:20px 32px;text-align:center;">
          <img src="${baseUrl}/images/common/ydeone-logo-white.png" alt="Y-de-ONE バレエ教室" width="200" style="display:block;margin:0 auto;" />
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;">${name} 様</p>
          <p style="margin:0 0 24px;line-height:1.8;">この度はY-de-ONEバレエ教室へ<br>お問い合わせいただきありがとうございます。<br>以下の内容でお問い合わせを受け付けました。</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:6px;padding:20px;margin-bottom:24px;">
            <tr><td style="padding:4px 0;color:#666;">お名前</td><td style="padding:4px 0 4px 16px;">${name}</td></tr>
            ${categoryRow}
            <tr><td style="padding:4px 0;color:#666;vertical-align:top;">内容</td><td style="padding:4px 0 4px 16px;white-space:pre-wrap;">${message}</td></tr>
          </table>
          <p style="margin:0 0 8px;line-height:1.8;">担当者より<span style="color:#e05080;font-size:18px;font-weight:bold;">48時間以内</span>にご返信いたします。</p>
          <p style="margin:0 0 24px;line-height:1.8;">返信がない場合は、お手数ですが、<br>下記よりご連絡をお願いいたします。</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
            <tr><td>
              <a href="https://lin.ee/iz33eCM" style="display:inline-block;background:#06C755;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;font-size:14px;">公式LINEはこちら</a>
            </td></tr>
          </table>
          <p style="margin:8px 0 16px;font-size:14px;color:#555;">お電話：<a href="tel:08067400770" style="color:#e05080;text-decoration:none;font-weight:bold;">080-6740-0770</a></p>
          <p style="margin:0;font-size:12px;color:#e05080;line-height:1.8;">※ このメールは自動送信のため、返信はお受けできません。<br>返信がない場合は公式LINEまたはお電話にてお願いいたします。</p>
        </td></tr>
        <tr><td style="background:#f5f5f5;padding:16px 32px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;">Y-de-ONE バレエ教室</p>
          <p style="margin:0;font-size:12px;color:#999;"><a href="https://maps.app.goo.gl/qfoj5m4KPzcPF5g76" style="color:#999;text-decoration:underline;">東京都新宿区高田馬場3-36-6 兼子ビル2階</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await Promise.all([
        // ① ユーザーへ確認メール
        resend.emails.send({
          from: FROM_ADDRESS,
          to: email,
          subject: "【Y-de-ONE】お問い合わせありがとうございます",
          html: userHtml,
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
