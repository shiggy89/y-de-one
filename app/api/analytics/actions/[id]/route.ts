import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const key = req.headers.get("x-analytics-key");
  if (!key || key !== process.env.ANALYTICS_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { outcome } = body;

  if (!["attended", "not_attended"].includes(outcome)) {
    return NextResponse.json({ error: "outcome must be 'attended' or 'not_attended'" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("action_logs")
    .update({ outcome, outcome_at: new Date().toISOString() })
    .eq("id", Number(id));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
