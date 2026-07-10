import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function authCheck(req: Request): boolean {
  const key = req.headers.get("x-analytics-key");
  return key === process.env.ANALYTICS_PASSWORD;
}

export async function GET(req: Request) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  let fromDate: string;
  let toDate: string;

  if (month) {
    const [y, m] = month.split("-").map(Number);
    fromDate = `${month}-01`;
    const nextM = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    toDate = `${nextM}-01`;
  } else {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    fromDate = `${y}-${String(m).padStart(2, "0")}-01`;
    const nextM = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    toDate = `${nextM}-01`;
  }

  const [{ data: logs }, { data: users }] = await Promise.all([
    supabaseAdmin
      .from("action_logs")
      .select("id, student_id, action_type, recommended_slot_id, note, actioned_at, outcome, outcome_at")
      .gte("actioned_at", fromDate)
      .lt("actioned_at", toDate)
      .order("actioned_at", { ascending: false }),
    supabaseAdmin.from("users").select("id, name, mypage_name, line_picture_url, mypage_picture_url"),
  ]);

  const logList = logs ?? [];
  const userMap = new Map((users ?? []).map((u) => [
    u.id,
    {
      name: u.mypage_name ?? u.name ?? "名前なし",
      pictureUrl: u.mypage_picture_url ?? u.line_picture_url ?? null,
    },
  ]));

  const enriched = logList.map((l) => ({
    ...l,
    studentName: userMap.get(l.student_id)?.name ?? "—",
    studentPictureUrl: userMap.get(l.student_id)?.pictureUrl ?? null,
  }));

  const totalSent = logList.length;
  const attended = logList.filter((l) => l.outcome === "attended").length;
  const notAttended = logList.filter((l) => l.outcome === "not_attended").length;
  const pending = totalSent - attended - notAttended;
  const successRate = totalSent > 0 ? Math.round((attended / totalSent) * 100) : 0;
  const avgPrice = 2200;
  const additionalRevenue = attended * avgPrice;

  return NextResponse.json({
    stats: { totalSent, attended, notAttended, pending, successRate, additionalRevenue },
    logs: enriched,
  });
}

export async function POST(req: Request) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { student_id, action_type = "line_message", recommended_slot_id, note } = body;

  if (!student_id) return NextResponse.json({ error: "student_id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("action_logs")
    .insert({ student_id, action_type, recommended_slot_id: recommended_slot_id ?? null, note: note ?? null })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id });
}
