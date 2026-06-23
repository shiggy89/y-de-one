import { supabaseAdmin } from "./supabase";

export const SUPER_ADMIN_IDS = [14, 15];

export async function requireSuperAdmin(req: Request): Promise<boolean> {
  const lineUserId = req.headers.get("x-admin-id");
  if (!lineUserId) return false;
  const { data } = await supabaseAdmin
    .from("users")
    .select("id, is_admin")
    .eq("line_user_id", lineUserId)
    .single();
  return data?.is_admin === true && SUPER_ADMIN_IDS.includes(data?.id);
}
