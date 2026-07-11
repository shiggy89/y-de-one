"use client";

import { useState, useEffect, useCallback } from "react";
import s from "./heatmap.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "class" | "time";
type PeriodMode = "week" | "month";

type HeatmapSlot = {
  key: string;
  dow: number;
  time: string;
  endTime: string;
  title: string;
  color: string;
  sessions: number;
  count: number;
  avgAttendees: number;
  teacherCounts: Record<string, number>;
  dominantTeacher: string | null;
  students: { id: number; name: string; picture_url: string | null }[];
};

type TimeDistItem = { time: string; sessions: number; avgAttendees: number };
type HeatmapData = { slots: HeatmapSlot[]; timeDistribution: TimeDistItem[]; from: string; to: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = "analytics_key";
const DOW_LABEL = ["日", "月", "火", "水", "木", "金", "土"] as const;
const DOW_ORDER = [2, 3, 4, 5, 6, 0]; // 火〜日
const START_MIN = 12 * 60 + 30;
const END_MIN = 21 * 60;
const TOTAL_MIN = END_MIN - START_MIN;
const MORIMANE = "門馬和樹";
const AOYAMA = "青山佳樹";

const COLOR_CLASS: Record<string, string> = {
  pink: s.pink, blue: s.blue, yellow: s.yellow, gray: s.gray,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function blockStyle(start: string, end: string) {
  const baseTop = ((toMin(start) - START_MIN) / TOTAL_MIN) * 100;
  const duration = toMin(end) - toMin(start);
  const baseHeight = (duration / TOTAL_MIN) * 100;
  const minH = duration <= 40 ? 10 : duration <= 60 ? 14 : 2;
  const height = Math.max(minH, Math.min(baseHeight - 0.5, 100 - baseTop));
  return { top: `${baseTop}%`, height: `${height}%` };
}

function getMondayStr(d = new Date()) {
  const diff = (d.getDay() + 6) % 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - diff);
  return mon.toISOString().split("T")[0];
}

function addWeeks(s: string, n: number) {
  const d = new Date(s + "T00:00:00");
  d.setDate(d.getDate() + n * 7);
  return d.toISOString().split("T")[0];
}

function addMonths(s: string, n: number) {
  const [y, m] = s.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtWeek(s: string) {
  const mon = new Date(s + "T00:00:00");
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const f = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${mon.getFullYear()}/${f(mon)}〜${f(sun)}`;
}

function fmtMonth(s: string) {
  const [y, m] = s.split("-").map(Number);
  return `${y}/${m}`;
}

function getMonths() {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (k: string) => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(false);
    const res = await fetch(`/api/heatmap?month=${getMonths()[0]}`, {
      headers: { "x-analytics-key": pw },
    });
    setLoading(false);
    if (res.ok) { sessionStorage.setItem(SESSION_KEY, pw); onLogin(pw); }
    else setErr(true);
  };

  return (
    <div className={s.loginPage}>
      <div className={s.loginCard}>
        <div className={s.loginLogo}>Y-de-ONE</div>
        <p className={s.loginSub}>ヒートマップ分析</p>
        <form onSubmit={submit} className={s.loginForm}>
          <input type="password" className={s.loginInput} placeholder="パスワード"
            value={pw} onChange={e => setPw(e.target.value)} autoFocus />
          {err && <p className={s.loginError}>パスワードが違います</p>}
          <button type="submit" className={s.loginBtn} disabled={!pw || loading}>
            {loading ? "確認中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Slot Block ───────────────────────────────────────────────────────────────

function SlotBlock({
  slot, mode, selected, onSelect,
}: {
  slot: HeatmapSlot;
  mode: PeriodMode;
  selected: boolean;
  onSelect: (slot: HeatmapSlot | null) => void;
}) {
  const colorClass = COLOR_CLASS[slot.color] ?? s.pink;
  const stat = slot.sessions > 0
    ? (mode === "week" ? `${slot.count}人` : `avg ${slot.avgAttendees}人`)
    : null;

  return (
    <div
      className={`${s.slotBlock} ${colorClass} ${selected ? s.slotBlockSelected : ""}`}
      style={blockStyle(slot.time, slot.endTime)}
      onClick={() => onSelect(selected ? null : slot)}
    >
      <p className={s.slotTime}>{slot.time}-{slot.endTime}</p>
      <p className={s.slotTitle}>{slot.title}</p>
      {slot.dominantTeacher && <p className={s.slotTeacher}>{slot.dominantTeacher}</p>}
      {stat && <p className={s.slotStat}>{stat}</p>}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ slot, mode, onClose }: { slot: HeatmapSlot; mode: PeriodMode; onClose: () => void }) {
  const total = Object.values(slot.teacherCounts).reduce((s, v) => s + v, 0);
  const teachers = Object.entries(slot.teacherCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className={s.detailPanel}>
      <div className={s.detailHeader}>
        <div>
          <span className={s.detailTitle}>{slot.title}</span>
          <span className={s.detailSub}>{DOW_LABEL[slot.dow]}曜 {slot.time}〜{slot.endTime}</span>
        </div>
        <button className={s.detailClose} onClick={onClose}>✕</button>
      </div>
      <div className={s.detailStats}>
        <div className={s.detailStat}>
          <span className={s.detailStatVal}>{slot.sessions}</span>
          <span className={s.detailStatLabel}>回開講</span>
        </div>
        <div className={s.detailStat}>
          <span className={s.detailStatVal}>
            {mode === "week" ? slot.count : slot.avgAttendees}
          </span>
          <span className={s.detailStatLabel}>{mode === "week" ? "参加人数" : "平均参加"}</span>
        </div>
        <div className={s.detailStat}>
          <span className={s.detailStatVal}>{slot.students.length}</span>
          <span className={s.detailStatLabel}>参加生徒</span>
        </div>
      </div>
      {teachers.length > 0 && (
        <div className={s.detailTeachers}>
          {teachers.map(([name, count]) => (
            <div key={name} className={s.detailTeacherRow}>
              <span className={s.detailTeacherName}
                style={{ color: name === MORIMANE ? "#e05080" : name === AOYAMA ? "#0090e8" : "#555" }}>
                {name}
              </span>
              <div className={s.detailTeacherBar}>
                <div
                  className={s.detailTeacherFill}
                  style={{
                    width: `${(count / total) * 100}%`,
                    background: name === MORIMANE ? "#e05080" : name === AOYAMA ? "#0090e8" : "#94a3b8",
                  }}
                />
              </div>
              <span className={s.detailTeacherCount}>{count}回</span>
            </div>
          ))}
        </div>
      )}
      {slot.students.length > 0 && (
        <div className={s.detailStudents}>
          {slot.students.map(st => (
            <span key={st.id} className={s.detailStudent}>{st.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Schedule Board ───────────────────────────────────────────────────────────

function ScheduleBoard({
  slots, mode, selectedKey, onSelect,
}: {
  slots: HeatmapSlot[];
  mode: PeriodMode;
  selectedKey: string | null;
  onSelect: (slot: HeatmapSlot | null) => void;
}) {
  const byDow = new Map<number, HeatmapSlot[]>();
  DOW_ORDER.forEach(d => byDow.set(d, []));
  slots.forEach(slot => byDow.get(slot.dow)?.push(slot));

  return (
    <div className={s.boardScroll}>
      <div className={s.board}>
        <div className={s.dayHeaderRow}>
          {DOW_ORDER.map(dow => (
            <div key={dow} className={s.dayHeaderCell}>{DOW_LABEL[dow]}</div>
          ))}
        </div>
        <div className={s.dayColumns}>
          {DOW_ORDER.map(dow => (
            <div key={dow} className={s.dayCol}>
              {(byDow.get(dow) ?? []).map(slot => (
                <SlotBlock
                  key={slot.key}
                  slot={slot}
                  mode={mode}
                  selected={selectedKey === slot.key}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className={s.statNote}>
        {mode === "week" ? "数値 = その週の参加人数" : "数値 = 月間の1回あたり平均参加人数"}
      </p>
    </div>
  );
}

// ─── Time Distribution ────────────────────────────────────────────────────────

function TimeDist({ data }: { data: TimeDistItem[] }) {
  const max = Math.max(...data.map(d => d.avgAttendees), 1);
  const sorted = [...data].sort((a, b) => b.avgAttendees - a.avgAttendees);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const early = data.find(d => d.time === "12:30");
  const regular = data.find(d => d.time === "13:00");

  return (
    <div className={s.timeDist}>
      <h2 className={s.timeDistTitle}>開始時刻別 平均参加人数</h2>
      <p className={s.timeDistNote}>
        同じ時間帯のコマを横断して集計。人数が多い時間帯ほど生徒が集まりやすい傾向があります。
      </p>

      <div className={s.timeDistChart}>
        {data.map(item => (
          <div key={item.time} className={s.timeDistRow}>
            <div className={s.timeDistLabel}>{item.time}</div>
            <div className={s.timeDistBarWrap}>
              <div
                className={s.timeDistBar}
                style={{
                  width: `${(item.avgAttendees / max) * 100}%`,
                  background: item.avgAttendees === top?.avgAttendees ? "#22c55e" : "#86efac",
                }}
              />
              <span className={s.timeDistVal}>{item.avgAttendees}人</span>
            </div>
            <div className={s.timeDistSessions}>{item.sessions}コマ</div>
          </div>
        ))}
      </div>

      {top && bottom && (
        <div className={s.timeDistInsight}>
          <p>
            最も平均参加人数が多い開始時刻は <strong>{top.time}</strong>（平均 {top.avgAttendees}人）、
            最も少ないのは <strong>{bottom.time}</strong>（平均 {bottom.avgAttendees}人）。
          </p>
          {early && regular && (
            <p>
              12:30開始（平均 {early.avgAttendees}人）と 13:00開始（平均 {regular.avgAttendees}人）を比較すると、
              {early.avgAttendees > regular.avgAttendees
                ? ` 12:30開始の方が${(early.avgAttendees - regular.avgAttendees).toFixed(1)}人多く、早い時間帯に需要がある可能性があります。`
                : early.avgAttendees < regular.avgAttendees
                  ? ` 13:00開始の方が${(regular.avgAttendees - early.avgAttendees).toFixed(1)}人多く、時間変更の効果は限定的かもしれません。`
                  : " 両時間帯で参加人数に差はありません。"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HeatmapPage() {
  const months = getMonths();
  const currentMonth = months[0];
  const currentWeek = getMondayStr();

  const [authKey, setAuthKey] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("class");
  const [mode, setMode] = useState<PeriodMode>("month");
  const [week, setWeek] = useState(currentWeek);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<HeatmapSlot | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setAuthKey(saved);
  }, []);

  const fetchData = useCallback(async () => {
    if (!authKey) return;
    setLoading(true);
    setSelectedSlot(null);
    const params = new URLSearchParams();
    if (mode === "week") params.set("week", week);
    else params.set("month", month);
    const res = await fetch(`/api/heatmap?${params}`, { headers: { "x-analytics-key": authKey } });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [authKey, mode, week, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!authKey) return <LoginPage onLogin={setAuthKey} />;

  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setAuthKey(null); setData(null); };

  const periodLabel = mode === "week" ? fmtWeek(week) : fmtMonth(month);
  const isPresent = mode === "week" ? week >= currentWeek : month >= currentMonth;

  return (
    <div className={s.page}>
      {/* Header */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.logo}>Y-de-ONE</span>
          <span className={s.divider}>/</span>
          <span className={s.title}>ヒートマップ分析</span>
        </div>
        <div className={s.headerRight}>
          <div className={s.periodControl}>
            <div className={s.modeTabs}>
              {(["week", "month"] as PeriodMode[]).map(m => (
                <button key={m}
                  className={`${s.modeTab} ${mode === m ? s.modeTabActive : ""}`}
                  onClick={() => { setMode(m); setSelectedSlot(null); }}>
                  {m === "week" ? "週" : "月"}
                </button>
              ))}
            </div>
            <div className={s.periodNav}>
              <button className={s.navBtn}
                onClick={() => mode === "week" ? setWeek(addWeeks(week, -1)) : setMonth(addMonths(month, -1))}>
                ‹
              </button>
              <span className={s.periodLabel}>{periodLabel}</span>
              <button className={s.navBtn} disabled={isPresent}
                onClick={() => mode === "week" ? setWeek(addWeeks(week, 1)) : setMonth(addMonths(month, 1))}>
                ›
              </button>
              {!isPresent && (
                <button className={s.todayBtn}
                  onClick={() => mode === "week" ? setWeek(currentWeek) : setMonth(currentMonth)}>
                  今{mode === "week" ? "週" : "月"}
                </button>
              )}
            </div>
          </div>
          <button className={s.logoutBtn} onClick={logout}>ログアウト</button>
        </div>
      </header>

      {/* Tabs */}
      <div className={s.tabs}>
        {([["class", "クラス別"], ["time", "時間帯別"]] as [Tab, string][]).map(([key, label]) => (
          <button key={key}
            className={`${s.tab} ${tab === key ? s.tabActive : ""}`}
            onClick={() => { setTab(key); setSelectedSlot(null); }}>
            {label}
          </button>
        ))}
      </div>

      {/* Main */}
      <main className={s.main}>
        {loading && <div className={s.loadingBar}><div className={s.loadingFill} /></div>}

        {data && tab === "class" && (
          <ScheduleBoard
            slots={data.slots}
            mode={mode}
            selectedKey={selectedSlot?.key ?? null}
            onSelect={slot => setSelectedSlot(slot)}
          />
        )}

        {data && tab === "time" && <TimeDist data={data.timeDistribution} />}

        {!loading && !data && (
          <p className={s.empty}>データを取得できませんでした</p>
        )}
      </main>

      {/* Detail Panel */}
      {selectedSlot && (
        <DetailPanel slot={selectedSlot} mode={mode} onClose={() => setSelectedSlot(null)} />
      )}
    </div>
  );
}
