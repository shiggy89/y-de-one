import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// リアクションのトグル (追加 or 削除)
export async function POST(req: Request) {
  try {
    const { lineUserId, noticeId, emoji } = await req.json();
    if (!lineUserId || !noticeId || !emoji) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("line_user_id", lineUserId)
      .single();

    if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

    // 既存のリアクションを確認
    const { data: existing } = await supabaseAdmin
      .from("reactions")
      .select("id")
      .eq("notice_id", noticeId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .single();

    if (existing) {
      // すでにリアクション済み → 削除
      await supabaseAdmin.from("reactions").delete().eq("id", existing.id);
    } else {
      // 未リアクション → 追加
      await supabaseAdmin.from("reactions").insert({ notice_id: noticeId, user_id: user.id, emoji });
    }

    // 更新後のリアクションを返す
    const { data: updated } = await supabaseAdmin
      .from("reactions")
      .select("emoji, user_id, users(name, mypage_name)")
      .eq("notice_id", noticeId);

    const grouped: Record<string, { count: number; users: string[] }> = {};
    for (const r of updated ?? []) {
      const u = r.users as unknown as { name: string | null; mypage_name: string | null } | null;
      const displayName = u?.mypage_name ?? u?.name ?? "名前なし";
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [] };
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(displayName);
    }

    const myEmojis = (updated ?? [])
      .filter((r) => r.user_id === user.id)
      .map((r) => r.emoji);

    return NextResponse.json({ reactions: grouped, myEmojis });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
