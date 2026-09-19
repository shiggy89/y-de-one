import { supabaseAdmin } from "./supabase";
import { getVerifiedLineUserId } from "./lineAuth";

export async function requireAdmin(req: Request): Promise<boolean> {
  const lineUserId = await getVerifiedLineUserId(req);
  if (!lineUserId) return false;
  const { data } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("line_user_id", lineUserId)
    .single();
  return data?.is_admin === true;
}
