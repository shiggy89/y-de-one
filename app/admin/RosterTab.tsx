"use client";

import { useEffect, useState } from "react";
import styles from "./admin.module.css";

type Template = {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  title: string;
  teacher: string;
};

type Instance = {
  id: number;
  class_template_id: number;
  lesson_date: string;
  status: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
};

type RosterUser = {
  id: number;
  name: string | null;
  line_display_name: string | null;
  line_picture_url: string | null;
  status: string;
};

const DAY_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function RosterTab({ adminFetch }: { adminFetch: (url: string, options?: RequestInit) => Promise<Response> }) {
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [templates, setTemplates] = useState<Template[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [rosterUsers, setRosterUsers] = useState<RosterUser[]>([]);
  const [attendedIds, setAttendedIds] = useState<Set<number>>(new Set());
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // 日付が変わったらその日のレッスンを取得
  useEffect(() => {
    if (!date) return;
    setSelectedTemplateId(null);
    setRosterUsers([]);
    setAttendedIds(new Set());
    const fetchDay = async () => {
      const res = await adminFetch(`/api/admin/schedule?from=${date}&to=${date}`);
      const data = await res.json();
      const dayKey = DAY_MAP[new Date(date + "T00:00:00").getDay()];
      setTemplates((data.templates ?? []).filter((t: Template) => t.day_of_week === dayKey));
      setInstances(data.instances ?? []);
    };
    fetchDay();
  }, [date, adminFetch]);

  // レッスン選択 → 出席データ取得（またはインスタンス作成して取得）
  const selectLesson = async (templateId: number) => {
    setSelectedTemplateId(templateId);
    setLoadingRoster(true);
    setAttendedIds(new Set());

    // lesson_instance を upsert してから取得
    await adminFetch("/api/admin/schedule/instance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classTemplateId: templateId,
        lessonDate: date,
        status: "regular",
      }),
    });

    // 更新後のインスタンス一覧を取得
    const schedRes = await adminFetch(`/api/admin/schedule?from=${date}&to=${date}`);
    const schedData = await schedRes.json();
    const updatedInstances: Instance[] = schedData.instances ?? [];
    setInstances(updatedInstances);

    const inst = updatedInstances.find(
      (i) => i.class_template_id === templateId && i.lesson_date === date
    );
    if (!inst) { setLoadingRoster(false); return; }

    const res = await adminFetch(`/api/admin/schedule/attendance?instanceId=${inst.id}`);
    const data = await res.json();
    setRosterUsers(data.users ?? []);
    setAttendedIds(new Set((data.attendances ?? []).map((a: { student_id: number }) => a.student_id)));
    setLoadingRoster(false);
  };

  const toggleStudent = (id: number) => {
    setAttendedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveAttendance = async () => {
    if (selectedTemplateId === null) return;
    const inst = instances.find(
      (i) => i.class_template_id === selectedTemplateId && i.lesson_date === date
    );
    if (!inst) return;
    setSaving(true);
    await adminFetch("/api/admin/schedule/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceId: inst.id, studentIds: Array.from(attendedIds) }),
    });
    setSaving(false);
    setSavedMsg("保存しました");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedInstance = instances.find(
    (i) => i.class_template_id === selectedTemplateId && i.lesson_date === date
  );

  return (
    <div className={styles.rosterTab}>
      {/* 日付選択 */}
      <div className={styles.rosterDateRow}>
        <label className={styles.formLabel}>日付</label>
        <input
          type="date"
          className={styles.dateInput}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* その日のレッスン一覧 */}
      {templates.length === 0 ? (
        <p className={styles.emptyMsg}>この日のレッスンはありません（月曜または休講日）</p>
      ) : (
        <div className={styles.rosterLessonList}>
          {templates.map((t) => {
            const inst = instances.find(
              (i) => i.class_template_id === t.id && i.lesson_date === date
            );
            const isCancelled = inst?.status === "cancelled";
            const startTime = (inst?.status === "time_changed" && inst.actual_start_time) ? inst.actual_start_time : t.start_time;
            const endTime = (inst?.status === "time_changed" && inst.actual_end_time) ? inst.actual_end_time : t.end_time;
            return (
              <button
                key={t.id}
                className={`${styles.rosterLessonBtn} ${selectedTemplateId === t.id ? styles.rosterLessonBtnActive : ""} ${isCancelled ? styles.rosterLessonBtnCancelled : ""}`}
                onClick={() => !isCancelled && selectLesson(t.id)}
                disabled={isCancelled}
              >
                <span className={styles.rosterLessonTime}>{startTime}〜{endTime}</span>
                <span className={styles.rosterLessonTitle}>{t.title.replace(/\n/g, "")}</span>
                <span className={styles.rosterLessonTeacher}>{t.teacher}</span>
                {isCancelled && <span className={styles.cancelledBadge}>休講</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* 出席者リスト */}
      {selectedTemplateId !== null && (
        <div className={styles.rosterSection}>
          <div className={styles.rosterSectionHeader}>
            <span>
              {selectedTemplate?.title.replace(/\n/g, "")} / {selectedInstance?.actual_start_time ?? selectedTemplate?.start_time}〜
            </span>
            <span className={styles.attendCount}>{attendedIds.size}名出席</span>
          </div>

          {loadingRoster ? (
            <p className={styles.emptyMsg}>読み込み中...</p>
          ) : (
            <>
              <div className={styles.studentList}>
                {rosterUsers.map((u) => {
                  const name = u.name ?? u.line_display_name ?? `ID:${u.id}`;
                  const attended = attendedIds.has(u.id);
                  return (
                    <button
                      key={u.id}
                      className={`${styles.studentRow} ${attended ? styles.studentRowAttended : ""}`}
                      onClick={() => toggleStudent(u.id)}
                    >
                      <span className={`${styles.checkBox} ${attended ? styles.checkBoxOn : ""}`}>
                        {attended ? "✓" : ""}
                      </span>
                      <span className={styles.studentName}>{name}</span>
                      <span className={styles.studentStatus}>{u.status}</span>
                    </button>
                  );
                })}
              </div>
              <div className={styles.rosterSaveRow}>
                {savedMsg && <span className={styles.savedMsg}>{savedMsg}</span>}
                <button className={styles.saveBtn} onClick={saveAttendance} disabled={saving}>
                  {saving ? "保存中..." : "出席を保存"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
