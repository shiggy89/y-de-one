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
// 通常・特別: ポワント/プレモダン=0.5, それ以外=1
// 祝日: ポワント/プレモダン=0.5, それ以外=1
// 個人: 15分=1回（lesson_timeに分数が入っている）
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

// 月間カウントからバッジを決定（マイページのバッジ仕組みと同一）
// 0→null, 4→bronze, 8→silver, 12→gold, 20→platinum, 40→diamond
function calcBadge(count: number): string | null {
  if (count >= 40) return "diamond";
  if (count >= 20) return "platinum";
  if (count >= 12) return "gold";
  if (count >= 8) return "silver";
  if (count >= 4) return "bronze";
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

    const yearMonth = lessonDate.slice(0, 7); // "2026-04"
    const nextMonth = new Date(`${yearMonth}-01`);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split("T")[0];

    // 先生チェック・当月レッスン回数カウントを並列取得
    const [{ data: user }, { data: beforeDate }, { data: sameDay }] = await Promise.all([
      supabaseAdmin.from("users").select("status").eq("id", userId).single(),
      supabaseAdmin.from("attendances").select("id").eq("student_id", userId).gte("lesson_date", `${yearMonth}-01`).lt("lesson_date", lessonDate),
      lessonTimeStart
        ? supabaseAdmin.from("attendances").select("id").eq("student_id", userId).eq("lesson_date", lessonDate).lt("lesson_time", lessonTimeStart)
        : Promise.resolve({ data: [] as { id: number }[] }),
    ]);

    const isTeacher = user?.status === "teacher";

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

    // 遡及チェックとバッジ用カウントを並列取得
    const [{ data: laterRecords }, { data: monthlyAttendances }] = await Promise.all([
      supabaseAdmin.from("attendances").select("id").eq("student_id", userId).gte("lesson_date", `${yearMonth}-01`).lt("lesson_date", nextMonthStr).gt("lesson_date", lessonDate).limit(1),
      supabaseAdmin.from("attendances").select("lesson_type, lesson_title, lesson_time").eq("student_id", userId).gte("lesson_date", `${yearMonth}-01`).lt("lesson_date", nextMonthStr),
    ]);

    // 遡及追加の場合のみ月間料金を再計算
    if ((laterRecords?.length ?? 0) > 0) {
      const { data: monthAll } = await supabaseAdmin
        .from("attendances")
        .select("id, lesson_date, lesson_time, lesson_type, lesson_title")
        .eq("student_id", userId)
        .gte("lesson_date", `${yearMonth}-01`)
        .lt("lesson_date", nextMonthStr)
        .order("lesson_date", { ascending: true })
        .order("lesson_time", { ascending: true, nullsFirst: false });

      await Promise.all(
        (monthAll ?? []).map((a, i) => {
          const newCount = i + 1;
          const newIsFirst = i === 0;
          const newMaintenanceFee = isTeacher ? 0 : (newIsFirst ? 500 : 0);
          const mins = a.lesson_type === "個人" ? parseInt(a.lesson_time ?? "15") : undefined;
          const newLessonFee = isTeacher ? 0 : calcPrice(newCount, a.lesson_type, mins, a.lesson_title ?? undefined);
          const newPrice = newLessonFee + newMaintenanceFee;
          return supabaseAdmin.from("attendances").update({ price_paid: newPrice }).eq("id", a.id);
        })
      );
    }

    return NextResponse.json({ ok: true, price, lessonFee, maintenanceFee, countThisMonth });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
