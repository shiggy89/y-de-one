import {
  ANALYSIS_THRESHOLDS,
  CLASS_SLOTS,
  DAY_LABEL,
  AttendanceRow,
  ClassFillEntry,
  Recommendation,
  filterClassRecords,
  makeSlotId,
  getFavoriteClasses,
  getFavoriteTeacher,
  getPrimaryDow,
  getPrimaryTime,
} from "./studentAnalytics";

// ─── Genre / Level Inference ──────────────────────────────────────────────────

type Genre = "モダン" | "バレエ" | "その他";
type Level = "入門" | "基礎" | "応用" | "その他";

function detectGenre(title: string): Genre {
  if (title.includes("モダン") || title.includes("プレモダン")) return "モダン";
  if (title.includes("バレエ")) return "バレエ";
  return "その他";
}

function detectLevel(title: string): Level {
  if (title.includes("入門") || title.includes("プレ")) return "入門";
  if (
    title.includes("基礎") ||
    title.includes("センター") ||
    title.includes("合同")
  ) return "基礎";
  if (title.includes("応用") || title.includes("中級")) return "応用";
  return "その他";
}

function timeToMinutes(time: string): number {
  const parts = time.split(":");
  return Number(parts[0]) * 60 + Number(parts[1] ?? 0);
}

// ─── Attendance Lookup Helpers ────────────────────────────────────────────────

function countStudentClassAttendances(
  records: AttendanceRow[],
  studentId: number,
  dow: number,
  title: string,
  teacher: string,
): number {
  return filterClassRecords(records).filter(
    (r) =>
      r.student_id === studentId &&
      new Date(r.lesson_date + "T00:00:00").getDay() === dow &&
      r.lesson_title === title &&
      r.lesson_teacher === teacher,
  ).length;
}

function countClassSessions(
  records: AttendanceRow[],
  dow: number,
  title: string,
  teacher: string,
): number {
  return new Set(
    filterClassRecords(records)
      .filter(
        (r) =>
          new Date(r.lesson_date + "T00:00:00").getDay() === dow &&
          r.lesson_title === title &&
          r.lesson_teacher === teacher,
      )
      .map((r) => r.lesson_date),
  ).size;
}

// Fraction of class sessions the student attended (in context window)
function calcAttendanceRatio(
  contextRecords: AttendanceRow[],
  studentId: number,
  dow: number,
  title: string,
  teacher: string,
): number {
  const sessions = countClassSessions(contextRecords, dow, title, teacher);
  if (sessions === 0) return 0;
  const attended = countStudentClassAttendances(contextRecords, studentId, dow, title, teacher);
  return attended / sessions;
}

// ─── Peer Overlap ─────────────────────────────────────────────────────────────

// Students who regularly attend the target class
function getPeerStudents(
  contextRecords: AttendanceRow[],
  primaryTitle: string,
  studentId: number,
): Set<number> {
  const peers = new Set<number>();
  filterClassRecords(contextRecords)
    .filter((r) => r.lesson_title === primaryTitle && r.student_id !== studentId)
    .forEach((r) => peers.add(r.student_id));
  return peers;
}

// Fraction of peers who also attend a given slot
function calcPeerOverlapRatio(
  contextRecords: AttendanceRow[],
  peers: Set<number>,
  dow: number,
  title: string,
  teacher: string,
): number {
  if (peers.size === 0) return 0;
  const attending = [...peers].filter((peerId) =>
    countStudentClassAttendances(contextRecords, peerId, dow, title, teacher) > 0,
  ).length;
  return attending / peers.size;
}

// ─── Main Scoring Function ────────────────────────────────────────────────────

export function scoreAndRankRecommendations(
  studentId: number,
  contextRecords: AttendanceRow[],   // past ~3 months — used for behavior analysis
  currentPeriodRecords: AttendanceRow[], // current period — used for "already attending"
  classFill: Map<string, ClassFillEntry>,
  maxResults: number = 3,
): Recommendation[] {
  const studentCtx = filterClassRecords(contextRecords.filter((r) => r.student_id === studentId));
  const studentCurrent = filterClassRecords(currentPeriodRecords.filter((r) => r.student_id === studentId));

  if (studentCtx.length < ANALYSIS_THRESHOLDS.MIN_HISTORY_FOR_ANALYSIS) return [];

  const favoriteClasses = getFavoriteClasses(studentCtx, studentId, 3);
  const favoriteTeacher = getFavoriteTeacher(studentCtx, studentId);
  const { dow: primaryDow } = getPrimaryDow(studentCtx, studentId);
  const primaryTimeStr = getPrimaryTime(studentCtx, studentId);
  const primaryTimeMinutes = primaryTimeStr ? timeToMinutes(primaryTimeStr) : null;

  const primaryGenre = favoriteClasses.length > 0 ? detectGenre(favoriteClasses[0]) : null;
  const primaryLevel = favoriteClasses.length > 0 ? detectLevel(favoriteClasses[0]) : null;

  const peers = favoriteClasses.length > 0
    ? getPeerStudents(contextRecords, favoriteClasses[0], studentId)
    : new Set<number>();

  const results: Recommendation[] = [];

  for (const slot of CLASS_SLOTS) {
    const slotId = makeSlotId(slot.dow, slot.title, slot.teacher);

    // Skip if already regularly attending in context window
    const attendRatio = calcAttendanceRatio(
      contextRecords, studentId, slot.dow, slot.title, slot.teacher,
    );
    if (attendRatio >= ANALYSIS_THRESHOLDS.REGULAR_ATTENDANCE_RATIO) continue;

    // Current period count for this slot
    const currentCount = countStudentClassAttendances(
      currentPeriodRecords, studentId, slot.dow, slot.title, slot.teacher,
    );
    if (currentCount >= 2) continue; // Already going regularly this period

    const fill = classFill.get(slotId);
    const avgAttendees = fill?.avgAttendees ?? 0;
    const sessions = fill?.sessions ?? 0;
    const spacesLeft = Math.max(0, ANALYSIS_THRESHOLDS.CAPACITY - avgAttendees);

    let score = 0;
    const reasons: string[] = [];

    // Genre match (+20)
    const slotGenre = detectGenre(slot.title);
    if (primaryGenre && primaryGenre !== "その他" && slotGenre === primaryGenre) {
      score += 20;
      if (favoriteClasses[0]) {
        reasons.push(`普段参加している${favoriteClasses[0]}と同じジャンルです`);
      }
    }

    // Level match (+15) – add if not already using genre match reason
    const slotLevel = detectLevel(slot.title);
    if (
      primaryLevel &&
      primaryLevel !== "その他" &&
      slotLevel === primaryLevel &&
      !reasons.some((r) => r.includes("ジャンル"))
    ) {
      score += 15;
      if (favoriteClasses[0]) {
        reasons.push(`普段参加している${favoriteClasses[0]}と同じレベルです`);
      }
    } else if (primaryLevel && primaryLevel !== "その他" && slotLevel === primaryLevel) {
      score += 15;
    }

    // Teacher match (+25)
    if (favoriteTeacher && slot.teacher === favoriteTeacher) {
      score += 25;
      reasons.push(`よく参加している${slot.teacher}先生の担当クラスです`);
    }

    // Same day of week (+15)
    if (primaryDow !== null && slot.dow === primaryDow) {
      score += 15;
    }

    // Time proximity
    const slotTimeMinutes = timeToMinutes(slot.time);
    if (primaryTimeMinutes !== null) {
      const timeDiff = Math.abs(slotTimeMinutes - primaryTimeMinutes);
      if (timeDiff <= 60) {
        score += 10;
      } else if (timeDiff <= 120) {
        score += 5;
      } else if (timeDiff > 180) {
        score -= 10;
      }
    }

    // Previously attended in context (but not currently regular)
    const contextCount = countStudentClassAttendances(
      contextRecords, studentId, slot.dow, slot.title, slot.teacher,
    );
    if (contextCount > 0) {
      score += 15;
      const dayStr = DAY_LABEL[slot.dow];
      reasons.push(`${dayStr}曜日の参加実績があります`);

      // Previously attended then stopped (mild penalty)
      if (currentCount === 0) score -= 5;
    }

    // Space available (+10)
    if (sessions > 0 && spacesLeft >= 5) {
      score += 10;
      reasons.push(`現在 約${Math.round(spacesLeft)} 席空いています（定員${ANALYSIS_THRESHOLDS.CAPACITY}名）`);
    } else if (sessions > 0 && spacesLeft < 2) {
      score -= 15;
    }

    // Not recently full (+5)
    if (sessions > 0 && avgAttendees < ANALYSIS_THRESHOLDS.CAPACITY - 2) {
      score += 5;
    }

    // Peer overlap (+10)
    const peerRatio = calcPeerOverlapRatio(contextRecords, peers, slot.dow, slot.title, slot.teacher);
    if (peerRatio >= 0.2) {
      score += 10;
      reasons.push(
        `同じクラスに参加している生徒の ${Math.round(peerRatio * 100)}% がこのレッスンにも参加しています`,
      );
    }

    if (score <= 0) continue;

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
      score,
      reasons: reasons.slice(0, 3),
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}
