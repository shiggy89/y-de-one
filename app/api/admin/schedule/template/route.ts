import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSuperAdmin } from "@/lib/superAdmin";

// POST: 新規クラステンプレート作成
export async function POST(req: Request) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dayOfWeek, startTime, endTime, title, teacher, colorType, hasStretch } = await req.json();

  if (!dayOfWeek || !startTime || !endTime || !title || !teacher || !colorType) {
    return NextResponse.json({ error: "必須項目不足" }, { status: 400 });
  }

  // その曜日の最大sort_orderを取得
  const { data: existing } = await supabaseAdmin
    .from("class_templates")
    .select("sort_order")
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("class_templates")
    .insert({
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      title,
      teacher,
      color_type: colorType,
      has_stretch: hasStretch ?? false,
      sort_order: nextOrder,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, template: data });
}

// PATCH: テンプレートの時間を永続変更
export async function PATCH(req: Request) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, startTime, endTime } = await req.json();

  if (!id || !startTime || !endTime) {
    return NextResponse.json({ error: "必須項目不足" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("class_templates")
    .update({ start_time: startTime, end_time: endTime })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
