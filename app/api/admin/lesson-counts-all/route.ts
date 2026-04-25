import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

// 全期間の出席記録から (lessonTime × lessonTitle) ごとの生徒出席回数を返す
// クライアント側でカウントマップを構築するための軽量エンドポイント
export async function GET(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data, error } = await supabaseAdmin
      .from("attendances")
      .select("student_id, lesson_time, lesson_title")
      .not("lesson_time", "is", null)
      .not("lesson_title", "is", null);

    if (error) return NextResponse.json({ rows: [] }, { status: 500 });

    return NextResponse.json({ rows: data ?? [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ rows: [] }, { status: 500 });
  }
}
