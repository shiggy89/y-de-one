import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSuperAdmin } from "@/lib/superAdmin";

// POST /api/admin/schedule/instance
// lesson_instance を作成または更新（upsert）
export async function POST(req: Request) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classTemplateId, lessonDate, status, actualStartTime, actualEndTime, notes } = await req.json();

  if (!classTemplateId || !lessonDate || !status) {
    return NextResponse.json({ error: "必須項目不足" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("lesson_instances")
    .upsert(
      {
        class_template_id: classTemplateId,
        lesson_date: lessonDate,
        status,
        actual_start_time: actualStartTime ?? null,
        actual_end_time: actualEndTime ?? null,
        notes: notes ?? null,
      },
      { onConflict: "class_template_id,lesson_date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, instance: data });
}
