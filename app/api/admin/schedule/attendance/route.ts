import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSuperAdmin } from "@/lib/superAdmin";

// GET /api/admin/schedule/attendance?instanceId=ID
export async function GET(req: Request) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const instanceId = searchParams.get("instanceId");
  if (!instanceId) return NextResponse.json({ error: "instanceId required" }, { status: 400 });

  const [{ data: attendances }, { data: users }] = await Promise.all([
    supabaseAdmin
      .from("attendance")
      .select("student_id, attended")
      .eq("lesson_instance_id", instanceId),
    supabaseAdmin
      .from("users")
      .select("id, name, line_display_name, line_picture_url, status")
      .in("status", ["active", "trial", "teacher"])
      .order("name"),
  ]);

  return NextResponse.json({ attendances: attendances ?? [], users: users ?? [] });
}

// POST /api/admin/schedule/attendance
// { instanceId, studentIds: number[] } — 出席者を一括保存
export async function POST(req: Request) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { instanceId, studentIds } = await req.json();
  if (!instanceId || !Array.isArray(studentIds)) {
    return NextResponse.json({ error: "必須項目不足" }, { status: 400 });
  }

  // 既存レコードを全削除して再挿入
  await supabaseAdmin.from("attendance").delete().eq("lesson_instance_id", instanceId);

  if (studentIds.length > 0) {
    const rows = studentIds.map((id: number) => ({
      lesson_instance_id: instanceId,
      student_id: id,
      attended: true,
    }));
    const { error } = await supabaseAdmin.from("attendance").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
