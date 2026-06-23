import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSuperAdmin } from "@/lib/superAdmin";

export async function POST(req: Request) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dayOfWeek, startTime, endTime, title, teacher, colorType, hasStretch } = await req.json();

  if (!dayOfWeek || !startTime || !endTime || !title || !teacher || !colorType) {
    return NextResponse.json({ error: "必須項目不足" }, { status: 400 });
  }

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

export async function PATCH(req: Request) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, startTime, endTime, title, teacher, colorType, hasStretch } = await req.json();

  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (startTime !== undefined) updates.start_time = startTime;
  if (endTime !== undefined) updates.end_time = endTime;
  if (title !== undefined) updates.title = title;
  if (teacher !== undefined) updates.teacher = teacher;
  if (colorType !== undefined) updates.color_type = colorType;
  if (hasStretch !== undefined) updates.has_stretch = hasStretch;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "更新する項目がありません" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("class_templates")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
