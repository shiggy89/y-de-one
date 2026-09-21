import { describe, expect, it } from "vitest";
import { buildDemoData, calcBadge, calcPrice, DEMO_MEMBER_INDEX } from "../demoSeed";
import { DEMO_LINE_USER_IDS } from "../demo";

const TODAY = "2026-09-21"; // 月曜。今月の途中を想定

describe("calcPrice（料金は本番の管理画面と同じ規則）", () => {
  it("2026年9月からの新料金: 3,000 / 2,800 / 2,600 / 2,400…、9回目以降は2,200", () => {
    const fee = (n: number) => calcPrice(n, "通常", 0, "モダンバレエ", "2026-09");
    expect([1, 2, 3, 4, 8].map(fee)).toEqual([3000, 2800, 2600, 2400, 2400]);
    expect(fee(9)).toBe(2200);
    expect(fee(20)).toBe(2200);
  });

  it("2026年8月までの旧料金: 1回目2,800、9回目以降2,000", () => {
    expect(calcPrice(1, "通常", 0, "モダンバレエ", "2026-08")).toBe(2800);
    expect(calcPrice(9, "通常", 0, "モダンバレエ", "2026-08")).toBe(2000);
  });

  it("固定料金クラスと個人レッスン", () => {
    expect(calcPrice(0, "通常", 0, "ポワント", "2026-09")).toBe(1200);
    expect(calcPrice(0, "通常", 0, "プレモダン", "2026-08")).toBe(1100);
    expect(calcPrice(0, "個人", 30, null, "2026-09")).toBe(5000);
  });

  it("バッジの閾値", () => {
    expect([0, 1, 4, 8, 12, 20, 40].map(calcBadge)).toEqual([null, "normal", "bronze", "silver", "gold", "platinum", "diamond"]);
  });
});

describe("buildDemoData", () => {
  const data = buildDemoData(TODAY);

  it("同じ日付なら同じデータになる", () => {
    expect(buildDemoData(TODAY)).toEqual(data);
  });

  it("管理者は14番目（SUPER_ADMIN_IDS に合う）で、固定IDを持つ", () => {
    expect(data.users[13]).toMatchObject({ is_admin: true, line_user_id: DEMO_LINE_USER_IDS.admin });
    expect(data.users.filter((u) => u.is_admin)).toHaveLength(1);
  });

  it("LINE ユーザーIDは既存 API の形式に合い、重複しない", () => {
    const ids = data.users.map((u) => u.line_user_id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^U[a-fA-F0-9]{16,64}$/);
  });

  it("出席は今日までで、月曜（休講日）にはない", () => {
    for (const a of data.attendances) {
      expect(a.lesson_date <= TODAY).toBe(true);
      expect(new Date(`${a.lesson_date}T00:00:00Z`).getUTCDay()).not.toBe(1);
    }
  });

  it("維持費500円は、各生徒の月の最初の1回だけに含まれる", () => {
    const seen = new Set<string>();
    for (const a of data.attendances) {
      const key = `${a.student_id_index}:${a.lesson_date.slice(0, 7)}`;
      const first = !seen.has(key);
      seen.add(key);
      const ym = a.lesson_date.slice(0, 7);
      const lessonOnly = a.price_paid - (first ? 500 : 0);
      expect(lessonOnly).toBeGreaterThan(0);
      // 9月以降は新料金の最低額（固定料金クラス1,200円）以上
      if (ym >= "2026-09") expect(lessonOnly).toBeGreaterThanOrEqual(1200);
    }
  });

  it("生徒のデモ用アカウント: 先月シルバー・今月ブロンズ、初回はバッジ獲得ポップアップ", () => {
    const member = data.users[DEMO_MEMBER_INDEX];
    expect(member.line_user_id).toBe(DEMO_LINE_USER_IDS.member);
    expect(member.current_badge).toBe("bronze");
    expect(member.badge_notified).toBe(false);
    const lastMonth = data.badges.find((b) => b.user_id_index === DEMO_MEMBER_INDEX && b.year_month === "2026-08");
    expect(lastMonth?.badge).toBe("silver");
  });

  it("全ランクのバッジが誰かに付いている（ダイヤモンドは過去月）", () => {
    const seen = new Set([...data.badges.map((b) => b.badge), ...data.users.map((u) => u.current_badge)]);
    for (const b of ["normal", "bronze", "silver", "gold", "platinum", "diamond"]) expect(seen.has(b)).toBe(true);
  });

  it("バッジは生徒×月で重複しない", () => {
    const keys = data.badges.map((b) => `${b.user_id_index}:${b.year_month}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("体験の生徒（trial）は3人いて、出席はない", () => {
    const trialIdx = data.users.flatMap((u, i) => (u.status === "trial" ? [i] : []));
    expect(trialIdx).toHaveLength(3);
    expect(data.attendances.some((a) => trialIdx.includes(a.student_id_index))).toBe(false);
  });

  it("月が変わっても、今月に出席がある", () => {
    const early = buildDemoData("2027-03-02");
    expect(early.attendances.some((a) => a.lesson_date.startsWith("2027-03"))).toBe(true);
    expect(early.attendances.every((a) => a.lesson_date <= "2027-03-02")).toBe(true);
  });
});
