import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data } = await supabaseAdmin
    .from("hp_news")
    .select("published_at")
    .gte("published_at", sevenDaysAgo.toISOString())
    .order("published_at", { ascending: false })
    .limit(1);

  const latestDate = data?.[0]?.published_at ?? null;
  return NextResponse.json({ latestDate });
}
