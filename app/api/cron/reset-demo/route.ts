import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DEMO_MODE, isDemoDatabaseConfigured } from "@/lib/demo";
import { resetDemoData } from "@/lib/demoSeed";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// デモ環境の全データを消して、架空データを入れ直す（毎日 JST 3:00 に Vercel Cron が呼ぶ）。
// 本番では 404。デモ用データベースだと確認できないときも実行しない。
export async function GET(req: Request) {
  if (!DEMO_MODE) return new NextResponse(null, { status: 404 });
  if (!isDemoDatabaseConfigured()) {
    return NextResponse.json({ error: "Demo database is not configured." }, { status: 503 });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await resetDemoData(supabaseAdmin);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("demo reset failed:", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "reset failed" }, { status: 500 });
  }
}
