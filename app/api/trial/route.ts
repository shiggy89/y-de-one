// app/api/trial/route.ts
import { NextResponse } from "next/server";

type TrialRequestBody = {
  lineUserId?: string;
  lineDisplayName?: string;
  name: string;
  date: string;
  timeSlot: string;
  experience: string;
  question?: string;
};

const LINE_ENDPOINT = "https://api.line.me/v2/bot/message/push";

export async function POST(req: Request) {
  try {
    // ① フロントから送られてきたデータを取得
    const body = (await req.json()) as TrialRequestBody;

    const {
      lineUserId,
      lineDisplayName,
      name,
      date,
      timeSlot,
      experience,
      question,
    } = body;

    // ② 簡単なバリデーション（必須項目チェック）
    if (!name || !date || !timeSlot || !experience) {
      return NextResponse.json(
        { ok: false, error: "必須項目が送信されていません。" },
        { status: 400 }
      );
    }

    // ③ ここでスプレッドシート／DB などに保存したければ処理を追加
    // 例）await saveToSheet(body);

    // ④ LINE へのプッシュメッセージ送信
    //    lineUserId が取得できている場合のみ送信します
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelAccessToken) {
      console.error("LINE_CHANNEL_ACCESS_TOKEN が設定されていません。");
      return NextResponse.json(
        {
          ok: false,
          error:
            "サーバーの設定に問題があり、LINEメッセージを送信できませんでした。",
        },
        { status: 500 }
      );
    }

    // ✅ 追加：LINEのユーザーIDとして妥当かをざっくりチェック
    function isValidLineUserId(id: string) {
      // "U" + 16 or 32桁のhex が一般的なのでざっくりこんな感じでOK
      return /^U[a-fA-F0-9]{16,64}$/.test(id);
    }

    const d = new Date(date + "T00:00:00");
    const day = d.getDay();
    const youbi = ["日", "月", "火", "水", "木", "金", "土"][day];
    const dateWithYoubi = `${date}（${youbi}）`;

    if (lineUserId && isValidLineUserId(lineUserId)) {
      console.log("LINE に送ろうとしている lineUserId:", lineUserId);

      const displayNameForMessage = name || lineDisplayName || "お客様";

      const text =
        `${displayNameForMessage} 様\n\n` +
        `Y-de-ONEバレエ教室です🩰\n` +
        `体験レッスンのお申込みありがとうございます。\n\n` +
        `🎉【ご予約が確定しました】🎉\n\n` +
        `▼ ご予約内容\n` +
        `・お名前：${displayNameForMessage}\n` +
        `・希望日：${dateWithYoubi}\n` +
        `・時間帯：${timeSlot}\n` +
        `・バレエ経験：${experience}\n` +
        (question ? `・ご質問 / 不安なこと：${question}\n` : "") +
        `\n当日はスタジオでお会いできることを楽しみにしております😊\n\n` +
        `📍Y-de-ONEスタジオ\nhttps://maps.app.goo.gl/qfoj5m4KPzcPF5g76\n\n` +
        (question
          ? `P.S.ご質問については、担当者より追ってご連絡いたします。\n`
          : ``) +
        `\n何か変更やキャンセルがある場合は、このLINEからお知らせください。`;

      const lineResponse = await fetch(LINE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${channelAccessToken}`,
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [
            {
              type: "text",
              text,
            },
          ],
        }),
      });

      if (!lineResponse.ok) {
        const errorText = await lineResponse.text();
        console.error("LINE Messaging API error:", errorText);
      }
    } else {
      console.warn(
        "有効な lineUserId が無いため、LINEメッセージは送信しませんでした。lineUserId:",
        lineUserId
      );
    }


    // ⑤ フロント側には「OK」を返す
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
