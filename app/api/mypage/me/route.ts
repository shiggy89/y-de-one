import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function calcLessonCount(lessonType: string, lessonTitle: string | null, lessonTime: string | null): number {
  if (lessonType === "個人") {
    const minutes = lessonTime ? parseInt(lessonTime) : 15;
    return isNaN(minutes) ? 1 : minutes / 15;
  }
  if (lessonType === "通常" || lessonType === "祝日") {
    if (lessonTitle === "ポワント" || lessonTitle === "プレモダン") return 0.5;
    return 1;
  }
  return 0;
}

const BADGE_THRESHOLDS = [
  { badge: "normal", min: 1 },
  { badge: "bronze", min: 2 },
  { badge: "silver", min: 3 },
  { badge: "gold", min: 4 },
  { badge: "platinum", min: 5 },
  { badge: "diamond", min: 6 },
];

const BADGE_LABEL: Record<string, string> = {
  normal: "ノーマル", bronze: "ブロンズ", silver: "シルバー",
  gold: "ゴールド", platinum: "プラチナ", diamond: "ダイヤモンド",
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lineUserId = searchParams.get("lineUserId");
    if (!lineUserId) return NextResponse.json({ error: "lineUserId required" }, { status: 400 });

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, name, line_display_name, line_picture_url, mypage_picture_url, mypage_name, status")
      .eq("line_user_id", lineUserId)
      .single();

    if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

    // 今月・先月のバッジ
    const [{ data: badge }, { data: lastBadge }] = await Promise.all([
      supabaseAdmin.from("badges").select("badge").eq("user_id", user.id).eq("year_month", yearMonth).single(),
      supabaseAdmin.from("badges").select("badge").eq("user_id", user.id).eq("year_month", lastYearMonth).single(),
    ]);

    // 今月の出席（加重カウント）
    const { data: monthlyAttendances } = await supabaseAdmin
      .from("attendances")
      .select("lesson_type, lesson_title, lesson_time")
      .eq("student_id", user.id)
      .gte("lesson_date", `${yearMonth}-01`)
      .lt("lesson_date", nextMonthStr);

    const monthlyCount = (monthlyAttendances ?? []).reduce(
      (sum, a) => sum + calcLessonCount(a.lesson_type, a.lesson_title, a.lesson_time),
      0
    );

    // 次のバッジまでの残り回数
    const currentBadge = badge?.badge ?? null;
    const lastMonthBadge = lastBadge?.badge ?? null;

    const CONTINUATION_BADGES = ["silver", "gold", "platinum", "diamond"];
    const isContinuation = CONTINUATION_BADGES.includes(lastMonthBadge ?? "");

    let nextBadgeResult = null;
    if (isContinuation) {
      const targetInfo = BADGE_THRESHOLDS.find((b) => b.badge === lastMonthBadge)!;
      const remaining = Math.ceil(targetInfo.min - monthlyCount);
      if (remaining > 0) {
        // まだ先月バッジ未達成 → 継続を促す
        nextBadgeResult = { badge: lastMonthBadge!, label: BADGE_LABEL[lastMonthBadge!], remaining, isContinuation: true };
      } else {
        // 先月バッジ達成済み → 次のランクを目標にする
        const currentRank = BADGE_THRESHOLDS.findIndex((b) => b.badge === currentBadge);
        const nextBadgeInfo = currentRank < BADGE_THRESHOLDS.length - 1
          ? BADGE_THRESHOLDS[currentRank + 1]
          : null;
        if (nextBadgeInfo) {
          const remainingForNext = Math.ceil(nextBadgeInfo.min - monthlyCount);
          if (remainingForNext > 0) {
            nextBadgeResult = { badge: nextBadgeInfo.badge, label: BADGE_LABEL[nextBadgeInfo.badge], remaining: remainingForNext, isContinuation: false };
          }
        }
      }
    } else {
      // 次のバッジ獲得を目標にする
      const currentRank = BADGE_THRESHOLDS.findIndex((b) => b.badge === currentBadge);
      const nextBadgeInfo = currentRank < BADGE_THRESHOLDS.length - 1
        ? BADGE_THRESHOLDS[currentRank + 1]
        : null;
      if (nextBadgeInfo) {
        const remaining = Math.ceil(nextBadgeInfo.min - monthlyCount);
        if (remaining > 0) {
          nextBadgeResult = { badge: nextBadgeInfo.badge, label: BADGE_LABEL[nextBadgeInfo.badge], remaining, isContinuation: false };
        }
      }
    }

    return NextResponse.json({
      user,
      currentBadge,
      monthlyCount,
      nextBadge: nextBadgeResult,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
