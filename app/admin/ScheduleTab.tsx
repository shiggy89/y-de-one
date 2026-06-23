"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./admin.module.css";

type Template = {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  title: string;
  teacher: string;
  color_type: string;
};

type Instance = {
  id: number;
  class_template_id: number;
  lesson_date: string;
  status: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  notes: string | null;
};

type EditTarget = {
  template: Template;
  date: string;
  instance: Instance | null;
};

const DAY_LABELS: Record<string, string> = {
  Mon: "月", Tue: "火", Wed: "水", Thu: "木", Fri: "金", Sat: "土", Sun: "日",
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_OPTIONS = [
  { value: "Mon", label: "月曜" },
  { value: "Tue", label: "火曜" },
  { value: "Wed", label: "水曜" },
  { value: "Thu", label: "木曜" },
  { value: "Fri", label: "金曜" },
  { value: "Sat", label: "土曜" },
  { value: "Sun", label: "日曜" },
];

const TEACHERS = ["門馬和樹", "青山佳樹"];

const CLASS_OPTIONS: Record<string, { label: string; color: string }[]> = {
  通常: [
    { label: "バレエ入門", color: "pink" },
    { label: "バレエ入門基礎", color: "pink" },
    { label: "バレエ基礎", color: "pink" },
    { label: "ポワント", color: "yellow" },
    { label: "プレモダン", color: "blue" },
    { label: "モダンバレエ", color: "blue" },
  ],
  祝日: [
    { label: "特別レッスン", color: "green" },
    { label: "バレエ", color: "green" },
    { label: "ポワント", color: "green" },
    { label: "モダン", color: "green" },
    { label: "プレモダン", color: "green" },
  ],
};

const STATUS_LABEL: Record<string, string> = {
  regular: "通常",
  cancelled: "休講",
  time_changed: "時間変更",
  rehearsal: "リハーサル",
};

const STATUS_COLOR: Record<string, string> = {
  regular: "#4caf50",
  cancelled: "#e05080",
  time_changed: "#ff9800",
  rehearsal: "#b0b0b0",
};

function getWeekRange(offset: number): { from: string; to: string; dates: string[] } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day === 0 ? 7 : day) - 1) + offset * 7);
  const dates = WEEKDAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
  return { from: dates[0], to: dates[6], dates };
}

const emptyNew = () => ({
  dayOfWeek: "Tue",
  lessonType: "通常" as "通常" | "祝日",
  title: CLASS_OPTIONS["通常"][0].label,
  colorType: CLASS_OPTIONS["通常"][0].color,
  teacher: TEACHERS[0],
  startTime: "13:00",
  endTime: "14:30",
  hasStretch: false,
});

export default function ScheduleTab({ adminFetch }: { adminFetch: (url: string, options?: RequestInit) => Promise<Response> }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editStatus, setEditStatus] = useState("regular");
  const [editScope, setEditScope] = useState<"once" | "permanent">("once");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newLesson, setNewLesson] = useState(emptyNew());
  const [addSaving, setAddSaving] = useState(false);

  const { from, to, dates } = getWeekRange(weekOffset);

  const fetchSchedule = useCallback(async () => {
    const res = await adminFetch(`/api/admin/schedule?from=${from}&to=${to}`);
    const data = await res.json();
    setTemplates(data.templates ?? []);
    setInstances(data.instances ?? []);
  }, [from, to, adminFetch]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const openEdit = (template: Template, date: string) => {
    const instance = instances.find(
      (i) => i.class_template_id === template.id && i.lesson_date === date
    ) ?? null;
    setEditTarget({ template, date, instance });
    setEditStatus(instance?.status ?? "regular");
    setEditScope("once");
    setEditStartTime(instance?.actual_start_time ?? template.start_time);
    setEditEndTime(instance?.actual_end_time ?? template.end_time);
    setEditNotes(instance?.notes ?? "");
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);

    if (editStatus === "time_changed" && editScope === "permanent") {
      // テンプレート自体を永続更新
      await adminFetch("/api/admin/schedule/template", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editTarget.template.id,
          startTime: editStartTime,
          endTime: editEndTime,
        }),
      });
    } else {
      // 通常のインスタンス作成/更新
      await adminFetch("/api/admin/schedule/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classTemplateId: editTarget.template.id,
          lessonDate: editTarget.date,
          status: editStatus,
          actualStartTime: editStatus === "time_changed" ? editStartTime : null,
          actualEndTime: editStatus === "time_changed" ? editEndTime : null,
          notes: editNotes || null,
        }),
      });
    }

    setSaving(false);
    setEditTarget(null);
    fetchSchedule();
  };

  const handleNewLessonTypeChange = (type: "通常" | "祝日") => {
    const first = CLASS_OPTIONS[type][0];
    setNewLesson((p) => ({ ...p, lessonType: type, title: first.label, colorType: first.color }));
  };

  const handleNewTitleChange = (label: string) => {
    const opt = CLASS_OPTIONS[newLesson.lessonType].find((o) => o.label === label);
    setNewLesson((p) => ({ ...p, title: label, colorType: opt?.color ?? "pink" }));
  };

  const saveNewLesson = async () => {
    setAddSaving(true);
    await adminFetch("/api/admin/schedule/template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayOfWeek: newLesson.dayOfWeek,
        startTime: newLesson.startTime,
        endTime: newLesson.endTime,
        title: newLesson.title,
        teacher: newLesson.teacher,
        colorType: newLesson.colorType,
        hasStretch: newLesson.hasStretch,
      }),
    });
    setAddSaving(false);
    setShowAddForm(false);
    setNewLesson(emptyNew());
    fetchSchedule();
  };

  const dayLabel = (date: string) => {
    const d = new Date(date + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className={styles.scheduleTab}>
      {/* 週ナビゲーション */}
      <div className={styles.weekNav}>
        <button className={styles.weekNavBtn} onClick={() => setWeekOffset((o) => o - 1)}>← 前週</button>
        <span className={styles.weekLabel}>{dayLabel(from)} 〜 {dayLabel(to)}</span>
        <button className={styles.weekNavBtn} onClick={() => setWeekOffset((o) => o + 1)}>次週 →</button>
      </div>

      {/* 曜日ごとのレッスン一覧 */}
      {WEEKDAYS.map((day, i) => {
        const date = dates[i];
        const dayTemplates = templates.filter((t) => t.day_of_week === day);
        if (dayTemplates.length === 0) return null;
        return (
          <div key={day} className={styles.scheduleDay}>
            <div className={styles.scheduleDayHeader}>
              {DAY_LABELS[day]}（{dayLabel(date)}）
            </div>
            {dayTemplates.map((t) => {
              const inst = instances.find(
                (i) => i.class_template_id === t.id && i.lesson_date === date
              );
              const status = inst?.status ?? "regular";
              const startTime = (inst?.status === "time_changed" && inst.actual_start_time) ? inst.actual_start_time : t.start_time;
              const endTime = (inst?.status === "time_changed" && inst.actual_end_time) ? inst.actual_end_time : t.end_time;
              return (
                <button
                  key={t.id}
                  className={styles.scheduleLessonBtn}
                  onClick={() => openEdit(t, date)}
                >
                  <span className={styles.scheduleLessonTime}>{startTime}〜{endTime}</span>
                  <span className={styles.scheduleLessonTitle}>{t.title.replace(/\n/g, "")}</span>
                  <span className={styles.scheduleLessonTeacher}>{t.teacher}</span>
                  <span
                    className={styles.scheduleStatusBadge}
                    style={{ backgroundColor: STATUS_COLOR[status] }}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}

      {/* クラス追加ボタン */}
      <button className={styles.addClassBtn} onClick={() => setShowAddForm(true)}>
        ＋ クラスを追加
      </button>

      {/* 編集モーダル */}
      {editTarget && (
        <div className={styles.modalOverlay} onClick={() => setEditTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {editTarget.date}　{editTarget.template.title.replace(/\n/g, "")}
            </h3>
            <p className={styles.modalSub}>{editTarget.template.teacher}</p>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ステータス</label>
              <div className={styles.statusBtns}>
                {Object.entries(STATUS_LABEL).map(([val, label]) => (
                  <button
                    key={val}
                    className={`${styles.statusBtn} ${editStatus === val ? styles.statusBtnActive : ""}`}
                    style={editStatus === val ? { backgroundColor: STATUS_COLOR[val] } : {}}
                    onClick={() => { setEditStatus(val); if (val !== "time_changed") setEditScope("once"); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {editStatus === "time_changed" && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>適用範囲</label>
                  <div className={styles.scopeBtns}>
                    <button
                      className={`${styles.scopeBtn} ${editScope === "once" ? styles.scopeBtnActive : ""}`}
                      onClick={() => setEditScope("once")}
                    >
                      今回のみ
                    </button>
                    <button
                      className={`${styles.scopeBtn} ${editScope === "permanent" ? styles.scopeBtnActive : ""}`}
                      onClick={() => setEditScope("permanent")}
                    >
                      今後すべて
                    </button>
                  </div>
                  {editScope === "permanent" && (
                    <p className={styles.scopeNote}>テンプレートの時間を変更します。以降のすべてのレッスンに反映されます。</p>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>変更後の時間</label>
                  <div className={styles.timeRow}>
                    <input type="time" className={styles.timeInput} value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
                    <span>〜</span>
                    <input type="time" className={styles.timeInput} value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {editStatus !== "time_changed" && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>メモ（任意）</label>
                <input
                  type="text"
                  className={styles.notesInput}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="例：振替あり、場所変更など"
                />
              </div>
            )}

            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => setEditTarget(null)}>キャンセル</button>
              <button className={styles.saveBtn} onClick={saveEdit} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新規クラス追加モーダル */}
      {showAddForm && (
        <div className={styles.modalOverlay} onClick={() => setShowAddForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>クラスを追加</h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>曜日</label>
              <select
                className={styles.formSelect}
                value={newLesson.dayOfWeek}
                onChange={(e) => setNewLesson((p) => ({ ...p, dayOfWeek: e.target.value }))}
              >
                {WEEKDAY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>レッスン種別</label>
              <select
                className={styles.formSelect}
                value={newLesson.lessonType}
                onChange={(e) => handleNewLessonTypeChange(e.target.value as "通常" | "祝日")}
              >
                <option value="通常">通常レッスン</option>
                <option value="祝日">祝日レッスン</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>クラス名</label>
              <select
                className={styles.formSelect}
                value={newLesson.title}
                onChange={(e) => handleNewTitleChange(e.target.value)}
              >
                {CLASS_OPTIONS[newLesson.lessonType].map((o) => (
                  <option key={o.label} value={o.label}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>先生</label>
              <select
                className={styles.formSelect}
                value={newLesson.teacher}
                onChange={(e) => setNewLesson((p) => ({ ...p, teacher: e.target.value }))}
              >
                {TEACHERS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>時間</label>
              <div className={styles.timeRow}>
                <input type="time" className={styles.timeInput} value={newLesson.startTime} onChange={(e) => setNewLesson((p) => ({ ...p, startTime: e.target.value }))} />
                <span>〜</span>
                <input type="time" className={styles.timeInput} value={newLesson.endTime} onChange={(e) => setNewLesson((p) => ({ ...p, endTime: e.target.value }))} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ストレッチ</label>
              <select
                className={styles.formSelect}
                value={newLesson.hasStretch ? "yes" : "no"}
                onChange={(e) => setNewLesson((p) => ({ ...p, hasStretch: e.target.value === "yes" }))}
              >
                <option value="no">なし</option>
                <option value="yes">あり</option>
              </select>
            </div>

            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => setShowAddForm(false)}>キャンセル</button>
              <button className={styles.saveBtn} onClick={saveNewLesson} disabled={addSaving}>
                {addSaving ? "追加中..." : "追加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
