import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 維持費500円を除いたレッスン料金累計
const LESSON_FEES_ONLY = [2800, 4900, 7300, 9100, 10500, 13500, 15700, 17100];

function calcNormalPrice(count: number): number {
  if (count >= 9) return 2000;
  const total = LESSON_FEES_ONLY[count - 1] ?? 2800;
  const prev = count > 1 ? (LESSON_FEES_ONLY[count - 2] ?? 0) : 0;
  return total - prev;
}

export async function POST(req: Request) {
  try {
    const { userIds, lessonDate, lessonType, privateMinutes = 15 } = await req.json();
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

        // 今月の通常レッスン出席回数
        const { data: thisMonth } = await supabaseAdmin
          .from("attendances")
          .select("id")
          .eq("student_id", userId)
          .eq("lesson_type", "通常")
          .gte("lesson_date", `${yearMonth}-01`)
          .lte("lesson_date", `${yearMonth}-31`);

        // 今月の全レッスン出席（維持費判定）
        const { data: allThisMonth } = await supabaseAdmin
          .from("attendances")
          .select("id")
          .eq("student_id", userId)
          .gte("lesson_date", `${yearMonth}-01`)
          .lte("lesson_date", `${yearMonth}-31`);

        const isTeacher = user?.status === "teacher";
        const normalCount = (thisMonth?.length ?? 0) + 1;
        const isFirstOfMonth = (allThisMonth?.length ?? 0) === 0;
        const maintenanceFee = isFirstOfMonth ? 500 : 0;

        let lessonFee = 0;
        if (!isTeacher) {
          if (lessonType === "通常") lessonFee = calcNormalPrice(normalCount);
          else if (lessonType === "特別") lessonFee = 3000;
          else if (lessonType === "個人") lessonFee = 2500 * (privateMinutes / 15);
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
          normalCount,
        };
      })
    );

    return NextResponse.json({ fees });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ fees: [] }, { status: 500 });
  }
}
