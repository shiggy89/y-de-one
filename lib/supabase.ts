import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// クライアント用（マイページ）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// サーバー用（管理画面・API）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
