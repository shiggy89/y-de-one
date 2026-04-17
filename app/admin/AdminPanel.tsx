"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import styles from "./admin.module.css";
import { getLessonsForDate, type Lesson } from "@/lib/lessons";
import * as Holiday from "@holiday-jp/holiday_jp";

type User = {
  id: number;
  name: string | null;
  line_user_id: string;
  line_display_name: string | null;
  line_picture_url: string | null;
  status: string;
  is_admin: boolean;
};

type Tab = "attendance" | "ledger" | "users" | "notices" | "message" | "report";

type NoticeRecord = { id: number; title: string; body: string; author: string | null; created_at: string; is_active: boolean };

type ReportRecord = {
  id: number;
  lesson_date: string;
  lesson_type: string;
  lesson_title: string | null;
  lesson_time: string | null;
  lesson_teacher: string | null;
  price_paid: number;
  student_id: number;
  users: { id: number; name: string | null; line_picture_url: string | null } | null;
};

type LedgerRecord = {
  id: number;
  student_id: number;
  lesson_date: string;
  lesson_type: string;
  lesson_title: string | null;
  lesson_time: string | null;
  lesson_teacher: string | null;
  price_paid: number;
  name: string;
  line_picture_url: string | null;
};

const LESSON_TYPE_LABEL: Record<string, string> = {
  通常: "通常レッスン", 祝日: "祝日レッスン", 個人: "個人レッスン", 特別: "特別レッスン",
};

function buildCalendar(yearMonth: string): (number | null)[][] {
  const [y, m] = yearMonth.split("-").map(Number);
  const firstDow = new Date(y, m - 1, 1).getDay(); // 0=日
  // 月曜始まり：月=0, 火=1, ..., 日=6
  const offset = (firstDow + 6) % 7;
  const daysInMonth = new Date(y, m, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
  return weeks;
}

const LESSON_FEES_ONLY = [2800, 5400, 7800, 9600, 11800, 14000, 16200, 17600];

function calcLessonFee(countThisMonth: number, lessonType: string, privateMinutes = 15, lessonTitle?: string): number {
  if (lessonType === "個人") return 2500 * (privateMinutes / 15);
  if (lessonType === "祝日") {
    if (lessonTitle === "特別レッスン") return 3000;
    if (lessonTitle === "ポワント" || lessonTitle === "プレモダン") return 1100;
  } else if (lessonType === "通常") {
    if (lessonTitle === "ポワント" || lessonTitle === "プレモダン") return 1100;
  }
  if (countThisMonth >= 9) return 2000;
  const total = LESSON_FEES_ONLY[countThisMonth - 1] ?? 2800;
  const prev = countThisMonth > 1 ? (LESSON_FEES_ONLY[countThisMonth - 2] ?? 0) : 0;
  return total - prev;
}

export default function AdminPanel() {
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as Tab;
      const valid: Tab[] = ["attendance", "ledger", "users", "notices", "message", "report"];
      if (valid.includes(hash)) return hash;
    }
    return "attendance";
  });

  const changeTab = (t: Tab) => {
    setTab(t);
    window.location.hash = t;
  };

  // ユーザー一覧
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  // 出席記録
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [lessonDate, setLessonDate] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; });
  const [lessonType, setLessonType] = useState("通常");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [holidayLessonType, setHolidayLessonType] = useState("特別レッスン");
  const [privateMinutes, setPrivateMinutes] = useState(15);
  const [feePreviews, setFeePreviews] = useState<{
    userId: number; name: string; line_picture_url: string | null;
    isTeacher: boolean; lessonFee: number; maintenanceFee: number; total: number;
  }[]>([]);
  const [attendanceMonthData, setAttendanceMonthData] = useState<LedgerRecord[]>([]);
  // 全期間の (lessonTime__lessonTitle) → { userId: count } マップ（ソート用）
  const [allLessonCountsMap, setAllLessonCountsMap] = useState<Record<string, Record<number, number>>>({});
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // お知らせ管理
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [noticeSending, setNoticeSending] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [noticeSearch, setNoticeSearch] = useState("");
  const [noticePage, setNoticePage] = useState(1);
  const NOTICES_PER_PAGE = 10;

  const fetchNotices = async () => {
    const res = await fetch("/api/admin/notices", { cache: "no-store" });
    const data = await res.json();
    setNotices(data.notices ?? []);
  };

  const handlePostNotice = async () => {
    if (!noticeBody.trim()) return;
    setNoticeSending(true);
    setNoticeMsg(null);
    const adminUser = users.find((u) => u.line_user_id === lineUserId);
    const author = adminUser?.name ?? adminUser?.line_display_name ?? null;
    const res = await fetch("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: noticeTitle, body: noticeBody, author }),
    });
    if (res.ok) {
      setNoticeTitle("");
      setNoticeBody("");
      setNoticeMsg("投稿しました");
      await fetchNotices();
    } else {
      setNoticeMsg("投稿に失敗しました");
    }
    setNoticeSending(false);
  };

  const handleDeleteNotice = async (id: number) => {
    if (!confirm("このお知らせを削除しますか？")) return;
    setNotices((prev) => prev.filter((n) => n.id !== id));
    await fetch("/api/admin/notices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  // メッセージ送信
  const [message, setMessage] = useState("");
  const [trialCount, setTrialCount] = useState(0);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // レッスン別出席回数（生徒ソート用）
  const [lessonCounts, setLessonCounts] = useState<Record<number, number>>({});

  const fetchLessonCounts = async (lessonTimeStart: string, lessonTitle: string) => {
    const res = await fetch(`/api/admin/lesson-counts?lessonTime=${encodeURIComponent(lessonTimeStart)}&lessonTitle=${encodeURIComponent(lessonTitle)}`);
    const data = await res.json();
    setLessonCounts(data.counts ?? {});
  };

  // 選択日にすでに出席済みの生徒ID
  const [attendedIds, setAttendedIds] = useState<number[]>([]);
  // このセッション内で記録済み: "date__time__title" → student IDs（fetchAttendanceMonthの上書きに左右されない）
  const [justRecordedMap, setJustRecordedMap] = useState<Record<string, number[]>>({});

  const fetchAttendedIds = async (date: string, lessonTime?: string | null, lessonTitle?: string | null) => {
    if (!lessonTime && !lessonTitle) { setAttendedIds([]); return; }
    const ym = date.slice(0, 7);
    const res = await fetch(`/api/admin/ledger?month=${ym}`);
    const data = await res.json();
    const ids = (data.records ?? [])
      .filter((r: LedgerRecord & { student_id?: number }) =>
        r.lesson_date === date &&
        (!lessonTime || r.lesson_time === lessonTime) &&
        (!lessonTitle || r.lesson_title === lessonTitle)
      )
      .map((r: LedgerRecord & { student_id?: number }) => r.student_id)
      .filter(Boolean);
    setAttendedIds([...new Set<number>(ids)]);
  };

  // 出席簿
  const [ledgerMonth, setLedgerMonth] = useState(new Date().toISOString().slice(0, 7));
  const [ledgerRecords, setLedgerRecords] = useState<LedgerRecord[]>([]);
  const [ledgerDate, setLedgerDate] = useState<string | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const fetchLedger = async (month: string) => {
    setLedgerLoading(true);
    setLedgerDate(null);
    const res = await fetch(`/api/admin/ledger?month=${month}`);
    const data = await res.json();
    setLedgerRecords(data.records ?? []);
    setLedgerLoading(false);
  };

  // ステータス選択
  const [statusTarget, setStatusTarget] = useState<User | null>(null);

  // 名前編集モーダル
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editLastName, setEditLastName] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (user: User) => {
    const parts = (user.name ?? "").split(/\s+/);
    setEditLastName(parts[0] ?? "");
    setEditFirstName(parts[1] ?? "");
    setEditUser(user);
  };

  const handleSaveName = async () => {
    if (!editUser) return;
    setEditSaving(true);
    const name = `${editLastName} ${editFirstName}`.trim();
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: editUser.id, name }),
    });
    await fetchUsers();
    setEditSaving(false);
    setEditUser(null);
  };

  // バッジ履歴モーダル
  const [badgeUser, setBadgeUser] = useState<User | null>(null);
  const [badgeData, setBadgeData] = useState<{ year_month: string; badge: string }[]>([]);
  const [badgeLoading, setBadgeLoading] = useState(false);
  const [badgeYear, setBadgeYear] = useState(new Date().getFullYear());
  // 全員分キャッシュ
  const [allBadgesCache, setAllBadgesCache] = useState<Record<number, { year_month: string; badge: string }[]>>({});

  const openBadge = (user: User) => {
    setBadgeUser(user);
    setBadgeYear(new Date().getFullYear());
    if (allBadgesCache[user.id]) {
      setBadgeData(allBadgesCache[user.id]);
      setBadgeLoading(false);
    } else {
      setBadgeData([]);
      setBadgeLoading(true);
      fetch(`/api/admin/badge-history?userId=${user.id}`)
        .then(r => r.json())
        .then(d => { setBadgeData(d.badges ?? []); setBadgeLoading(false); });
    }
  };

  const getBadgeMinYear = () => {
    if (badgeData.length === 0) return new Date().getFullYear();
    return parseInt(badgeData[0].year_month.slice(0, 4));
  };

  // レッスン履歴モーダル
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [historyData, setHistoryData] = useState<{ id: number; lesson_date: string; lesson_type: string; lesson_title: string | null; lesson_time: string | null; lesson_teacher: string | null; price_paid: number; maintenance_fee: number; lesson_fee: number }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7));
  // 全員分キャッシュ
  const [allHistoriesCache, setAllHistoriesCache] = useState<Record<number, typeof historyData>>({});

  const openHistory = (user: User) => {
    setHistoryUser(user);
    setHistoryMonth(new Date().toISOString().slice(0, 7));
    if (allHistoriesCache[user.id]) {
      setHistoryData(allHistoriesCache[user.id]);
      setHistoryLoading(false);
    } else {
      setHistoryData([]);
      setHistoryLoading(true);
      fetch(`/api/admin/attendance-history?userId=${user.id}`)
        .then(r => r.json())
        .then(d => { setHistoryData(d.attendances ?? []); setHistoryLoading(false); });
    }
  };

  const historyMonthData = historyData.filter((a) => a.lesson_date.startsWith(historyMonth));

  const changeHistoryMonth = (delta: number) => {
    const [y, m] = historyMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setHistoryMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

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

  useEffect(() => {
    if (tab === "ledger" && isAdmin) fetchLedger(ledgerMonth);
  }, [tab, ledgerMonth, isAdmin]);

  const lessonMonth = lessonDate.slice(0, 7);
  useEffect(() => {
    if (tab === "attendance" && isAdmin) {
      fetchAttendanceMonth(lessonMonth);
      // 全カウントマップが未取得の場合のみ取得（一度きり）
      if (Object.keys(allLessonCountsMap).length === 0) fetchAllLessonCounts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAdmin, lessonMonth]);

  useEffect(() => {
    if (tab === "notices" && isAdmin) fetchNotices();
  }, [tab, isAdmin]);

  useEffect(() => {
    if (tab === "users" && isAdmin) {
      // 履歴・バッジを全員分まとめて取得
      Promise.all([
        fetch("/api/admin/all-histories").then(r => r.json()),
        fetch("/api/admin/all-badges").then(r => r.json()),
      ]).then(([h, b]) => {
        if (h.histories) setAllHistoriesCache(h.histories);
        if (b.badges) setAllBadgesCache(b.badges);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAdmin]);

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

  const fetchFeePreviews = async (ids: number[], date: string, type: string, minutes: number, lessonTitle?: string, lessonTime?: string) => {
    if (ids.length === 0) { setFeePreviews([]); return; }
    const res = await fetch("/api/admin/preview-fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: ids, lessonDate: date, lessonType: type, privateMinutes: minutes, lessonTitle, lessonTime }),
    });
    const data = await res.json();
    setFeePreviews(data.fees ?? []);
  };

  // 出席タブ用：当月の出席データを取得（料金計算をクライアント側で行うため）
  const fetchAttendanceMonth = async (month: string) => {
    const res = await fetch(`/api/admin/ledger?month=${month}`);
    const data = await res.json();
    setAttendanceMonthData(data.records ?? []);
  };

  // 全期間の出席カウントマップを構築（ソート用・一度だけ取得）
  const fetchAllLessonCounts = async () => {
    const res = await fetch("/api/admin/lesson-counts-all");
    const data = await res.json();
    const map: Record<string, Record<number, number>> = {};
    for (const row of data.rows ?? []) {
      const key = `${row.lesson_time}__${row.lesson_title}`;
      if (!map[key]) map[key] = {};
      map[key][row.student_id] = (map[key][row.student_id] ?? 0) + 1;
    }
    setAllLessonCountsMap(map);
  };

  // クライアント側で料金を即座に計算（APIコールなし）
  const calcClientFee = (userId: number, date: string, type: string, title: string | undefined, timeStart: string | null, minutes: number) => {
    const user = users.find((u) => u.id === userId);
    const isTeacher = user?.status === "teacher";
    const prevCount = attendanceMonthData.filter((r) =>
      r.student_id === userId &&
      (r.lesson_date < date || (r.lesson_date === date && timeStart && r.lesson_time && r.lesson_time.split("〜")[0] < timeStart))
    ).length;
    const countThisMonth = prevCount + 1;
    const isFirst = prevCount === 0;
    const maintenanceFee = isTeacher ? 0 : (isFirst ? 500 : 0);
    const lessonFee = isTeacher ? 0 : calcLessonFee(countThisMonth, type, minutes, title);
    const total = isTeacher ? 0 : lessonFee + maintenanceFee;
    return { isTeacher: isTeacher ?? false, lessonFee, maintenanceFee, total };
  };

  const handleAttendance = async () => {
    setAttendanceError(null);
    if (selectedUserIds.length === 0) { setAttendanceError("生徒を選択してください"); return; }

    // 選択した生徒のアイコンをAPIレスポンス待たずに即時非表示
    const prevAttendedIds = attendedIds;
    setAttendedIds((prev) => [...new Set([...prev, ...selectedUserIds])]);

    // attendanceMonthDataへも即時追加（fetchAttendanceMonth完了前に再選択されても二重出席防止）
    const lessonTitle = lessonType === "祝日" ? holidayLessonType : selectedLesson?.title ?? null;
    const lessonTime = selectedLesson ? `${selectedLesson.start}〜${selectedLesson.end}` : null;
    const optimisticRecords: LedgerRecord[] = selectedUserIds.map((userId) => ({
      id: -(userId * 100000 + Date.now() % 100000), // 一時的な負のID
      student_id: userId,
      lesson_date: lessonDate,
      lesson_type: lessonType,
      lesson_title: lessonTitle,
      lesson_time: lessonTime,
      lesson_teacher: selectedLesson?.teacher ?? null,
      price_paid: 0,
      name: users.find((u) => u.id === userId)?.name ?? "",
      line_picture_url: null,
    }));
    setAttendanceMonthData((prev) => [...prev, ...optimisticRecords]);

    setSubmitting(true);
    const results = await Promise.all(
      selectedUserIds.map((userId) =>
        fetch("/api/admin/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId, lessonDate, lessonType,
            privateMinutes: lessonType === "個人" ? privateMinutes : undefined,
            lessonTitle: lessonType === "祝日" ? holidayLessonType : selectedLesson?.title,
            lessonTime: selectedLesson ? `${selectedLesson.start}〜${selectedLesson.end}` : null,
            lessonTeacher: selectedLesson?.teacher ?? null,
          }),
        }).then((r) => r.json())
      )
    );

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      setAttendanceError("一部の記録に失敗しました");
      setAttendedIds(prevAttendedIds); // 楽観更新を元に戻す
      setAttendanceMonthData((prev) => prev.filter((r) => r.id >= 0)); // 楽観レコードを削除
    } else {
      const n = new Date();
      const today = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
      setSelectedUserIds([]);
      setFeePreviews([]);
      setSelectedLesson(null);
      setLessonType("通常");
      setPrivateMinutes(15);
      setHolidayLessonType("特別レッスン");
      setLessonDate(today);
      setAttendedIds([]);
      // 記録済みマップに追加（fetchAttendanceMonthの完了を待たずに再選択時の二重出席を防ぐ）
      const recordedKey = `${lessonDate}__${lessonTime}__${lessonTitle}`;
      setJustRecordedMap((prev) => ({
        ...prev,
        [recordedKey]: [...new Set([...(prev[recordedKey] ?? []), ...selectedUserIds])],
      }));
      // 月データと全カウントマップを再取得（次回の即時計算を最新に）
      fetchAttendanceMonth(lessonDate.slice(0, 7));
      fetchAllLessonCounts();
      const names = selectedUserIds.map((id) => users.find((u) => u.id === id)?.name ?? "").filter(Boolean).join("、");
      setToast(`${results.length}名の出席を記録しました\n${names}`);
      setTimeout(() => setToast(null), 4000);
    }
    setSubmitting(false);
  };

  // ━━━ レポート ━━━
  const [reportMode, setReportMode] = useState<"week" | "month">("week");
  const [reportWeekOffset, setReportWeekOffset] = useState(0); // 0=今週, -1=先週
  const [reportMonthOffset, setReportMonthOffset] = useState(0);
  const [reportRecords, setReportRecords] = useState<ReportRecord[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedReportDay, setSelectedReportDay] = useState<string | null>(null);

  const fmtLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const getWeekRange = (offset: number) => {
    const now = new Date();
    const localDay = now.getDay(); // 0=日, 1=月, ..., 6=土
    const daysSinceMonday = (localDay + 6) % 7; // 月=0, 火=1, ..., 日=6
    // new Date(y, m, d) はローカル日時のため UTC変換なし
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday + offset * 7);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { from: fmtLocal(monday), to: fmtLocal(sunday) };
  };

  const getYearRange = (offset: number) => {
    const y = new Date().getFullYear() + offset;
    const first = new Date(y, 0, 1);
    const last = new Date(y, 11, 31);
    return { from: fmtLocal(first), to: fmtLocal(last), year: y };
  };

  const fetchReport = async (from: string, to: string) => {
    setReportLoading(true);
    const res = await fetch(`/api/admin/report?from=${from}&to=${to}`);
    const data = await res.json();
    setReportRecords(data.records ?? []);
    setReportLoading(false);
  };

  useEffect(() => {
    if (tab !== "report") return;
    setSelectedReportDay(null);
    if (reportMode === "week") {
      const { from, to } = getWeekRange(reportWeekOffset);
      fetchReport(from, to);
    } else {
      const { from, to } = getYearRange(reportMonthOffset);
      fetchReport(from, to);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, reportMode, reportWeekOffset, reportMonthOffset]);

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

  const isFutureDate = lessonDate > fmtLocal(new Date());

  if (loading) return <div className={styles.admin}><p>読み込み中...</p></div>;
  if (!isAdmin) return <div className={styles.unauthorized}>管理者のみアクセスできます</div>;

  return (
    <div className={styles.admin}>
      <div className={styles.stickyTop}>
        <h1 className={styles.title}>管理画面</h1>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "attendance" ? styles.active : ""}`} onClick={() => changeTab("attendance")}>出席記録</button>
          <button className={`${styles.tab} ${tab === "ledger" ? styles.active : ""}`} onClick={() => changeTab("ledger")}>出席簿</button>
          <button className={`${styles.tab} ${tab === "users" ? styles.active : ""}`} onClick={() => changeTab("users")}>会員管理</button>
          <button className={`${styles.tab} ${tab === "report" ? styles.active : ""}`} onClick={() => changeTab("report")}>レポート</button>
          <button className={`${styles.tab} ${tab === "notices" ? styles.active : ""}`} onClick={() => changeTab("notices")}>お知らせ</button>
          <button className={`${styles.tab} ${tab === "message" ? styles.active : ""}`} onClick={() => changeTab("message")}>メッセージ</button>
        </div>
      </div>

      <div className={styles.scrollArea}>
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
                  const newDate = e.target.value;
                  setLessonDate(newDate);
                  setSelectedLesson(null);
                  setSelectedUserIds([]);
                  setFeePreviews([]);
                  const isHoliday = Holiday.isHoliday(new Date(newDate + "T00:00:00"));
                  setLessonType(isHoliday ? "祝日" : "通常");
                  setAttendedIds([]);
                }}
              />
              {(() => {
                const d = new Date(lessonDate + "T00:00:00");
                const dow = d.getDay();
                const holiday = Holiday.isHoliday(d) ? Holiday.between(d, d)[0]?.name : null;
                const cls = holiday ? styles.lessonDowHoliday : dow === 0 ? styles.lessonDowSun : dow === 6 ? styles.lessonDowSat : styles.lessonDow;
                return <span className={cls}>{"日月火水木金土"[dow]}曜日{holiday ? `（${holiday}）` : ""}</span>;
              })()}
              {isFutureDate && <p className={styles.alertMsg}>未来の日付は記録できません</p>}
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>レッスン種別</label>
              <select className={styles.formSelect} value={lessonType} onChange={(e) => {
                setLessonType(e.target.value);
                setSelectedLesson(null);
                setSelectedUserIds([]);
                setFeePreviews([]);
                setLessonCounts({});
              }}>
                <option value="通常">通常レッスン</option>
                <option value="祝日">祝日レッスン</option>
                <option value="個人">個人レッスン</option>
              </select>
            </div>
            {lessonType === "個人" && (
              <div className={styles.formRow}>
                <label className={styles.formLabel}>個人レッスン時間</label>
                <select
                  className={styles.formSelect}
                  value={privateMinutes}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setPrivateMinutes(m);
                    if (selectedUserIds.length > 0) {
                      fetchFeePreviews(selectedUserIds, lessonDate, lessonType, m);
                    }
                  }}
                >
                  {[15, 30, 45, 60, 75, 90, 105, 120].map((m) => (
                    <option key={m} value={m}>{m}分（¥{(2500 * m / 15).toLocaleString()}）</option>
                  ))}
                </select>
              </div>
            )}
            {lessonType === "祝日" && (
              <div className={styles.formRow}>
                <label className={styles.formLabel}>レッスンを選択</label>
                <div className={styles.lessonGrid}>
                  {["特別レッスン", "バレエ", "ポワント", "モダン", "プレモダン"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.lessonBtn} ${holidayLessonType === t ? styles.lessonBtnActive : ""}`}
                      onClick={() => {
                        setHolidayLessonType(t);
                        setSelectedUserIds([]);
                        setFeePreviews([]);
                        const fromHistory = attendanceMonthData
                          .filter(r => r.lesson_date === lessonDate && r.lesson_title === t)
                          .map(r => r.student_id);
                        const fromJustRecorded = justRecordedMap[`${lessonDate}__null__${t}`] ?? [];
                        setAttendedIds([...new Set<number>([...fromHistory, ...fromJustRecorded])]);
                      }}
                    >
                      <span className={styles.lessonBtnTitle}>{t}</span>
                    </button>
                  ))}
                </div>
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
                          setSelectedUserIds([]);
                          setFeePreviews([]);
                          const lessonTimeStr = `${l.start}〜${l.end}`;
                          const fromHistory = attendanceMonthData
                            .filter(r => r.lesson_date === lessonDate && r.lesson_time === lessonTimeStr && r.lesson_title === l.title)
                            .map(r => r.student_id);
                          const fromJustRecorded = justRecordedMap[`${lessonDate}__${lessonTimeStr}__${l.title}`] ?? [];
                          setAttendedIds([...new Set<number>([...fromHistory, ...fromJustRecorded])]);
                          // lessonCounts: 全期間マップから即時取得
                          setLessonCounts(allLessonCountsMap[`${lessonTimeStr}__${l.title}`] ?? {});
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
                {users
                  .filter((u) => !attendedIds.includes(u.id))
                  .sort((a, b) => (lessonCounts[b.id] ?? 0) - (lessonCounts[a.id] ?? 0))
                  .map((u) => (
                  <div
                    key={u.id}
                    className={`${styles.studentItem} ${selectedUserIds.includes(u.id) ? styles.selected : ""}`}
                    onClick={() => {
                      const next = lessonType === "個人"
                        ? (selectedUserIds.includes(u.id) ? [] : [u.id])
                        : selectedUserIds.includes(u.id)
                          ? selectedUserIds.filter((id) => id !== u.id)
                          : [...selectedUserIds, u.id];
                      setSelectedUserIds(next);
                      setAttendanceError(null);
                      const lessonTitle = lessonType === "祝日" ? holidayLessonType : selectedLesson?.title;
                      const timeStart = selectedLesson?.start ?? null;
                      if (lessonType !== "通常" || selectedLesson) {
                        // クライアント側で即座に計算（APIコールなし）
                        const previews = next.map((id) => {
                          const usr = users.find((u) => u.id === id);
                          const fee = calcClientFee(id, lessonDate, lessonType, lessonTitle, timeStart, privateMinutes);
                          return { userId: id, name: usr?.name ?? "名前なし", line_picture_url: usr?.line_picture_url ?? null, ...fee };
                        });
                        setFeePreviews(previews);
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
            {attendanceError && <p className={styles.errorMsg}>{attendanceError}</p>}
            <button className={styles.submitBtn} onClick={handleAttendance} disabled={isFutureDate || submitting}>
              {submitting ? "記録中..." : "記録する"}
            </button>
          </div>
        </div>
      )}

      {/* ━━━ 出席簿 ━━━ */}
      {tab === "ledger" && (
        <div className={styles.section}>
          <div className={styles.calendarNavRow}>
            <button
              className={styles.calendarTodayBtn}
              onClick={() => {
                const today = new Date().toISOString().slice(0, 7);
                setLedgerMonth(today);
                fetchLedger(today);
                setLedgerDate(null);
              }}
            >Today</button>
            <div className={styles.calendarNav}>
              <button className={styles.calendarNavBtn} onClick={() => {
                const d = new Date(`${ledgerMonth}-01`);
                d.setMonth(d.getMonth() - 1);
                setLedgerMonth(d.toISOString().slice(0, 7));
              }}>◀</button>
              <span className={styles.calendarNavMonth}>{ledgerMonth.split("-").map(Number).join("年")}月</span>
              <button className={styles.calendarNavBtn} onClick={() => {
                const d = new Date(`${ledgerMonth}-01`);
                d.setMonth(d.getMonth() + 1);
                setLedgerMonth(d.toISOString().slice(0, 7));
              }}>▶</button>
            </div>
          </div>
          {ledgerLoading ? <p className={styles.noLesson}>読み込み中...</p> : (
            <div className={styles.calendarWrapper}>
              <div className={styles.calendarHeader}>
                {["月", "火", "水", "木", "金", "土", "日"].map((d) => (
                  <div key={d} className={styles.calendarDow}>{d}</div>
                ))}
              </div>
              {buildCalendar(ledgerMonth).map((week, wi) => (
                <div key={wi} className={styles.calendarWeek}>
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className={styles.calendarCell} />;
                    const dateStr = `${ledgerMonth}-${String(day).padStart(2, "0")}`;
                    const dateObj = new Date(dateStr + "T00:00:00");
                    const hasRecords = ledgerRecords.some((r) => r.lesson_date === dateStr);
                    const isSelected = ledgerDate === dateStr;
                    const isToday = dateStr === new Date().toISOString().split("T")[0];
                    const dowIdx = dateObj.getDay();
                    const holiday = Holiday.isHoliday(dateObj) ? Holiday.between(dateObj, dateObj)[0]?.name : null;
                    const isSun = dowIdx === 0 || !!holiday;
                    const isSat = dowIdx === 6 && !holiday;
                    return (
                      <div
                        key={di}
                        className={`${styles.calendarCell} ${hasRecords ? styles.calendarHasRecord : ""} ${isSelected ? styles.calendarSelected : ""}`}
                        onClick={() => hasRecords && setLedgerDate(isSelected ? null : dateStr)}
                        title={holiday ?? undefined}
                      >
                        <span className={`${styles.calendarDayNum} ${isToday ? styles.calendarTodayNum : ""} ${isSelected ? styles.calendarSelectedNum : hasRecords ? styles.calendarHasRecordNum : isSun ? styles.calendarSunNum : isSat ? styles.calendarSatNum : ""}`}>{day}</span>
                        {hasRecords && <span className={styles.calendarDot} />}
                        {holiday && !hasRecords && <span className={styles.calendarHolidayDot} />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {ledgerDate && (() => {
            const dayRecords = ledgerRecords.filter((r) => r.lesson_date === ledgerDate);
            const total = dayRecords.reduce((sum, r) => sum + r.price_paid, 0);
            const [, m, d] = ledgerDate.split("-");
            const dow = ["日", "月", "火", "水", "木", "金", "土"][new Date(ledgerDate + "T00:00:00").getDay()];

            // lesson_time + lesson_title + lesson_teacher でグループ化
            const groupKey = (r: LedgerRecord) => `${r.lesson_time ?? ""}__${r.lesson_title ?? r.lesson_type}__${r.lesson_teacher ?? ""}`;
            const groups: { key: string; time: string | null; title: string; teacher: string | null; records: typeof dayRecords }[] = [];
            dayRecords.forEach((r) => {
              const k = groupKey(r);
              const g = groups.find((g) => g.key === k);
              if (g) g.records.push(r);
              else groups.push({ key: k, time: r.lesson_time, title: r.lesson_title ?? (LESSON_TYPE_LABEL[r.lesson_type] ?? r.lesson_type), teacher: r.lesson_teacher, records: [r] });
            });

            return (
              <div className={styles.ledgerDetail}>
                <div className={styles.ledgerDetailHeader}>
                  <span>{parseInt(m)}月{parseInt(d)}日（{dow}）</span>
                  <span className={styles.ledgerTotal}>合計 ¥{total.toLocaleString()}</span>
                </div>
                {groups.map((g) => (
                  <div key={g.key} className={styles.ledgerGroup}>
                    <div className={styles.ledgerGroupHeader}>
                      <span className={styles.ledgerGroupInfo}>
                        {g.time && <span className={styles.ledgerGroupTime}>{g.time}</span>}
                        <span>{g.title}</span>
                        {g.teacher && <span className={styles.ledgerGroupTeacher}>{g.teacher}</span>}
                      </span>
                      <span>¥{g.records.reduce((s, r) => s + r.price_paid, 0).toLocaleString()}</span>
                    </div>
                    {g.records.map((r) => (
                      <div key={r.id} className={styles.ledgerRow}>
                        {r.line_picture_url
                          ? <img src={r.line_picture_url} alt="" className={styles.ledgerIcon} />
                          : <div className={styles.ledgerIconPlaceholder}><i className="fa-solid fa-user" /></div>
                        }
                        <span className={styles.ledgerName}>{r.name}</span>
                        <button
                          className={styles.ledgerDeleteBtn}
                          onClick={async () => {
                            if (!confirm(`${r.name} の出席記録を削除しますか？`)) return;
                            // attendedIds・attendanceMonthData を即時更新（出席タブのアイコン復活）
                            setAttendedIds((prev) => prev.filter((id) => id !== r.student_id));
                            setAttendanceMonthData((prev) => prev.filter((a) => a.id !== r.id));
                            await fetch(`/api/admin/attendance/${r.id}`, { method: "DELETE" });
                            fetchLedger(ledgerMonth);
                          }}
                        >削除</button>
                        <span className={styles.ledgerPrice}>¥{r.price_paid.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
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
                <span
                  className={`${styles.badge} ${styles[u.status]} ${styles.badgeClickable}`}
                  onClick={() => setStatusTarget(u)}
                >{u.status}</span>
                <button
                  className={`${styles.adminToggle} ${u.is_admin ? styles.isAdmin : ""}`}
                  onClick={() => handleAdminToggle(u.id, u.is_admin)}
                >
                  {u.is_admin ? "管理者" : "一般"}
                </button>
                <button className={styles.historyBtn} onClick={() => openHistory(u)}>
                  レッスン履歴
                </button>
                <button className={styles.badgeBtn} onClick={() => openBadge(u)}>
                  バッジ
                </button>
                <button className={styles.editBtn} onClick={() => openEdit(u)}>
                  編集
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━━ 履歴モーダル ━━━ */}
      {historyUser && (
        <div className={styles.modalOverlay} onClick={() => setHistoryUser(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {historyUser.line_picture_url ? (
                <img src={historyUser.line_picture_url} alt="" className={styles.modalIcon} />
              ) : (
                <div className={styles.modalIconPlaceholder}><i className="fa-solid fa-user" /></div>
              )}
              <span className={styles.modalName}>{historyUser.name ?? "（名前なし）"}</span>
              <button className={styles.modalClose} onClick={() => setHistoryUser(null)}>✕</button>
            </div>
            <div className={styles.monthNav}>
              <button className={styles.monthNavBtn} onClick={() => changeHistoryMonth(-1)}>‹</button>
              <span className={styles.monthNavLabel}>{historyMonth.split("-").map(Number).join("年")}月</span>
              <button
                className={styles.monthNavBtn}
                onClick={() => changeHistoryMonth(1)}
                disabled={historyMonth >= new Date().toISOString().slice(0, 7)}
              >›</button>
            </div>
            <div className={styles.modalTitleRow}>
              <p className={styles.modalTitle}>{parseInt(historyMonth.split("-")[1])}月レッスン {(() => {
                const count = historyMonthData.reduce((sum, a) => {
                  if (a.lesson_type === "個人") {
                    const mins = a.lesson_time ? parseInt(a.lesson_time) : 15;
                    return sum + (isNaN(mins) ? 1 : mins / 15);
                  }
                  if (a.lesson_title === "ポワント" || a.lesson_title === "プレモダン") return sum + 0.5;
                  return sum + 1;
                }, 0);
                return Number.isInteger(count) ? `${count}回` : `${count}回`;
              })()}</p>
              <p className={styles.modalTotal}>合計 ¥{historyMonthData.reduce((sum, a) => sum + a.price_paid, 0).toLocaleString()}</p>
            </div>
            {historyLoading ? (
              <p className={styles.modalLoading}>読み込み中...</p>
            ) : historyMonthData.length === 0 ? (
              <p className={styles.modalEmpty}>この月の履歴がありません</p>
            ) : (
              <div className={styles.historyList}>
                {historyMonthData.map((a) => (
                  <div key={a.id} className={styles.historyItem}>
                    {a.maintenance_fee > 0 && (
                      <div className={styles.historyRow}>
                        <span className={styles.historyDate}>{a.lesson_date.split("-").slice(1).map(Number).join("/")}</span>
                        <span className={styles.historyTypeMaint}>維持費</span>
                        <span className={styles.historyPrice}>¥{a.maintenance_fee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className={styles.historyRow}>
                      <span className={styles.historyDate}>{a.maintenance_fee > 0 ? "\u00A0" : a.lesson_date.split("-").slice(1).map(Number).join("/")}</span>
                      <span className={styles.historyType}>
                        {a.lesson_title ?? { 通常: "通常レッスン", 祝日: "祝日レッスン", 個人: "個人レッスン", 特別: "特別レッスン" }[a.lesson_type] ?? a.lesson_type}
                        {a.lesson_time && <><br /><span className={styles.historyTime}>{a.lesson_time}</span></>}
                        {a.lesson_teacher && <><br /><span className={styles.historyTeacher}>{a.lesson_teacher}</span></>}
                      </span>
                      <span className={styles.historyPrice}>¥{a.lesson_fee.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ━━━ ステータス選択シート ━━━ */}
      {statusTarget && (
        <div className={styles.modalOverlay} onClick={() => setStatusTarget(null)}>
          <div className={styles.statusSheet} onClick={(e) => e.stopPropagation()}>
            <p className={styles.statusSheetTitle}>{statusTarget.name} のステータスを変更</p>
            {["trial", "member", "teacher"].map((s) => (
              <button
                key={s}
                className={`${styles.statusSheetBtn} ${statusTarget.status === s ? s === "teacher" ? styles.statusSheetBtnTeacher : s === "trial" ? styles.statusSheetBtnTrial : styles.statusSheetBtnActive : ""}`}
                onClick={() => {
                  if (s !== statusTarget.status) handleStatusChange(statusTarget.id, s, statusTarget.status);
                  setStatusTarget(null);
                }}
              >{s}</button>
            ))}
            <button className={styles.statusSheetCancel} onClick={() => setStatusTarget(null)}>キャンセル</button>
          </div>
        </div>
      )}

      {/* ━━━ 名前編集モーダル ━━━ */}
      {editUser && (
        <div className={styles.modalOverlay} onClick={() => setEditUser(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {editUser.line_picture_url
                ? <img src={editUser.line_picture_url} alt="" className={styles.modalIcon} />
                : <div className={styles.modalIconPlaceholder}><i className="fa-solid fa-user" /></div>
              }
              <span className={styles.modalName}>{editUser.name ?? "（名前なし）"}</span>
              <button className={styles.modalClose} onClick={() => setEditUser(null)}>✕</button>
            </div>
            <div className={styles.editForm}>
              <div className={styles.editRow}>
                <label className={styles.editLabel}>姓</label>
                <input className={styles.editInput} value={editLastName} onChange={(e) => setEditLastName(e.target.value)} placeholder="姓" />
              </div>
              <div className={styles.editRow}>
                <label className={styles.editLabel}>名</label>
                <input className={styles.editInput} value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} placeholder="名" />
              </div>
              <button className={styles.editSaveBtn} onClick={handleSaveName} disabled={editSaving}>
                {editSaving ? "保存中..." : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━ バッジモーダル ━━━ */}
      {badgeUser && (
        <div className={styles.modalOverlay} onClick={() => setBadgeUser(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {badgeUser.line_picture_url
                ? <img src={badgeUser.line_picture_url} alt="" className={styles.modalIcon} />
                : <div className={styles.modalIconPlaceholder}><i className="fa-solid fa-user" /></div>
              }
              <span className={styles.modalName}>{badgeUser.name ?? "（名前なし）"}</span>
              <button className={styles.modalClose} onClick={() => setBadgeUser(null)}>✕</button>
            </div>
            {badgeLoading ? (
              <p className={styles.modalLoading}>読み込み中...</p>
            ) : (
              <>
                <div className={styles.monthNav}>
                  <button
                    className={styles.monthNavBtn}
                    onClick={() => setBadgeYear((y) => y - 1)}
                    disabled={badgeYear <= getBadgeMinYear()}
                  >‹</button>
                  <span className={styles.monthNavLabel}>{badgeYear}年</span>
                  <button
                    className={styles.monthNavBtn}
                    onClick={() => setBadgeYear((y) => y + 1)}
                    disabled={badgeYear >= new Date().getFullYear()}
                  >›</button>
                </div>
                <div className={styles.badgeMonthGrid}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => {
                    const ym = `${badgeYear}-${String(m).padStart(2, "0")}`;
                    const b = badgeData.find((b) => b.year_month === ym);
                    return (
                      <div key={m} className={styles.badgeCell}>
                        {b ? (
                          <img
                            src={`/images/badges/badge-${b.badge}.png`}
                            alt={b.badge}
                            className={styles.badgeIconImg}
                          />
                        ) : (
                          <span className={styles.badgeEmptyMonth}>{m}月</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ━━━ レポート ━━━ */}
      {tab === "report" && (() => {
        const isWeek = reportMode === "week";
        const weekRange = isWeek ? getWeekRange(reportWeekOffset) : null;
        const yearRange = !isWeek ? getYearRange(reportMonthOffset) : null;
        const { from, to } = isWeek ? weekRange! : yearRange!;
        const reportYear = yearRange?.year ?? new Date().getFullYear();

        // 週間：日付リスト生成
        const dates: string[] = [];
        if (isWeek) {
          const [fy, fm, fd] = from.split("-").map(Number);
          const [ty, tm, td] = to.split("-").map(Number);
          const cur = new Date(fy, fm - 1, fd);
          const end = new Date(ty, tm - 1, td);
          while (cur <= end) { dates.push(fmtLocal(cur)); cur.setDate(cur.getDate() + 1); }
        }

        // 月間：月別売上
        const monthlySales: Record<string, number> = {};
        for (let m = 1; m <= 12; m++) monthlySales[`${reportYear}-${String(m).padStart(2, "0")}`] = 0;

        // 週間：日別売上
        const dailySales: Record<string, number> = {};
        dates.forEach((d) => { dailySales[d] = 0; });

        reportRecords.forEach((r) => {
          if (isWeek) {
            if (dailySales[r.lesson_date] !== undefined) dailySales[r.lesson_date] += r.price_paid;
          } else {
            const ym = r.lesson_date.slice(0, 7);
            if (monthlySales[ym] !== undefined) monthlySales[ym] += r.price_paid;
          }
        });

        const barValues = isWeek ? Object.values(dailySales) : Object.values(monthlySales);
        const maxSales = Math.max(...barValues, 1);
        const totalSales = barValues.reduce((s, v) => s + v, 0);

        // 選択中の集計値
        const selectedSales = selectedReportDay
          ? isWeek
            ? (dailySales[selectedReportDay] ?? 0)
            : (monthlySales[selectedReportDay] ?? 0)
          : null;

        // ナビゲーションラベル
        const navLabel = isWeek
          ? `${from.slice(5).split("-").map(Number).join("/")} - ${to.slice(5).split("-").map(Number).join("/")}`
          : `${reportYear}年`;

        // レッスンごとにグループ化
        type LessonGroup = { key: string; date: string; time: string | null; title: string | null; teacher: string | null; attendees: { name: string | null; pic: string | null }[] };
        const lessonMap: Map<string, LessonGroup> = new Map();
        reportRecords.forEach((r) => {
          const key = `${r.lesson_date}__${r.lesson_time ?? ""}__${r.lesson_title ?? ""}`;
          if (!lessonMap.has(key)) {
            lessonMap.set(key, { key, date: r.lesson_date, time: r.lesson_time, title: r.lesson_title, teacher: r.lesson_teacher, attendees: [] });
          }
          lessonMap.get(key)!.attendees.push({ name: r.users?.name ?? null, pic: r.users?.line_picture_url ?? null });
        });
        const lessonGroups = Array.from(lessonMap.values()).sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (a.time ?? "").localeCompare(b.time ?? "");
        });

        const youbi = ["日", "月", "火", "水", "木", "金", "土"];

        return (
          <div className={styles.section}>
            {/* 週/月 切り替え */}
            <div className={styles.reportModeToggle}>
              <button className={`${styles.reportModeBtn} ${isWeek ? styles.reportModeBtnActive : ""}`} onClick={() => setReportMode("week")}>週間</button>
              <button className={`${styles.reportModeBtn} ${!isWeek ? styles.reportModeBtnActive : ""}`} onClick={() => setReportMode("month")}>月間</button>
            </div>

            {/* ナビゲーション */}
            <div className={styles.reportNav}>
              <button className={styles.reportNavBtn} onClick={() => isWeek ? setReportWeekOffset((o) => o - 1) : setReportMonthOffset((o) => o - 1)}>‹</button>
              <span className={styles.reportNavLabel}>{navLabel}</span>
              <button
                className={styles.reportNavBtn}
                onClick={() => isWeek ? setReportWeekOffset((o) => o + 1) : setReportMonthOffset((o) => o + 1)}
                disabled={isWeek ? reportWeekOffset >= 0 : reportMonthOffset >= 0}
              >›</button>
            </div>

            {/* 合計 */}
            <p className={styles.reportTotal}>
              ¥{(selectedSales !== null ? selectedSales : totalSales).toLocaleString()}
            </p>

            {/* バーグラフ */}
            {reportLoading ? (
              <p className={styles.modalLoading}>読み込み中...</p>
            ) : (
              <>
                <div className={styles.reportChart}>
                  {isWeek ? dates.map((d) => {
                    const val = dailySales[d] ?? 0;
                    const pct = maxSales > 0 ? (val / maxSales) * 100 : 0;
                    const [dy, dmm, dd] = d.split("-").map(Number);
                    const dt = new Date(dy, dmm - 1, dd);
                    const dow = dt.getDay();
                    return (
                      <div key={d} className={styles.reportBar} onClick={() => val > 0 && setSelectedReportDay(selectedReportDay === d ? null : d)}>
                        <div className={styles.reportBarTrack}>
                          <div className={`${styles.reportBarFill} ${selectedReportDay === d ? styles.reportBarFillActive : ""}`} style={{ height: `${pct}%` }} />
                        </div>
                        <span className={`${styles.reportBarLabel} ${dow === 0 ? styles.reportBarSun : dow === 6 ? styles.reportBarSat : ""}`}>
                          <span className={styles.reportBarDow}>{youbi[dow]}</span><br />{dt.getDate()}
                        </span>
                      </div>
                    );
                  }) : [1,2,3,4,5,6,7,8,9,10,11,12].map((m) => {
                    const ym = `${reportYear}-${String(m).padStart(2, "0")}`;
                    const val = monthlySales[ym] ?? 0;
                    const pct = maxSales > 0 ? (val / maxSales) * 100 : 0;
                    return (
                      <div key={ym} className={styles.reportBar} onClick={() => val > 0 && setSelectedReportDay(selectedReportDay === ym ? null : ym)}>
                        <div className={styles.reportBarTrack}>
                          <div className={`${styles.reportBarFill} ${selectedReportDay === ym ? styles.reportBarFillActive : ""}`} style={{ height: `${pct}%` }} />
                        </div>
                        <span className={styles.reportBarLabel}>{m}月</span>
                      </div>
                    );
                  })}
                </div>

                {/* 日付ごとにグループ化して表示 */}
                <div className={styles.reportLessons}>
                  {lessonGroups.length === 0 ? (
                    <p className={styles.modalEmpty}>この期間のデータがありません</p>
                  ) : (() => {
                    // 日付でまとめる（selectedReportDayでフィルタ）
                    const filteredGroups = selectedReportDay
                      ? lessonGroups.filter((g) => isWeek ? g.date === selectedReportDay : g.date.startsWith(selectedReportDay))
                      : lessonGroups;
                    const dateGroups: { date: string; lessons: typeof lessonGroups }[] = [];
                    filteredGroups.forEach((g) => {
                      const existing = dateGroups.find((dg) => dg.date === g.date);
                      if (existing) existing.lessons.push(g);
                      else dateGroups.push({ date: g.date, lessons: [g] });
                    });
                    return dateGroups.length === 0
                      ? <p key="empty" className={styles.modalEmpty}>この日のデータがありません</p>
                      : dateGroups.map((dg) => {
                        const [dgy, dgm, dgd] = dg.date.split("-").map(Number);
                        const dt = new Date(dgy, dgm - 1, dgd);
                        const dateLabel = `${dgm}/${dgd} (${youbi[dt.getDay()]})`;
                        const daySales = dg.lessons.reduce((s, g) => s + g.attendees.length, 0);
                        const daySalesAmt = isWeek
                          ? (dailySales[dg.date] ?? 0)
                          : (monthlySales[dg.date.slice(0, 7)] ?? 0);
                        return (
                          <div key={dg.date} className={styles.reportDayGroup}>
                            <div className={styles.reportDayLabel}>
                              <span>{dateLabel}</span>
                              <span className={styles.reportDaySales}>¥{daySalesAmt.toLocaleString()}</span>
                            </div>
                            {dg.lessons.map((g) => (
                              <div key={g.key} className={styles.reportLesson}>
                                <div className={styles.reportLessonHeader}>
                                  {g.time && <span className={styles.reportLessonTime}>{g.time}</span>}
                                  <span className={styles.reportLessonTitle}>{g.title ?? "レッスン"}</span>
                                  {g.teacher && <span className={styles.reportLessonTeacher}>{g.teacher}</span>}
                                  <span className={styles.reportLessonCount}>{g.attendees.length}人</span>
                                </div>
                                <div className={styles.reportAttendees}>
                                  {g.attendees.map((a, i) => (
                                    <div key={i} className={styles.reportAttendee}>
                                      {a.pic
                                        ? <img src={a.pic} alt="" className={styles.reportAttendeePic} />
                                        : <div className={styles.reportAttendeeIcon}><i className="fa-solid fa-user" /></div>
                                      }
                                      <span className={styles.reportAttendeeName}>{a.name ?? "?"}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      });
                  })()}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ━━━ お知らせ管理 ━━━ */}
      {tab === "notices" && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>お知らせを投稿する</p>
          <div className={styles.noticeForm}>
            <textarea
              className={styles.noticeTextarea}
              placeholder="お知らせ内容を入力してください"
              value={noticeBody}
              onChange={(e) => setNoticeBody(e.target.value)}
              rows={4}
            />
            <button
              className={styles.noticePostBtn}
              onClick={handlePostNotice}
              disabled={noticeSending || !noticeBody.trim()}
            >
              {noticeSending ? "投稿中..." : "投稿する"}
            </button>
            {noticeMsg && <p className={styles.noticeMsg}>{noticeMsg}</p>}
          </div>

          <p className={styles.sectionTitle} style={{ marginTop: 24 }}>投稿済みのお知らせ</p>
          <input
            type="text"
            className={styles.noticeSearchInput}
            placeholder="タイトル・本文で検索"
            value={noticeSearch}
            onChange={(e) => { setNoticeSearch(e.target.value); setNoticePage(1); }}
          />
          {(() => {
            const filtered = notices.filter((n) =>
              n.body.includes(noticeSearch)
            );
            const totalPages = Math.ceil(filtered.length / NOTICES_PER_PAGE);
            const paged = filtered.slice((noticePage - 1) * NOTICES_PER_PAGE, noticePage * NOTICES_PER_PAGE);
            return filtered.length === 0 ? (
              <p className={styles.empty}>お知らせはありません</p>
            ) : (
              <>
                {paged.map((n) => (
                  <div key={n.id} className={styles.noticeItem}>
                    <div className={styles.noticeItemHeader}>
                      <div>
                          <p className={styles.noticeItemMeta}>
                          {n.author && <span>{n.author}　</span>}
                          {new Date(n.created_at).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <button className={styles.noticeDeleteBtn} onClick={() => handleDeleteNotice(n.id)}>削除</button>
                    </div>
                    <p className={styles.noticeItemBody}>{n.body}</p>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className={styles.noticePager}>
                    <button className={styles.noticePagerBtn} onClick={() => setNoticePage((p) => p - 1)} disabled={noticePage <= 1}>‹</button>
                    <span className={styles.noticePagerLabel}>{noticePage} / {totalPages}</span>
                    <button className={styles.noticePagerBtn} onClick={() => setNoticePage((p) => p + 1)} disabled={noticePage >= totalPages}>›</button>
                  </div>
                )}
              </>
            );
          })()}
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

      {/* ━━━ トースト通知 ━━━ */}
      {toast && (
        <div className={styles.toast}>
          {toast.split("\n").map((line, i) => (
            <span key={i} className={i === 0 ? styles.toastMain : styles.toastSub}>{line}</span>
          ))}
        </div>
      )}
    </div>
  );
}
