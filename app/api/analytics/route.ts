import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const TARGET = 15;
const DAY_LABEL = ["日", "月", "火", "水", "木", "金", "土"];
const BADGE_ORDER = ["normal", "bronze", "silver", "gold", "platinum", "diamond"];

const CLASS_SLOTS = [
  { dow: 2, title: "バレエ入門",           teacher: "門馬和樹", time: "13:00" },
  { dow: 2, title: "プレモダン",           teacher: "門馬和樹", time: "14:30" },
  { dow: 2, title: "モダンバレエ",         teacher: "青山佳樹", time: "19:30" },
  { dow: 3, title: "バレエ基礎",           teacher: "門馬和樹", time: "13:00" },
  { dow: 3, title: "モダンバレエ",         teacher: "門馬和樹", time: "15:00" },
  { dow: 3, title: "バレエ入門基礎",       teacher: "青山佳樹", time: "19:15" },
  { dow: 4, title: "バレエ基礎",           teacher: "青山佳樹", time: "13:00" },
  { dow: 4, title: "ポワント",             teacher: "青山佳樹", time: "14:30" },
  { dow: 4, title: "モダンバレエ",         teacher: "青山佳樹", time: "15:30" },
  { dow: 4, title: "モダンバレエ",         teacher: "門馬和樹", time: "19:30" },
  { dow: 5, title: "バレエ入門",           teacher: "青山佳樹", time: "15:00" },
  { dow: 5, title: "ポワント",             teacher: "青山佳樹", time: "16:30" },
  { dow: 6, title: "バレエ入門基礎合同",   teacher: "門馬和樹", time: "12:30" },
  { dow: 6, title: "モダンバレエ",         teacher: "青山佳樹", time: "14:30" },
  { dow: 0, title: "バレエ入門",           teacher: "青山佳樹", time: "12:30" },
  { dow: 0, title: "ポワント+バレエ基礎センター", teacher: "青山佳樹", time: "14:15" },
];

export async function GET(req: Request) {
  const key = req.headers.get("x-analytics-key");
  if (!key || key !== process.env.ANALYTICS_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });

  const from = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const toDate = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const twelveMonthsAgo = new Date(y, m - 13, 1);
  const trendFrom = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

  const [
    { data: monthRows },
    { data: allUsers },
    { data: trendRows },
    { data: allBadges },
  ] = await Promise.all([
    supabaseAdmin
      .from("attendances")
      .select("student_id, lesson_date, lesson_title, lesson_teacher, lesson_type, lesson_time, price_paid")
      .gte("lesson_date", from)
      .lt("lesson_date", toDate),
    supabaseAdmin
      .from("users")
      .select("id, name, line_picture_url, status"),
    supabaseAdmin
      .from("attendances")
      .select("student_id, lesson_date")
      .gte("lesson_date", trendFrom)
      .lt("lesson_date", toDate),
    supabaseAdmin
      .from("badges")
      .select("user_id, year_month, badge"),
  ]);

  const records = monthRows ?? [];
  const users = allUsers ?? [];
  const trends = trendRows ?? [];
  const badges = allBadges ?? [];

  const userMap = new Map(users.map((u) => [u.id, u]));
  const classRecords = records.filter((r) => ["通常", "祝日", "特別"].includes(r.lesson_type));

  // ── KPI ──────────────────────────────────────────
  const totalAttendance = classRecords.length;
  const totalRevenue = records.reduce((s, r) => s + (r.price_paid ?? 0), 0);

  // ── Class Fill ───────────────────────────────────
  const slotSessions = new Map<string, Set<string>>();
  const slotStudents = new Map<string, Set<number>>();
  const slotTotal = new Map<string, number>();

  classRecords.forEach((r) => {
    const dow = new Date(r.lesson_date + "T00:00:00").getDay();
    const slot = CLASS_SLOTS.find(
      (s) => s.dow === dow && s.title === (r.lesson_title ?? "") && s.teacher === (r.lesson_teacher ?? "")
    );
    if (!slot) return;
    const k = `${dow}_${r.lesson_title}_${r.lesson_teacher}`;
    if (!slotSessions.has(k)) slotSessions.set(k, new Set());
    if (!slotStudents.has(k)) slotStudents.set(k, new Set());
    slotSessions.get(k)!.add(r.lesson_date);
    slotStudents.get(k)!.add(r.student_id);
    slotTotal.set(k, (slotTotal.get(k) ?? 0) + 1);
  });

  const classFill = CLASS_SLOTS.map((slot) => {
    const k = `${slot.dow}_${slot.title}_${slot.teacher}`;
    const sessions = slotSessions.get(k)?.size ?? 0;
    const total = slotTotal.get(k) ?? 0;
    const avg = sessions > 0 ? Math.round((total / sessions) * 10) / 10 : 0;
    const studentIds = Array.from(slotStudents.get(k) ?? []);
    const students = studentIds
      .map((id) => userMap.get(id))
      .filter(Boolean)
      .map((u) => ({ id: u!.id, name: u!.name ?? "名前なし", picture_url: u!.line_picture_url }));
    return {
      id: k,
      day: DAY_LABEL[slot.dow],
      dow: slot.dow,
      title: slot.title,
      teacher: slot.teacher,
      time: slot.time,
      sessions,
      avgAttendees: avg,
      fillRate: avg / TARGET,
      students,
    };
  });

  const avgFillPct = Math.round(
    classFill.filter((c) => c.sessions > 0).reduce((s, c) => s + c.fillRate, 0) /
    Math.max(1, classFill.filter((c) => c.sessions > 0).length) * 100
  );

  // ── Rankings ─────────────────────────────────────
  const attCount = new Map<number, number>();
  const revTotal = new Map<number, number>();
  classRecords.forEach((r) => attCount.set(r.student_id, (attCount.get(r.student_id) ?? 0) + 1));
  records.forEach((r) => revTotal.set(r.student_id, (revTotal.get(r.student_id) ?? 0) + (r.price_paid ?? 0)));

  const toRankItem = (id: number, extra: object) => {
    const u = userMap.get(id);
    return { id, name: u?.name ?? "名前なし", picture_url: u?.line_picture_url ?? null, ...extra };
  };

  const byAttendance = [...attCount.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([id, count]) => toRankItem(id, { count }));

  const byRevenue = [...revTotal.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([id, total]) => toRankItem(id, { total }));

  const badgeCountMap = new Map<number, number>();
  const topBadgeMap = new Map<number, string>();
  badges.forEach((b) => {
    badgeCountMap.set(b.user_id, (badgeCountMap.get(b.user_id) ?? 0) + 1);
    const cur = topBadgeMap.get(b.user_id);
    if (!cur || BADGE_ORDER.indexOf(b.badge) > BADGE_ORDER.indexOf(cur)) topBadgeMap.set(b.user_id, b.badge);
  });
  const byBadges = [...badgeCountMap.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([id, badgeCount]) => toRankItem(id, { badgeCount, topBadge: topBadgeMap.get(id) ?? "normal" }));

  // ── Churn Risk ───────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const latestByStudent = new Map<number, string>();
  trends.forEach((r) => {
    const cur = latestByStudent.get(r.student_id);
    if (!cur || r.lesson_date > cur) latestByStudent.set(r.student_id, r.lesson_date);
  });

  const churnRisk = users
    .filter((u) => u.status === "member")
    .flatMap((u) => {
      const last = latestByStudent.get(u.id);
      if (!last) return [];
      const daysAgo = Math.floor((today.getTime() - new Date(last + "T00:00:00").getTime()) / 86400000);
      return daysAgo >= 30 ? [{ id: u.id, name: u.name ?? "名前なし", picture_url: u.line_picture_url ?? null, lastDate: last, daysAgo }] : [];
    })
    .sort((a, b) => b.daysAgo - a.daysAgo);

  // ── Weekly Trend (12週) ──────────────────────────
  const weeklyMap = new Map<string, number>();
  trends.forEach((r) => {
    const d = new Date(r.lesson_date + "T00:00:00");
    const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const k = mon.toISOString().split("T")[0];
    weeklyMap.set(k, (weeklyMap.get(k) ?? 0) + 1);
  });
  const weeklyTrend = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - ((today.getDay() + 6) % 7) - (11 - i) * 7);
    const k = d.toISOString().split("T")[0];
    return { week: k, label: `${d.getMonth() + 1}/${d.getDate()}`, count: weeklyMap.get(k) ?? 0 };
  });

  // ── Monthly Trend (12ヶ月) ───────────────────────
  const monthlyMap = new Map<string, number>();
  trends.forEach((r) => { const ym = r.lesson_date.slice(0, 7); monthlyMap.set(ym, (monthlyMap.get(ym) ?? 0) + 1); });
  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(y, m - 1 - (11 - i), 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { month: ym, label: `${d.getMonth() + 1}月`, count: monthlyMap.get(ym) ?? 0 };
  });

  // ── Multi-class students ─────────────────────────
  const studentClasses = new Map<number, Set<string>>();
  classRecords.forEach((r) => {
    if (!r.lesson_title) return;
    if (!studentClasses.has(r.student_id)) studentClasses.set(r.student_id, new Set());
    studentClasses.get(r.student_id)!.add(r.lesson_title);
  });
  const multiStudents = [...studentClasses.entries()]
    .filter(([, c]) => c.size >= 2).sort((a, b) => b[1].size - a[1].size).slice(0, 10)
    .map(([id, classes]) => toRankItem(id, { classCount: classes.size, classes: Array.from(classes) }));
  const avgClassesPerStudent = studentClasses.size > 0
    ? Math.round([...studentClasses.values()].reduce((s, c) => s + c.size, 0) / studentClasses.size * 10) / 10
    : 0;

  return NextResponse.json({
    kpi: { totalAttendance, totalRevenue, avgFillPct, churnRiskCount: churnRisk.length },
    classFill,
    rankings: { byAttendance, byRevenue, byBadges },
    churnRisk,
    weeklyTrend,
    monthlyTrend,
    multiClass: { avgClassesPerStudent, multiStudents },
  });
}
