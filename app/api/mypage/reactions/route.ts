import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 1人1notice1リアクション制限でトグル
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

    // このユーザーのこのnoticeへの既存リアクションを取得
    const { data: existing } = await supabaseAdmin
      .from("reactions")
      .select("id, emoji")
      .eq("notice_id", noticeId)
      .eq("user_id", user.id)
      .single();

    if (existing && existing.emoji === emoji) {
      // 同じ絵文字をタップ → 削除（トグルオフ）
      await supabaseAdmin.from("reactions").delete().eq("id", existing.id);
    } else {
      // 別の絵文字 or 未リアクション → 既存を削除して新しいものを追加
      if (existing) {
        await supabaseAdmin.from("reactions").delete().eq("id", existing.id);
      }
      await supabaseAdmin.from("reactions").insert({ notice_id: noticeId, user_id: user.id, emoji });
    }

    // 更新後のリアクションを返す
    const { data: updated } = await supabaseAdmin
      .from("reactions")
      .select("emoji, user_id, users(line_display_name, line_picture_url)")
      .eq("notice_id", noticeId);

    const grouped: Record<string, { count: number; users: { name: string; pictureUrl: string | null }[] }> = {};
    for (const r of updated ?? []) {
      const u = r.users as unknown as { line_display_name: string | null; line_picture_url: string | null } | null;
      const displayName = u?.line_display_name ?? "名前なし";
      const pictureUrl = u?.line_picture_url ?? null;
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [] };
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push({ name: displayName, pictureUrl });
    }

    const myEmoji = (updated ?? []).find((r) => r.user_id === user.id)?.emoji ?? null;

    return NextResponse.json({ reactions: grouped, myEmojis: myEmoji ? [myEmoji] : [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
