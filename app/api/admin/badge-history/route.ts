import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = `${yearMonth}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

    // 過去月バッジ + 今月の出席データを並列取得
    const [{ data, error }, { data: currentAttendances }] = await Promise.all([
      supabaseAdmin
        .from("badges")
        .select("year_month, badge")
        .eq("user_id", userId)
        .order("year_month", { ascending: true }),
      supabaseAdmin
        .from("attendances")
        .select("lesson_type, lesson_title, lesson_time")
        .eq("student_id", userId)
        .gte("lesson_date", monthStart)
        .lt("lesson_date", monthEnd),
    ]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const badges = data ?? [];

    // 今月バッジをリアルタイム計算して追加
    const monthlyCount = (currentAttendances ?? []).reduce(
      (sum, a) => sum + calcLessonCount(a.lesson_type, a.lesson_title, a.lesson_time),
      0
    );
    const currentBadge = calcBadge(monthlyCount);
    if (currentBadge) {
      const existing = badges.findIndex((b) => b.year_month === yearMonth);
      if (existing >= 0) {
        badges[existing] = { year_month: yearMonth, badge: currentBadge };
      } else {
        badges.push({ year_month: yearMonth, badge: currentBadge });
      }
    }

    return NextResponse.json({ badges });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
