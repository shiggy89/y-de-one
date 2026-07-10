import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  parsePeriod,
  filterClassRecords,
  calcStudentPeriodCount,
  calcStudentPeriodRevenue,
  calcLastAttendanceDate,
  calcAvgIntervalDays,
  getPrimaryDow,
  getPrimaryTime,
  getFavoriteClasses,
  getFavoriteTeacher,
  classifyFrequency,
  classifyTrend,
  classifyBehavior,
  calcAdditionalPotential,
  calcCoOccurrencePairs,
  calcClassFill,
  calcKPI,
  calcActionPriorityStudents,
  calcClassRecruitmentOpportunities,
  calcMonthlyDistribution,
  calcRevenueImpact,
  DAY_LABEL,
  AttendanceRow,
  UserRow,
  StudentAnalysisSummary,
} from "@/lib/studentAnalytics";
import { scoreAndRankRecommendations } from "@/lib/recommendationEngine";

export async function GET(req: Request) {
  const key = req.headers.get("x-analytics-key");
  if (!key || key !== process.env.ANALYTICS_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = parsePeriod(
    searchParams.get("month"),
    searchParams.get("week"),
    searchParams.get("from"),
    searchParams.get("to"),
  );

  // Fetch 12 months of records for context, last-attendance, and trends
  const twelveMonthsAgo = new Date(period.from + "T00:00:00");
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const contextFrom = twelveMonthsAgo.toISOString().split("T")[0];

  const [
    { data: allAttendances },
    { data: allUsers },
    { data: firstDates },
  ] = await Promise.all([
    supabaseAdmin
      .from("attendances")
      .select(
        "student_id, lesson_date, lesson_type, lesson_title, lesson_teacher, lesson_time, price_paid",
      )
      .gte("lesson_date", contextFrom),
    supabaseAdmin
      .from("users")
      .select("id, name, line_picture_url, mypage_picture_url, mypage_name, status"),
    supabaseAdmin
      .from("attendances")
      .select("student_id, lesson_date")
      .order("lesson_date", { ascending: true }),
  ]);

  const attendances = (allAttendances ?? []) as AttendanceRow[];
  const users = (allUsers ?? []) as UserRow[];

  // First attendance dates (all-time)
  const firstDateMap = new Map<number, string>();
  (firstDates ?? []).forEach(
    (r: { student_id: number; lesson_date: string }) => {
      if (!firstDateMap.has(r.student_id)) firstDateMap.set(r.student_id, r.lesson_date);
    },
  );

  // All-time counts from separate query (reuse firstDates rows for this)
  const allTimeCountMap = new Map<number, number>();
  (firstDates ?? []).forEach((r: { student_id: number }) => {
    allTimeCountMap.set(r.student_id, (allTimeCountMap.get(r.student_id) ?? 0) + 1);
  });

  // Split records by period
  const currentRecords = attendances.filter(
    (r) => r.lesson_date >= period.from && r.lesson_date < period.to,
  );
  const prevRecords = attendances.filter(
    (r) => r.lesson_date >= period.prevFrom && r.lesson_date < period.prevTo,
  );

  // Context: last 3 months for behavior analysis
  const threeMonthsAgo = new Date(period.from + "T00:00:00");
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const contextThreeMonths = threeMonthsAgo.toISOString().split("T")[0];
  const contextRecords = attendances.filter((r) => r.lesson_date >= contextThreeMonths);

  // Class fill from last month (for recommendation space calculation)
  const classFill = calcClassFill(currentRecords.length > 0 ? currentRecords : contextRecords);

  const today = new Date();
  const members = users.filter((u) => u.status === "member");

  const students: StudentAnalysisSummary[] = members.map((user) => {
    const name = user.mypage_name ?? user.name ?? "名前なし";
    const pictureUrl = user.mypage_picture_url ?? user.line_picture_url;

    const currentCount = calcStudentPeriodCount(currentRecords, user.id);
    const prevCount = calcStudentPeriodCount(prevRecords, user.id);
    const currentRevenue = calcStudentPeriodRevenue(currentRecords, user.id);
    const changeCount = currentCount - prevCount;
    const changeRate =
      prevCount > 0 ? Math.round(((currentCount - prevCount) / prevCount) * 1000) / 1000 : null;

    const { date: lastDate, daysAgo } = calcLastAttendanceDate(attendances, user.id, today);

    // Avg interval from context records
    const avgIntervalDays = calcAvgIntervalDays(
      filterClassRecords(contextRecords).filter((r) => r.student_id === user.id),
      user.id,
    );

    const { dow: primaryDow } = getPrimaryDow(contextRecords, user.id);
    const primaryDowLabel =
      primaryDow !== null ? (DAY_LABEL[primaryDow] ?? "") : "";
    const primaryTime = getPrimaryTime(contextRecords, user.id);
    const favoriteClasses = getFavoriteClasses(contextRecords, user.id, 3);
    const favoriteTeacher = getFavoriteTeacher(contextRecords, user.id);

    const frequencyType = classifyFrequency(currentCount, daysAgo);
    const trendType = classifyTrend(currentCount, prevCount);
    const behaviorTypes = classifyBehavior(contextRecords, user.id);

    const contextClassRecords = filterClassRecords(contextRecords.filter((r) => r.student_id === user.id));
    const hasEnoughHistory =
      contextClassRecords.length >= 3;
    const uniqueClassesInContext = new Set(contextClassRecords.map((r) => r.lesson_title)).size;
    const hasMultiClassHistory = uniqueClassesInContext >= 2;

    const additionalPotential = calcAdditionalPotential({
      currentMonthlyCount: currentCount,
      daysSinceLastAttendance: daysAgo,
      behaviorTypes,
      hasMultiClassHistory,
      hasEnoughHistory,
    });

    const recommendations = scoreAndRankRecommendations(
      user.id,
      contextRecords,
      currentRecords,
      classFill,
      3,
    );

    return {
      id: user.id,
      name,
      pictureUrl,
      currentCount,
      prevCount,
      changeCount,
      changeRate,
      currentRevenue,
      lastAttendanceDate: lastDate,
      daysSinceLastAttendance: daysAgo,
      avgIntervalDays,
      primaryDow,
      primaryDowLabel,
      primaryTime,
      favoriteClasses,
      favoriteTeacher,
      frequencyType,
      trendType,
      behaviorTypes,
      additionalPotential,
      hasEnoughHistory,
      recommendations,
      allTimeCount: allTimeCountMap.get(user.id) ?? 0,
      firstAttendanceDate: firstDateMap.get(user.id) ?? null,
    };
  });

  const coOccurrence = calcCoOccurrencePairs(contextRecords);
  const actionStudents = calcActionPriorityStudents(students);
  const classRecruitment = calcClassRecruitmentOpportunities(students, classFill);
  const monthlyDistribution = calcMonthlyDistribution(students);
  const revenueImpact = calcRevenueImpact(students);
  const kpi = calcKPI(students, actionStudents.length, classRecruitment.length);

  return NextResponse.json({ period, kpi, students, coOccurrence, actionStudents, classRecruitment, monthlyDistribution, revenueImpact });
}
