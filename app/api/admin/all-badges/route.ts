import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 全生徒のバッジ履歴を一括返却（会員管理タブ用）
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("badges")
      .select("user_id, year_month, badge")
      .order("year_month", { ascending: true });

    if (error) return NextResponse.json({ badges: {} }, { status: 500 });

    // userId ごとにグループ化
    const grouped: Record<number, { year_month: string; badge: string }[]> = {};
    for (const b of data ?? []) {
      if (!grouped[b.user_id]) grouped[b.user_id] = [];
      grouped[b.user_id].push({ year_month: b.year_month, badge: b.badge });
    }

    return NextResponse.json({ badges: grouped });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ badges: {} }, { status: 500 });
  }
}
