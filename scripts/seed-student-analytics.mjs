/**
 * 開発環境用サンプルデータシード
 *
 * 使い方:
 *   node scripts/seed-student-analytics.mjs
 *
 * 削除方法 (本番環境では絶対に実行しないこと):
 *   node scripts/seed-student-analytics.mjs --delete
 *
 * 本番環境のデータと混在しないよう、生徒名は [TEST] プレフィックスを付けています。
 * line_user_id は U_test_XXX の形式で本番 LINE ユーザーIDと衝突しません。
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const IS_DELETE = process.argv.includes("--delete");

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASS_SLOTS = [
  { dow: 2, title: "バレエ入門",                   teacher: "門馬和樹", time: "13:00" },
  { dow: 2, title: "プレモダン",                   teacher: "門馬和樹", time: "14:30" },
  { dow: 2, title: "モダンバレエ",                 teacher: "青山佳樹", time: "19:30" },
  { dow: 3, title: "バレエ基礎",                   teacher: "門馬和樹", time: "13:00" },
  { dow: 3, title: "モダンバレエ",                 teacher: "門馬和樹", time: "15:00" },
  { dow: 3, title: "バレエ入門基礎",               teacher: "青山佳樹", time: "19:15" },
  { dow: 4, title: "バレエ基礎",                   teacher: "青山佳樹", time: "13:00" },
  { dow: 4, title: "ポワント",                     teacher: "青山佳樹", time: "14:30" },
  { dow: 4, title: "モダンバレエ",                 teacher: "青山佳樹", time: "15:30" },
  { dow: 4, title: "モダンバレエ",                 teacher: "門馬和樹", time: "19:30" },
  { dow: 5, title: "バレエ入門",                   teacher: "青山佳樹", time: "15:00" },
  { dow: 5, title: "ポワント",                     teacher: "青山佳樹", time: "16:30" },
  { dow: 6, title: "バレエ入門基礎合同",           teacher: "門馬和樹", time: "12:30" },
  { dow: 6, title: "モダンバレエ",                 teacher: "青山佳樹", time: "14:30" },
  { dow: 0, title: "バレエ入門",                   teacher: "青山佳樹", time: "12:30" },
  { dow: 0, title: "ポワント+バレエ基礎センター", teacher: "青山佳樹", time: "14:15" },
];

// 生徒プロファイル定義
const STUDENT_PROFILES = [
  // 高頻度（月8回以上）
  { name: "[TEST] 山田優花",   pattern: "high",     primarySlots: [0, 3], primaryDow: 2 },
  { name: "[TEST] 佐藤美咲",   pattern: "high",     primarySlots: [3, 6], primaryDow: 3 },
  { name: "[TEST] 鈴木彩香",   pattern: "high",     primarySlots: [6, 9], primaryDow: 4 },
  { name: "[TEST] 田中玲奈",   pattern: "high",     primarySlots: [0, 6, 14], primaryDow: 2 },
  { name: "[TEST] 渡辺真由",   pattern: "high",     primarySlots: [3, 6, 9], primaryDow: 4 },

  // 中頻度（月4〜7回）、複数クラス型
  { name: "[TEST] 伊藤春菜",   pattern: "mid",      primarySlots: [0, 3],  primaryDow: 2 },
  { name: "[TEST] 加藤葵",     pattern: "mid",      primarySlots: [6, 13], primaryDow: 4 },
  { name: "[TEST] 松本紗希",   pattern: "mid",      primarySlots: [9, 12], primaryDow: 4 },
  { name: "[TEST] 小林舞",     pattern: "mid",      primarySlots: [3, 14], primaryDow: 3 },
  { name: "[TEST] 中村奈々",   pattern: "mid",      primarySlots: [0, 13], primaryDow: 2 },
  { name: "[TEST] 吉田愛梨",   pattern: "mid",      primarySlots: [6, 10], primaryDow: 4 },
  { name: "[TEST] 青木花音",   pattern: "mid",      primarySlots: [12, 14], primaryDow: 6 },

  // 低頻度（月1〜3回）、固定クラス型
  { name: "[TEST] 斎藤凛",     pattern: "low",      primarySlots: [0],  primaryDow: 2 },
  { name: "[TEST] 桜田七海",   pattern: "low",      primarySlots: [6],  primaryDow: 4 },
  { name: "[TEST] 近藤みく",   pattern: "low",      primarySlots: [14], primaryDow: 0 },
  { name: "[TEST] 橋本柚希",   pattern: "low",      primarySlots: [3],  primaryDow: 3 },
  { name: "[TEST] 山本萌",     pattern: "low",      primarySlots: [12], primaryDow: 6 },
  { name: "[TEST] 藤田朱里",   pattern: "low",      primarySlots: [10], primaryDow: 5 },

  // 増加傾向（最近増えてきた）
  { name: "[TEST] 岡田千夏",   pattern: "growing",  primarySlots: [0, 3], primaryDow: 2 },
  { name: "[TEST] 石川ひな",   pattern: "growing",  primarySlots: [6, 9], primaryDow: 4 },
  { name: "[TEST] 池田あかり", pattern: "growing",  primarySlots: [3, 6], primaryDow: 3 },

  // 減少傾向（最近減ってきた）
  { name: "[TEST] 三浦実里",   pattern: "declining", primarySlots: [0],  primaryDow: 2 },
  { name: "[TEST] 福田ゆい",   pattern: "declining", primarySlots: [13], primaryDow: 6 },

  // 休眠（30日以上参加なし）
  { name: "[TEST] 西田梨花",   pattern: "dormant",  primarySlots: [0],  primaryDow: 2 },
  { name: "[TEST] 清水えな",   pattern: "dormant",  primarySlots: [6],  primaryDow: 4 },
  { name: "[TEST] 坂本のの",   pattern: "dormant",  primarySlots: [3],  primaryDow: 3 },

  // 曜日固定型
  { name: "[TEST] 中島美月",   pattern: "dow_fixed", primarySlots: [0, 2], primaryDow: 2 },
  { name: "[TEST] 小川百花",   pattern: "dow_fixed", primarySlots: [6, 7, 8], primaryDow: 4 },
  { name: "[TEST] 武田夏希",   pattern: "dow_fixed", primarySlots: [12, 13], primaryDow: 6 },

  // 複数クラス参加実績あり
  { name: "[TEST] 遠藤結菜",   pattern: "multi",    primarySlots: [0, 3, 6, 10], primaryDow: 2 },
  { name: "[TEST] 金子朱音",   pattern: "multi",    primarySlots: [3, 6, 9, 13], primaryDow: 3 },
];

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function getDateByDow(referenceDate, targetDow) {
  const d = new Date(referenceDate);
  const currentDow = d.getDay();
  const diff = (targetDow - currentDow + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
  return d;
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 過去6ヶ月の特定曜日の日付を取得
function getDatesForDow(dow, monthsBack = 6) {
  const dates = [];
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - monthsBack);

  const d = new Date(start);
  // 次の targetDow に合わせる
  while (d.getDay() !== dow) d.setDate(d.getDate() + 1);

  while (d <= today) {
    dates.push(formatDate(new Date(d)));
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

function calcPrice(count) {
  // 簡易料金計算（本番の calcLessonFee に合わせる必要があれば調整）
  if (count <= 4) return 2200;
  if (count <= 8) return 2000;
  return 1800;
}

// ─── Seed Functions ────────────────────────────────────────────────────────────

async function deleteTestData() {
  console.log("🗑  テストデータを削除中...");

  // テストユーザー一覧を取得
  const { data: testUsers } = await supabase
    .from("users")
    .select("id")
    .like("name", "[TEST]%");

  if (!testUsers || testUsers.length === 0) {
    console.log("削除するテストデータがありません");
    return;
  }

  const ids = testUsers.map((u) => u.id);
  console.log(`  ${ids.length} 人のテストユーザーを削除します...`);

  // 参加履歴を先に削除
  const { error: attErr } = await supabase
    .from("attendances")
    .delete()
    .in("student_id", ids);
  if (attErr) console.error("参加履歴の削除エラー:", attErr);

  // バッジを削除
  const { error: badgeErr } = await supabase
    .from("badges")
    .delete()
    .in("user_id", ids);
  if (badgeErr) console.error("バッジの削除エラー:", badgeErr);

  // ユーザーを削除
  const { error: userErr } = await supabase
    .from("users")
    .delete()
    .in("id", ids);
  if (userErr) console.error("ユーザーの削除エラー:", userErr);

  console.log("✅ テストデータを削除しました");
}

async function seedStudents() {
  console.log("👥 テスト生徒を作成中...");
  const insertedIds = [];

  for (let i = 0; i < STUDENT_PROFILES.length; i++) {
    const profile = STUDENT_PROFILES[i];
    const lineUserId = `U_test_${String(i + 1).padStart(3, "0")}`;

    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          line_user_id: lineUserId,
          name: profile.name,
          line_display_name: profile.name.replace("[TEST] ", ""),
          status: "member",
          is_admin: false,
        },
        { onConflict: "line_user_id" },
      )
      .select("id")
      .single();

    if (error) {
      console.error(`  ユーザー作成エラー (${profile.name}):`, error.message);
      continue;
    }
    insertedIds.push({ ...profile, id: data.id });
    process.stdout.write(".");
  }
  console.log(`\n  ${insertedIds.length} 人作成完了`);
  return insertedIds;
}

async function seedAttendances(students) {
  console.log("📅 参加履歴を作成中...");
  const allRecords = [];
  const today = new Date();

  for (const student of students) {
    const { id, pattern, primarySlots } = student;
    const monthlyCountTracker = new Map(); // YYYY-MM -> count

    for (const slotIndex of primarySlots) {
      const slot = CLASS_SLOTS[slotIndex];
      if (!slot) continue;

      const dates = getDatesForDow(slot.dow, 6);
      let selectedDates;

      switch (pattern) {
        case "high":
          selectedDates = dates; // every session
          break;
        case "mid":
          selectedDates = dates.filter((_, i) => i % 2 === 0); // every other week
          break;
        case "low":
          selectedDates = dates.filter((_, i) => i % 4 === 0); // once a month
          break;
        case "growing":
          // fewer in past, more recently
          selectedDates = dates.filter((_, i) => {
            const monthsAgo = Math.floor((dates.length - 1 - i) / 4);
            if (monthsAgo >= 4) return i % 4 === 0; // once a month early
            if (monthsAgo >= 2) return i % 2 === 0; // biweekly
            return true; // weekly recently
          });
          break;
        case "declining":
          selectedDates = dates.filter((_, i) => {
            const monthsAgo = Math.floor((dates.length - 1 - i) / 4);
            if (monthsAgo >= 4) return true; // weekly early
            if (monthsAgo >= 2) return i % 2 === 0;
            return i % 4 === 0; // monthly recently
          });
          break;
        case "dormant":
          // only attend in first 4 months
          selectedDates = dates.filter((_, i) => i < dates.length * 0.4);
          break;
        case "dow_fixed":
          selectedDates = dates.filter((_, i) => i % 2 === 0); // biweekly, fixed day
          break;
        case "multi":
          selectedDates = dates.filter((_, i) => i % 2 === 0);
          break;
        default:
          selectedDates = dates;
      }

      for (const date of selectedDates) {
        const ym = date.slice(0, 7);
        const count = (monthlyCountTracker.get(ym) ?? 0) + 1;
        monthlyCountTracker.set(ym, count);

        allRecords.push({
          student_id: id,
          lesson_date: date,
          lesson_type: "通常",
          lesson_title: slot.title,
          lesson_teacher: slot.teacher,
          lesson_time: slot.time,
          price_paid: calcPrice(count),
        });
      }
    }
  }

  // バッチインサート（500件ずつ）
  const BATCH_SIZE = 500;
  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    const batch = allRecords.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("attendances").insert(batch);
    if (error) {
      console.error(`  参加履歴インサートエラー (batch ${i}):`, error.message);
    } else {
      process.stdout.write(".");
    }
  }
  console.log(`\n  ${allRecords.length} 件の参加履歴を作成完了`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ 環境変数が設定されていません。.env.local を確認してください");
    process.exit(1);
  }

  if (IS_DELETE) {
    await deleteTestData();
    return;
  }

  console.log("🌱 サンプルデータのシードを開始します...");
  console.log("   ⚠️  本番環境では実行しないでください");
  console.log("   削除するには: node scripts/seed-student-analytics.mjs --delete\n");

  const students = await seedStudents();
  await seedAttendances(students);

  console.log("\n✅ シード完了！");
  console.log(`   ${students.length} 人の生徒、6ヶ月分の参加履歴を作成しました`);
  console.log("   /analytics/students にアクセスして確認してください");
}

main().catch((e) => {
  console.error("❌ シードエラー:", e);
  process.exit(1);
});
