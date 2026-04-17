import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lineUserId = searchParams.get("lineUserId");

    // お知らせ + リアクションを並列取得
    const [{ data: noticesRaw, error }, { data: reactionsRaw }, { data: currentUser }] = await Promise.all([
      supabaseAdmin
        .from("notices")
        .select("id, title, body, author, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("reactions")
        .select("notice_id, emoji, user_id, users(line_display_name, line_picture_url)"),
      lineUserId
        ? supabaseAdmin.from("users").select("id").eq("line_user_id", lineUserId).single()
        : Promise.resolve({ data: null }),
    ]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const myUserId = currentUser?.id ?? null;

    // notice_idごとにリアクションをグループ化
    const reactionMap: Record<number, { grouped: Record<string, { count: number; users: { name: string; pictureUrl: string | null }[] }>; myEmojis: string[] }> = {};

    for (const r of reactionsRaw ?? []) {
      const u = r.users as unknown as { line_display_name: string | null; line_picture_url: string | null } | null;
      const displayName = u?.line_display_name ?? "名前なし";
      const pictureUrl = u?.line_picture_url ?? null;
      if (!reactionMap[r.notice_id]) reactionMap[r.notice_id] = { grouped: {}, myEmojis: [] };
      if (!reactionMap[r.notice_id].grouped[r.emoji]) {
        reactionMap[r.notice_id].grouped[r.emoji] = { count: 0, users: [] };
      }
      reactionMap[r.notice_id].grouped[r.emoji].count++;
      reactionMap[r.notice_id].grouped[r.emoji].users.push({ name: displayName, pictureUrl });
      if (myUserId && r.user_id === myUserId) {
        reactionMap[r.notice_id].myEmojis.push(r.emoji);
      }
    }

    const notices = (noticesRaw ?? []).map((n) => ({
      ...n,
      reactions: reactionMap[n.id]?.grouped ?? {},
      myReactions: reactionMap[n.id]?.myEmojis ?? [],
    }));

    return NextResponse.json({ notices });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
