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
      .select("id, name, line_display_name, line_picture_url, mypage_picture_url, mypage_name, status, current_badge, badge_notified")
      .eq("line_user_id", lineUserId)
      .single();

    if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

    // 全出席履歴 + 全バッジ履歴を並列取得
    const [{ data: allAttendances }, { data: allBadges }] = await Promise.all([
      supabaseAdmin
        .from("attendances")
        .select("id, lesson_date, lesson_type, lesson_title, lesson_time, lesson_teacher, price_paid")
        .eq("student_id", user.id)
        .order("lesson_date", { ascending: true })
        .order("lesson_time", { ascending: true, nullsFirst: false }),
      supabaseAdmin
        .from("badges")
        .select("year_month, badge")
        .eq("user_id", user.id)
        .order("year_month", { ascending: true }),
    ]);

    // 出席履歴: 維持費を分離
    const monthSeen = new Set<string>();
    const attendanceHistory = (allAttendances ?? []).map((a) => {
      const ym = a.lesson_date.slice(0, 7);
      const isFirst = !monthSeen.has(ym);
      if (isFirst) monthSeen.add(ym);
      const maintenance_fee = isFirst && a.price_paid > 0 ? 500 : 0;
      return { ...a, maintenance_fee, lesson_fee: a.price_paid - maintenance_fee };
    });

    // 累計レッスン数（バッジ計算用）
    const totalCount = (allAttendances ?? []).reduce(
      (sum, a) => sum + calcLessonCount(a.lesson_type, a.lesson_title, a.lesson_time),
      0
    );

    const currentBadge = user.current_badge ?? null;

    // 次のバッジまでの残り回数（累計ベース）
    const currentRank = BADGE_THRESHOLDS.findIndex((b) => b.badge === currentBadge);
    let nextBadgeResult: { badge: string; label: string; remaining: number } | null = null;
    for (let i = currentRank + 1; i < BADGE_THRESHOLDS.length; i++) {
      const info = BADGE_THRESHOLDS[i];
      const rem = info.min - totalCount;
      if (rem > 0) {
        nextBadgeResult = { badge: info.badge, label: BADGE_LABEL[info.badge], remaining: rem };
        break;
      }
    }

    // 未通知バッジがあれば返す
    const newBadge = user.badge_notified === false ? currentBadge : null;

    return NextResponse.json({
      user,
      currentBadge,
      newBadge,
      totalCount,
      nextBadge: nextBadgeResult,
      attendanceHistory,
      badgeHistory: allBadges ?? [],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
