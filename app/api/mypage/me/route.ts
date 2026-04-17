import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function calcLessonCount(lessonType: string, lessonTitle: string | null, lessonTime: string | null): number {
  if (lessonType === "個人") {
    const minutes = lessonTime ? parseInt(lessonTime) : 15;
    return isNaN(minutes) ? 1 : minutes / 15;
  }
  if (lessonType === "通常" || lessonType === "祝日" || lessonType === "特別") {
    if (lessonTitle === "ポワント" || lessonTitle === "プレモダン") return 0.5;
    return 1;
  }
  return 0;
}

const BADGE_THRESHOLDS = [
  { badge: "normal",   min: 0  },
  { badge: "bronze",   min: 4  },
  { badge: "silver",   min: 8  },
  { badge: "gold",     min: 12 },
  { badge: "platinum", min: 20 },
  { badge: "diamond",  min: 40 },
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

    // 今月・先月のバッジ + 全出席履歴 + 全バッジ履歴を並列取得
    const [
      { data: badge },
      { data: lastBadge },
      { data: allAttendances },
      { data: allBadges },
    ] = await Promise.all([
      supabaseAdmin.from("badges").select("badge").eq("user_id", user.id).eq("year_month", yearMonth).single(),
      supabaseAdmin.from("badges").select("badge").eq("user_id", user.id).eq("year_month", lastYearMonth).single(),
      supabaseAdmin
        .from("attendances")
        .select("id, lesson_date, lesson_type, lesson_title, lesson_time, lesson_teacher, price_paid")
        .eq("student_id", user.id)
        .order("lesson_date", { ascending: true }),
      supabaseAdmin
        .from("badges")
        .select("year_month, badge")
        .eq("user_id", user.id)
        .order("year_month", { ascending: true }),
    ]);

    // 出席履歴: 維持費を分離して降順に
    const monthSeen = new Set<string>();
    const attendanceHistory = (allAttendances ?? []).map((a) => {
      const ym = a.lesson_date.slice(0, 7);
      const isFirst = !monthSeen.has(ym);
      if (isFirst) monthSeen.add(ym);
      const maintenance_fee = isFirst && a.price_paid > 0 ? 500 : 0;
      return { ...a, maintenance_fee, lesson_fee: a.price_paid - maintenance_fee };
    });

    // 今月の出席（加重カウント）
    const monthlyAttendances = (allAttendances ?? []).filter(
      (a) => a.lesson_date >= `${yearMonth}-01` && a.lesson_date < nextMonthStr
    );

    const monthlyCount = (monthlyAttendances ?? []).reduce(
      (sum, a) => sum + calcLessonCount(a.lesson_type, a.lesson_title, a.lesson_time),
      0
    );

    // 次のバッジまでの残り回数
    const currentBadge = badge?.badge ?? null;
    const lastMonthBadge = lastBadge?.badge ?? null;

    type NextBadge = { badge: string; label: string; remaining: number; isContinuation: boolean } | null;

    // remaining > 0 になる最初の上位バッジを返すヘルパー
    function findNextAchievable(fromBadge: string | null): NextBadge {
      const startRank = BADGE_THRESHOLDS.findIndex((b) => b.badge === fromBadge);
      for (let i = startRank + 1; i < BADGE_THRESHOLDS.length; i++) {
        const info = BADGE_THRESHOLDS[i];
        const rem = info.min - monthlyCount;
        if (rem > 0) {
          return { badge: info.badge, label: BADGE_LABEL[info.badge], remaining: rem, isContinuation: false };
        }
      }
      return null;
    }

    const CONTINUATION_BADGES = ["silver", "gold", "platinum", "diamond"];
    const isContinuation = CONTINUATION_BADGES.includes(lastMonthBadge ?? "");

    let nextBadgeResult: NextBadge = null;
    if (isContinuation) {
      const targetInfo = BADGE_THRESHOLDS.find((b) => b.badge === lastMonthBadge)!;
      const remaining = targetInfo.min - monthlyCount;
      if (remaining > 0) {
        // まだ先月バッジ未達成 → 継続を促す
        nextBadgeResult = { badge: lastMonthBadge!, label: BADGE_LABEL[lastMonthBadge!], remaining, isContinuation: true };
      } else {
        // 先月バッジ達成済み → 次のランクを目標にする
        nextBadgeResult = findNextAchievable(currentBadge);
      }
    } else {
      nextBadgeResult = findNextAchievable(currentBadge);
    }

    return NextResponse.json({
      user,
      currentBadge,
      lastMonthBadge,
      monthlyCount,
      nextBadge: nextBadgeResult,
      attendanceHistory,
      badgeHistory: allBadges ?? [],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
