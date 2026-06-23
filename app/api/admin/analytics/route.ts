import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSuperAdmin } from "@/lib/superAdmin";

const DAY_LABEL = ["日", "月", "火", "水", "木", "金", "土"];

// GET /api/admin/analytics?month=YYYY-MM
export async function GET(req: Request) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "2026-06"
  if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });

  const from = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const { data: rows } = await supabaseAdmin
    .from("attendances")
    .select("student_id, lesson_date, lesson_title, lesson_teacher, lesson_type")
    .gte("lesson_date", from)
    .lt("lesson_date", nextMonth)
    .not("lesson_type", "eq", "個人"); // 個人レッスンはクラス集計から除外

  const records = rows ?? [];

  // クラス別出席数
  const byClass: Record<string, number> = {};
  // 曜日別出席数
  const byDay: number[] = [0, 0, 0, 0, 0, 0, 0];
  // 先生別出席数
  const byTeacher: Record<string, number> = {};
  // ユニーク受講者数（延べではなく実人数）のため日付+クラス+時間でデdup
  const sessionSet = new Set<string>();

  records.forEach((r) => {
    const title = r.lesson_title ?? "不明";
    byClass[title] = (byClass[title] ?? 0) + 1;

    const d = new Date(r.lesson_date + "T00:00:00");
    byDay[d.getDay()] += 1;

    const teacher = r.lesson_teacher ?? "不明";
    byTeacher[teacher] = (byTeacher[teacher] ?? 0) + 1;

    sessionSet.add(`${r.lesson_date}__${title}`);
  });

  const totalAttendance = records.length;
  const totalSessions = sessionSet.size;

  const classRanking = Object.entries(byClass)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count);

  const dayRanking = byDay.map((count, i) => ({ day: DAY_LABEL[i], count }));

  const teacherRanking = Object.entries(byTeacher)
    .map(([teacher, count]) => ({ teacher, count }))
    .sort((a, b) => b.count - a.count);

  const topClass = classRanking[0]?.title ?? "—";
  const topDay = [...dayRanking].sort((a, b) => b.count - a.count)[0]?.day ?? "—";
  const avgPerSession = totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0;

  return NextResponse.json({
    month,
    totalAttendance,
    totalSessions,
    avgPerSession,
    topClass,
    topDay,
    classRanking,
    dayRanking,
    teacherRanking,
  });
}
