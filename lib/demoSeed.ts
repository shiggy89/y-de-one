// デモ環境の架空データ（生徒・出席・バッジ・お知らせ など）を作る。
// データの作成（buildDemoData）と、データベースへの書き込み（resetDemoData）を分けてあり、
// 前者は日付を渡せば同じ結果を返す。出席は「今日」を基準に直近4か月分を作るので、
// 毎日リセットしても、いつ見ても最新の月に出席がある状態になる。
//
// lesson_type / lesson_title は本番と同じ日本語の値を使う（料金・バッジの判定がこの値に依存するため）。

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_LINE_USER_IDS } from "./demo";
import { getLessonsForDate } from "./lessons";

// ── 料金・バッジ計算 ────────────────────────────────
// app/api/admin/attendance/route.ts の calcPrice / calcBadge と同じ規則（2026年9月から新料金）。
const NEW_PRICING_MONTH = "2026-09";
const LESSON_FEES_ONLY_OLD = [2800, 5400, 7800, 9600, 11800, 14000, 16200, 17600];
const LESSON_FEES_ONLY_NEW = [3000, 5800, 8400, 10800, 13200, 15600, 18000, 20400];
const MAINTENANCE_FEE = 500;

const FIXED_FEE_TITLES = ["ポワント", "プレモダン"];
const NON_STANDARD_TITLES = [...FIXED_FEE_TITLES, "90分リハーサル"];

export function calcPrice(standardCount: number, lessonType: string, minutes: number, title: string | null, yearMonth: string): number {
  const isNew = yearMonth >= NEW_PRICING_MONTH;
  if (lessonType === "個人") return 2500 * (minutes / 15);
  if (title && FIXED_FEE_TITLES.includes(title)) return isNew ? 1200 : 1100;
  if (standardCount >= 9) return isNew ? 2200 : 2000;
  const table = isNew ? LESSON_FEES_ONLY_NEW : LESSON_FEES_ONLY_OLD;
  return table[standardCount - 1] - (standardCount > 1 ? table[standardCount - 2] : 0);
}

export function calcBadge(count: number): string | null {
  if (count >= 40) return "diamond";
  if (count >= 20) return "platinum";
  if (count >= 12) return "gold";
  if (count >= 8) return "silver";
  if (count >= 4) return "bronze";
  if (count >= 1) return "normal";
  return null;
}

function badgeWeight(lessonType: string, title: string | null, minutes: number): number {
  if (lessonType === "個人") return minutes / 15;
  return title && FIXED_FEE_TITLES.includes(title) ? 0.5 : 1;
}

// ── 日付・乱数 ─────────────────────────────────────
export function todayInTokyo(now = new Date()): string {
  return now.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function shiftDays(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// 同じ入力なら同じ結果になる乱数（mulberry32）
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], count: number, random: () => number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return out;
}

// ── 生徒 ───────────────────────────────────────────
type Person = {
  name: string;
  display: string;
  status: "member" | "trial" | "teacher";
  isAdmin?: boolean;
  lineUserId?: string;
  // 直近4か月（3か月前 → 今月）の標準レッスン回数
  standard?: [number, number, number, number];
  fixed?: number; // ポワント・プレモダンの回数（各月）
  privateMinutes?: number[]; // 個人レッスン（分）を月ごとに1回ずつ
};

// 並びがそのまま users.id になる（14 番目が管理者：SUPER_ADMIN_IDS = [14, 15] に合わせる）
const PEOPLE: Person[] = [
  { name: "Emily Carter", display: "Emily C.", status: "member", standard: [6, 8, 9, 5], fixed: 1 },
  { name: "Daniel Kim", display: "Daniel", status: "member", standard: [3, 4, 4, 3] },
  { name: "Sofia Rossi", display: "Sofia R.", status: "member", standard: [12, 13, 12, 9], fixed: 2 },
  { name: "Liam Foster", display: "Liam", status: "member", standard: [1, 2, 2, 1] },
  { name: "Hannah Weber", display: "Hannah W.", status: "member", standard: [8, 8, 9, 6], privateMinutes: [15, 30] },
  { name: "Noah Bennett", display: "Noah", status: "member", standard: [0, 0, 3, 2] },
  { name: "Olivia Martin", display: "Olivia M.", status: "member", standard: [10, 11, 12, 8], fixed: 1 },
  { name: "Ethan Brooks", display: "Ethan", status: "member", standard: [5, 6, 4, 4] },
  { name: "Grace Nakamura", display: "Grace N.", status: "member", standard: [14, 16, 15, 11], fixed: 2 },
  { name: "Lucas Meyer", display: "Lucas", status: "member", standard: [2, 3, 3, 2] },
  { name: "Mia Sanchez", display: "Mia S.", status: "member", standard: [7, 9, 8, 6], fixed: 1 },
  { name: "Jack Turner", display: "Jack", status: "member", standard: [0, 1, 2, 1] },
  { name: "Chloe Dubois", display: "Chloe D.", status: "member", standard: [4, 4, 5, 3] },
  { name: "Demo Admin", display: "Demo Admin", status: "teacher", isAdmin: true, lineUserId: DEMO_LINE_USER_IDS.admin },
  // 生徒のデモ用アカウント：先月シルバー、今月ブロンズ → 「あと◯回でシルバー継続」が表示される
  { name: "Demo Member", display: "Demo Member", status: "member", lineUserId: DEMO_LINE_USER_IDS.member, standard: [4, 6, 9, 5], fixed: 1, privateMinutes: [15] },
  { name: "Ava Thompson", display: "Ava T.", status: "member", standard: [21, 41, 24, 17], fixed: 2 },
  { name: "Ryan Cooper", display: "Ryan", status: "member", standard: [9, 10, 10, 7] },
  { name: "Zoe Adams", display: "Zoe", status: "member", standard: [3, 5, 6, 4], fixed: 1 },
  { name: "Oliver Hayes", display: "Oliver", status: "trial" },
  { name: "Priya Shah", display: "Priya", status: "trial" },
  { name: "Marco Bianchi", display: "Marco", status: "trial" },
];

export const DEMO_MEMBER_INDEX = PEOPLE.findIndex((p) => p.lineUserId === DEMO_LINE_USER_IDS.member);

function lineIdFor(index: number): string {
  // 実在の LINE ユーザーID と同じ形式（U + 32 桁の 16 進数）。固定IDとは重ならない
  return `Uf${"0".repeat(23)}${(index + 1).toString(16).padStart(8, "0")}`;
}

// ── 出席 ───────────────────────────────────────────
type AttendanceRow = {
  student_id_index: number; // PEOPLE の添字（挿入後に users.id へ置き換える）
  lesson_date: string;
  lesson_type: "通常" | "個人";
  lesson_title: string | null;
  lesson_time: string;
  lesson_teacher: string | null;
  price_paid: number;
};

type Slot = { date: string; start: string; title: string; time: string; teacher: string };

function slotsForMonth(yearMonth: string, today: string): Slot[] {
  const slots: Slot[] = [];
  for (let day = 1; day <= daysInMonth(yearMonth); day++) {
    const date = `${yearMonth}-${String(day).padStart(2, "0")}`;
    if (date > today) break;
    for (const lesson of getLessonsForDate(date)) {
      slots.push({ date, start: lesson.start, title: lesson.title, time: `${lesson.start}〜${lesson.end}`, teacher: lesson.teacher });
    }
  }
  return slots;
}

function attendancesFor(index: number, person: Person, months: string[], today: string): AttendanceRow[] {
  const rows: AttendanceRow[] = [];

  months.forEach((yearMonth, monthIdx) => {
    const random = rng(index * 1000 + monthIdx * 37 + 11);
    const slots = slotsForMonth(yearMonth, today);
    const standardSlots = slots.filter((s) => !NON_STANDARD_TITLES.includes(s.title));
    const fixedSlots = slots.filter((s) => FIXED_FEE_TITLES.includes(s.title));

    const chosen = [
      ...pick(standardSlots, person.standard?.[monthIdx] ?? 0, random),
      ...pick(fixedSlots, person.fixed ?? 0, random),
    ];

    type Draft = { date: string; start: string; type: "通常" | "個人"; title: string | null; time: string; teacher: string | null; minutes: number };
    const drafts: Draft[] = chosen.map((s) => ({ date: s.date, start: s.start, type: "通常", title: s.title, time: s.time, teacher: s.teacher || null, minutes: 0 }));

    const minutes = person.privateMinutes?.[monthIdx];
    if (minutes && (person.standard?.[monthIdx] ?? 0) > 0) {
      const day = slots.length > 0 ? slots[Math.floor(random() * slots.length)].date : null;
      if (day) drafts.push({ date: day, start: "18:00", type: "個人", title: null, time: String(minutes), teacher: "青山佳樹", minutes });
    }

    // 日付・開始時刻の順に並べ、標準レッスンの回数で段階料金を決める（維持費は月の最初の1回）
    drafts.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
    let standardCount = 0;
    drafts.forEach((d, i) => {
      const isStandard = d.type === "通常" && !NON_STANDARD_TITLES.includes(d.title ?? "");
      if (isStandard) standardCount++;
      const fee = calcPrice(isStandard ? standardCount : 0, d.type, d.minutes, d.title, yearMonth);
      rows.push({
        student_id_index: index,
        lesson_date: d.date,
        lesson_type: d.type,
        lesson_title: d.title,
        lesson_time: d.time,
        lesson_teacher: d.teacher,
        price_paid: fee + (i === 0 ? MAINTENANCE_FEE : 0),
      });
    });
  });

  return rows;
}

// ── 全データ ────────────────────────────────────────
export function buildDemoData(today: string) {
  const currentMonth = today.slice(0, 7);
  const months = [-3, -2, -1, 0].map((d) => shiftMonth(currentMonth, d));

  const attendances = PEOPLE.flatMap((p, i) => attendancesFor(i, p, months, today));

  const weightedByUserMonth = new Map<string, number>();
  for (const a of attendances) {
    const minutes = a.lesson_type === "個人" ? Number(a.lesson_time) : 0;
    const key = `${a.student_id_index}:${a.lesson_date.slice(0, 7)}`;
    weightedByUserMonth.set(key, (weightedByUserMonth.get(key) ?? 0) + badgeWeight(a.lesson_type, a.lesson_title, minutes));
  }
  const monthlyCount = (index: number, ym: string) => weightedByUserMonth.get(`${index}:${ym}`) ?? 0;

  const users = PEOPLE.map((p, i) => {
    const current = calcBadge(monthlyCount(i, currentMonth));
    return {
      line_user_id: p.lineUserId ?? lineIdFor(i),
      name: p.name,
      status: p.status,
      is_admin: p.isAdmin ?? false,
      line_display_name: p.display,
      current_badge: current,
      // 生徒のデモ用アカウントは、初回のマイページで獲得ポップアップが出るよう「未通知」にしておく
      badge_notified: i === DEMO_MEMBER_INDEX ? false : true,
    };
  });

  // 過去月のバッジ（毎月1日のcronが確定させる値と同じ）
  const badges = PEOPLE.flatMap((_, i) =>
    months.slice(0, -1).flatMap((ym) => {
      const badge = calcBadge(monthlyCount(i, ym));
      return badge ? [{ user_id_index: i, year_month: ym, badge, notified: true }] : [];
    })
  );

  const daysAgo = (n: number, hour = 10) => `${shiftDays(today, -n)}T${String(hour).padStart(2, "0")}:00:00+09:00`;

  const notices = [
    { title: "Welcome to the Y-de-ONE demo", body: "This is a sandbox with fictional students and sample data. Feel free to look around, edit or delete anything. Everything resets every day.", author: "Y-de-ONE", created_at: daysAgo(1) },
    { title: "Autumn workshop: sign-ups are open", body: "A one-day workshop for all levels will be held this autumn. Ask a teacher after class if you would like to join.", author: "Y-de-ONE", created_at: daysAgo(6) },
    { title: "Reminder: monthly studio fee", body: "The monthly studio fee of 500 yen is paid in cash at your first lesson of the month. Lesson fees get cheaper the more you attend in a month.", author: "Y-de-ONE", created_at: daysAgo(15) },
    { title: "The studio is closed on Mondays", body: "Regular lessons are held from Tuesday to Sunday. Changes to the schedule are posted here and on the website.", author: "Y-de-ONE", created_at: daysAgo(30) },
  ];

  // お知らせへのリアクション（notice の添字, 生徒の添字, 絵文字）
  const reactions: { notice_index: number; user_index: number; emoji: string }[] = [
    [0, 0, "❤️"], [0, 2, "👍"], [0, 8, "😊"], [0, 14, "❤️"],
    [1, 2, "😮"], [1, 6, "👍"], [1, 10, "😊"],
    [2, 4, "👍"], [2, 12, "👍"],
    [3, 8, "😊"],
  ].map(([notice_index, user_index, emoji]) => ({ notice_index: notice_index as number, user_index: user_index as number, emoji: emoji as string }));

  const categories = [
    { name: "Studio diary", slug: "diary" },
    { name: "Ballet tips", slug: "tips" },
  ];

  const posts = [
    { title: "A quiet Tuesday afternoon at the studio", type: "diary", slug: "tuesday-afternoon", category_index: 0, published_at: daysAgo(3), content: "<p>Sunlight, a warm barre and a small class. Days like this are why we teach.</p>" },
    { title: "Five tips for your first ballet class", type: "seo", slug: "first-ballet-class-tips", category_index: 1, published_at: daysAgo(12), content: "<h2>Wear what you can move in</h2><p>Comfortable clothes and socks are all you need for a trial lesson.</p><h2>Arrive ten minutes early</h2><p>Take your time to get changed and say hello to your teacher.</p>" },
    { title: "Draft: ideas for the winter showcase", type: "diary", slug: null, category_index: 0, published_at: null, status: "draft", content: "<p>Notes for later.</p>" },
  ].map((p) => ({ status: "published", ...p }));

  const hpNews = [
    { title: "New autumn schedule", content: "The autumn schedule starts this month.\nPlease check the class page for details.", category: "Schedule", published_at: daysAgo(5) },
    { title: "Trial lessons are open", content: "Trial lessons for adults are open all year.\nBook from the trial lesson form.", category: "Info", published_at: daysAgo(20) },
    { title: "Studio closed for a public holiday", content: "The studio will be closed on the public holiday.\nThank you for your understanding.", category: "Closure", published_at: daysAgo(40) },
  ];

  const lessonInfo = [
    { section: "change", content: "Sample notice: the Saturday lesson starts 30 minutes later this week." },
    { section: "closed", content: "Sample notice: no lessons on the public holiday this month." },
  ];

  const serverDbCosts = months.slice(0, -1).map((ym, i) => ({ year_month: ym, amount: 2500 + i * 100, received_at: `${ym}-25`, note: "Sample server and database cost" }));

  return { people: PEOPLE, users, attendances, badges, notices, reactions, categories, posts, hpNews, lessonInfo, serverDbCosts };
}

// ── データベースへの書き込み ────────────────────────
const BUCKETS = ["avatars", "post-images"];
const CHUNK = 400;

async function insertAll<T extends object>(client: SupabaseClient, table: string, rows: T[]) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await client.from(table).insert(rows.slice(i, i + CHUNK));
    if (error) throw new Error(`insert into ${table} failed: ${error.message}`);
  }
}

async function insertReturningIds<T extends object>(client: SupabaseClient, table: string, rows: T[]): Promise<number[]> {
  const { data, error } = await client.from(table).insert(rows).select("id");
  if (error || !data) throw new Error(`insert into ${table} failed: ${error?.message}`);
  return data.map((r) => r.id as number);
}

async function emptyBucket(client: SupabaseClient, bucket: string) {
  const { data } = await client.storage.from(bucket).list("", { limit: 1000 });
  const files = (data ?? []).filter((f) => f.id).map((f) => f.name);
  if (files.length > 0) await client.storage.from(bucket).remove(files);
}

// 全データを消して、架空データを入れ直す。デモ用データベースに対してだけ呼ぶこと。
export async function resetDemoData(client: SupabaseClient, today = todayInTokyo()) {
  const data = buildDemoData(today);

  const { error: resetError } = await client.rpc("demo_reset_data");
  if (resetError) throw new Error(`demo_reset_data failed: ${resetError.message}`);
  await Promise.all(BUCKETS.map((b) => emptyBucket(client, b)));

  // 並び順がそのまま id になる（管理者が 14 番目）。想定と違えば、権限が壊れるので止める
  const userIds = await insertReturningIds(client, "users", data.users);
  const adminIndex = data.people.findIndex((p) => p.isAdmin);
  if (userIds[adminIndex] !== 14) throw new Error(`demo admin got id ${userIds[adminIndex]}, expected 14`);

  await insertAll(client, "attendances", data.attendances.map(({ student_id_index, ...a }) => ({ ...a, student_id: userIds[student_id_index] })));
  await insertAll(client, "badges", data.badges.map(({ user_id_index, ...b }) => ({ ...b, user_id: userIds[user_id_index] })));

  const noticeIds = await insertReturningIds(client, "notices", data.notices);
  await insertAll(client, "reactions", data.reactions.map((r) => ({ notice_id: noticeIds[r.notice_index], user_id: userIds[r.user_index], emoji: r.emoji })));

  const categoryIds = await insertReturningIds(client, "categories", data.categories);
  await insertAll(client, "posts", data.posts.map(({ category_index, ...p }) => ({ ...p, category_id: categoryIds[category_index] })));

  await insertAll(client, "hp_news", data.hpNews);
  await insertAll(client, "lesson_info", data.lessonInfo);
  await insertAll(client, "server_db_costs", data.serverDbCosts);

  return {
    today,
    users: data.users.length,
    attendances: data.attendances.length,
    badges: data.badges.length,
    notices: data.notices.length,
    posts: data.posts.length,
  };
}
