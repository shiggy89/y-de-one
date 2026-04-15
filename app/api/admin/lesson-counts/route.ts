import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonTime = searchParams.get("lessonTime"); // e.g. "13:00〜14:30"
    const lessonTitle = searchParams.get("lessonTitle"); // e.g. "バレエ基礎"

    if (!lessonTime || !lessonTitle) {
      return NextResponse.json({ counts: {} });
    }

    const { data, error } = await supabaseAdmin
      .from("attendances")
      .select("student_id")
      .eq("lesson_time", lessonTime)
      .eq("lesson_title", lessonTitle);

    if (error) return NextResponse.json({ counts: {} }, { status: 500 });

    const counts: Record<number, number> = {};
    for (const row of data ?? []) {
      counts[row.student_id] = (counts[row.student_id] ?? 0) + 1;
    }

    return NextResponse.json({ counts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ counts: {} }, { status: 500 });
  }
}
