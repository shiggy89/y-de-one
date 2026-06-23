import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

const DAY_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ lessons: [] });

  const d = new Date(date + "T00:00:00");
  const dayOfWeek = DAY_MAP[d.getDay()];

  const [{ data: templates }, { data: instances }] = await Promise.all([
    supabaseAdmin
      .from("class_templates")
      .select("id, start_time, end_time, title, teacher")
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .order("sort_order"),
    supabaseAdmin
      .from("lesson_instances")
      .select("class_template_id, status, actual_start_time, actual_end_time")
      .eq("lesson_date", date),
  ]);

  const instanceMap = Object.fromEntries(
    (instances ?? []).map((i) => [i.class_template_id, i])
  );

  const lessons = (templates ?? [])
    .map((t) => {
      const inst = instanceMap[t.id];
      if (inst?.status === "cancelled") return null;
      const start =
        inst?.status === "time_changed" && inst.actual_start_time
          ? inst.actual_start_time
          : t.start_time;
      const end =
        inst?.status === "time_changed" && inst.actual_end_time
          ? inst.actual_end_time
          : t.end_time;
      return {
        start,
        end,
        title: t.title.replace(/\n/g, ""),
        teacher: t.teacher,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ lessons });
}
