import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const LESSON_FEES_ONLY = [2800, 5400, 7800, 9600, 11800, 14000, 16200, 17600];

function isStandardLesson(lessonType: string, lessonTitle: string | null | undefined): boolean {
  if (lessonType !== "通常" && lessonType !== "祝日") return false;
  if (lessonTitle === "ポワント" || lessonTitle === "プレモダン" || lessonTitle === "特別レッスン") return false;
  return true;
}

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

// 指定生徒・月の全出席記録の price_paid を再計算・UPDATE する
// POST body: { userId: string, yearMonth: string } // yearMonth例: "2026-03"
export async function POST(req: Request) {
  try {
    const { userId, yearMonth } = await req.json();

    if (!userId || !yearMonth) {
      return NextResponse.json({ error: "userId と yearMonth が必要です" }, { status: 400 });
    }

    const nextMonth = new Date(`${yearMonth}-01`);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split("T")[0];

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("status")
      .eq("id", userId)
      .single();
    const isTeacher = user?.status === "teacher";

    const { data: monthAll, error } = await supabaseAdmin
      .from("attendances")
      .select("id, lesson_date, lesson_time, lesson_type, lesson_title, price_paid")
      .eq("student_id", userId)
      .gte("lesson_date", `${yearMonth}-01`)
      .lt("lesson_date", nextMonthStr)
      .order("lesson_date", { ascending: true })
      .order("lesson_time", { ascending: true, nullsFirst: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const updates: { id: string; oldPrice: number; newPrice: number; lessonDate: string }[] = [];

    let standardCount = 0;
    for (let i = 0; i < (monthAll ?? []).length; i++) {
      const a = monthAll![i];
      if (isStandardLesson(a.lesson_type, a.lesson_title)) standardCount++;
      const newIsFirst = i === 0;
      const newMaintenanceFee = isTeacher ? 0 : (newIsFirst ? 500 : 0);
      const mins = a.lesson_type === "個人" ? parseInt(a.lesson_time ?? "15") : undefined;
      const newLessonFee = isTeacher ? 0 : calcPrice(standardCount, a.lesson_type, mins, a.lesson_title ?? undefined);
      const newPrice = newLessonFee + newMaintenanceFee;

      if (a.price_paid !== newPrice) {
        await supabaseAdmin
          .from("attendances")
          .update({ price_paid: newPrice })
          .eq("id", a.id);
        updates.push({ id: a.id, oldPrice: a.price_paid, newPrice, lessonDate: a.lesson_date });
      }
    }

    return NextResponse.json({ ok: true, updated: updates.length, updates });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
