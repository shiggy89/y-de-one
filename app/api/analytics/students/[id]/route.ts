import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getMonthlyTrend,
  getRevenueTrend,
  calcDowDistribution,
  calcClassDistribution,
  calcTeacherDistribution,
  calcTimeDistribution,
  DAY_LABEL,
  AttendanceRow,
} from "@/lib/studentAnalytics";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const key = req.headers.get("x-analytics-key");
  if (!key || key !== process.env.ANALYTICS_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const studentId = Number(id);
  if (isNaN(studentId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [{ data: attendanceRows }, { data: userRow }] = await Promise.all([
    supabaseAdmin
      .from("attendances")
      .select(
        "student_id, lesson_date, lesson_type, lesson_title, lesson_teacher, lesson_time, price_paid",
      )
      .eq("student_id", studentId)
      .order("lesson_date", { ascending: false }),
    supabaseAdmin
      .from("users")
      .select("id, name, mypage_name, line_picture_url, mypage_picture_url, status")
      .eq("id", studentId)
      .single(),
  ]);

  if (!userRow) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const records = (attendanceRows ?? []) as AttendanceRow[];
  const allTimeCount = records.length;
  const allTimeRevenue = records.reduce((s, r) => s + (r.price_paid ?? 0), 0);
  const firstAttendanceDate = records.length > 0
    ? [...records].sort((a, b) => a.lesson_date.localeCompare(b.lesson_date))[0].lesson_date
    : null;

  const monthlyTrend = getMonthlyTrend(records, studentId, 12);
  const revenueTrend = getRevenueTrend(records, studentId, 12);

  // Distributions (all-time)
  const dowDist = calcDowDistribution(records, studentId);
  const classDist = calcClassDistribution(records, studentId);
  const teacherDist = calcTeacherDistribution(records, studentId);
  const timeDist = calcTimeDistribution(records, studentId);

  // Convert maps to serializable arrays
  const dowDistArr = Array.from({ length: 7 }, (_, i) => ({
    dow: i,
    label: DAY_LABEL[i],
    count: dowDist.get(i) ?? 0,
  }));

  const classDistArr = [...classDist.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([title, count]) => ({ title, count }));

  const teacherDistArr = [...teacherDist.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([teacher, count]) => ({ teacher, count }));

  const timeDistArr = [...timeDist.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, count]) => ({ time, count }));

  // History: last 100 records (already sorted desc)
  const history = records.slice(0, 100).map((r) => {
    const d = new Date(r.lesson_date + "T00:00:00");
    return {
      date: r.lesson_date,
      dowLabel: DAY_LABEL[d.getDay()],
      time: r.lesson_time ?? "",
      title: r.lesson_title ?? "",
      teacher: r.lesson_teacher ?? "",
      type: r.lesson_type,
      pricePaid: r.price_paid ?? 0,
    };
  });

  return NextResponse.json({
    student: {
      id: studentId,
      name: userRow.mypage_name ?? userRow.name ?? "名前なし",
      pictureUrl: userRow.mypage_picture_url ?? userRow.line_picture_url,
    },
    allTimeCount,
    allTimeRevenue,
    firstAttendanceDate,
    monthlyTrend,
    revenueTrend,
    distributions: { dow: dowDistArr, class: classDistArr, teacher: teacherDistArr, time: timeDistArr },
    history,
  });
}
