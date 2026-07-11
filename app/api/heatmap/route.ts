import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const CLASS_SLOTS = [
  { dow: 2, title: "バレエ入門",                  teacher: "門馬和樹", time: "13:00", endTime: "14:30", color: "pink"   },
  { dow: 2, title: "プレモダン",                  teacher: "門馬和樹", time: "14:30", endTime: "15:05", color: "blue"   },
  { dow: 2, title: "モダンバレエ",                teacher: "青山佳樹", time: "19:30", endTime: "21:00", color: "blue"   },
  { dow: 3, title: "バレエ基礎",                  teacher: "門馬和樹", time: "13:00", endTime: "14:30", color: "pink"   },
  { dow: 3, title: "モダンバレエ",                teacher: "門馬和樹", time: "15:00", endTime: "16:30", color: "blue"   },
  { dow: 3, title: "バレエ入門基礎",              teacher: "青山佳樹", time: "19:15", endTime: "20:45", color: "pink"   },
  { dow: 4, title: "バレエ基礎",                  teacher: "青山佳樹", time: "13:00", endTime: "14:30", color: "pink"   },
  { dow: 4, title: "ポワント",                    teacher: "青山佳樹", time: "14:30", endTime: "15:05", color: "yellow" },
  { dow: 4, title: "モダンバレエ",                teacher: "青山佳樹", time: "15:30", endTime: "17:00", color: "blue"   },
  { dow: 4, title: "モダンバレエ",                teacher: "門馬和樹", time: "19:30", endTime: "21:00", color: "blue"   },
  { dow: 5, title: "バレエ入門",                  teacher: "青山佳樹", time: "15:00", endTime: "16:30", color: "pink"   },
  { dow: 5, title: "ポワント",                    teacher: "青山佳樹", time: "16:30", endTime: "17:05", color: "yellow" },
  { dow: 6, title: "バレエ入門基礎合同",          teacher: "門馬和樹", time: "12:30", endTime: "14:00", color: "pink"   },
  { dow: 6, title: "モダンバレエ",                teacher: "青山佳樹", time: "14:30", endTime: "16:00", color: "blue"   },
  { dow: 0, title: "バレエ入門",                  teacher: "青山佳樹", time: "12:30", endTime: "14:00", color: "pink"   },
  { dow: 0, title: "ポワント+バレエ基礎センター", teacher: "青山佳樹", time: "14:15", endTime: "15:45", color: "yellow" },
];

function authCheck(req: Request) {
  return req.headers.get("x-analytics-key") === process.env.ANALYTICS_PASSWORD;
}

function findSlotMeta(dow: number, time: string, title: string) {
  const exact = CLASS_SLOTS.find(s => s.dow === dow && s.time === time && s.title === title);
  if (exact) return { endTime: exact.endTime, color: exact.color };
  const byTime = CLASS_SLOTS.filter(s => s.dow === dow && s.time === time);
  if (byTime.length > 0) return { endTime: byTime[0].endTime, color: byTime[0].color };
  const isShort = ["ポワント", "プレモダン", "センター"].some(t => title.includes(t));
  const [h, m] = time.split(":").map(Number);
  const end = h * 60 + m + (isShort ? 35 : 90);
  const endTime = `${Math.floor(end / 60)}:${String(end % 60).padStart(2, "0")}`;
  const color = title.includes("モダン") ? "blue" : title.includes("ポワント") ? "yellow" : "pink";
  return { endTime, color };
}

export async function GET(req: Request) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week");
  const month = searchParams.get("month");

  let from: string, to: string;
  if (week) {
    from = week;
    const d = new Date(week + "T00:00:00");
    d.setDate(d.getDate() + 7);
    to = d.toISOString().split("T")[0];
  } else {
    const m = month ?? (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    })();
    const [y, mo] = m.split("-").map(Number);
    from = `${m}-01`;
    to = mo === 12 ? `${y + 1}-01-01` : `${y}-${String(mo + 1).padStart(2, "0")}-01`;
  }

  const [{ data: rows }, { data: users }] = await Promise.all([
    supabaseAdmin
      .from("attendances")
      .select("student_id, lesson_date, lesson_title, lesson_teacher, lesson_type, lesson_time")
      .gte("lesson_date", from)
      .lt("lesson_date", to),
    supabaseAdmin
      .from("users")
      .select("id, name, line_picture_url, mypage_picture_url, mypage_name"),
  ]);

  const CLASS_TYPES = new Set(["通常", "祝日", "特別"]);
  const records = (rows ?? []).filter(r => CLASS_TYPES.has(r.lesson_type) && r.lesson_title && r.lesson_time);
  const userMap = new Map((users ?? []).map(u => [u.id, u]));

  // (dow, time, title) で集計 — 先生は問わない
  type SlotAcc = {
    sessions: Set<string>;
    count: number;
    teacherCounts: Map<string, number>;
    studentIds: Set<number>;
  };
  const slotAcc = new Map<string, SlotAcc>();

  records.forEach(r => {
    const dow = new Date(r.lesson_date + "T00:00:00").getDay();
    const sep1 = "|", sep2 = "||";
    const startTime = r.lesson_time!.split("〜")[0].trim();
    const key = `${dow}${sep1}${startTime}${sep2}${r.lesson_title}`;
    if (!slotAcc.has(key)) {
      slotAcc.set(key, { sessions: new Set(), count: 0, teacherCounts: new Map(), studentIds: new Set() });
    }
    const acc = slotAcc.get(key)!;
    acc.sessions.add(r.lesson_date);
    acc.count++;
    if (r.lesson_teacher) {
      acc.teacherCounts.set(r.lesson_teacher, (acc.teacherCounts.get(r.lesson_teacher) ?? 0) + 1);
    }
    acc.studentIds.add(r.student_id);
  });

  const slots = Array.from(slotAcc.entries()).map(([key, acc]) => {
    const idx1 = key.indexOf("|");
    const idx2 = key.indexOf("||");
    const dow = Number(key.slice(0, idx1));
    const time = key.slice(idx1 + 1, idx2);
    const title = key.slice(idx2 + 2);
    const meta = findSlotMeta(dow, time, title);
    const sessions = acc.sessions.size;
    const avgAttendees = sessions > 0 ? Math.round((acc.count / sessions) * 10) / 10 : 0;
    const teacherCounts: Record<string, number> = {};
    acc.teacherCounts.forEach((v, k) => { teacherCounts[k] = v; });
    const dominantTeacher = acc.teacherCounts.size
      ? [...acc.teacherCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;
    const students = Array.from(acc.studentIds)
      .map(id => userMap.get(id))
      .filter(Boolean)
      .map(u => ({
        id: u!.id,
        name: u!.mypage_name ?? u!.name ?? "名前なし",
        picture_url: u!.mypage_picture_url ?? u!.line_picture_url ?? null,
      }));
    return { key, dow, time, endTime: meta.endTime, title, color: meta.color, sessions, count: acc.count, avgAttendees, teacherCounts, dominantTeacher, students };
  });

  // 時間帯別集計
  const timeAcc = new Map<string, { total: number; sessions: Set<string> }>();
  records.forEach(r => {
    const t = r.lesson_time!.split("〜")[0].trim();
    if (!timeAcc.has(t)) timeAcc.set(t, { total: 0, sessions: new Set() });
    const acc = timeAcc.get(t)!;
    acc.total++;
    const dow = new Date(r.lesson_date + "T00:00:00").getDay();
    acc.sessions.add(`${dow}_${r.lesson_date}`);
  });
  const timeDistribution = [...timeAcc.entries()]
    .map(([time, d]) => ({
      time,
      sessions: d.sessions.size,
      avgAttendees: d.sessions.size > 0 ? Math.round((d.total / d.sessions.size) * 10) / 10 : 0,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  return NextResponse.json({ slots, timeDistribution, from, to });
}
