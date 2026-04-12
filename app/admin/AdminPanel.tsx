"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import styles from "./admin.module.css";

type User = {
  id: number;
  name: string | null;
  line_user_id: string;
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
  const [selectedUserId, setSelectedUserId] = useState("");
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split("T")[0]);
  const [lessonType, setLessonType] = useState("通常");
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
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) { setLoading(false); return; }

        if (!liff.isInClient() && process.env.NODE_ENV !== "production") {
          setLineUserId("debug");
          setIsAdmin(true);
          setLoading(false);
          return;
        }

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

  const handleStatusChange = async (userId: number, status: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status }),
    });
    fetchUsers();
  };

  const handleAdminToggle = async (userId: number, currentIsAdmin: boolean) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, is_admin: !currentIsAdmin }),
    });
    fetchUsers();
  };

  const handleAttendance = async () => {
    setAttendanceMsg(null);
    setAttendanceError(null);
    if (!selectedUserId) { setAttendanceError("生徒を選択してください"); return; }

    const res = await fetch("/api/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: Number(selectedUserId), lessonDate, lessonType }),
    });
    const data = await res.json();
    if (res.ok) {
      setAttendanceMsg(`記録しました（料金：¥${data.price?.toLocaleString()}）`);
    } else {
      setAttendanceError(data.error ?? "エラーが発生しました");
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
              <label className={styles.formLabel}>生徒</label>
              <select className={styles.formSelect} value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="">選択してください</option>
                {users.filter(u => u.status !== "trial").map((u) => (
                  <option key={u.id} value={u.id}>{u.name ?? "（名前なし）"}</option>
                ))}
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>レッスン日</label>
              <input type="date" className={styles.formInput} value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>レッスン種別</label>
              <select className={styles.formSelect} value={lessonType} onChange={(e) => setLessonType(e.target.value)}>
                <option value="通常">通常</option>
                <option value="35分">35分</option>
                <option value="特別">特別</option>
                <option value="個人">個人</option>
              </select>
            </div>
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
                <span className={styles.userName}>{u.name ?? "（名前なし）"}</span>
                <span className={`${styles.badge} ${styles[u.status]}`}>{u.status}</span>
                <select
                  className={styles.statusSelect}
                  value={u.status}
                  onChange={(e) => handleStatusChange(u.id, e.target.value)}
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
