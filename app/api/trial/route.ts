// app/api/trial/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

    // ③ Supabaseに trial ユーザーとして登録（未登録の場合のみ）
    if (lineUserId && /^U[a-fA-F0-9]{16,64}$/.test(lineUserId)) {
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id, status")
        .eq("line_user_id", lineUserId)
        .single();

      if (!existing) {
        await supabaseAdmin.from("users").insert({
          line_user_id: lineUserId,
          name,
          status: "trial",
          is_admin: false,
        });
      }
    }

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
        `📍Y-de-ONEスタジオ\nhttps://maps.app.goo.gl/qfoj5m4KPzcPF5g76\n` +
        (question
          ? `\nP.S.ご質問については、担当者より追ってご連絡いたします。\n\n`
          : ``) +
        `何か変更やキャンセルがある場合は、このLINEからお知らせください。`;

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

    // ▼ ここから管理者への通知（複数人対応）
    const adminIdsEnv = process.env.LINE_ADMIN_USER_IDS;

    if (adminIdsEnv) {
      // カンマ区切りを配列に変換して、LINEのIDとして妥当なものだけ残す
      const adminUserIds = adminIdsEnv
        .split(",")
        .map((id) => id.trim())
        .filter((id) => isValidLineUserId(id));

      if (adminUserIds.length > 0) {
        const adminText =
          `【体験レッスン申込み通知】\n\n` +
          `▼ お申込み内容\n` +
          `・お名前：${name}\n` +
          `・LINE表示名：${lineDisplayName ?? "不明"}\n` +
          `・希望日：${dateWithYoubi}\n` +
          `・時間帯：${timeSlot}\n` +
          `・バレエ経験：${experience}\n` +
          (question ? `・ご質問／不安なこと：${question}\n` : "") +
          (question ? `\n⚠️質問がきています⚠️\n${name} 様へ質問の返信をしてください。` : "");

        // 管理者の人数分だけ push を回す（3〜4人ならこれで十分）
        for (const adminId of adminUserIds) {
          const adminResponse = await fetch(LINE_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${channelAccessToken}`,
            },
            body: JSON.stringify({
              to: adminId,
              messages: [
                {
                  type: "text",
                  text: adminText,
                },
              ],
            }),
          });

          if (!adminResponse.ok) {
            const adminError = await adminResponse.text();
            console.error("LINE admin push error:", adminError);
          }
        }
      } else {
        console.warn(
          "LINE_ADMIN_USER_IDS は設定されていますが、有効なIDがありません。",
          adminIdsEnv
        );
      }
    } else {
      console.warn(
        "LINE_ADMIN_USER_IDS が設定されていないため、管理者への通知は送信しません。"
      );
    }
    // ▲ 管理者通知ここまで



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
