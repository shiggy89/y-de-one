import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSuperAdmin } from "@/lib/superAdmin";

// GET /api/admin/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
// テンプレートとインスタンスをマージして返す
export async function GET(req: Request) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "from/to required" }, { status: 400 });

  const [{ data: templates }, { data: instances }] = await Promise.all([
    supabaseAdmin
      .from("class_templates")
      .select("id, day_of_week, start_time, end_time, title, teacher, color_type, has_stretch")
      .eq("is_active", true)
      .order("sort_order"),
    supabaseAdmin
      .from("lesson_instances")
      .select("id, class_template_id, lesson_date, status, actual_start_time, actual_end_time, notes")
      .gte("lesson_date", from)
      .lte("lesson_date", to),
  ]);

  return NextResponse.json({ templates: templates ?? [], instances: instances ?? [] });
}
