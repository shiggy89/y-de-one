import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("attendances")
      .select("id, lesson_date, lesson_type, lesson_title, lesson_time, lesson_teacher, price_paid")
      .eq("student_id", userId)
      .order("lesson_date", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 月初の初回レコードを検出して維持費を分離
    const monthSeen = new Set<string>();
    const attendances = (data ?? []).map((a) => {
      const ym = a.lesson_date.slice(0, 7);
      const isFirst = !monthSeen.has(ym);
      if (isFirst) monthSeen.add(ym);
      const maintenance_fee = isFirst && a.price_paid > 0 ? 500 : 0;
      return { ...a, maintenance_fee, lesson_fee: a.price_paid - maintenance_fee };
    }).reverse();

    return NextResponse.json({ attendances });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
