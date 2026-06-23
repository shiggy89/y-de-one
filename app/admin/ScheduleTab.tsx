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
  rehearsal: "#9c27b0",
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

export default function ScheduleTab({ adminFetch }: { adminFetch: (url: string, options?: RequestInit) => Promise<Response> }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editStatus, setEditStatus] = useState("regular");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

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
    setEditStartTime(instance?.actual_start_time ?? template.start_time);
    setEditEndTime(instance?.actual_end_time ?? template.end_time);
    setEditNotes(instance?.notes ?? "");
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
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
    setSaving(false);
    setEditTarget(null);
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
                    onClick={() => setEditStatus(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {editStatus === "time_changed" && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>変更後の時間</label>
                <div className={styles.timeRow}>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                  />
                  <span>〜</span>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

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

            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => setEditTarget(null)}>キャンセル</button>
              <button className={styles.saveBtn} onClick={saveEdit} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
