import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 毎月1日に前月の出席データからバッジを一括付与するCronジョブ
// Vercel Cron: "0 1 1 * *" (毎月1日 JST 10:00 = UTC 01:00)

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

function calcBadge(count: number): string | null {
  if (count >= 40) return "diamond";
  if (count >= 20) return "platinum";
  if (count >= 12) return "gold";
  if (count >= 8) return "silver";
  if (count >= 4) return "bronze";
  if (count >= 1) return "normal";
  return null;
}

export async function GET(req: Request) {
  // Vercel Cron認証
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 対象月: 前月
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const yearMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = `${yearMonth}-01`;
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // 前月の出席データを全取得
    const { data: attendances, error } = await supabaseAdmin
      .from("attendances")
      .select("student_id, lesson_type, lesson_title, lesson_time")
      .gte("lesson_date", monthStart)
      .lt("lesson_date", monthEnd);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // student_idごとに加重カウント集計
    const countMap: Record<number, number> = {};
    for (const a of attendances ?? []) {
      countMap[a.student_id] = (countMap[a.student_id] ?? 0) + calcLessonCount(a.lesson_type, a.lesson_title, a.lesson_time);
    }

    // 出席があった生徒にバッジをupsert
    const results = await Promise.all(
      Object.entries(countMap).map(async ([studentId, count]) => {
        const badge = calcBadge(count);
        if (!badge) return null;
        const { error: upsertError } = await supabaseAdmin
          .from("badges")
          .upsert(
            { user_id: Number(studentId), year_month: yearMonth, badge, notified: false },
            { onConflict: "user_id,year_month" }
          );
        return upsertError ? { error: upsertError.message, studentId } : { ok: true, studentId, badge };
      })
    );

    const assigned = results.filter((r) => r?.ok).length;
    console.log(`[assign-badges] ${yearMonth}: ${assigned}件のバッジを付与`);
    return NextResponse.json({ ok: true, yearMonth, assigned });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
