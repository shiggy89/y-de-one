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
  has_stretch: boolean;
};

type Instance = {
  id: number;
  class_template_id: number;
  lesson_date: string;
  status: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  notes: string | null;
  actual_title: string | null;
  actual_teacher: string | null;
  actual_color_type: string | null;
  actual_has_stretch: boolean | null;
};

type EditTarget = { template: Template; date: string; instance: Instance | null };

type EditState = {
  scope: "once" | "permanent";
  status: string;
  lessonType: "通常" | "祝日";
  title: string;
  teacher: string;
  startTime: string;
  endTime: string;
  hasStretch: boolean;
  notes: string;
};

const DAY_LABELS: Record<string, string> = {
  Mon: "月", Tue: "火", Wed: "水", Thu: "木", Fri: "金", Sat: "土", Sun: "日",
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_OPTIONS = [
  { value: "Mon", label: "月曜" }, { value: "Tue", label: "火曜" },
  { value: "Wed", label: "水曜" }, { value: "Thu", label: "木曜" },
  { value: "Fri", label: "金曜" }, { value: "Sat", label: "土曜" },
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

const colorToLessonType = (color: string): "通常" | "祝日" =>
  color === "green" ? "祝日" : "通常";

const titleToColor = (type: "通常" | "祝日", title: string): string => {
  if (type === "祝日") return "green";
  return CLASS_OPTIONS["通常"].find((o) => o.label === title)?.color ?? "pink";
};

const STATUS_COLOR: Record<string, string> = {
  regular: "#4caf50",
  cancelled: "#e05080",
  rehearsal: "#b0b0b0",
};

function getBadge(template: Template, instance: Instance | null) {
  if (!instance) return { label: "通常", color: STATUS_COLOR.regular };
  if (instance.status === "cancelled") return { label: "休講", color: STATUS_COLOR.cancelled };
  if (instance.status === "rehearsal") return { label: "リハーサル", color: STATUS_COLOR.rehearsal };

  const hasTimeChange =
    (instance.actual_start_time && instance.actual_start_time !== template.start_time) ||
    (instance.actual_end_time && instance.actual_end_time !== template.end_time);
  const hasContentChange =
    instance.actual_title || instance.actual_teacher ||
    instance.actual_color_type || instance.actual_has_stretch !== null;

  if (hasTimeChange && !hasContentChange) return { label: "時間変更", color: "#ff9800" };
  if (hasContentChange || hasTimeChange) return { label: "変更あり", color: "#0090e8" };
  return { label: "通常", color: STATUS_COLOR.regular };
}

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
  const [editState, setEditState] = useState<EditState>({
    scope: "once", status: "regular", lessonType: "通常",
    title: "", teacher: "", startTime: "", endTime: "",
    hasStretch: false, notes: "",
  });
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

  const isModalOpen = !!editTarget || showAddForm;
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isModalOpen]);

  const openEdit = (template: Template, date: string) => {
    const instance = instances.find(
      (i) => i.class_template_id === template.id && i.lesson_date === date
    ) ?? null;

    const effectiveColorType = instance?.actual_color_type ?? template.color_type;
    const effectiveLessonType = colorToLessonType(effectiveColorType);
    const effectiveTitle = (instance?.actual_title ?? template.title).replace(/\n/g, "");

    setEditTarget({ template, date, instance });
    setEditState({
      scope: "once",
      status: instance?.status ?? "regular",
      lessonType: effectiveLessonType,
      title: effectiveTitle,
      teacher: instance?.actual_teacher ?? template.teacher,
      startTime: instance?.actual_start_time ?? template.start_time,
      endTime: instance?.actual_end_time ?? template.end_time,
      hasStretch: instance?.actual_has_stretch ?? template.has_stretch,
      notes: instance?.notes ?? "",
    });
  };

  const handleEditTypeChange = (type: "通常" | "祝日") => {
    const first = CLASS_OPTIONS[type][0];
    setEditState((s) => ({ ...s, lessonType: type, title: first.label }));
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);

    if (editState.scope === "permanent") {
      const colorType = titleToColor(editState.lessonType, editState.title);
      await adminFetch("/api/admin/schedule/template", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editTarget.template.id,
          title: editState.title,
          teacher: editState.teacher,
          colorType,
          hasStretch: editState.hasStretch,
          startTime: editState.startTime,
          endTime: editState.endTime,
        }),
      });
    } else {
      const colorType = titleToColor(editState.lessonType, editState.title);
      const t = editTarget.template;
      await adminFetch("/api/admin/schedule/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classTemplateId: t.id,
          lessonDate: editTarget.date,
          status: editState.status,
          actualStartTime: editState.startTime !== t.start_time ? editState.startTime : null,
          actualEndTime: editState.endTime !== t.end_time ? editState.endTime : null,
          notes: editState.notes || null,
          actualTitle: editState.title !== t.title.replace(/\n/g, "") ? editState.title : null,
          actualTeacher: editState.teacher !== t.teacher ? editState.teacher : null,
          actualColorType: colorType !== t.color_type ? colorType : null,
          actualHasStretch: editState.hasStretch !== t.has_stretch ? editState.hasStretch : null,
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
      {/* 週ナビ */}
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
              ) ?? null;
              const badge = getBadge(t, inst);
              const startTime = inst?.actual_start_time ?? t.start_time;
              const endTime = inst?.actual_end_time ?? t.end_time;
              const title = (inst?.actual_title ?? t.title).replace(/\n/g, "");
              const teacher = inst?.actual_teacher ?? t.teacher;
              return (
                <button key={t.id} className={styles.scheduleLessonBtn} onClick={() => openEdit(t, date)}>
                  <span className={styles.scheduleLessonTime}>{startTime}〜{endTime}</span>
                  <span className={styles.scheduleLessonTitle}>{title}</span>
                  <span className={styles.scheduleLessonTeacher}>{teacher}</span>
                  <span className={styles.scheduleStatusBadge} style={{ backgroundColor: badge.color }}>
                    {badge.label}
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

      {/* ━━━ 編集モーダル ━━━ */}
      {editTarget && (
        <div className={styles.modalOverlay} onClick={() => setEditTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {editTarget.date}　{(editTarget.instance?.actual_title ?? editTarget.template.title).replace(/\n/g, "")}
            </h3>
            <p className={styles.modalSub}>{editTarget.instance?.actual_teacher ?? editTarget.template.teacher}</p>

            {/* 変更の範囲 */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>変更の範囲</label>
              <div className={styles.scopeBtns}>
                <button
                  className={`${styles.scopeBtn} ${editState.scope === "once" ? styles.scopeBtnActive : ""}`}
                  onClick={() => setEditState((s) => ({ ...s, scope: "once" }))}
                >
                  今回のみ
                </button>
                <button
                  className={`${styles.scopeBtn} ${editState.scope === "permanent" ? styles.scopeBtnActive : ""}`}
                  onClick={() => setEditState((s) => ({ ...s, scope: "permanent" }))}
                >
                  今後すべて
                </button>
              </div>
              {editState.scope === "permanent" && (
                <p className={styles.scopeNote}>テンプレートを更新します。以降のすべてのレッスンに反映されます。</p>
              )}
            </div>

            {/* レッスン種別 */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>レッスン種別</label>
              <select
                className={styles.formSelect}
                value={editState.lessonType}
                onChange={(e) => handleEditTypeChange(e.target.value as "通常" | "祝日")}
              >
                <option value="通常">通常レッスン</option>
                <option value="祝日">祝日レッスン</option>
              </select>
            </div>

            {/* クラス名 */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>クラス名</label>
              <select
                className={styles.formSelect}
                value={editState.title}
                onChange={(e) => setEditState((s) => ({ ...s, title: e.target.value }))}
              >
                {CLASS_OPTIONS[editState.lessonType].map((o) => (
                  <option key={o.label} value={o.label}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* 先生 */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>先生</label>
              <select
                className={styles.formSelect}
                value={editState.teacher}
                onChange={(e) => setEditState((s) => ({ ...s, teacher: e.target.value }))}
              >
                {TEACHERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* 時間 */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>時間</label>
              <div className={styles.timeRow}>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={editState.startTime}
                  onChange={(e) => setEditState((s) => ({ ...s, startTime: e.target.value }))}
                />
                <span>〜</span>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={editState.endTime}
                  onChange={(e) => setEditState((s) => ({ ...s, endTime: e.target.value }))}
                />
              </div>
            </div>

            {/* ストレッチ */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ストレッチ</label>
              <select
                className={styles.formSelect}
                value={editState.hasStretch ? "yes" : "no"}
                onChange={(e) => setEditState((s) => ({ ...s, hasStretch: e.target.value === "yes" }))}
              >
                <option value="no">なし</option>
                <option value="yes">あり</option>
              </select>
            </div>

            {/* 今回のみ: ステータス + メモ */}
            {editState.scope === "once" && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>ステータス</label>
                  <div className={styles.statusBtns}>
                    {([["regular", "通常"], ["cancelled", "休講"], ["rehearsal", "リハーサル"]] as const).map(([val, label]) => (
                      <button
                        key={val}
                        className={`${styles.statusBtn} ${editState.status === val ? styles.statusBtnActive : ""}`}
                        style={editState.status === val ? { backgroundColor: STATUS_COLOR[val] } : {}}
                        onClick={() => setEditState((s) => ({ ...s, status: val }))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>メモ（任意）</label>
                  <input
                    type="text"
                    className={styles.notesInput}
                    value={editState.notes}
                    onChange={(e) => setEditState((s) => ({ ...s, notes: e.target.value }))}
                    placeholder="例：振替あり、場所変更など"
                  />
                </div>
              </>
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

      {/* ━━━ 新規クラス追加モーダル ━━━ */}
      {showAddForm && (
        <div className={styles.modalOverlay} onClick={() => setShowAddForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>クラスを追加</h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>曜日</label>
              <select className={styles.formSelect} value={newLesson.dayOfWeek} onChange={(e) => setNewLesson((p) => ({ ...p, dayOfWeek: e.target.value }))}>
                {WEEKDAY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>レッスン種別</label>
              <select className={styles.formSelect} value={newLesson.lessonType} onChange={(e) => handleNewLessonTypeChange(e.target.value as "通常" | "祝日")}>
                <option value="通常">通常レッスン</option>
                <option value="祝日">祝日レッスン</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>クラス名</label>
              <select className={styles.formSelect} value={newLesson.title} onChange={(e) => handleNewTitleChange(e.target.value)}>
                {CLASS_OPTIONS[newLesson.lessonType].map((o) => <option key={o.label} value={o.label}>{o.label}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>先生</label>
              <select className={styles.formSelect} value={newLesson.teacher} onChange={(e) => setNewLesson((p) => ({ ...p, teacher: e.target.value }))}>
                {TEACHERS.map((t) => <option key={t} value={t}>{t}</option>)}
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
              <select className={styles.formSelect} value={newLesson.hasStretch ? "yes" : "no"} onChange={(e) => setNewLesson((p) => ({ ...p, hasStretch: e.target.value === "yes" }))}>
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
