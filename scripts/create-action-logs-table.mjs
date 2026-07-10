/**
 * action_logs テーブルの存在確認スクリプト
 *
 * 使い方:
 *   node scripts/create-action-logs-table.mjs
 *
 * テーブルが存在しない場合は、Supabase SQL エディタで実行すべき SQL を出力します。
 */

import { createClient } from "@supabase/supabase-js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const CREATE_SQL = `-- Supabase SQL エディタで実行してください
CREATE TABLE IF NOT EXISTS action_logs (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id      integer NOT NULL,
  action_type     text NOT NULL DEFAULT 'line_message',
  recommended_slot_id text,
  note            text,
  actioned_at     timestamptz NOT NULL DEFAULT now(),
  outcome         text CHECK (outcome IN ('attended', 'not_attended')),
  outcome_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_action_logs_student     ON action_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_actioned_at ON action_logs(actioned_at);
`;

const { error } = await supabase.from("action_logs").select("id").limit(1);

if (!error) {
  console.log("✅ action_logs テーブルは既に存在しています");
  process.exit(0);
}

if (error.code === "42P01") {
  console.log("❌ action_logs テーブルが存在しません。");
  console.log("");
  console.log("Supabase ダッシュボード → SQL Editor で以下を実行してください:");
  console.log("─".repeat(60));
  console.log(CREATE_SQL);
  console.log("─".repeat(60));
  process.exit(1);
}

console.error("予期しないエラー:", error.message);
process.exit(1);
