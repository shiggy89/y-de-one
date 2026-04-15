import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from"); // "2026-04-07"
    const to = searchParams.get("to");     // "2026-04-13"

    if (!from || !to) {
      return NextResponse.json({ error: "from/to required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("attendances")
      .select(`
        id,
        lesson_date,
        lesson_type,
        lesson_title,
        lesson_time,
        lesson_teacher,
        price_paid,
        student_id,
        users!attendances_student_id_fkey (
          id,
          name,
          line_picture_url
        )
      `)
      .gte("lesson_date", from)
      .lte("lesson_date", to)
      .order("lesson_date", { ascending: true })
      .order("lesson_time", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ records: data ?? [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
