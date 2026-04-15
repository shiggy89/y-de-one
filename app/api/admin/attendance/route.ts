import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 維持費500円を除いたレッスン料金累計
const LESSON_FEES_ONLY = [2800, 5400, 7800, 9600, 11800, 14000, 16200, 17600];

function calcPrice(countThisMonth: number, lessonType: string, privateMinutes = 15, lessonTitle?: string): number {
  if (lessonType === "個人") return 2500 * (privateMinutes / 15);
  if (lessonType === "祝日") {
    if (lessonTitle === "特別レッスン") return 3000;
    if (lessonTitle === "ポワント" || lessonTitle === "プレモダン") return 1100;
  } else if (lessonType === "通常") {
    if (lessonTitle === "ポワント" || lessonTitle === "プレモダン") return 1100;
  }
  if (countThisMonth >= 9) return 2000;
  const total = LESSON_FEES_ONLY[countThisMonth - 1] ?? 2800;
  const prev = countThisMonth > 1 ? (LESSON_FEES_ONLY[countThisMonth - 2] ?? 0) : 0;
  return total - prev;
}

// レッスンのバッジ計算用カウント
// 通常: ポワント/プレモダン=0.5, それ以外=1
// 祝日: ポワント/プレモダン=0.5, それ以外=1
// 個人: 15分=1回（lesson_timeに分数が入っている）
function calcLessonCount(lessonType: string, lessonTitle: string | null, lessonTime: string | null): number {
  if (lessonType === "個人") {
    const minutes = lessonTime ? parseInt(lessonTime) : 15;
    return isNaN(minutes) ? 1 : minutes / 15;
  }
  if (lessonType === "通常" || lessonType === "祝日") {
    if (lessonTitle === "ポワント" || lessonTitle === "プレモダン") return 0.5;
    return 1;
  }
  return 0;
}

// 月間カウントからバッジを決定
// 1回→normal, 2回→bronze, 3回→silver, 4回→gold, 5回→platinum, 6回→diamond
function calcBadge(count: number): string | null {
  if (count >= 6) return "diamond";
  if (count >= 5) return "platinum";
  if (count >= 4) return "gold";
  if (count >= 3) return "silver";
  if (count >= 2) return "bronze";
  if (count >= 1) return "normal";
  return null;
}

export async function POST(req: Request) {
  try {
    const { userId, lessonDate, lessonType, privateMinutes, lessonTitle, lessonTime, lessonTeacher } = await req.json();
    const lessonTimeStart = lessonTime ? lessonTime.split("〜")[0] : null;

    if (!userId || !lessonDate || !lessonType) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    // 先生は料金0円
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("status")
      .eq("id", userId)
      .single();

    const isTeacher = user?.status === "teacher";

    // 今月の出席回数を取得
    const yearMonth = lessonDate.slice(0, 7); // "2026-04"
    const nextMonth = new Date(`${yearMonth}-01`);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split("T")[0];

    // lessonDate より前の件数
    const { data: beforeDate } = await supabaseAdmin
      .from("attendances")
      .select("id")
      .eq("student_id", userId)
      .gte("lesson_date", `${yearMonth}-01`)
      .lt("lesson_date", lessonDate);

    // 同日でlessonTimeより前の件数（同日複数レッスン対応）
    const { data: sameDay } = lessonTimeStart
      ? await supabaseAdmin
          .from("attendances")
          .select("id")
          .eq("student_id", userId)
          .eq("lesson_date", lessonDate)
          .lt("lesson_time", lessonTimeStart)
      : { data: [] };

    const prevCount = (beforeDate?.length ?? 0) + (sameDay?.length ?? 0);
    const countThisMonth = prevCount + 1;
    const isFirstOfMonth = prevCount === 0;
    const maintenanceFee = isFirstOfMonth ? 500 : 0;
    const lessonFee = isTeacher ? 0 : calcPrice(countThisMonth, lessonType, privateMinutes, lessonTitle);
    const price = lessonFee + (isTeacher ? 0 : maintenanceFee);

    // 個人レッスンはlesson_timeに分数を保存（バッジ計算用）
    const storedLessonTime = lessonType === "個人"
      ? String(privateMinutes ?? 15)
      : (lessonTime ?? null);

    // 出席記録を保存
    const { error } = await supabaseAdmin.from("attendances").insert({
      student_id: userId,
      lesson_date: lessonDate,
      lesson_type: lessonType,
      price_paid: price,
      lesson_title: lessonTitle ?? null,
      lesson_time: storedLessonTime,
      lesson_teacher: lessonTeacher ?? null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // バッジ判定：月間全レッスンを加重カウント
    const { data: monthlyAttendances } = await supabaseAdmin
      .from("attendances")
      .select("lesson_type, lesson_title, lesson_time")
      .eq("student_id", userId)
      .gte("lesson_date", `${yearMonth}-01`)
      .lt("lesson_date", nextMonthStr);

    const monthlyCount = (monthlyAttendances ?? []).reduce(
      (sum, a) => sum + calcLessonCount(a.lesson_type, a.lesson_title, a.lesson_time),
      0
    );
    const badge = calcBadge(monthlyCount);

    const badgeOrder = ["normal", "bronze", "silver", "gold", "platinum", "diamond"];

    if (badge) {
      const { data: existingBadge } = await supabaseAdmin
        .from("badges")
        .select("id, badge")
        .eq("user_id", userId)
        .eq("year_month", yearMonth)
        .single();

      const newBadgeRank = badgeOrder.indexOf(badge);
      const currentBadgeRank = existingBadge ? badgeOrder.indexOf(existingBadge.badge) : -1;

      if (!existingBadge) {
        await supabaseAdmin.from("badges").insert({
          user_id: userId,
          year_month: yearMonth,
          badge,
          notified: false,
        });
      } else if (newBadgeRank > currentBadgeRank) {
        await supabaseAdmin
          .from("badges")
          .update({ badge, notified: false })
          .eq("id", existingBadge.id);
      }
    }

    return NextResponse.json({ ok: true, price, lessonFee, maintenanceFee, countThisMonth, badge });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
