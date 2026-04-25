import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    if (!month) return NextResponse.json({ records: [] });

    const nextMonth = new Date(`${month}-01`);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split("T")[0];

    // 出席データとユーザー情報を並列取得
    const [{ data: attendances, error }, { data: users }] = await Promise.all([
      supabaseAdmin
        .from("attendances")
        .select("id, lesson_date, lesson_type, lesson_title, lesson_time, lesson_teacher, price_paid, student_id")
        .gte("lesson_date", `${month}-01`)
        .lt("lesson_date", nextMonthStr)
        .order("lesson_date", { ascending: true })
        .order("lesson_time", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true }),
      supabaseAdmin.from("users").select("id, name, line_picture_url"),
    ]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!attendances?.length) return NextResponse.json({ records: [] });

    const userMap = new Map((users ?? []).map((u) => [u.id, u]));

    const records = attendances.map((a) => {
      const user = userMap.get(a.student_id);
      return {
        id: a.id,
        student_id: a.student_id,
        lesson_date: a.lesson_date,
        lesson_type: a.lesson_type,
        lesson_title: a.lesson_title ?? null,
        lesson_time: a.lesson_time ?? null,
        lesson_teacher: a.lesson_teacher ?? null,
        price_paid: a.price_paid,
        name: user?.name ?? "名前なし",
        line_picture_url: user?.line_picture_url ?? null,
      };
    });

    return NextResponse.json({ records }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ records: [] }, { status: 500 });
  }
}
