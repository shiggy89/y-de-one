import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const LESSON_PRICES = [3300, 5400, 7800, 9600, 11000, 14000, 16200, 17600];

function calcPrice(countThisMonth: number, lessonType: string): number {
  if (lessonType === "35分") return 1100;
  if (lessonType === "特別") return 3000;
  if (lessonType === "個人") return 2500;
  if (countThisMonth >= 9) return 2000;
  const total = LESSON_PRICES[countThisMonth - 1] ?? 3300;
  const prevTotal = countThisMonth > 1 ? (LESSON_PRICES[countThisMonth - 2] ?? 0) : 0;
  return total - prevTotal;
}

function calcBadge(count: number): string | null {
  if (count >= 40) return "diamond";
  if (count >= 20) return "platinum";
  if (count >= 12) return "gold";
  if (count >= 8) return "silver";
  if (count >= 4) return "bronze";
  return null;
}

export async function POST(req: Request) {
  try {
    const { userId, lessonDate, lessonType } = await req.json();

    if (!userId || !lessonDate || !lessonType) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    // 先生は料金0円
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("status")
      .eq("id", userId)
      .single();

    const isTeacher = user?.status === "teacher";

    // 今月の出席回数を取得
    const yearMonth = lessonDate.slice(0, 7); // "2026-04"
    const { data: thisMonthAttendances } = await supabaseAdmin
      .from("attendances")
      .select("id")
      .eq("student_id", userId)
      .gte("lesson_date", `${yearMonth}-01`)
      .lte("lesson_date", `${yearMonth}-31`);

    const countThisMonth = (thisMonthAttendances?.length ?? 0) + 1;
    const price = isTeacher ? 0 : calcPrice(countThisMonth, lessonType);

    // 出席記録を保存
    const { error } = await supabaseAdmin.from("attendances").insert({
      student_id: userId,
      lesson_date: lessonDate,
      lesson_type: lessonType,
      price_paid: price,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // バッジ判定（通常レッスンのみカウント）
    const { data: normalAttendances } = await supabaseAdmin
      .from("attendances")
      .select("id")
      .eq("student_id", userId)
      .eq("lesson_type", "通常")
      .gte("lesson_date", `${yearMonth}-01`)
      .lte("lesson_date", `${yearMonth}-31`);

    const normalCount = normalAttendances?.length ?? 0;
    const badge = calcBadge(normalCount);

    if (badge) {
      // 既存バッジを確認してアップデート or インサート
      const { data: existingBadge } = await supabaseAdmin
        .from("badges")
        .select("id, badge")
        .eq("user_id", userId)
        .eq("year_month", yearMonth)
        .single();

      const badgeOrder = ["bronze", "silver", "gold", "platinum", "diamond"];
      const newBadgeRank = badgeOrder.indexOf(badge);
      const currentBadgeRank = existingBadge ? badgeOrder.indexOf(existingBadge.badge) : -1;

      if (!existingBadge) {
        await supabaseAdmin.from("badges").insert({
          user_id: userId,
          year_month: yearMonth,
          badge,
          notified: false,
        });
      } else if (newBadgeRank > currentBadgeRank) {
        await supabaseAdmin
          .from("badges")
          .update({ badge, notified: false })
          .eq("id", existingBadge.id);
      }
    }

    return NextResponse.json({ ok: true, price, countThisMonth, badge });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
