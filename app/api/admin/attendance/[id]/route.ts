import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;

    // 削除前にレコード情報を取得（再計算に必要）
    const { data: target } = await supabaseAdmin
      .from("attendances")
      .select("student_id, lesson_date")
      .eq("id", id)
      .single();

    const { error } = await supabaseAdmin
      .from("attendances")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 削除後、同月の残りレコードを料金再計算
    if (target) {
      const yearMonth = target.lesson_date.slice(0, 7);
      const nextMonth = new Date(`${yearMonth}-01`);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().split("T")[0];

      const { data: user } = await supabaseAdmin
        .from("users")
        .select("status")
        .eq("id", target.student_id)
        .single();
      const isTeacher = user?.status === "teacher";

      const { data: remaining } = await supabaseAdmin
        .from("attendances")
        .select("id, lesson_date, lesson_time, lesson_type, lesson_title")
        .eq("student_id", target.student_id)
        .gte("lesson_date", `${yearMonth}-01`)
        .lt("lesson_date", nextMonthStr)
        .order("lesson_date", { ascending: true })
        .order("lesson_time", { ascending: true, nullsFirst: false });

      if (remaining && remaining.length > 0) {
        let standardCount = 0;
        await Promise.all(
          remaining.map((a, i) => {
            if (isStandardLesson(a.lesson_type, a.lesson_title)) standardCount++;
            const newIsFirst = i === 0;
            const newMaintenanceFee = isTeacher ? 0 : (newIsFirst ? 500 : 0);
            const mins = a.lesson_type === "個人" ? parseInt(a.lesson_time ?? "15") : undefined;
            const newLessonFee = isTeacher ? 0 : calcPrice(standardCount, a.lesson_type, mins, a.lesson_title ?? undefined);
            const newPrice = newLessonFee + newMaintenanceFee;
            return supabaseAdmin.from("attendances").update({ price_paid: newPrice }).eq("id", a.id);
          })
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
