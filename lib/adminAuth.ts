import { supabaseAdmin } from "./supabase";

export async function requireAdmin(req: Request): Promise<boolean> {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) return false;
  const { data } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("line_user_id", adminId)
    .single();
  return data?.is_admin === true;
}
