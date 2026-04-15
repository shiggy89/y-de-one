export type Lesson = {
  start: string;
  end: string;
  title: string;
  teacher: string;
};

const LESSONS_BY_DAY: Record<string, Lesson[]> = {
  Tue: [
    { start: "13:00", end: "14:30", title: "バレエ入門", teacher: "門馬和樹" },
    { start: "14:30", end: "15:05", title: "プレモダン", teacher: "門馬和樹" },
    { start: "19:30", end: "21:00", title: "モダンバレエ", teacher: "青山佳樹" },
  ],
  Wed: [
    { start: "13:00", end: "14:30", title: "バレエ基礎", teacher: "門馬和樹" },
    { start: "15:00", end: "16:30", title: "モダンバレエ", teacher: "門馬和樹" },
    { start: "19:15", end: "20:45", title: "バレエ入門基礎", teacher: "青山佳樹" },
  ],
  Thu: [
    { start: "13:00", end: "14:30", title: "バレエ基礎", teacher: "青山佳樹" },
    { start: "14:30", end: "15:05", title: "ポワント", teacher: "青山佳樹" },
    { start: "15:30", end: "17:00", title: "モダンバレエ", teacher: "青山佳樹" },
    { start: "19:30", end: "21:00", title: "モダンバレエ", teacher: "門馬和樹" },
  ],
  Fri: [
    { start: "15:00", end: "16:30", title: "バレエ入門", teacher: "青山佳樹" },
    { start: "16:30", end: "17:05", title: "ポワント", teacher: "青山佳樹" },
  ],
  Sat: [
    { start: "12:30", end: "14:00", title: "バレエ入門基礎", teacher: "門馬和樹" },
    { start: "14:30", end: "16:00", title: "バレエ基礎", teacher: "青山佳樹" },
    { start: "16:30", end: "18:00", title: "モダンバレエ", teacher: "青山佳樹" },
  ],
  Sun: [
    { start: "12:30", end: "14:00", title: "バレエ入門", teacher: "青山佳樹" },
    { start: "14:30", end: "16:00", title: "バレエ基礎", teacher: "青山佳樹" },
    { start: "16:00", end: "16:35", title: "ポワント", teacher: "青山佳樹" },
  ],
};

const DAY_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getLessonsForDate(dateStr: string): Lesson[] {
  const d = new Date(dateStr + "T00:00:00");
  const dayKey = DAY_MAP[d.getDay()];
  return LESSONS_BY_DAY[dayKey] ?? [];
}
