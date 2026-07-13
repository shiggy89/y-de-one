import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const DAYS = ["日", "月", "火", "水", "木", "金", "土"];

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

const BADGE_THRESHOLDS = [
  { badge: "normal",   min: 1  },
  { badge: "bronze",   min: 4  },
  { badge: "silver",   min: 8  },
  { badge: "gold",     min: 12 },
  { badge: "platinum", min: 20 },
  { badge: "diamond",  min: 40 },
];

const BADGE_ORDER = ["normal", "bronze", "silver", "gold", "platinum", "diamond"];

export async function GET(req: Request) {
  if (req.headers.get("x-analytics-key") !== process.env.ANALYTICS_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    const nowJst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const todayStr = `${nowJst.getUTCFullYear()}-${String(nowJst.getUTCMonth() + 1).padStart(2, "0")}-${String(nowJst.getUTCDate()).padStart(2, "0")}`;
    const yearMonth = month ?? `${nowJst.getUTCFullYear()}-${String(nowJst.getUTCMonth() + 1).padStart(2, "0")}`;
    const [y, m] = yearMonth.split("-").map(Number);
    const monthStart = `${yearMonth}-01`;
    const nextM = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`;
    const lastYearMonth = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;

    // 過去3ヶ月（行動パターン・最終来店用）: 今日基準
    const threeMonthsAgo = new Date(nowJst.getUTCFullYear(), nowJst.getUTCMonth() - 3, 1);
    const threeMonthsBack = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

    const [
      { data: users },
      { data: attendances },
      { data: lastMonthBadges },
      { data: histAttendances },
    ] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("id, name, line_picture_url, mypage_picture_url, mypage_name")
        .eq("status", "member")
        .order("name"),
      supabaseAdmin
        .from("attendances")
        .select("student_id, lesson_type, lesson_title, lesson_time, price_paid")
        .gte("lesson_date", monthStart)
        .lt("lesson_date", nextM),
      supabaseAdmin
        .from("badges")
        .select("user_id, badge")
        .eq("year_month", lastYearMonth),
      supabaseAdmin
        .from("attendances")
        .select("student_id, lesson_date, lesson_title, lesson_type")
        .gte("lesson_date", threeMonthsBack)
        .neq("lesson_type", "リハーサル")
        .order("lesson_date"),
    ]);

    // 今月の集計
    const countMap = new Map<number, number>();
    const revenueMap = new Map<number, number>();
    for (const a of attendances ?? []) {
      const c = calcLessonCount(a.lesson_type, a.lesson_title, a.lesson_time);
      countMap.set(a.student_id, (countMap.get(a.student_id) ?? 0) + c);
      revenueMap.set(a.student_id, (revenueMap.get(a.student_id) ?? 0) + (a.price_paid ?? 0));
    }

    const lastBadgeMap = new Map<number, string>();
    for (const b of lastMonthBadges ?? []) {
      lastBadgeMap.set(b.user_id, b.badge);
    }

    // 過去3ヶ月の行動パターン集計
    type Behavior = { days: Map<string, number>; lessons: Map<string, number>; dates: string[] };
    const behaviorMap = new Map<number, Behavior>();

    for (const a of histAttendances ?? []) {
      if (!behaviorMap.has(a.student_id)) {
        behaviorMap.set(a.student_id, { days: new Map(), lessons: new Map(), dates: [] });
      }
      const b = behaviorMap.get(a.student_id)!;

      const [yr, mo, dy] = a.lesson_date.split("-").map(Number);
      const dow = DAYS[new Date(yr, mo - 1, dy).getDay()];
      b.days.set(dow, (b.days.get(dow) ?? 0) + 1);

      if (a.lesson_title) {
        b.lessons.set(a.lesson_title, (b.lessons.get(a.lesson_title) ?? 0) + 1);
      }
      b.dates.push(a.lesson_date);
    }

    function getBehavior(studentId: number) {
      const b = behaviorMap.get(studentId);
      if (!b) return { favoriteDay: null, favoriteLesson: null, avgInterval: null, lastVisitDate: null, daysSinceLastVisit: null };

      const favoriteDay = [...b.days.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
      const favoriteLesson = [...b.lessons.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;

      const uniqueDates = [...new Set(b.dates)].sort();
      const lastVisitDate = uniqueDates[uniqueDates.length - 1] ?? null;

      let daysSinceLastVisit: number | null = null;
      if (lastVisitDate) {
        const [lyr, lmo, ldy] = lastVisitDate.split("-").map(Number);
        const [tyr, tmo, tdy] = todayStr.split("-").map(Number);
        daysSinceLastVisit = Math.floor(
          (new Date(tyr, tmo - 1, tdy).getTime() - new Date(lyr, lmo - 1, ldy).getTime()) / 86400000
        );
      }

      let avgInterval: number | null = null;
      if (uniqueDates.length >= 2) {
        const gaps: number[] = [];
        for (let i = 1; i < uniqueDates.length; i++) {
          const [y1, m1, d1] = uniqueDates[i - 1].split("-").map(Number);
          const [y2, m2, d2] = uniqueDates[i].split("-").map(Number);
          gaps.push((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000);
        }
        avgInterval = Math.round((gaps.reduce((s, v) => s + v, 0) / gaps.length) * 10) / 10;
      }

      return { favoriteDay, favoriteLesson, avgInterval, lastVisitDate, daysSinceLastVisit };
    }

    const students = (users ?? []).map((u) => {
      const count = Math.round((countMap.get(u.id) ?? 0) * 10) / 10;
      const currentBadge = calcBadge(count);
      const lastMonthBadge = lastBadgeMap.get(u.id) ?? null;

      const currentRank = currentBadge ? BADGE_ORDER.indexOf(currentBadge) : -1;
      const lastMonthRank = lastMonthBadge ? BADGE_ORDER.indexOf(lastMonthBadge) : -1;

      let nextBadge: { badge: string; remaining: number; isContinuation: boolean } | null = null;

      if (lastMonthRank > currentRank && lastMonthBadge) {
        const target = BADGE_THRESHOLDS.find((b) => b.badge === lastMonthBadge)!;
        const remaining = Math.ceil(target.min - count);
        if (remaining > 0) nextBadge = { badge: lastMonthBadge, remaining, isContinuation: true };
      }

      if (!nextBadge) {
        for (let i = currentRank + 1; i < BADGE_THRESHOLDS.length; i++) {
          const info = BADGE_THRESHOLDS[i];
          const rem = Math.ceil(info.min - count);
          if (rem > 0) { nextBadge = { badge: info.badge, remaining: rem, isContinuation: false }; break; }
        }
      }

      return {
        id: u.id,
        name: u.mypage_name ?? u.name ?? "—",
        pictureUrl: (u.mypage_picture_url ?? u.line_picture_url) as string | null,
        count,
        revenue: revenueMap.get(u.id) ?? 0,
        currentBadge,
        lastMonthBadge,
        nextBadge,
        ...getBehavior(u.id),
      };
    });

    return NextResponse.json({ students, yearMonth });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
