// ─── Thresholds (all adjustable) ─────────────────────────────────────────────

export const ANALYSIS_THRESHOLDS = {
  HIGH_FREQUENCY_MIN: 8,
  MID_FREQUENCY_MIN: 4,
  DORMANT_DAYS: 30,
  FIXED_CLASS_RATIO: 0.8,
  FIXED_DOW_RATIO: 0.8,
  MIN_HISTORY_FOR_ANALYSIS: 3,
  MIN_COOCCURRENCE_SAMPLE: 5,
  CAPACITY: 15,
  HIGH_POTENTIAL_MAX_MONTHLY: 4,
  HIGH_POTENTIAL_MIN_MONTHLY: 1,
  MID_POTENTIAL_MAX_MONTHLY: 7,
  MID_POTENTIAL_MIN_MONTHLY: 4,
  ADDITIONAL_POTENTIAL_ACTIVE_DAYS: 60,
  MULTI_CLASS_MIN_COUNT: 2,
  REGULAR_ATTENDANCE_RATIO: 0.75,
  CO_OCCURRENCE_TOP_N: 20,
} as const;

export const DAY_LABEL = ["日", "月", "火", "水", "木", "金", "土"] as const;

export const CLASS_SLOTS = [
  { dow: 2, title: "バレエ入門",               teacher: "門馬和樹", time: "13:00", endTime: "14:30", color: "pink"   },
  { dow: 2, title: "プレモダン",               teacher: "門馬和樹", time: "14:30", endTime: "15:05", color: "blue"   },
  { dow: 2, title: "モダンバレエ",             teacher: "青山佳樹", time: "19:30", endTime: "21:00", color: "blue"   },
  { dow: 3, title: "バレエ基礎",               teacher: "門馬和樹", time: "13:00", endTime: "14:30", color: "pink"   },
  { dow: 3, title: "モダンバレエ",             teacher: "門馬和樹", time: "15:00", endTime: "16:30", color: "blue"   },
  { dow: 3, title: "バレエ入門基礎",           teacher: "青山佳樹", time: "19:15", endTime: "20:45", color: "pink"   },
  { dow: 4, title: "バレエ基礎",               teacher: "青山佳樹", time: "13:00", endTime: "14:30", color: "pink"   },
  { dow: 4, title: "ポワント",                 teacher: "青山佳樹", time: "14:30", endTime: "15:05", color: "yellow" },
  { dow: 4, title: "モダンバレエ",             teacher: "青山佳樹", time: "15:30", endTime: "17:00", color: "blue"   },
  { dow: 4, title: "モダンバレエ",             teacher: "門馬和樹", time: "19:30", endTime: "21:00", color: "blue"   },
  { dow: 5, title: "バレエ入門",               teacher: "青山佳樹", time: "15:00", endTime: "16:30", color: "pink"   },
  { dow: 5, title: "ポワント",                 teacher: "青山佳樹", time: "16:30", endTime: "17:05", color: "yellow" },
  { dow: 6, title: "バレエ入門基礎合同",       teacher: "門馬和樹", time: "12:30", endTime: "14:00", color: "pink"   },
  { dow: 6, title: "モダンバレエ",             teacher: "青山佳樹", time: "14:30", endTime: "16:00", color: "blue"   },
  { dow: 0, title: "バレエ入門",               teacher: "青山佳樹", time: "12:30", endTime: "14:00", color: "pink"   },
  { dow: 0, title: "ポワント+バレエ基礎センター", teacher: "青山佳樹", time: "14:15", endTime: "15:45", color: "yellow" },
] as const;

export type ClassSlot = (typeof CLASS_SLOTS)[number];

const SLOT_MAP = new Map(
  CLASS_SLOTS.map((s) => [`${s.dow}_${s.title}_${s.teacher}`, s as ClassSlot]),
);

export function getSlotById(id: string): ClassSlot | undefined {
  return SLOT_MAP.get(id);
}

export function makeSlotId(dow: number, title: string, teacher: string): string {
  return `${dow}_${title}_${teacher}`;
}

// ─── DB Row Types ─────────────────────────────────────────────────────────────

export type AttendanceRow = {
  student_id: number;
  lesson_date: string;
  lesson_type: string;
  lesson_title: string | null;
  lesson_teacher: string | null;
  lesson_time: string | null;
  price_paid: number;
};

export type UserRow = {
  id: number;
  name: string | null;
  line_picture_url: string | null;
  mypage_picture_url: string | null;
  mypage_name: string | null;
  status: string;
};

// ─── Analysis Types ───────────────────────────────────────────────────────────

export type FrequencyType = "高頻度" | "中頻度" | "低頻度" | "休眠";
export type TrendType = "増加傾向" | "減少傾向" | "安定";
export type BehaviorType = "固定クラス型" | "曜日固定型" | "複数クラス型";
export type PotentialLevel = "高" | "中" | "低";

export type Recommendation = {
  slotId: string;
  title: string;
  dow: number;
  dowLabel: string;
  time: string;
  endTime: string;
  teacher: string;
  avgAttendees: number;
  spacesLeft: number;
  score: number;
  reasons: string[];
};

export type CoOccurrencePair = {
  classAId: string;
  classBId: string;
  classALabel: string;
  classBLabel: string;
  participantsA: number;
  both: number;
  coRate: number;
  isReferenceOnly: boolean;
  talkScript: string;
};

export type PotentialStars = {
  stars: 1 | 2 | 3 | 4 | 5;
  reasons: string[];
};

export type ScoreBreakdownItem = { points: number; label: string };

export type ActionPriorityStudent = {
  id: number;
  name: string;
  pictureUrl: string | null;
  currentCount: number;
  lastAttendanceDate: string | null;
  daysSinceLastAttendance: number | null;
  avgIntervalDays: number | null;
  priorityScore: number;
  priorityStars: 1 | 2 | 3 | 4 | 5;
  topRecommendation: Recommendation | null;
  priorityReasons: string[];
  potentialStars: PotentialStars;
  scoreBreakdown: ScoreBreakdownItem[];
};

export type RecruitmentCandidate = {
  id: number;
  name: string;
  pictureUrl: string | null;
  recScore: number;
  recReasons: string[];
};

export type ClassRecruitmentOpportunity = {
  slotId: string;
  title: string;
  dow: number;
  dowLabel: string;
  time: string;
  endTime: string;
  teacher: string;
  avgAttendees: number;
  spacesLeft: number;
  candidateCount: number;
  candidates: RecruitmentCandidate[];
  recruitmentScore: number;
};

export type MonthlyDistributionBucket = {
  key: string;
  label: string;
  count: number;
  pct: number;
};

export type RevenueImpact = {
  targetCount: number;
  additionalLessons: number;
  additionalRevenue: number;
  avgPricePerLesson: number;
  weeklyLessons: number;
  weeklyRevenue: number;
  yearlyRevenue: number;
  formula: string;
};

export type StudentAnalysisSummary = {
  id: number;
  name: string;
  pictureUrl: string | null;
  currentCount: number;
  prevCount: number;
  changeCount: number;
  changeRate: number | null;
  currentRevenue: number;
  lastAttendanceDate: string | null;
  daysSinceLastAttendance: number | null;
  avgIntervalDays: number | null;
  primaryDow: number | null;
  primaryDowLabel: string;
  primaryTime: string | null;
  favoriteClasses: string[];
  favoriteTeacher: string | null;
  frequencyType: FrequencyType;
  trendType: TrendType | null;
  behaviorTypes: BehaviorType[];
  additionalPotential: PotentialLevel;
  hasEnoughHistory: boolean;
  recommendations: Recommendation[];
  allTimeCount: number;
  firstAttendanceDate: string | null;
};

export type StudentsKPI = {
  regularMemberCount: number;
  avgAttendancePerStudent: number;
  prevPeriodAvg: number;
  periodChange: number | null;
  totalAttendance: number;
  totalRevenue: number;
  dormantCount: number;
  additionalPotentialCount: number;
  lowFreqCount: number;
  midFreqCount: number;
  highFreqCount: number;
  almostOneMoreCount: number;
  todayApproachCount: number;
  recruitableClassCount: number;
};

export type Period = {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  label: string;
};

export type ClassFillEntry = {
  slotId: string;
  avgAttendees: number;
  sessions: number;
};

// ─── Period Helpers ───────────────────────────────────────────────────────────

export function getJSTDateStr(date: Date = new Date()): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split("T")[0];
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().split("T")[0];
}

export function parsePeriod(
  month?: string | null,
  week?: string | null,
  from?: string | null,
  to?: string | null,
): Period {
  if (week) {
    const nextWeek = addDaysToDateStr(week, 7);
    const prevWeek = addDaysToDateStr(week, -7);
    const weekEnd = addDaysToDateStr(week, 6);
    const mon = new Date(week + "T00:00:00");
    return {
      from: week,
      to: nextWeek,
      prevFrom: prevWeek,
      prevTo: week,
      label: `${mon.getMonth() + 1}/${mon.getDate()}〜${new Date(weekEnd + "T00:00:00").getMonth() + 1}/${new Date(weekEnd + "T00:00:00").getDate()}`,
    };
  }

  if (from && to) {
    const fromDate = new Date(from + "T00:00:00");
    const toDate = new Date(to + "T00:00:00");
    const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000);
    const prevFrom = addDaysToDateStr(from, -diffDays);
    return {
      from,
      to,
      prevFrom,
      prevTo: from,
      label: `${from}〜${addDaysToDateStr(to, -1)}`,
    };
  }

  const targetMonth = month ?? (() => {
    const today = new Date();
    const jst = new Date(today.getTime() + 9 * 60 * 60 * 1000);
    return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
  })();

  const [y, m] = targetMonth.split("-").map(Number);
  const [py, pm] = m === 1 ? [y - 1, 12] : [y, m - 1];
  const nextM = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const prevM = `${py}-${String(pm).padStart(2, "0")}`;
  const prevNextM = pm === 12 ? `${py + 1}-01` : `${py}-${String(pm + 1).padStart(2, "0")}`;

  return {
    from: `${targetMonth}-01`,
    to: `${nextM}-01`,
    prevFrom: `${prevM}-01`,
    prevTo: `${prevNextM}-01`,
    label: `${y}年${m}月`,
  };
}

// ─── Filtering ────────────────────────────────────────────────────────────────

const CLASS_LESSON_TYPES = new Set(["通常", "祝日", "特別"]);

export function filterClassRecords(records: AttendanceRow[]): AttendanceRow[] {
  return records.filter((r) => CLASS_LESSON_TYPES.has(r.lesson_type));
}

// ─── Core Stats ───────────────────────────────────────────────────────────────

export function calcStudentPeriodCount(
  records: AttendanceRow[],
  studentId: number,
): number {
  return filterClassRecords(records).filter((r) => r.student_id === studentId).length;
}

export function calcStudentPeriodRevenue(
  records: AttendanceRow[],
  studentId: number,
): number {
  return records
    .filter((r) => r.student_id === studentId)
    .reduce((s, r) => s + (r.price_paid ?? 0), 0);
}

export function calcLastAttendanceDate(
  records: AttendanceRow[],
  studentId: number,
  today: Date,
): { date: string | null; daysAgo: number | null } {
  const studentRecords = records.filter((r) => r.student_id === studentId);
  if (studentRecords.length === 0) return { date: null, daysAgo: null };
  const latest = studentRecords.reduce(
    (max, r) => (r.lesson_date > max ? r.lesson_date : max),
    "",
  );
  if (!latest) return { date: null, daysAgo: null };
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  const daysAgo = Math.floor(
    (todayMidnight.getTime() - new Date(latest + "T00:00:00").getTime()) / 86400000,
  );
  return { date: latest, daysAgo };
}

export function calcAvgIntervalDays(
  records: AttendanceRow[],
  studentId: number,
): number | null {
  const uniqueDates = [
    ...new Set(records.filter((r) => r.student_id === studentId).map((r) => r.lesson_date)),
  ].sort();
  if (uniqueDates.length < 2) return null;
  let totalDiff = 0;
  for (let i = 1; i < uniqueDates.length; i++) {
    totalDiff +=
      (new Date(uniqueDates[i] + "T00:00:00").getTime() -
        new Date(uniqueDates[i - 1] + "T00:00:00").getTime()) /
      86400000;
  }
  return Math.round((totalDiff / (uniqueDates.length - 1)) * 10) / 10;
}

// ─── Distribution Helpers ─────────────────────────────────────────────────────

function topEntries<T extends string | number>(
  map: Map<T, number>,
  n: number,
): [T, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function primaryEntry<T extends string | number>(
  map: Map<T, number>,
): { key: T | null; ratio: number } {
  if (map.size === 0) return { key: null, ratio: 0 };
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  if (total === 0) return { key: null, ratio: 0 };
  const [key, count] = topEntries(map, 1)[0];
  return { key, ratio: count / total };
}

export function calcDowDistribution(
  records: AttendanceRow[],
  studentId: number,
): Map<number, number> {
  const map = new Map<number, number>();
  filterClassRecords(records)
    .filter((r) => r.student_id === studentId)
    .forEach((r) => {
      const dow = new Date(r.lesson_date + "T00:00:00").getDay();
      map.set(dow, (map.get(dow) ?? 0) + 1);
    });
  return map;
}

export function calcClassDistribution(
  records: AttendanceRow[],
  studentId: number,
): Map<string, number> {
  const map = new Map<string, number>();
  filterClassRecords(records)
    .filter((r) => r.student_id === studentId && r.lesson_title)
    .forEach((r) => {
      const title = r.lesson_title!;
      map.set(title, (map.get(title) ?? 0) + 1);
    });
  return map;
}

export function calcTeacherDistribution(
  records: AttendanceRow[],
  studentId: number,
): Map<string, number> {
  const map = new Map<string, number>();
  filterClassRecords(records)
    .filter((r) => r.student_id === studentId && r.lesson_teacher)
    .forEach((r) => {
      const teacher = r.lesson_teacher!;
      map.set(teacher, (map.get(teacher) ?? 0) + 1);
    });
  return map;
}

export function calcTimeDistribution(
  records: AttendanceRow[],
  studentId: number,
): Map<string, number> {
  const map = new Map<string, number>();
  filterClassRecords(records)
    .filter((r) => r.student_id === studentId && r.lesson_time)
    .forEach((r) => {
      const hour = r.lesson_time!.split(":")[0];
      const label = `${hour}時台`;
      map.set(label, (map.get(label) ?? 0) + 1);
    });
  return map;
}

export function getPrimaryDow(
  records: AttendanceRow[],
  studentId: number,
): { dow: number | null; ratio: number } {
  const dist = calcDowDistribution(records, studentId);
  const { key, ratio } = primaryEntry(dist);
  return { dow: key, ratio };
}

export function getPrimaryTime(
  records: AttendanceRow[],
  studentId: number,
): string | null {
  // Return the most frequent start time string (e.g. "13:00")
  const map = new Map<string, number>();
  filterClassRecords(records)
    .filter((r) => r.student_id === studentId && r.lesson_time)
    .forEach((r) => {
      const t = r.lesson_time!;
      map.set(t, (map.get(t) ?? 0) + 1);
    });
  const { key } = primaryEntry(map);
  return key;
}

export function getFavoriteClasses(
  records: AttendanceRow[],
  studentId: number,
  n: number = 3,
): string[] {
  const dist = calcClassDistribution(records, studentId);
  return topEntries(dist, n).map(([title]) => title);
}

export function getFavoriteTeacher(
  records: AttendanceRow[],
  studentId: number,
): string | null {
  const dist = calcTeacherDistribution(records, studentId);
  const { key } = primaryEntry(dist);
  return key;
}

export function getMonthlyTrend(
  records: AttendanceRow[],
  studentId: number,
  months: number = 12,
): { yearMonth: string; label: string; count: number }[] {
  const today = new Date();
  const jst = new Date(today.getTime() + 9 * 60 * 60 * 1000);
  const curYear = jst.getUTCFullYear();
  const curMonth = jst.getUTCMonth() + 1;

  const monthlyMap = new Map<string, number>();
  filterClassRecords(records)
    .filter((r) => r.student_id === studentId)
    .forEach((r) => {
      const ym = r.lesson_date.slice(0, 7);
      monthlyMap.set(ym, (monthlyMap.get(ym) ?? 0) + 1);
    });

  return Array.from({ length: months }, (_, i) => {
    const d = new Date(curYear, curMonth - 1 - (months - 1 - i), 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      yearMonth: ym,
      label: `${d.getMonth() + 1}月`,
      count: monthlyMap.get(ym) ?? 0,
    };
  });
}

export function getRevenueTrend(
  records: AttendanceRow[],
  studentId: number,
  months: number = 12,
): { yearMonth: string; label: string; revenue: number }[] {
  const today = new Date();
  const jst = new Date(today.getTime() + 9 * 60 * 60 * 1000);
  const curYear = jst.getUTCFullYear();
  const curMonth = jst.getUTCMonth() + 1;

  const revenueMap = new Map<string, number>();
  records
    .filter((r) => r.student_id === studentId)
    .forEach((r) => {
      const ym = r.lesson_date.slice(0, 7);
      revenueMap.set(ym, (revenueMap.get(ym) ?? 0) + (r.price_paid ?? 0));
    });

  return Array.from({ length: months }, (_, i) => {
    const d = new Date(curYear, curMonth - 1 - (months - 1 - i), 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      yearMonth: ym,
      label: `${d.getMonth() + 1}月`,
      revenue: revenueMap.get(ym) ?? 0,
    };
  });
}

// ─── Classification ───────────────────────────────────────────────────────────

export function classifyFrequency(
  monthlyCount: number,
  daysSinceLastAttendance: number | null,
): FrequencyType {
  if (
    daysSinceLastAttendance !== null &&
    daysSinceLastAttendance >= ANALYSIS_THRESHOLDS.DORMANT_DAYS
  ) {
    return "休眠";
  }
  if (monthlyCount >= ANALYSIS_THRESHOLDS.HIGH_FREQUENCY_MIN) return "高頻度";
  if (monthlyCount >= ANALYSIS_THRESHOLDS.MID_FREQUENCY_MIN) return "中頻度";
  return "低頻度";
}

export function classifyTrend(
  currentCount: number,
  prevCount: number,
): TrendType | null {
  if (currentCount === 0 && prevCount === 0) return null;
  if (prevCount === 0) return "増加傾向";
  if (currentCount === 0) return "減少傾向";
  if (currentCount > prevCount) return "増加傾向";
  if (currentCount < prevCount) return "減少傾向";
  return "安定";
}

export function classifyBehavior(
  contextRecords: AttendanceRow[],
  studentId: number,
): BehaviorType[] {
  const studentRecords = filterClassRecords(
    contextRecords.filter((r) => r.student_id === studentId),
  );
  if (studentRecords.length < ANALYSIS_THRESHOLDS.MIN_HISTORY_FOR_ANALYSIS) return [];

  const result: BehaviorType[] = [];
  const total = studentRecords.length;

  // 固定クラス型
  const classDist = calcClassDistribution(studentRecords, studentId);
  const { ratio: classRatio } = primaryEntry(classDist);
  if (classRatio >= ANALYSIS_THRESHOLDS.FIXED_CLASS_RATIO) result.push("固定クラス型");

  // 曜日固定型
  const dowDist = calcDowDistribution(studentRecords, studentId);
  const { ratio: dowRatio } = primaryEntry(dowDist);
  if (dowRatio >= ANALYSIS_THRESHOLDS.FIXED_DOW_RATIO && total >= ANALYSIS_THRESHOLDS.MIN_HISTORY_FOR_ANALYSIS) {
    result.push("曜日固定型");
  }

  // 複数クラス型: 2クラス以上それぞれ2回以上
  const multiClassCount = [...classDist.entries()].filter(
    ([, c]) => c >= ANALYSIS_THRESHOLDS.MULTI_CLASS_MIN_COUNT,
  ).length;
  if (multiClassCount >= 2) result.push("複数クラス型");

  return result;
}

export function calcAdditionalPotential(params: {
  currentMonthlyCount: number;
  daysSinceLastAttendance: number | null;
  behaviorTypes: BehaviorType[];
  hasMultiClassHistory: boolean;
  hasEnoughHistory: boolean;
}): PotentialLevel {
  const {
    currentMonthlyCount,
    daysSinceLastAttendance,
    behaviorTypes,
    hasMultiClassHistory,
    hasEnoughHistory,
  } = params;

  if (!hasEnoughHistory) return "低";
  if (
    daysSinceLastAttendance !== null &&
    daysSinceLastAttendance >= ANALYSIS_THRESHOLDS.DORMANT_DAYS
  ) return "低";
  if (currentMonthlyCount >= ANALYSIS_THRESHOLDS.HIGH_FREQUENCY_MIN) return "低";

  const isActive =
    daysSinceLastAttendance !== null &&
    daysSinceLastAttendance < ANALYSIS_THRESHOLDS.ADDITIONAL_POTENTIAL_ACTIVE_DAYS;
  const hasDowPreference =
    behaviorTypes.includes("曜日固定型") || behaviorTypes.includes("固定クラス型");

  // 高: 月1〜4回 + アクティブ + 傾向あり + 複数クラス実績
  if (
    currentMonthlyCount >= ANALYSIS_THRESHOLDS.HIGH_POTENTIAL_MIN_MONTHLY &&
    currentMonthlyCount <= ANALYSIS_THRESHOLDS.HIGH_POTENTIAL_MAX_MONTHLY &&
    isActive &&
    hasDowPreference &&
    hasMultiClassHistory
  ) return "高";

  // 中: 月1〜7回 + アクティブ
  if (
    currentMonthlyCount >= ANALYSIS_THRESHOLDS.MID_POTENTIAL_MIN_MONTHLY &&
    currentMonthlyCount <= ANALYSIS_THRESHOLDS.MID_POTENTIAL_MAX_MONTHLY &&
    isActive
  ) return "中";

  if (
    currentMonthlyCount >= ANALYSIS_THRESHOLDS.HIGH_POTENTIAL_MIN_MONTHLY &&
    currentMonthlyCount <= ANALYSIS_THRESHOLDS.HIGH_POTENTIAL_MAX_MONTHLY &&
    isActive
  ) return "中";

  return "低";
}

// ─── Class Fill (for recommendations) ────────────────────────────────────────

export function calcClassFill(records: AttendanceRow[]): Map<string, ClassFillEntry> {
  const classRecords = filterClassRecords(records);
  const sessionMap = new Map<string, Set<string>>();
  const totalMap = new Map<string, number>();

  classRecords.forEach((r) => {
    if (!r.lesson_title || !r.lesson_teacher) return;
    const dow = new Date(r.lesson_date + "T00:00:00").getDay();
    const slotId = makeSlotId(dow, r.lesson_title, r.lesson_teacher);
    if (!CLASS_SLOTS.some((s) => makeSlotId(s.dow, s.title, s.teacher) === slotId)) return;
    if (!sessionMap.has(slotId)) sessionMap.set(slotId, new Set());
    sessionMap.get(slotId)!.add(r.lesson_date);
    totalMap.set(slotId, (totalMap.get(slotId) ?? 0) + 1);
  });

  const result = new Map<string, ClassFillEntry>();
  CLASS_SLOTS.forEach((slot) => {
    const slotId = makeSlotId(slot.dow, slot.title, slot.teacher);
    const sessions = sessionMap.get(slotId)?.size ?? 0;
    const total = totalMap.get(slotId) ?? 0;
    const avgAttendees = sessions > 0 ? Math.round((total / sessions) * 10) / 10 : 0;
    result.set(slotId, { slotId, avgAttendees, sessions });
  });

  return result;
}

// ─── Co-occurrence ────────────────────────────────────────────────────────────

export function calcCoOccurrencePairs(
  records: AttendanceRow[],
  minSample: number = ANALYSIS_THRESHOLDS.MIN_COOCCURRENCE_SAMPLE,
): CoOccurrencePair[] {
  const classRecords = filterClassRecords(records);

  const studentClasses = new Map<number, Set<string>>();
  classRecords.forEach((r) => {
    if (!r.lesson_title || !r.lesson_teacher) return;
    const dow = new Date(r.lesson_date + "T00:00:00").getDay();
    const slotId = makeSlotId(dow, r.lesson_title, r.lesson_teacher);
    if (!SLOT_MAP.has(slotId)) return;
    if (!studentClasses.has(r.student_id)) studentClasses.set(r.student_id, new Set());
    studentClasses.get(r.student_id)!.add(slotId);
  });

  const classParticipants = new Map<string, Set<number>>();
  studentClasses.forEach((classes, studentId) => {
    classes.forEach((classId) => {
      if (!classParticipants.has(classId)) classParticipants.set(classId, new Set());
      classParticipants.get(classId)!.add(studentId);
    });
  });

  const classIds = Array.from(classParticipants.keys());
  const pairs: CoOccurrencePair[] = [];

  for (let i = 0; i < classIds.length; i++) {
    for (let j = i + 1; j < classIds.length; j++) {
      const idA = classIds[i];
      const idB = classIds[j];
      const setA = classParticipants.get(idA)!;
      const setB = classParticipants.get(idB)!;

      const both = [...setA].filter((id) => setB.has(id)).length;
      if (both < 2) continue;

      const coRate = setA.size > 0 ? both / setA.size : 0;
      const slotA = SLOT_MAP.get(idA);
      const slotB = SLOT_MAP.get(idB);
      if (!slotA || !slotB) continue;

      pairs.push({
        classAId: idA,
        classBId: idB,
        classALabel: `${DAY_LABEL[slotA.dow]}曜 ${slotA.time} ${slotA.title}`,
        classBLabel: `${DAY_LABEL[slotB.dow]}曜 ${slotB.time} ${slotB.title}`,
        participantsA: setA.size,
        both,
        coRate: Math.round(coRate * 1000) / 1000,
        isReferenceOnly: setA.size < minSample,
        talkScript: `「${slotA.title}がお好きでしたら、${slotB.title}も人気ですよ。${DAY_LABEL[slotB.dow]}曜日の${slotB.time}から${slotB.teacher}先生が担当しています。」`,
      });
    }
  }

  return pairs
    .sort((a, b) => {
      if (a.isReferenceOnly !== b.isReferenceOnly) return a.isReferenceOnly ? 1 : -1;
      return b.coRate - a.coRate;
    })
    .slice(0, ANALYSIS_THRESHOLDS.CO_OCCURRENCE_TOP_N);
}

// ─── Potential Stars ──────────────────────────────────────────────────────────

export function calcPotentialStars(student: StudentAnalysisSummary): PotentialStars {
  const { additionalPotential, currentCount, daysSinceLastAttendance, recommendations } = student;
  const reasons: string[] = [];

  if (additionalPotential === "高") {
    const hasMultipleRecs = recommendations.length >= 2;
    const isVeryRecent = daysSinceLastAttendance !== null && daysSinceLastAttendance < 14;
    if (hasMultipleRecs && isVeryRecent) {
      reasons.push("参加余地のある回数帯で直近参加あり");
      reasons.push(`おすすめクラスが${recommendations.length}件あります`);
      return { stars: 5, reasons };
    }
    if (hasMultipleRecs) {
      reasons.push(`おすすめクラスが${recommendations.length}件あります`);
      if (currentCount >= 1 && currentCount <= 4) reasons.push(`今月${currentCount}回参加（月8回まで余裕あり）`);
      return { stars: 4, reasons };
    }
    reasons.push("参加回数が増加余地のある範囲です");
    if (recommendations.length > 0) reasons.push("おすすめクラスがあります");
    return { stars: 4, reasons };
  }

  if (additionalPotential === "中") {
    if (daysSinceLastAttendance !== null && daysSinceLastAttendance < 21) {
      reasons.push(`直近${daysSinceLastAttendance}日以内に参加あり`);
      if (currentCount >= 4) reasons.push(`今月${currentCount}回参加中`);
      if (recommendations.length > 0) reasons.push("おすすめクラスがあります");
      return { stars: 3, reasons };
    }
    reasons.push("参加ペースに余地があります");
    if (daysSinceLastAttendance !== null) reasons.push(`最終参加から${daysSinceLastAttendance}日経過`);
    return { stars: 2, reasons };
  }

  if (daysSinceLastAttendance !== null && daysSinceLastAttendance >= 30) {
    reasons.push(`${daysSinceLastAttendance}日以上未参加`);
  } else if (currentCount >= ANALYSIS_THRESHOLDS.HIGH_FREQUENCY_MIN) {
    reasons.push("既に高頻度で参加中です");
  } else {
    reasons.push("参加データが少ないです");
  }
  return { stars: 1, reasons };
}

// ─── Action Priority Students ─────────────────────────────────────────────────

function calcApproachPriorityScoreWithBreakdown(student: StudentAnalysisSummary): {
  total: number;
  breakdown: ScoreBreakdownItem[];
} {
  const breakdown: ScoreBreakdownItem[] = [];
  let total = 0;
  const { additionalPotential, daysSinceLastAttendance, avgIntervalDays, recommendations, currentCount } = student;

  if (additionalPotential === "高") {
    breakdown.push({ points: 40, label: "参加ポテンシャル高（参加履歴から算出）" });
    total += 40;
  }
  if (daysSinceLastAttendance !== null && avgIntervalDays !== null && daysSinceLastAttendance > avgIntervalDays) {
    const over = daysSinceLastAttendance - Math.round(avgIntervalDays);
    breakdown.push({ points: 30, label: `平均間隔（${Math.round(avgIntervalDays)}日）を${over}日超過` });
    total += 30;
  }
  if (daysSinceLastAttendance !== null && daysSinceLastAttendance < 30) {
    breakdown.push({ points: 20, label: `直近${daysSinceLastAttendance}日以内に参加あり` });
    total += 20;
  }
  if (recommendations.length > 0) {
    const topTitle = recommendations[0]?.title ?? "";
    breakdown.push({ points: 20, label: `おすすめクラスあり（${topTitle}等）` });
    total += 20;
  }
  if (currentCount >= 4 && currentCount <= 8) {
    breakdown.push({ points: 20, label: `今月${currentCount}回参加中（増加余地あり）` });
    total += 20;
  }
  if (currentCount >= 10) {
    breakdown.push({ points: -30, label: "今月10回以上（既に高頻度）" });
    total -= 30;
  }
  if (daysSinceLastAttendance !== null && daysSinceLastAttendance >= 30) {
    breakdown.push({ points: -50, label: `${daysSinceLastAttendance}日以上未参加` });
    total -= 50;
  }

  return { total, breakdown };
}

function scoreToPriorityStars(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 70) return 5;
  if (score >= 50) return 4;
  if (score >= 30) return 3;
  if (score >= 10) return 2;
  return 1;
}

export function calcActionPriorityStudents(students: StudentAnalysisSummary[]): ActionPriorityStudent[] {
  return students
    .map((st) => {
      const { total: score, breakdown } = calcApproachPriorityScoreWithBreakdown(st);
      const stars = scoreToPriorityStars(score);
      const topRec = st.recommendations[0] ?? null;
      const priorityReasons = breakdown.filter((b) => b.points > 0).map((b) => b.label);

      return {
        id: st.id,
        name: st.name,
        pictureUrl: st.pictureUrl,
        currentCount: st.currentCount,
        lastAttendanceDate: st.lastAttendanceDate,
        daysSinceLastAttendance: st.daysSinceLastAttendance,
        avgIntervalDays: st.avgIntervalDays,
        priorityScore: score,
        priorityStars: stars,
        topRecommendation: topRec,
        priorityReasons: priorityReasons.slice(0, 4),
        potentialStars: calcPotentialStars(st),
        scoreBreakdown: breakdown,
      };
    })
    .filter((st) => st.priorityScore > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10);
}

// ─── Class Recruitment Opportunities ─────────────────────────────────────────

export function calcClassRecruitmentOpportunities(
  students: StudentAnalysisSummary[],
  classFill: Map<string, ClassFillEntry>,
  maxResults: number = 6,
): ClassRecruitmentOpportunity[] {
  const results: ClassRecruitmentOpportunity[] = [];

  CLASS_SLOTS.forEach((slot) => {
    const slotId = makeSlotId(slot.dow, slot.title, slot.teacher);
    const fill = classFill.get(slotId);
    const avgAttendees = fill?.avgAttendees ?? 0;
    const spacesLeft = Math.max(0, ANALYSIS_THRESHOLDS.CAPACITY - avgAttendees);

    if (spacesLeft < 3) return;

    const candidates = students.filter((st) =>
      st.recommendations.some((r) => r.slotId === slotId),
    );
    if (candidates.length === 0) return;

    const sortedCandidates = candidates
      .map((st) => {
        const rec = st.recommendations.find((r) => r.slotId === slotId)!;
        return { id: st.id, name: st.name, pictureUrl: st.pictureUrl, recScore: rec.score, recReasons: rec.reasons };
      })
      .sort((a, b) => b.recScore - a.recScore);

    results.push({
      slotId,
      title: slot.title,
      dow: slot.dow,
      dowLabel: DAY_LABEL[slot.dow],
      time: slot.time,
      endTime: slot.endTime,
      teacher: slot.teacher,
      avgAttendees: Math.round(avgAttendees * 10) / 10,
      spacesLeft: Math.round(spacesLeft),
      candidateCount: candidates.length,
      candidates: sortedCandidates,
      recruitmentScore: Math.round(spacesLeft * 2 + candidates.length * 3),
    });
  });

  return results.sort((a, b) => b.recruitmentScore - a.recruitmentScore).slice(0, maxResults);
}

// ─── Monthly Distribution ─────────────────────────────────────────────────────

export function calcMonthlyDistribution(students: StudentAnalysisSummary[]): MonthlyDistributionBucket[] {
  const total = students.length;
  const buckets: { key: string; label: string; min: number; max: number }[] = [
    { key: "0",  label: "0回",      min: 0,  max: 0 },
    { key: "1-3",label: "1〜3回",   min: 1,  max: 3 },
    { key: "4-6",label: "4〜6回",   min: 4,  max: 6 },
    { key: "7-9",label: "7〜9回",   min: 7,  max: 9 },
    { key: "10+",label: "10回以上", min: 10, max: Infinity },
  ];

  return buckets.map((b) => {
    const count = students.filter((st) => st.currentCount >= b.min && st.currentCount <= b.max).length;
    return { key: b.key, label: b.label, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
  });
}

// ─── Revenue Impact ───────────────────────────────────────────────────────────

export function calcRevenueImpact(students: StudentAnalysisSummary[]): RevenueImpact {
  const highPotential = students.filter((st) => st.additionalPotential === "高");
  const targetCount = highPotential.length;

  const totalRevenue = students.reduce((s, st) => s + st.currentRevenue, 0);
  const totalAttendance = students.reduce((s, st) => s + st.currentCount, 0);
  const avgPricePerLesson = totalAttendance > 0 ? Math.round(totalRevenue / totalAttendance) : 2200;

  const additionalLessons = targetCount * 2;
  const additionalRevenue = additionalLessons * avgPricePerLesson;
  const weeklyLessons = Math.ceil(additionalLessons / 4.3);
  const weeklyRevenue = weeklyLessons * avgPricePerLesson;
  const yearlyRevenue = additionalRevenue * 12;
  const formula = `ポテンシャル高${targetCount}名 × 月2回追加 × 平均単価¥${avgPricePerLesson.toLocaleString()}`;

  return {
    targetCount,
    additionalLessons,
    additionalRevenue,
    avgPricePerLesson,
    weeklyLessons,
    weeklyRevenue,
    yearlyRevenue,
    formula,
  };
}

// ─── KPI ─────────────────────────────────────────────────────────────────────

export function calcKPI(
  students: StudentAnalysisSummary[],
  todayApproachCount: number = 0,
  recruitableClassCount: number = 0,
): StudentsKPI {
  const regularMemberCount = students.length;
  const totalAttendance = students.reduce((s, st) => s + st.currentCount, 0);
  const totalRevenue = students.reduce((s, st) => s + st.currentRevenue, 0);
  const prevTotalAttendance = students.reduce((s, st) => s + st.prevCount, 0);

  const activeStudents = students.filter((st) => st.currentCount > 0);
  const prevActiveStudents = students.filter((st) => st.prevCount > 0);

  const avgAttendancePerStudent =
    activeStudents.length > 0
      ? Math.round((totalAttendance / activeStudents.length) * 10) / 10
      : 0;
  const prevPeriodAvg =
    prevActiveStudents.length > 0
      ? Math.round((prevTotalAttendance / prevActiveStudents.length) * 10) / 10
      : 0;

  const periodChange =
    prevPeriodAvg > 0
      ? Math.round(((avgAttendancePerStudent - prevPeriodAvg) / prevPeriodAvg) * 1000) / 1000
      : null;

  const dormantCount = students.filter((st) => st.frequencyType === "休眠").length;
  const additionalPotentialCount = students.filter((st) => st.additionalPotential === "高").length;

  const lowFreqCount = students.filter((st) => st.currentCount >= 1 && st.currentCount <= 3).length;
  const midFreqCount = students.filter((st) => st.currentCount >= 4 && st.currentCount <= 6).length;
  const highFreqCount = students.filter((st) => st.currentCount >= 7).length;
  const almostOneMoreCount = students.filter((st) => {
    if (st.avgIntervalDays == null || st.daysSinceLastAttendance == null) return false;
    return st.daysSinceLastAttendance >= st.avgIntervalDays * 0.8 && st.daysSinceLastAttendance < 30;
  }).length;

  return {
    regularMemberCount,
    avgAttendancePerStudent,
    prevPeriodAvg,
    periodChange,
    totalAttendance,
    totalRevenue,
    dormantCount,
    additionalPotentialCount,
    lowFreqCount,
    midFreqCount,
    highFreqCount,
    almostOneMoreCount,
    todayApproachCount,
    recruitableClassCount,
  };
}
