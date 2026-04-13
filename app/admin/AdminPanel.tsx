"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import styles from "./admin.module.css";
import { getLessonsForDate, type Lesson } from "@/lib/lessons";

type User = {
  id: number;
  name: string | null;
  line_user_id: string;
  line_display_name: string | null;
  line_picture_url: string | null;
  status: string;
  is_admin: boolean;
};

type Tab = "attendance" | "users" | "message";

const LESSON_PRICES = [3300, 5400, 7800, 9600, 11000, 14000, 16200, 17600];

function calcPrice(countThisMonth: number, lessonType: string): number {
  if (lessonType === "35分") return 1100;
  if (lessonType === "特別") return 3000;
  if (lessonType === "個人") return 2500;
  if (countThisMonth >= 9) return 2000;
  const total = LESSON_PRICES[Math.min(countThisMonth, 8) - 1] ?? 3300;
  const prevTotal = countThisMonth > 1 ? (LESSON_PRICES[countThisMonth - 2] ?? 0) : 0;
  return total - prevTotal;
}

export default function AdminPanel() {
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("attendance");

  // ユーザー一覧
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  // 出席記録
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split("T")[0]);
  const [lessonType, setLessonType] = useState("通常");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [privateMinutes, setPrivateMinutes] = useState(15);
  const [feePreviews, setFeePreviews] = useState<{
    userId: number; name: string; line_picture_url: string | null;
    isTeacher: boolean; lessonFee: number; maintenanceFee: number; total: number;
  }[]>([]);
  const [attendanceMsg, setAttendanceMsg] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  // メッセージ送信
  const [message, setMessage] = useState("");
  const [trialCount, setTrialCount] = useState(0);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (process.env.NODE_ENV !== "production") {
          setLineUserId("debug");
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) { setLoading(false); return; }

        await liff.init({ liffId });
        if (!liff.isLoggedIn()) { liff.login(); return; }
        const p = await liff.getProfile();
        setLineUserId(p.userId);

        // 管理者チェック
        const res = await fetch(`/api/admin/me?lineUserId=${p.userId}`);
        const data = await res.json();
        setIsAdmin(data.isAdmin ?? false);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    try { init(); } catch (e) { console.error(e); setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setTrialCount((data.users ?? []).filter((u: User) => u.status === "trial").length);
  };

  const handleStatusChange = async (userId: number, newStatus: string, currentStatus: string) => {
    if (!confirm(`${currentStatus} → ${newStatus} に変更しますか？`)) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status: newStatus }),
    });
    fetchUsers();
  };

  const handleAdminToggle = async (userId: number, currentIsAdmin: boolean) => {
    if (currentIsAdmin) {
      if (!confirm("管理者 → 一般 に変更しますか？")) return;
    } else {
      const input = prompt("管理者に変更するには「admin」と入力してください");
      if (input !== "admin") {
        if (input !== null) alert("入力が正しくありません");
        return;
      }
    }
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, is_admin: !currentIsAdmin }),
    });
    fetchUsers();
  };

  const fetchFeePreviews = async (ids: number[], date: string, type: string, minutes: number) => {
    if (ids.length === 0) { setFeePreviews([]); return; }
    const res = await fetch("/api/admin/preview-fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: ids, lessonDate: date, lessonType: type, privateMinutes: minutes }),
    });
    const data = await res.json();
    setFeePreviews(data.fees ?? []);
  };

  const handleAttendance = async () => {
    setAttendanceMsg(null);
    setAttendanceError(null);
    if (selectedUserIds.length === 0) { setAttendanceError("生徒を選択してください"); return; }

    const results = await Promise.all(
      selectedUserIds.map((userId) =>
        fetch("/api/admin/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, lessonDate, lessonType, privateMinutes: lessonType === "個人" ? privateMinutes : undefined }),
        }).then((r) => r.json())
      )
    );

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      setAttendanceError("一部の記録に失敗しました");
    } else {
      setAttendanceMsg(`${selectedUserIds.length}人分を記録しました`);
      setSelectedUserIds([]);
    }
  };

  const handleSendMessage = async () => {
    setSendMsg(null);
    setSendError(null);
    if (!message.trim()) { setSendError("メッセージを入力してください"); return; }
    if (!confirm(`trial会員${trialCount}人にメッセージを送信しますか？`)) return;

    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (res.ok) {
      setSendMsg(`${data.count}人に送信しました`);
      setMessage("");
    } else {
      setSendError(data.error ?? "エラーが発生しました");
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.name ?? "").includes(search) || u.line_user_id.includes(search)
  );

  if (loading) return <div className={styles.admin}><p>読み込み中...</p></div>;
  if (!isAdmin) return <div className={styles.unauthorized}>管理者のみアクセスできます</div>;

  return (
    <div className={styles.admin}>
      <h1 className={styles.title}>管理画面</h1>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "attendance" ? styles.active : ""}`} onClick={() => setTab("attendance")}>出席記録</button>
        <button className={`${styles.tab} ${tab === "users" ? styles.active : ""}`} onClick={() => setTab("users")}>会員管理</button>
        <button className={`${styles.tab} ${tab === "message" ? styles.active : ""}`} onClick={() => setTab("message")}>メッセージ</button>
      </div>

      {/* ━━━ 出席記録 ━━━ */}
      {tab === "attendance" && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>出席を記録する</p>
          <div className={styles.attendanceForm}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>レッスン日</label>
              <input
                type="date"
                className={styles.formInput}
                value={lessonDate}
                onChange={(e) => {
                  setLessonDate(e.target.value);
                  setSelectedLesson(null);
                  fetchFeePreviews(selectedUserIds, e.target.value, lessonType, privateMinutes);
                }}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>レッスン種別</label>
              <select className={styles.formSelect} value={lessonType} onChange={(e) => {
                setLessonType(e.target.value);
                fetchFeePreviews(selectedUserIds, lessonDate, e.target.value, privateMinutes);
              }}>
                <option value="通常">通常レッスン</option>
                <option value="特別">特別レッスン</option>
                <option value="個人">個人レッスン</option>
              </select>
            </div>
            {lessonType === "個人" && (
              <div className={styles.formRow}>
                <label className={styles.formLabel}>個人レッスン時間</label>
                <select
                  className={styles.formSelect}
                  value={privateMinutes}
                  onChange={(e) => setPrivateMinutes(Number(e.target.value))}
                >
                  {[15, 30, 45, 60, 75, 90].map((m) => (
                    <option key={m} value={m}>{m}分（¥{(2500 * m / 15).toLocaleString()}）</option>
                  ))}
                </select>
              </div>
            )}
            {lessonType === "通常" && (() => {
              const lessons = getLessonsForDate(lessonDate);
              return lessons.length > 0 ? (
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>レッスンを選択</label>
                  <div className={styles.lessonGrid}>
                    {lessons.map((l) => (
                      <button
                        key={`${l.start}-${l.title}`}
                        type="button"
                        className={`${styles.lessonBtn} ${selectedLesson?.start === l.start && selectedLesson?.title === l.title ? styles.lessonBtnActive : ""}`}
                        onClick={() => {
                          setSelectedLesson(l);
                          if (selectedUserIds.length > 0) {
                            fetchFeePreviews(selectedUserIds, lessonDate, lessonType, privateMinutes);
                          }
                        }}
                      >
                        <span className={styles.lessonBtnTime}>{l.start}〜{l.end}</span>
                        <span className={styles.lessonBtnTitle}>{l.title}</span>
                        <span className={styles.lessonBtnTeacher}>{l.teacher}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className={styles.noLesson}>この日はレッスンがありません（月曜休講）</p>
              );
            })()}
            <div className={styles.formRow}>
              <div className={styles.studentLabelRow}>
                <label className={styles.formLabel}>生徒を選択</label>
                <span className={styles.selectedCount}>{selectedUserIds.length}人</span>
              </div>
              <div className={styles.studentGrid}>
                {users.filter(u => u.status !== "trial").map((u) => (
                  <div
                    key={u.id}
                    className={`${styles.studentItem} ${selectedUserIds.includes(u.id) ? styles.selected : ""}`}
                    onClick={() => {
                      const next = selectedUserIds.includes(u.id)
                        ? selectedUserIds.filter((id) => id !== u.id)
                        : [...selectedUserIds, u.id];
                      setSelectedUserIds(next);
                      if (lessonType !== "通常" || selectedLesson) {
                        fetchFeePreviews(next, lessonDate, lessonType, privateMinutes);
                      } else {
                        setFeePreviews([]);
                      }
                    }}
                  >
                    {u.line_picture_url ? (
                      <img src={u.line_picture_url} alt="" className={styles.studentIcon} />
                    ) : (
                      <div className={styles.studentIconPlaceholder}><i className="fa-solid fa-user" /></div>
                    )}
                    <span className={styles.studentName}>{u.name ?? "名前なし"}</span>
                  </div>
                ))}
              </div>
            </div>
            {feePreviews.length > 0 && (
              <div className={styles.feePreview}>
                {feePreviews.map((f) => (
                  <div key={f.userId} className={styles.feePreviewRow}>
                    {f.line_picture_url ? (
                      <img src={f.line_picture_url} alt="" className={styles.feePreviewIcon} />
                    ) : (
                      <div className={styles.feePreviewIconPlaceholder}><i className="fa-solid fa-user" /></div>
                    )}
                    <span className={styles.feePreviewName}>{f.name}</span>
                    <span className={styles.feePreviewAmount}>
                      <span className={styles.feePreviewAmountNum}>
                        ¥{f.isTeacher ? "0" : f.total.toLocaleString()}
                      </span>
                      <span className={styles.feePreviewNote}>
                        {f.isTeacher ? "（講師）" : f.maintenanceFee > 0 ? "（維持費含む）" : ""}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {attendanceMsg && <p className={styles.successMsg}>{attendanceMsg}</p>}
            {attendanceError && <p className={styles.errorMsg}>{attendanceError}</p>}
            <button className={styles.submitBtn} onClick={handleAttendance}>記録する</button>
          </div>
        </div>
      )}

      {/* ━━━ 会員管理 ━━━ */}
      {tab === "users" && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>会員一覧（{users.length}人）</p>
          <input
            className={styles.searchInput}
            placeholder="名前で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className={styles.userList}>
            {filteredUsers.map((u) => (
              <div key={u.id} className={styles.userCard}>
                {u.line_picture_url ? (
                  <img src={u.line_picture_url} alt="" className={styles.lineIcon} />
                ) : (
                  <div className={styles.lineIconPlaceholder}><i className="fa-solid fa-user"></i></div>
                )}
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{u.name ?? "（名前なし）"}</span>
                  {u.line_display_name && (
                    <span className={styles.lineDisplayName}>{u.line_display_name}</span>
                  )}
                </div>
                <span className={`${styles.badge} ${styles[u.status]}`}>{u.status}</span>
                <select
                  className={styles.statusSelect}
                  value={u.status}
                  onChange={(e) => handleStatusChange(u.id, e.target.value, u.status)}
                >
                  <option value="trial">trial</option>
                  <option value="member">member</option>
                  <option value="teacher">teacher</option>
                </select>
                <button
                  className={`${styles.adminToggle} ${u.is_admin ? styles.isAdmin : ""}`}
                  onClick={() => handleAdminToggle(u.id, u.is_admin)}
                >
                  {u.is_admin ? "管理者" : "一般"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━━ メッセージ送信 ━━━ */}
      {tab === "message" && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>trial会員への一斉送信</p>
          <p className={styles.trialCount}>現在のtrial会員：{trialCount}人</p>
          <div className={styles.messageForm}>
            <textarea
              className={styles.textarea}
              rows={6}
              placeholder="送信するメッセージを入力..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {sendMsg && <p className={styles.successMsg}>{sendMsg}</p>}
            {sendError && <p className={styles.errorMsg}>{sendError}</p>}
            <button className={styles.sendBtn} onClick={handleSendMessage}>
              {trialCount}人に送信する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
