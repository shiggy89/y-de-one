import { NextResponse } from "next/server";
import { Resend } from "resend";

const LINE_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const ADMIN_EMAILS = ["ydeone.danceschool@gmail.com"];
const FROM_ADDRESS = "noreply@y-de-one.com";

function isValidLineUserId(id: string) {
  return /^U[a-fA-F0-9]{16,64}$/.test(id);
}

export async function POST(req: Request) {
  try {
    const { name, email, category, companyName, companyNameKana, companyPostal, companyPrefecture, companyCity, companyStreet, companyBuilding, companyAddressKana, companyPhone, contactName, contactNameKana, contactDepartment, contactPhone, message } = await req.json();

    if (!name || !email || !category || !message) {
      return NextResponse.json(
        { ok: false, error: "必須項目が不足しています。" },
        { status: 400 }
      );
    }

    if (category === "その他") {
      if (!companyName || !companyNameKana || !companyPostal || !companyPrefecture || !companyCity || !companyStreet || !companyBuilding || !companyAddressKana || !companyPhone || !contactName || !contactNameKana || !contactDepartment || !contactPhone) {
        return NextResponse.json(
          { ok: false, error: "「その他」の場合は会社情報・担当者情報を入力してください。" },
          { status: 400 }
        );
      }
      if (contactPhone === companyPhone) {
        return NextResponse.json(
          { ok: false, error: "担当電話番号は会社電話番号と異なる番号を入力してください。" },
          { status: 400 }
        );
      }
      if (message.length > 100) {
        return NextResponse.json(
          { ok: false, error: "「その他」のお問い合わせ内容は100文字以内でご入力ください。" },
          { status: 400 }
        );
      }
    }

    // ① ユーザーへの受付確認メール
    // ② 管理者への通知メール（Reply-To = ユーザーのメアド）
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const isOther = category === "その他";
      const companyRows = isOther
        ? `<tr><td style="padding:4px 0;color:#666;">会社名</td><td style="padding:4px 0 4px 16px;">${companyName}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">会社名（ふりがな）</td><td style="padding:4px 0 4px 16px;">${companyNameKana}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">郵便番号</td><td style="padding:4px 0 4px 16px;">${companyPostal}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">都道府県</td><td style="padding:4px 0 4px 16px;">${companyPrefecture}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">市区町村</td><td style="padding:4px 0 4px 16px;">${companyCity}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">番地</td><td style="padding:4px 0 4px 16px;">${companyStreet}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">建物名・部屋番号</td><td style="padding:4px 0 4px 16px;">${companyBuilding}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">住所（ふりがな）</td><td style="padding:4px 0 4px 16px;">${companyAddressKana}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">会社電話番号</td><td style="padding:4px 0 4px 16px;">${companyPhone}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">担当者氏名</td><td style="padding:4px 0 4px 16px;">${contactName}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">担当者氏名（ふりがな）</td><td style="padding:4px 0 4px 16px;">${contactNameKana}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">担当部署</td><td style="padding:4px 0 4px 16px;">${contactDepartment}</td></tr>
           <tr><td style="padding:4px 0;color:#666;">担当電話番号</td><td style="padding:4px 0 4px 16px;">${contactPhone}</td></tr>`
        : "";
      const categoryRow = `<tr><td style="padding:4px 0;color:#666;">種別</td><td style="padding:4px 0 4px 16px;">${category}</td></tr>${companyRows}`;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://y-de-one.com";
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
          to: ADMIN_EMAILS,
          replyTo: email,
          subject: `【お問い合わせ】${name} 様より`,
          text:
            `新しいお問い合わせが届きました。\n\n` +
            `▼ お問い合わせ内容\n` +
            `・お名前：${name}\n` +
            `・メール：${email}\n` +
            `・種別：${category}\n` +
            (isOther
              ? `・会社名：${companyName}（${companyNameKana}）\n` +
                `・郵便番号：${companyPostal}\n` +
                `・都道府県：${companyPrefecture}\n` +
                `・市区町村：${companyCity}\n` +
                `・番地：${companyStreet}\n` +
                `・建物名・部屋番号：${companyBuilding}\n` +
                `・住所（ふりがな）：${companyAddressKana}\n` +
                `・会社電話番号：${companyPhone}\n` +
                `・担当者氏名：${contactName}（${contactNameKana}）\n` +
                `・担当部署：${contactDepartment}\n` +
                `・担当電話番号：${contactPhone}\n`
              : "") +
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
        `・種別：${category}\n` +
        (category === "その他"
          ? `・会社名：${companyName}（${companyNameKana}）\n` +
            `・郵便番号：${companyPostal}\n` +
            `・都道府県：${companyPrefecture}\n` +
            `・市区町村：${companyCity}\n` +
            `・番地：${companyStreet}\n` +
            `・建物名・部屋番号：${companyBuilding}\n` +
            `・住所（ふりがな）：${companyAddressKana}\n` +
            `・会社電話番号：${companyPhone}\n` +
            `・担当者氏名：${contactName}（${contactNameKana}）\n` +
            `・担当部署：${contactDepartment}\n` +
            `・担当電話番号：${contactPhone}\n`
          : "") +
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
