import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 全生徒のバッジ履歴を一括返却（会員管理タブ用）

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

function calcBadge(count: number): string | null {
  if (count >= 40) return "diamond";
  if (count >= 20) return "platinum";
  if (count >= 12) return "gold";
  if (count >= 8) return "silver";
  if (count >= 4) return "bronze";
  if (count >= 1) return "normal";
  return null;
}

export async function GET() {
  try {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = `${yearMonth}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

    // badges テーブル（過去月）と今月の出席データを並列取得
    const [{ data: badgeRows }, { data: currentAttendances }] = await Promise.all([
      supabaseAdmin
        .from("badges")
        .select("user_id, year_month, badge")
        .order("year_month", { ascending: true }),
      supabaseAdmin
        .from("attendances")
        .select("student_id, lesson_type, lesson_title, lesson_time")
        .gte("lesson_date", monthStart)
        .lt("lesson_date", monthEnd),
    ]);

    // 過去月バッジをユーザーIDごとにグループ化
    const grouped: Record<number, { year_month: string; badge: string }[]> = {};
    for (const b of badgeRows ?? []) {
      if (!grouped[b.user_id]) grouped[b.user_id] = [];
      grouped[b.user_id].push({ year_month: b.year_month, badge: b.badge });
    }

    // 今月の出席からバッジをリアルタイム計算して追加
    const countMap: Record<number, number> = {};
    for (const a of currentAttendances ?? []) {
      countMap[a.student_id] = (countMap[a.student_id] ?? 0) +
        calcLessonCount(a.lesson_type, a.lesson_title, a.lesson_time);
    }
    for (const [studentId, count] of Object.entries(countMap)) {
      const badge = calcBadge(count);
      if (!badge) continue;
      const uid = Number(studentId);
      if (!grouped[uid]) grouped[uid] = [];
      // 既に今月分があれば上書き、なければ追加
      const existing = grouped[uid].findIndex((b) => b.year_month === yearMonth);
      if (existing >= 0) {
        grouped[uid][existing] = { year_month: yearMonth, badge };
      } else {
        grouped[uid].push({ year_month: yearMonth, badge });
      }
    }

    return NextResponse.json({ badges: grouped });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ badges: {} }, { status: 500 });
  }
}
