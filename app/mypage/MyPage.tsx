"use client";

import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent } from "react";
import liff from "@line/liff";
import styles from "./mypage.module.css";

function NoticeItem({ n }: { n: { id: number; title: string; body: string; author: string | null; created_at: string } }) {
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isNew = Date.now() - new Date(n.created_at).getTime() < 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (bodyRef.current) {
      setOverflows(bodyRef.current.scrollHeight > bodyRef.current.clientHeight + 1);
    }
  }, []);

  return (
    <div className={styles.noticeItem}>
      <div className={styles.noticeDateRow}>
        <p className={styles.noticeDate}>
          {new Date(n.created_at).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
          {n.author && <span className={styles.noticeAuthor}>　{n.author}</span>}
        </p>
        {isNew && <span className={styles.noticeBadgeNew}>NEW</span>}
      </div>
      <p ref={bodyRef} className={`${styles.noticeBody} ${expanded ? "" : styles.noticeBodyClamped}`}>{n.body}</p>
      {(overflows || expanded) && (
        <button className={styles.noticeToggle} onClick={() => setExpanded(!expanded)}>
          {expanded ? "閉じる ▲" : "全文を表示 ▼"}
        </button>
      )}
    </div>
  );
}

type UserInfo = {
  id: number;
  name: string | null;
  line_display_name: string | null;
  line_picture_url: string | null;
  mypage_picture_url: string | null;
  mypage_name: string | null;
  status: string;
};

type NextBadge = { badge: string; label: string; remaining: number; isContinuation: boolean };

type Notice = { id: number; title: string; body: string; author: string | null; created_at: string };

type Attendance = {
  id: number;
  lesson_date: string;
  lesson_type: string;
  lesson_title: string | null;
  lesson_time: string | null;
  lesson_teacher: string | null;
  price_paid: number;
  maintenance_fee: number;
  lesson_fee: number;
};

type BadgeRecord = { year_month: string; badge: string };

const BADGE_LABEL: Record<string, string> = {
  normal: "ノーマル", bronze: "ブロンズ", silver: "シルバー",
  gold: "ゴールド", platinum: "プラチナ", diamond: "ダイヤモンド",
};

export default function MyPage() {
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<UserInfo | null>(null);
  const [currentBadge, setCurrentBadge] = useState<string | null>(null);
  const [lastMonthBadge, setLastMonthBadge] = useState<string | null>(null);
  const [nextBadge, setNextBadge] = useState<NextBadge | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showBadgeInfo, setShowBadgeInfo] = useState(false);
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const [popupBadge, setPopupBadge] = useState<string | null>(null);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lineUserId) return;
    const ext = file.name.split(".").pop();
    const path = `${lineUserId}-${Date.now()}.${ext}`;
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { console.error(uploadError); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await fetch("/api/mypage/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineUserId, mypage_picture_url: publicUrl }),
    });
    setUser((prev) => prev ? { ...prev, mypage_picture_url: publicUrl } : prev);
    e.target.value = "";
  };

  const handleNameSave = async () => {
    if (!lineUserId || !editName.trim()) return;
    setNameSaving(true);
    await fetch("/api/mypage/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineUserId, mypage_name: editName.trim() }),
    });
    setUser((prev) => prev ? { ...prev, mypage_name: editName.trim() } : prev);
    setNameSaving(false);
    setShowNameEdit(false);
  };

  // レッスン履歴
  const [historyData, setHistoryData] = useState<Attendance[]>([]);
  const [historyMode, setHistoryMode] = useState<"month" | "year">("month");
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // バッジ履歴
  const [badgeData, setBadgeData] = useState<BadgeRecord[]>([]);
  const [badgeYear, setBadgeYear] = useState(new Date().getFullYear());

  // タブ
  const [tab, setTab] = useState<"notices" | "history" | "badges">("notices");

  // LIFF初期化
  useEffect(() => {
    const init = async () => {
      try {
        if (process.env.NODE_ENV !== "production") {
          setLineUserId("debug");
          setDisplayName("テストユーザー");
          setLoading(false);
          return;
        }

        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) { setError("LIFF設定エラー"); setLoading(false); return; }

        await liff.init({ liffId });
        if (!liff.isLoggedIn()) { liff.login(); return; }

        const p = await liff.getProfile();
        setLineUserId(p.userId);
        setDisplayName(p.displayName);
      } catch (e) {
        console.error(e);
        setError("LINEログインに失敗しました");
      } finally {
        setLoading(false);
      }
    };
    try { init(); } catch (e) { console.error(e); setLoading(false); }
  }, []);

  // ユーザー情報取得
  useEffect(() => {
    if (!lineUserId) return;
    fetch(`/api/mypage/me?lineUserId=${lineUserId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        setCurrentBadge(data.currentBadge ?? null);
        setLastMonthBadge(data.lastMonthBadge ?? null);
        setNextBadge(data.nextBadge ?? null);
        setHistoryData(data.attendanceHistory ?? []);
        setBadgeData(data.badgeHistory ?? []);

        // バッジ獲得ポップアップの表示判定
        const lastBadge: string | null = data.lastMonthBadge ?? null;
        if (lastBadge && data.user) {
          const userId: number = data.user.id;
          const now = new Date();
          const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const storageKey = `badge_popup_${userId}_${yearMonth}`;
          const shouldShow = !localStorage.getItem(storageKey);
          if (shouldShow) {
            setPopupBadge(lastBadge);
            setShowBadgePopup(true);
            localStorage.setItem(storageKey, "1");
          }
        }
      });
  }, [lineUserId]);

  // お知らせ取得
  const fetchNotices = () => {
    fetch("/api/mypage/notices", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setNotices(data.notices ?? []));
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    if (tab !== "notices") return;
    const id = setInterval(fetchNotices, 10000);
    return () => clearInterval(id);
  }, [tab]);


  const historyMonthData = historyData.filter((a) => a.lesson_date.startsWith(historyMonth));

  const changeHistoryMonth = (delta: number) => {
    const [y, m] = historyMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setHistoryMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const calcCount = (items: Attendance[]): number => {
    return items.reduce((sum, a) => {
      if (a.lesson_type === "個人") {
        const mins = a.lesson_time ? parseInt(a.lesson_time) : 15;
        return sum + (isNaN(mins) ? 1 : mins / 15);
      }
      if (a.lesson_title === "ポワント" || a.lesson_title === "プレモダン") return sum + 0.5;
      return sum + 1;
    }, 0);
  };

  const fmtCount = (n: number): string => {
    return Number.isInteger(n) ? `${n}回` : `${n}回`;
  };

  const getHistoryMinYear = () => {
    if (historyData.length === 0) return new Date().getFullYear();
    return parseInt(historyData[historyData.length - 1].lesson_date.slice(0, 4));
  };

  const toggleMonth = (ym: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(ym)) next.delete(ym); else next.add(ym);
      return next;
    });
  };

  const getBadgeMinYear = () => {
    if (badgeData.length === 0) return new Date().getFullYear();
    return parseInt(badgeData[0].year_month.slice(0, 4));
  };

  const fmtDate = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    const dow = ["日", "月", "火", "水", "木", "金", "土"][new Date(y, m - 1, d).getDay()];
    return `${m}/${d} (${dow})`;
  };

  if (loading) return <main className={styles.mypage}><p className={styles.loading}>読み込み中...</p></main>;
  if (error) return <main className={styles.mypage}><p className={styles.errorMsg}>{error}</p></main>;

  const name = user?.name ?? displayName ?? "ゲスト";
  const displayedName = user?.mypage_name ?? name;
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <main className={styles.mypage}>
      <div className={styles.stickyTop}>
      {/* ━━━ ヘッダー ━━━ */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.avatarBtn} onClick={handleAvatarClick}>
            {(user?.mypage_picture_url ?? user?.line_picture_url)
              ? <img src={user.mypage_picture_url ?? user.line_picture_url!} alt="" className={styles.avatar} />
              : <div className={styles.avatarPlaceholder}><i className="fa-solid fa-user" /></div>
            }
            <span className={styles.avatarEditIcon}>✎</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          <div className={styles.headerInfo}>
            <p className={styles.headerName}>
              <button className={styles.nameEditBtn} onClick={() => { setEditName(user?.mypage_name ?? name); setShowNameEdit(true); }}>
                <span className={styles.headerNameText}>{user?.mypage_name ?? name}</span>さん ✎
              </button>
            </p>
          </div>
        </div>
        {user && (
          <button className={styles.headerBadge} onClick={() => setShowBadgeInfo(true)}>
            <img
              src={`/images/badges/badge-${lastMonthBadge ?? "normal"}.png`}
              alt={lastMonthBadge ?? "normal"}
              className={styles.headerBadgeImg}
            />
            <p className={styles.headerBadgeLabel}>{BADGE_LABEL[lastMonthBadge ?? "normal"]}</p>
          </button>
        )}
      </div>

      {/* ━━━ 次のバッジまで ━━━ */}
      {nextBadge && nextBadge.remaining > 0 && (
        <div className={styles.nextBadge}>
          <img src={`/images/badges/badge-${nextBadge.badge}.png`} alt="" className={styles.nextBadgeImg} />
          <p className={styles.nextBadgeText}>
            あと<span className={styles.nextBadgeNum}>{nextBadge.remaining}</span>回で
            {nextBadge.isContinuation
              ? <><span className={styles.nextBadgeName}>{nextBadge.label}バッジ</span>継続！</>
              : <><span className={styles.nextBadgeName}>{nextBadge.label}バッジ</span>獲得！</>
            }
          </p>
        </div>
      )}
      {!nextBadge && currentBadge === "diamond" && (
        <div className={styles.nextBadge}>
          <img src="/images/badges/badge-diamond.png" alt="" className={styles.nextBadgeImg} />
          <p className={styles.nextBadgeText}>
            すごい🤩<span className={styles.nextBadgeName}>ダイヤモンド達成！</span>最高ランクです✨
          </p>
        </div>
      )}

      {/* ━━━ 名前編集モーダル ━━━ */}
      {showNameEdit && (
        <div className={styles.badgeInfoOverlay} onClick={() => setShowNameEdit(false)}>
          <div className={styles.badgeInfoModal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.badgeInfoTitle}>名前を変更</p>
            <input
              type="text"
              className={styles.nameEditInput}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="表示名を入力"
            />
            <button className={styles.badgeInfoClose} onClick={handleNameSave} disabled={nameSaving || !editName.trim()}>
              {nameSaving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      )}

      {/* ━━━ バッジ説明モーダル ━━━ */}
      {showBadgeInfo && (
        <div className={styles.badgeInfoOverlay} onClick={() => setShowBadgeInfo(false)}>
          <div className={styles.badgeInfoModal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.badgeInfoTitle}>バッジの仕組み</p>
            <div className={styles.badgeInfoList}>
              {[
                { badge: "normal",   label: "ノーマル",   count: "月0回以上" },
                { badge: "bronze",   label: "ブロンズ",   count: "月4回以上" },
                { badge: "silver",   label: "シルバー",   count: "月8回以上" },
                { badge: "gold",     label: "ゴールド",   count: "月12回以上" },
                { badge: "platinum", label: "プラチナ",   count: "月20回以上" },
                { badge: "diamond",  label: "ダイヤモンド", count: "月40回以上" },
              ].map((b) => (
                <div key={b.badge} className={styles.badgeInfoRow}>
                  <img src={`/images/badges/badge-${b.badge}.png`} alt={b.label} className={styles.badgeInfoImg} />
                  <span className={styles.badgeInfoLabel}>{b.label}</span>
                  <span className={styles.badgeInfoCount}>{b.count}</span>
                </div>
              ))}
            </div>
            <button className={styles.badgeInfoClose} onClick={() => setShowBadgeInfo(false)}>閉じる</button>
          </div>
        </div>
      )}

      {/* ━━━ バッジ獲得ポップアップ ━━━ */}
      {showBadgePopup && popupBadge && (
        <div className={styles.badgePopupOverlay} onClick={() => setShowBadgePopup(false)}>
          <div className={styles.badgePopup} onClick={(e) => e.stopPropagation()}>
            {/* コンフェティ */}
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className={styles.confetti} style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.2}s`,
                animationDuration: `${1.2 + Math.random() * 1}s`,
                background: ["#e05080","#0090e8","#ffd700","#7ed957","#ff914d","#c77dff"][i % 6],
                transform: `rotate(${Math.random() * 360}deg)`,
              }} />
            ))}
            <p className={styles.badgePopupTitle}>🎉 {new Date().getMonth() === 0 ? 12 : new Date().getMonth()}月のバッジを獲得しました！</p>
            <img
              src={`/images/badges/badge-${popupBadge}.png`}
              alt={popupBadge}
              className={styles.badgePopupImg}
            />
            <p className={styles.badgePopupName}>{BADGE_LABEL[popupBadge]}バッジ</p>
            <button className={styles.badgePopupClose} onClick={() => setShowBadgePopup(false)}>
              やったー！
            </button>
          </div>
        </div>
      )}

      {/* ━━━ タブ ━━━ */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "notices" ? styles.active : ""}`} onClick={() => setTab("notices")}>お知らせ</button>
        <button className={`${styles.tab} ${tab === "history" ? styles.active : ""}`} onClick={() => setTab("history")}>レッスン履歴</button>
        <button className={`${styles.tab} ${tab === "badges" ? styles.active : ""}`} onClick={() => setTab("badges")}>マイバッジ</button>
      </div>
      </div>

      <div className={`${styles.scrollArea} ${tab === "badges" ? styles.scrollAreaFit : ""}`}>
      {/* ━━━ お知らせ ━━━ */}
      {tab === "notices" && (
        <div className={styles.section}>
          {notices.length === 0 ? (
            <p className={styles.empty}>お知らせはありません</p>
          ) : notices.map((n) => <NoticeItem key={n.id} n={n} />)}
        </div>
      )}

      {/* ━━━ レッスン履歴 ━━━ */}
      {tab === "history" && (
        <div className={styles.section}>
          {/* モード切替 */}
          <div className={styles.historyModeToggle}>
            <button className={`${styles.historyModeBtn} ${historyMode === "month" ? styles.active : ""}`} onClick={() => setHistoryMode("month")}>月</button>
            <button className={`${styles.historyModeBtn} ${historyMode === "year" ? styles.active : ""}`} onClick={() => setHistoryMode("year")}>年</button>
          </div>

          {historyMode === "month" ? (
            <>
              <div className={styles.monthNav}>
                <button className={styles.monthNavBtn} onClick={() => changeHistoryMonth(-1)}>‹</button>
                <span className={styles.monthNavLabel}>{historyMonth.split("-").map(Number).join("年")}月</span>
                <button className={styles.monthNavBtn} onClick={() => changeHistoryMonth(1)} disabled={historyMonth >= yearMonth}>›</button>
              </div>
              <div className={styles.historyMeta}>
                <span className={styles.historyCount}>{parseInt(historyMonth.split("-")[1])}月レッスン {fmtCount(calcCount(historyMonthData))}</span>
              </div>
              {historyMonthData.length === 0 ? (
                <p className={styles.empty}>この月の履歴がありません</p>
              ) : (() => {
                const dateGroups: { date: string; items: Attendance[] }[] = [];
                historyMonthData.forEach((a) => {
                  const existing = dateGroups.find((g) => g.date === a.lesson_date);
                  if (existing) existing.items.push(a);
                  else dateGroups.push({ date: a.lesson_date, items: [a] });
                });
                return (
                  <div className={styles.historyList}>
                    {dateGroups.map((g) => (
                      <div key={g.date} className={styles.historyDateGroup}>
                        <p className={styles.historyDateLabel}>{fmtDate(g.date)}</p>
                        {g.items.map((a) => (
                          <div key={a.id} className={styles.historyItem}>
                            <div className={styles.historyRow}>
                              <span className={styles.historyType}>
                                {a.lesson_time && <span className={styles.historyLessonTime}>{a.lesson_time}　</span>}
                                {a.lesson_title ?? { 通常: "通常レッスン", 祝日: "祝日レッスン", 個人: "個人レッスン", 特別: "特別レッスン" }[a.lesson_type] ?? a.lesson_type}
                              </span>
                              {a.lesson_teacher && <span className={styles.historyTeacher}>{a.lesson_teacher}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              <div className={styles.monthNav}>
                <button className={styles.monthNavBtn} onClick={() => setHistoryYear((y) => y - 1)} disabled={historyYear <= getHistoryMinYear()}>‹</button>
                <span className={styles.monthNavLabel}>{historyYear}年</span>
                <button className={styles.monthNavBtn} onClick={() => setHistoryYear((y) => y + 1)} disabled={historyYear >= new Date().getFullYear()}>›</button>
              </div>
              <div className={styles.historyList}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => {
                  const ym = `${historyYear}-${String(m).padStart(2, "0")}`;
                  const monthItems = historyData.filter((a) => a.lesson_date.startsWith(ym));
                  const isOpen = expandedMonths.has(ym);
                  const dateGroups: { date: string; items: Attendance[] }[] = [];
                  monthItems.forEach((a) => {
                    const existing = dateGroups.find((g) => g.date === a.lesson_date);
                    if (existing) existing.items.push(a);
                    else dateGroups.push({ date: a.lesson_date, items: [a] });
                  });
                  return (
                    <div key={ym} className={styles.historyYearMonth}>
                      <button className={styles.historyYearMonthBtn} onClick={() => toggleMonth(ym)} disabled={monthItems.length === 0}>
                        <span className={styles.historyYearMonthLabel}>{m}月</span>
                        <span className={styles.historyYearMonthCount}>{fmtCount(calcCount(monthItems))}</span>
                        {monthItems.length > 0 && <span className={styles.historyYearMonthArrow}>{isOpen ? "▲" : "▼"}</span>}
                      </button>
                      {isOpen && (
                        <div className={styles.historyYearMonthDetail}>
                          {dateGroups.map((g) => (
                            <div key={g.date} className={styles.historyDateGroup}>
                              <p className={styles.historyDateLabel}>{fmtDate(g.date)}</p>
                              {g.items.map((a) => (
                                <div key={a.id} className={styles.historyItem}>
                                  <div className={styles.historyRow}>
                                    <span className={styles.historyType}>
                                      {a.lesson_time && <span className={styles.historyLessonTime}>{a.lesson_time}　</span>}
                                      {a.lesson_title ?? { 通常: "通常レッスン", 祝日: "祝日レッスン", 個人: "個人レッスン", 特別: "特別レッスン" }[a.lesson_type] ?? a.lesson_type}
                                    </span>
                                    {a.lesson_teacher && <span className={styles.historyTeacher}>{a.lesson_teacher}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ━━━ バッジ履歴 ━━━ */}
      {tab === "badges" && (
        <div className={`${styles.section} ${styles.sectionFit}`}>
          <div className={styles.badgeInner}>
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
              <div className={styles.badgeGrid}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => {
                  const ym = `${badgeYear}-${String(m).padStart(2, "0")}`;
                  const b = badgeData.find((b) => b.year_month === ym);
                  return (
                    <div key={m} className={styles.badgeCell}>
                      {b ? (
                        <img src={`/images/badges/badge-${b.badge}.png`} alt={b.badge} className={styles.badgeImg} />
                      ) : (
                        <span className={styles.badgeEmpty}>{m}月</span>
                      )}
                    </div>
                  );
                })}
              </div>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
