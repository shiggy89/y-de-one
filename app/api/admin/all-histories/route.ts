import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 全生徒の出席履歴を一括返却（会員管理タブ用）
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("attendances")
      .select("id, student_id, lesson_date, lesson_type, lesson_title, lesson_time, lesson_teacher, price_paid")
      .order("lesson_date", { ascending: true });

    if (error) return NextResponse.json({ histories: {} }, { status: 500 });

    // userId ごとにグループ化 & 維持費を分離
    const grouped: Record<number, {
      id: number; lesson_date: string; lesson_type: string;
      lesson_title: string | null; lesson_time: string | null;
      lesson_teacher: string | null; price_paid: number;
      maintenance_fee: number; lesson_fee: number;
    }[]> = {};

    const monthSeen: Record<number, Set<string>> = {};
    for (const a of data ?? []) {
      if (!grouped[a.student_id]) {
        grouped[a.student_id] = [];
        monthSeen[a.student_id] = new Set();
      }
      const ym = a.lesson_date.slice(0, 7);
      const isFirst = !monthSeen[a.student_id].has(ym);
      if (isFirst) monthSeen[a.student_id].add(ym);
      const maintenance_fee = isFirst && a.price_paid > 0 ? 500 : 0;
      grouped[a.student_id].push({
        id: a.id, lesson_date: a.lesson_date, lesson_type: a.lesson_type,
        lesson_title: a.lesson_title ?? null, lesson_time: a.lesson_time ?? null,
        lesson_teacher: a.lesson_teacher ?? null, price_paid: a.price_paid,
        maintenance_fee, lesson_fee: a.price_paid - maintenance_fee,
      });
    }

    return NextResponse.json({ histories: grouped });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ histories: {} }, { status: 500 });
  }
}
