// app/api/trial/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type TrialRequestBody = {
  lineUserId?: string;
  lineDisplayName?: string;
  name: string;
  formType?: "trial" | "visit";
  genre?: string;
  date?: string;
  timeSlot?: string;
  customRequest?: string;
  experience?: string;
  question?: string;
};

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

export async function POST(req: Request) {
  try {
    // ① フロントから送られてきたデータを取得
    const body = (await req.json()) as TrialRequestBody;

    const {
      lineUserId,
      lineDisplayName,
      name,
      formType = "trial",
      genre,
      date,
      timeSlot,
      customRequest,
      experience,
      question,
    } = body;

    const isVisit = formType === "visit";
    // 候補日から選べなかった場合は、date/timeSlotの代わりにcustomRequest（自由記述の希望）が入る
    const hasFixedSlot = Boolean(date && timeSlot);
    const hasCustomRequest = Boolean(customRequest && customRequest.trim());

    // ② 簡単なバリデーション（必須項目チェック）
    if (!name || (!hasFixedSlot && !hasCustomRequest) || (!isVisit && !experience)) {
      return NextResponse.json(
        { ok: false, error: "必須項目が送信されていません。" },
        { status: 400 }
      );
    }

    // ③ Supabaseに trial ユーザーとして登録（未登録の場合のみ）
    if (lineUserId && /^U[a-fA-F0-9]{16,64}$/.test(lineUserId)) {
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id, status, line_display_name, line_picture_url")
        .eq("line_user_id", lineUserId)
        .single();

      const profile = await getLineProfile(lineUserId);

      if (!existing) {
        await supabaseAdmin.from("users").insert({
          line_user_id: lineUserId,
          name,
          status: "trial",
          is_admin: false,
          line_display_name: profile?.displayName ?? null,
          line_picture_url: profile?.pictureUrl ?? null,
        });
      } else if (!existing.line_display_name || !existing.line_picture_url) {
        // プロフィールが未取得の場合は更新
        await supabaseAdmin.from("users").update({
          line_display_name: profile?.displayName ?? existing.line_display_name,
          line_picture_url: profile?.pictureUrl ?? existing.line_picture_url,
        }).eq("line_user_id", lineUserId);
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

    let dateWithYoubi = "";
    if (hasFixedSlot && date) {
      const d = new Date(date + "T00:00:00");
      const day = d.getDay();
      const youbi = ["日", "月", "火", "水", "木", "金", "土"][day];
      dateWithYoubi = `${date}（${youbi}）`;
    }

    // 日時が確定している場合は「日付＋時間帯」、相談希望の場合は自由記述をそのまま使う
    const scheduleLine = hasFixedSlot
      ? `・${isVisit ? "見学希望日" : "希望日"}：${dateWithYoubi}\n・時間帯：${timeSlot}\n`
      : `・ご希望の曜日・時間帯：${customRequest}\n`;

    if (lineUserId && isValidLineUserId(lineUserId)) {
      console.log("LINE に送ろうとしている lineUserId:", lineUserId);

      const displayNameForMessage = name || lineDisplayName || "お客様";

      const text = isVisit
        ? `${displayNameForMessage} 様\n\n` +
          `Y-de-ONEバレエ教室です🩰\n` +
          `レッスン見学のお申込みありがとうございます。\n\n` +
          (hasFixedSlot
            ? `🎉【見学のご予約が確定しました】🎉\n\n`
            : `【見学のご希望を承りました】\n\n`) +
          `▼ ご予約内容\n` +
          `・お名前：${displayNameForMessage}\n` +
          scheduleLine +
          (question ? `・ご質問 / 不安なこと：${question}\n` : "") +
          (hasFixedSlot
            ? `\n当日はスタジオでお待ちしております😊\n動きやすい服装でお越しください。\n\n`
            : `\nスタッフが空き状況を確認し、改めてこちらのLINEで日程をご案内いたします😊\n\n`) +
          `📍Y-de-ONEスタジオ\nhttps://maps.app.goo.gl/qfoj5m4KPzcPF5g76\n` +
          `\n何か変更やキャンセルがある場合は、このLINEからお知らせください。`
        : `${displayNameForMessage} 様\n\n` +
          `Y-de-ONEバレエ教室です🩰\n` +
          `体験レッスンのお申込みありがとうございます。\n\n` +
          (hasFixedSlot
            ? `🎉【ご予約が確定しました】🎉\n\n`
            : `【ご希望を承りました】\n\n`) +
          `▼ ご予約内容\n` +
          `・お名前：${displayNameForMessage}\n` +
          `・レッスン種類：${genre ?? ""}\n` +
          scheduleLine +
          `・バレエ経験：${experience ?? ""}\n` +
          (question ? `・ご質問 / 不安なこと：${question}\n` : "") +
          (hasFixedSlot
            ? `\n当日はスタジオでお会いできることを楽しみにしております😊\n\n`
            : `\nスタッフが空き状況を確認し、改めてこちらのLINEで日程をご案内いたします😊\n\n`) +
          `📍Y-de-ONEスタジオ\nhttps://maps.app.goo.gl/qfoj5m4KPzcPF5g76\n` +
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

    // ▼ ここから管理者への通知（複数人対応）
    const adminIdsEnv = process.env.LINE_ADMIN_USER_IDS;

    if (adminIdsEnv) {
      // カンマ区切りを配列に変換して、LINEのIDとして妥当なものだけ残す
      const adminUserIds = adminIdsEnv
        .split(",")
        .map((id) => id.trim())
        .filter((id) => isValidLineUserId(id));

      if (adminUserIds.length > 0) {
        const adminText = isVisit
          ? `${hasFixedSlot ? "【見学申込み通知】" : "【要対応】見学：希望日時の個別相談"}\n\n` +
            `▼ お申込み内容\n` +
            `・お名前：${name}\n` +
            `・LINE表示名：${lineDisplayName ?? "不明"}\n` +
            scheduleLine +
            (question ? `\n\n・ご質問／不安なこと：${question}\n` : "")
          : `${hasFixedSlot ? "【体験レッスン申込み通知】" : "【要対応】体験：希望日時の個別相談"}\n\n` +
            `▼ お申込み内容\n` +
            `・お名前：${name}\n` +
            `・LINE表示名：${lineDisplayName ?? "不明"}\n` +
            `・レッスン種類：${genre ?? ""}\n` +
            scheduleLine +
            `・バレエ経験：${experience ?? ""}\n` +
            (question ? `\n\n・ご質問／不安なこと：${question}\n` : "");

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
