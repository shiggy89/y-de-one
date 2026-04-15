import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 維持費500円を除いたレッスン料金累計
const LESSON_FEES_ONLY = [2800, 5400, 7800, 9600, 11800, 14000, 16200, 17600];
function calcLessonFee(count: number, lessonType: string, lessonTitle?: string): number {
  if (lessonType === "祝日") {
    if (lessonTitle === "特別レッスン") return 3000;
    if (lessonTitle === "ポワント" || lessonTitle === "プレモダン") return 1100;
    // バレエ・モダン → 通常と同じ回数制
  } else if (lessonType === "通常") {
    if (lessonTitle === "ポワント" || lessonTitle === "プレモダン") return 1100;
  }
  if (count >= 9) return 2000;
  const total = LESSON_FEES_ONLY[count - 1] ?? 2800;
  const prev = count > 1 ? (LESSON_FEES_ONLY[count - 2] ?? 0) : 0;
  return total - prev;
}

export async function POST(req: Request) {
  try {
    const { userIds, lessonDate, lessonType, privateMinutes = 15, lessonTitle, lessonTime } = await req.json();
    if (!userIds?.length || !lessonDate) {
      return NextResponse.json({ fees: [] });
    }

    const yearMonth = lessonDate.slice(0, 7);

    const fees = await Promise.all(
      userIds.map(async (userId: number) => {
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("name, line_picture_url, status")
          .eq("id", userId)
          .single();

        // lessonDate より前の件数
        const { data: beforeDate } = await supabaseAdmin
          .from("attendances")
          .select("id")
          .eq("student_id", userId)
          .gte("lesson_date", `${yearMonth}-01`)
          .lt("lesson_date", lessonDate);

        // 同日でlessonTimeより前の件数（同日複数レッスン対応）
        const { data: sameDay } = lessonTime
          ? await supabaseAdmin
              .from("attendances")
              .select("id")
              .eq("student_id", userId)
              .eq("lesson_date", lessonDate)
              .lt("lesson_time", lessonTime.split("〜")[0])
          : { data: [] };

        const allThisMonth = [...(beforeDate ?? []), ...(sameDay ?? [])];

        const isTeacher = user?.status === "teacher";
        const countThisMonth = (allThisMonth?.length ?? 0) + 1;
        const isFirstOfMonth = (allThisMonth?.length ?? 0) === 0;
        const maintenanceFee = isFirstOfMonth ? 500 : 0;

        let lessonFee = 0;
        if (!isTeacher) {
          if (lessonType === "個人") lessonFee = 2500 * (privateMinutes / 15);
          else lessonFee = calcLessonFee(countThisMonth, lessonType, lessonTitle);
        }

        const total = isTeacher ? 0 : lessonFee + maintenanceFee;

        return {
          userId,
          name: user?.name ?? "名前なし",
          line_picture_url: user?.line_picture_url ?? null,
          isTeacher,
          lessonFee,
          maintenanceFee,
          total,
          isFirstOfMonth,
          countThisMonth,
        };
      })
    );

    return NextResponse.json({ fees });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ fees: [] }, { status: 500 });
  }
}
