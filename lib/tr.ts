// デモ環境のアプリ画面（管理画面・マイページ・フォーム）を英語で見せるための翻訳。
// tr("日本語") は、デモ環境では辞書の英語を返し、それ以外（本番）は日本語のまま返す。
// 辞書にない文言は日本語のまま表示されるので、訳し漏れがあっても画面は壊れない。
//
// 料金・バッジの判定に使う値（lesson_type の "通常" など）は翻訳しない。表示するときだけ tr() を通す。

import { DEMO_MODE } from "./demo";
import { SANDBOX_EN } from "./sandboxEn";

export const EN = DEMO_MODE;

export const tr = (ja: string): string => (EN ? (SANDBOX_EN[ja] ?? ja) : ja);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

// 2026-09 → 「2026年9月」 / "September 2026"
export function fmtYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return EN ? `${MONTHS[m - 1]} ${y}` : `${y}年${m}月`;
}

// 月だけ（9月 / Sep）
export function fmtMonth(m: number, long = false): string {
  return EN ? (long ? MONTHS[m - 1] : MONTHS_SHORT[m - 1]) : `${m}月`;
}

// 曜日（0 = 日曜）
export function weekday(index: number): string {
  return (EN ? WEEKDAYS_EN : WEEKDAYS_JA)[index];
}

// 「3回」 / "3 lessons"
export function fmtLessons(n: number): string {
  return EN ? `${n} ${n === 1 ? "lesson" : "lessons"}` : `${n}回`;
}
