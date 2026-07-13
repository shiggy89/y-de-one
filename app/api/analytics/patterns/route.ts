import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getCurrentYearMonth() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  if (req.headers.get("x-analytics-key") !== process.env.ANALYTICS_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? getCurrentYearMonth();
  const [y, m] = month.split("-").map(Number);
  const monthStart = `${month}-01`;
  const nextM = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`;
  const sixMonthsBack = m > 6
    ? `${y}-${String(m - 6).padStart(2, "0")}-01`
    : `${y - 1}-${String(m + 6).padStart(2, "0")}-01`;

  const [{ data: monthAtt }, { data: recentAtt }, { data: users }] = await Promise.all([
    supabaseAdmin
      .from("attendances")
      .select("lesson_title, lesson_teacher, lesson_date, lesson_type")
      .gte("lesson_date", monthStart)
      .lt("lesson_date", nextM),
    supabaseAdmin
      .from("attendances")
      .select("student_id, lesson_date")
      .gte("lesson_date", sixMonthsBack)
      .neq("lesson_type", "リハーサル")
      .order("lesson_date"),
    supabaseAdmin
      .from("users")
      .select("id, name, mypage_name")
      .eq("status", "member"),
  ]);

  // レッスン別頻度
  const lessonMap = new Map<string, number>();
  for (const a of monthAtt ?? []) {
    const title = a.lesson_title ?? "不明";
    lessonMap.set(title, (lessonMap.get(title) ?? 0) + 1);
  }
  const lessonFreq = [...lessonMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([title, count]) => ({ title, count }));

  // 先生別頻度
  const teacherMap = new Map<string, number>();
  for (const a of monthAtt ?? []) {
    const teacher = a.lesson_teacher || "未設定";
    teacherMap.set(teacher, (teacherMap.get(teacher) ?? 0) + 1);
  }
  const teacherFreq = [...teacherMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([teacher, count]) => ({ teacher, count }));

  // 曜日別頻度
  const DAYS = ["日", "月", "火", "水", "木", "金", "土"];
  const dayMap = new Map<number, number>();
  for (let i = 0; i < 7; i++) dayMap.set(i, 0);
  for (const a of monthAtt ?? []) {
    const [yr, mo, dy] = a.lesson_date.split("-").map(Number);
    const dow = new Date(yr, mo - 1, dy).getDay();
    dayMap.set(dow, (dayMap.get(dow) ?? 0) + 1);
  }
  const dayFreq = DAYS.map((day, i) => ({ day, count: dayMap.get(i) ?? 0 }));

  // 出席間隔（過去6ヶ月）
  const studentNameMap = new Map<number, string>();
  for (const u of users ?? []) {
    studentNameMap.set(u.id, u.mypage_name ?? u.name ?? "—");
  }

  const visitsByStudent = new Map<number, string[]>();
  for (const a of recentAtt ?? []) {
    if (!visitsByStudent.has(a.student_id)) visitsByStudent.set(a.student_id, []);
    visitsByStudent.get(a.student_id)!.push(a.lesson_date);
  }

  const intervalStats: { id: number; name: string; avgInterval: number; visitCount: number }[] = [];
  for (const [studentId, dates] of visitsByStudent.entries()) {
    const sorted = [...new Set(dates)].sort();
    if (sorted.length < 2) continue;
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const [y1, m1, d1] = sorted[i - 1].split("-").map(Number);
      const [y2, m2, d2] = sorted[i].split("-").map(Number);
      const days = (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000;
      gaps.push(days);
    }
    const avg = Math.round((gaps.reduce((s, v) => s + v, 0) / gaps.length) * 10) / 10;
    intervalStats.push({
      id: studentId,
      name: studentNameMap.get(studentId) ?? "—",
      avgInterval: avg,
      visitCount: sorted.length,
    });
  }
  intervalStats.sort((a, b) => a.avgInterval - b.avgInterval);

  return NextResponse.json({ lessonFreq, teacherFreq, dayFreq, intervalStats });
}
