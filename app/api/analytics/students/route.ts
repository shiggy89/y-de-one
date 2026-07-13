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

    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const yearMonth = month ?? `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
    const [y, m] = yearMonth.split("-").map(Number);
    const monthStart = `${yearMonth}-01`;
    const nextM = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`;
    const lastYearMonth = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;

    const [{ data: users }, { data: attendances }, { data: lastMonthBadges }] = await Promise.all([
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
    ]);

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
        if (remaining > 0) {
          nextBadge = { badge: lastMonthBadge, remaining, isContinuation: true };
        }
      }

      if (!nextBadge) {
        for (let i = currentRank + 1; i < BADGE_THRESHOLDS.length; i++) {
          const info = BADGE_THRESHOLDS[i];
          const rem = Math.ceil(info.min - count);
          if (rem > 0) {
            nextBadge = { badge: info.badge, remaining: rem, isContinuation: false };
            break;
          }
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
      };
    });

    return NextResponse.json({ students, yearMonth });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
