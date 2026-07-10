import { describe, it, expect } from "vitest";
import {
  ANALYSIS_THRESHOLDS,
  AttendanceRow,
  calcStudentPeriodCount,
  calcStudentPeriodRevenue,
  calcLastAttendanceDate,
  calcAvgIntervalDays,
  classifyFrequency,
  classifyTrend,
  classifyBehavior,
  calcAdditionalPotential,
  calcCoOccurrencePairs,
  parsePeriod,
  filterClassRecords,
} from "../studentAnalytics";
import { scoreAndRankRecommendations } from "../recommendationEngine";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeRecord(
  overrides: Partial<AttendanceRow> & { student_id: number; lesson_date: string },
): AttendanceRow {
  return {
    lesson_type: "通常",
    lesson_title: "バレエ入門",
    lesson_teacher: "門馬和樹",
    lesson_time: "13:00",
    price_paid: 2200,
    ...overrides,
  };
}

const TODAY = new Date("2026-07-10T00:00:00");

// ─── parsePeriod ──────────────────────────────────────────────────────────────

describe("parsePeriod", () => {
  it("month mode returns correct from/to boundaries", () => {
    const p = parsePeriod("2026-07");
    expect(p.from).toBe("2026-07-01");
    expect(p.to).toBe("2026-08-01");
    expect(p.prevFrom).toBe("2026-06-01");
    expect(p.prevTo).toBe("2026-07-01");
  });

  it("month mode handles January boundary", () => {
    const p = parsePeriod("2026-01");
    expect(p.from).toBe("2026-01-01");
    expect(p.to).toBe("2026-02-01");
    expect(p.prevFrom).toBe("2025-12-01");
    expect(p.prevTo).toBe("2026-01-01");
  });

  it("week mode returns 7-day windows", () => {
    const p = parsePeriod(null, "2026-07-06"); // Monday
    expect(p.from).toBe("2026-07-06");
    expect(p.to).toBe("2026-07-13");
    expect(p.prevFrom).toBe("2026-06-29");
    expect(p.prevTo).toBe("2026-07-06");
  });

  it("custom mode spans correct date range", () => {
    const p = parsePeriod(null, null, "2026-07-01", "2026-07-15");
    expect(p.from).toBe("2026-07-01");
    expect(p.to).toBe("2026-07-15");
    expect(p.prevFrom).toBe("2026-06-17");
    expect(p.prevTo).toBe("2026-07-01");
  });
});

// ─── filterClassRecords ───────────────────────────────────────────────────────

describe("filterClassRecords", () => {
  it("excludes 個人 and リハーサル lesson types", () => {
    const records = [
      makeRecord({ student_id: 1, lesson_date: "2026-07-01", lesson_type: "通常" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-02", lesson_type: "個人" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-03", lesson_type: "リハーサル" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-04", lesson_type: "祝日" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-05", lesson_type: "特別" }),
    ];
    const result = filterClassRecords(records);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.lesson_type)).toEqual(["通常", "祝日", "特別"]);
  });
});

// ─── calcStudentPeriodCount ───────────────────────────────────────────────────

describe("calcStudentPeriodCount", () => {
  it("counts only the target student's class records", () => {
    const records = [
      makeRecord({ student_id: 1, lesson_date: "2026-07-01" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-02" }),
      makeRecord({ student_id: 2, lesson_date: "2026-07-03" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-04", lesson_type: "個人" }), // excluded
    ];
    expect(calcStudentPeriodCount(records, 1)).toBe(2);
    expect(calcStudentPeriodCount(records, 2)).toBe(1);
  });

  it("returns 0 for students with no records", () => {
    const records = [makeRecord({ student_id: 1, lesson_date: "2026-07-01" })];
    expect(calcStudentPeriodCount(records, 99)).toBe(0);
  });
});

// ─── calcStudentPeriodRevenue ─────────────────────────────────────────────────

describe("calcStudentPeriodRevenue", () => {
  it("sums all price_paid for the student including 個人 lessons", () => {
    const records = [
      makeRecord({ student_id: 1, lesson_date: "2026-07-01", price_paid: 2200 }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-02", price_paid: 2200, lesson_type: "個人" }),
      makeRecord({ student_id: 2, lesson_date: "2026-07-01", price_paid: 3000 }),
    ];
    expect(calcStudentPeriodRevenue(records, 1)).toBe(4400);
    expect(calcStudentPeriodRevenue(records, 2)).toBe(3000);
  });
});

// ─── calcLastAttendanceDate ───────────────────────────────────────────────────

describe("calcLastAttendanceDate", () => {
  it("returns the latest date and days since then", () => {
    const records = [
      makeRecord({ student_id: 1, lesson_date: "2026-07-01" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-08" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-05" }),
    ];
    const { date, daysAgo } = calcLastAttendanceDate(records, 1, TODAY);
    expect(date).toBe("2026-07-08");
    expect(daysAgo).toBe(2);
  });

  it("returns null when no records exist for student", () => {
    const records = [makeRecord({ student_id: 2, lesson_date: "2026-07-01" })];
    const { date, daysAgo } = calcLastAttendanceDate(records, 1, TODAY);
    expect(date).toBeNull();
    expect(daysAgo).toBeNull();
  });
});

// ─── calcAvgIntervalDays ──────────────────────────────────────────────────────

describe("calcAvgIntervalDays", () => {
  it("returns the average number of days between participations", () => {
    const records = [
      makeRecord({ student_id: 1, lesson_date: "2026-07-01" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-08" }), // 7 days later
      makeRecord({ student_id: 1, lesson_date: "2026-07-15" }), // 7 days later
    ];
    expect(calcAvgIntervalDays(records, 1)).toBe(7);
  });

  it("deduplicates same-day attendances before computing interval", () => {
    const records = [
      makeRecord({ student_id: 1, lesson_date: "2026-07-01" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-01" }), // duplicate
      makeRecord({ student_id: 1, lesson_date: "2026-07-08" }),
    ];
    expect(calcAvgIntervalDays(records, 1)).toBe(7);
  });

  it("returns null when fewer than 2 unique dates", () => {
    const records = [makeRecord({ student_id: 1, lesson_date: "2026-07-01" })];
    expect(calcAvgIntervalDays(records, 1)).toBeNull();
  });
});

// ─── classifyFrequency ────────────────────────────────────────────────────────

describe("classifyFrequency", () => {
  it("classifies 休眠 when 30+ days since last attendance", () => {
    expect(classifyFrequency(5, 30)).toBe("休眠");
    expect(classifyFrequency(0, 31)).toBe("休眠");
    expect(classifyFrequency(10, 45)).toBe("休眠");
  });

  it("classifies 高頻度 at threshold", () => {
    expect(classifyFrequency(8, 2)).toBe("高頻度");
    expect(classifyFrequency(12, 1)).toBe("高頻度");
  });

  it("classifies 中頻度 correctly", () => {
    expect(classifyFrequency(4, 2)).toBe("中頻度");
    expect(classifyFrequency(7, 5)).toBe("中頻度");
  });

  it("classifies 低頻度 for 1–3 per month", () => {
    expect(classifyFrequency(1, 2)).toBe("低頻度");
    expect(classifyFrequency(3, 5)).toBe("低頻度");
  });

  it("classifies 低頻度 when 0 count and recent", () => {
    expect(classifyFrequency(0, 5)).toBe("低頻度");
  });

  it("dormant threshold is exactly DORMANT_DAYS", () => {
    const threshold = ANALYSIS_THRESHOLDS.DORMANT_DAYS;
    expect(classifyFrequency(2, threshold - 1)).toBe("低頻度");
    expect(classifyFrequency(2, threshold)).toBe("休眠");
  });
});

// ─── classifyTrend ────────────────────────────────────────────────────────────

describe("classifyTrend", () => {
  it("増加傾向 when current > prev", () => {
    expect(classifyTrend(5, 3)).toBe("増加傾向");
  });

  it("減少傾向 when current < prev", () => {
    expect(classifyTrend(2, 5)).toBe("減少傾向");
  });

  it("安定 when equal and both non-zero", () => {
    expect(classifyTrend(4, 4)).toBe("安定");
  });

  it("returns null when both are 0", () => {
    expect(classifyTrend(0, 0)).toBeNull();
  });

  it("増加傾向 when prev is 0 but current is non-zero", () => {
    expect(classifyTrend(3, 0)).toBe("増加傾向");
  });
});

// ─── classifyBehavior ────────────────────────────────────────────────────────

describe("classifyBehavior", () => {
  it("detects 固定クラス型 when 80%+ same class", () => {
    const records: AttendanceRow[] = [
      ...Array(8).fill(null).map((_, i) =>
        makeRecord({ student_id: 1, lesson_date: `2026-07-0${i + 1}`, lesson_title: "バレエ入門" })
      ),
      makeRecord({ student_id: 1, lesson_date: "2026-07-09", lesson_title: "モダンバレエ" }),
    ];
    const types = classifyBehavior(records, 1);
    expect(types).toContain("固定クラス型");
  });

  it("does NOT detect 固定クラス型 when spread across classes", () => {
    const records: AttendanceRow[] = [
      ...Array(5).fill(null).map((_, i) =>
        makeRecord({ student_id: 1, lesson_date: `2026-07-0${i + 1}`, lesson_title: "バレエ入門" })
      ),
      ...Array(5).fill(null).map((_, i) =>
        makeRecord({ student_id: 1, lesson_date: `2026-07-1${i}`, lesson_title: "モダンバレエ" })
      ),
    ];
    const types = classifyBehavior(records, 1);
    expect(types).not.toContain("固定クラス型");
  });

  it("detects 曜日固定型 when 80%+ same day", () => {
    // Tuesday = dow 2, all records on 2026-07-07 (Tue), 2026-07-14 (Tue), etc.
    const tueDates = ["2026-07-07", "2026-07-14", "2026-07-21", "2026-07-28"];
    const records: AttendanceRow[] = [
      ...tueDates.map((d) => makeRecord({ student_id: 1, lesson_date: d })),
      makeRecord({ student_id: 1, lesson_date: "2026-07-09" }), // Thu, outlier
    ];
    const types = classifyBehavior(records, 1);
    expect(types).toContain("曜日固定型");
  });

  it("detects 複数クラス型 when attending 2+ classes regularly", () => {
    const records: AttendanceRow[] = [
      ...Array(3).fill(null).map((_, i) =>
        makeRecord({ student_id: 1, lesson_date: `2026-07-0${i + 1}`, lesson_title: "バレエ入門" })
      ),
      ...Array(3).fill(null).map((_, i) =>
        makeRecord({ student_id: 1, lesson_date: `2026-07-1${i + 5}`, lesson_title: "モダンバレエ" })
      ),
    ];
    const types = classifyBehavior(records, 1);
    expect(types).toContain("複数クラス型");
  });

  it("returns empty array when insufficient history", () => {
    const records: AttendanceRow[] = [
      makeRecord({ student_id: 1, lesson_date: "2026-07-01" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-07" }),
    ];
    expect(classifyBehavior(records, 1)).toHaveLength(0);
  });
});

// ─── calcAdditionalPotential ──────────────────────────────────────────────────

describe("calcAdditionalPotential", () => {
  it("returns 高 for low-frequency active student with clear preference and multi-class history", () => {
    const result = calcAdditionalPotential({
      currentMonthlyCount: 3,
      daysSinceLastAttendance: 5,
      behaviorTypes: ["曜日固定型"],
      hasMultiClassHistory: true,
      hasEnoughHistory: true,
    });
    expect(result).toBe("高");
  });

  it("returns 低 for dormant student", () => {
    const result = calcAdditionalPotential({
      currentMonthlyCount: 2,
      daysSinceLastAttendance: 35,
      behaviorTypes: [],
      hasMultiClassHistory: false,
      hasEnoughHistory: true,
    });
    expect(result).toBe("低");
  });

  it("returns 低 for high-frequency student", () => {
    const result = calcAdditionalPotential({
      currentMonthlyCount: 10,
      daysSinceLastAttendance: 2,
      behaviorTypes: ["複数クラス型"],
      hasMultiClassHistory: true,
      hasEnoughHistory: true,
    });
    expect(result).toBe("低");
  });

  it("returns 低 when insufficient history", () => {
    const result = calcAdditionalPotential({
      currentMonthlyCount: 3,
      daysSinceLastAttendance: 5,
      behaviorTypes: ["曜日固定型"],
      hasMultiClassHistory: true,
      hasEnoughHistory: false,
    });
    expect(result).toBe("低");
  });

  it("returns 中 for mid-frequency active student", () => {
    const result = calcAdditionalPotential({
      currentMonthlyCount: 5,
      daysSinceLastAttendance: 7,
      behaviorTypes: ["固定クラス型"],
      hasMultiClassHistory: false,
      hasEnoughHistory: true,
    });
    expect(result).toBe("中");
  });
});

// ─── calcCoOccurrencePairs ────────────────────────────────────────────────────

describe("calcCoOccurrencePairs", () => {
  it("detects co-occurrence between two classes", () => {
    // Students 1–7 attend both Tuesday 13:00 バレエ入門 (dow=2) and Thursday 13:00 バレエ基礎 (dow=4)
    const tueDates = ["2026-07-07", "2026-07-14"]; // Tuesday
    const thuDates = ["2026-07-09", "2026-07-16"]; // Thursday

    const records: AttendanceRow[] = [];
    for (let sid = 1; sid <= 7; sid++) {
      tueDates.forEach((d) =>
        records.push(makeRecord({ student_id: sid, lesson_date: d, lesson_title: "バレエ入門", lesson_teacher: "門馬和樹" }))
      );
      thuDates.forEach((d) =>
        records.push(makeRecord({ student_id: sid, lesson_date: d, lesson_title: "バレエ基礎", lesson_teacher: "青山佳樹" }))
      );
    }
    // Student 8 only attends Tuesday
    tueDates.forEach((d) =>
      records.push(makeRecord({ student_id: 8, lesson_date: d, lesson_title: "バレエ入門", lesson_teacher: "門馬和樹" }))
    );

    const pairs = calcCoOccurrencePairs(records, 5);
    expect(pairs.length).toBeGreaterThan(0);

    const pair = pairs.find(
      (p) =>
        (p.classALabel.includes("バレエ入門") && p.classBLabel.includes("バレエ基礎")) ||
        (p.classALabel.includes("バレエ基礎") && p.classBLabel.includes("バレエ入門")),
    );
    expect(pair).toBeDefined();
    expect(pair!.both).toBe(7);
    expect(pair!.coRate).toBeCloseTo(7 / 8, 2);
  });

  it("marks pairs as reference-only when below minimum sample", () => {
    const records: AttendanceRow[] = [];
    // Only 3 students (below default min of 5) attend both classes
    const tueDates = ["2026-07-07"];
    const thuDates = ["2026-07-09"];
    for (let sid = 1; sid <= 3; sid++) {
      tueDates.forEach((d) =>
        records.push(makeRecord({ student_id: sid, lesson_date: d, lesson_title: "バレエ入門", lesson_teacher: "門馬和樹" }))
      );
      thuDates.forEach((d) =>
        records.push(makeRecord({ student_id: sid, lesson_date: d, lesson_title: "バレエ基礎", lesson_teacher: "青山佳樹" }))
      );
    }
    const pairs = calcCoOccurrencePairs(records, 5);
    pairs.forEach((p) => {
      if (p.participantsA < 5) expect(p.isReferenceOnly).toBe(true);
    });
  });

  it("returns empty array when no co-attendance exists", () => {
    // Student 1 only Tuesday, Student 2 only Thursday
    const records = [
      makeRecord({ student_id: 1, lesson_date: "2026-07-07", lesson_title: "バレエ入門", lesson_teacher: "門馬和樹" }),
      makeRecord({ student_id: 2, lesson_date: "2026-07-09", lesson_title: "バレエ基礎", lesson_teacher: "青山佳樹" }),
    ];
    const pairs = calcCoOccurrencePairs(records, 1);
    expect(pairs.filter((p) => p.both >= 2)).toHaveLength(0);
  });
});

// ─── scoreAndRankRecommendations ──────────────────────────────────────────────

describe("scoreAndRankRecommendations", () => {
  it("returns empty array when student has insufficient history", () => {
    const records: AttendanceRow[] = [
      makeRecord({ student_id: 1, lesson_date: "2026-07-07" }),
    ];
    const recs = scoreAndRankRecommendations(1, records, records, new Map(), 3);
    expect(recs).toHaveLength(0);
  });

  it("does not recommend a class the student already regularly attends", () => {
    // Student 1 attends every Tuesday バレエ入門 session
    const tueDates = ["2026-06-03", "2026-06-10", "2026-06-17", "2026-06-24", "2026-07-01", "2026-07-07"];
    const records: AttendanceRow[] = tueDates.map((d) =>
      makeRecord({ student_id: 1, lesson_date: d, lesson_title: "バレエ入門", lesson_teacher: "門馬和樹" })
    );
    const classFill = new Map([
      ["2_バレエ入門_門馬和樹", { slotId: "2_バレエ入門_門馬和樹", avgAttendees: 8, sessions: 6 }],
    ]);
    const recs = scoreAndRankRecommendations(1, records, records, classFill, 3);
    const hasRegularClass = recs.some((r) => r.slotId === "2_バレエ入門_門馬和樹");
    expect(hasRegularClass).toBe(false);
  });

  it("returns at most maxResults recommendations", () => {
    // Student with varied history to get multiple recommendations
    const dates = ["2026-06-03", "2026-06-10", "2026-06-17", "2026-06-24", "2026-07-01"];
    const records: AttendanceRow[] = dates.map((d, i) =>
      makeRecord({
        student_id: 1,
        lesson_date: d,
        lesson_title: i % 2 === 0 ? "バレエ入門" : "バレエ基礎",
        lesson_teacher: i % 2 === 0 ? "門馬和樹" : "青山佳樹",
      })
    );
    const recs = scoreAndRankRecommendations(1, records, records, new Map(), 2);
    expect(recs.length).toBeLessThanOrEqual(2);
  });

  it("gives higher score to classes with same teacher as favorite", () => {
    // Student mainly attends 門馬和樹's classes
    const dates = ["2026-06-03", "2026-06-10", "2026-06-17"];
    const records: AttendanceRow[] = dates.map((d) =>
      makeRecord({ student_id: 1, lesson_date: d, lesson_teacher: "門馬和樹", lesson_title: "バレエ入門" })
    );
    const recs = scoreAndRankRecommendations(1, records, records, new Map(), 5);
    const mommaRecs = recs.filter((r) => r.teacher === "門馬和樹");
    const aoyamaRecs = recs.filter((r) => r.teacher === "青山佳樹");
    if (mommaRecs.length > 0 && aoyamaRecs.length > 0) {
      expect(mommaRecs[0].score).toBeGreaterThan(aoyamaRecs[0].score);
    }
  });

  it("includes human-readable reasons in Japanese", () => {
    const dates = ["2026-06-03", "2026-06-10", "2026-06-17", "2026-06-24"];
    const records: AttendanceRow[] = dates.map((d) =>
      makeRecord({ student_id: 1, lesson_date: d, lesson_teacher: "門馬和樹", lesson_title: "バレエ入門" })
    );
    const recs = scoreAndRankRecommendations(1, records, records, new Map(), 3);
    recs.forEach((rec) => {
      expect(rec.reasons.length).toBeGreaterThan(0);
      rec.reasons.forEach((r) => {
        expect(typeof r).toBe("string");
        expect(r.length).toBeGreaterThan(0);
      });
    });
  });
});

// ─── Data insufficiency edge cases ───────────────────────────────────────────

describe("data insufficiency handling", () => {
  it("calcAvgIntervalDays returns null for single record", () => {
    const records = [makeRecord({ student_id: 1, lesson_date: "2026-07-01" })];
    expect(calcAvgIntervalDays(records, 1)).toBeNull();
  });

  it("classifyBehavior returns empty for < MIN_HISTORY records", () => {
    const records = [
      makeRecord({ student_id: 1, lesson_date: "2026-07-01" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-07" }),
    ];
    // MIN_HISTORY_FOR_ANALYSIS = 3, so 2 records is insufficient
    expect(classifyBehavior(records, 1)).toHaveLength(0);
  });

  it("calcLastAttendanceDate returns null for student with no records", () => {
    const records: AttendanceRow[] = [];
    const { date, daysAgo } = calcLastAttendanceDate(records, 1, TODAY);
    expect(date).toBeNull();
    expect(daysAgo).toBeNull();
  });

  it("scoreAndRankRecommendations returns empty for student with < MIN_HISTORY records", () => {
    const records = [
      makeRecord({ student_id: 1, lesson_date: "2026-07-01" }),
      makeRecord({ student_id: 1, lesson_date: "2026-07-07" }),
    ];
    const recs = scoreAndRankRecommendations(1, records, records, new Map(), 3);
    expect(recs).toHaveLength(0);
  });
});
