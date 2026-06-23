"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./admin.module.css";

type AnalyticsData = {
  month: string;
  totalAttendance: number;
  totalSessions: number;
  avgPerSession: number;
  topClass: string;
  topDay: string;
  classRanking: { title: string; count: number }[];
  dayRanking: { day: string; count: number }[];
  teacherRanking: { teacher: string; count: number }[];
};

function getAvailableMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function BarChart({ items, max }: { items: { label: string; count: number }[]; max: number }) {
  return (
    <div className={styles.barChart}>
      {items.map(({ label, count }) => (
        <div key={label} className={styles.barRow}>
          <span className={styles.barLabel}>{label}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: max > 0 ? `${(count / max) * 100}%` : "0%" }}
            />
          </div>
          <span className={styles.barCount}>{count}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsTab({
  adminFetch,
}: {
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
}) {
  const months = getAvailableMonths();
  const [month, setMonth] = useState(months[0]);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch(`/api/admin/analytics?month=${month}`);
    const json = await res.json();
    setData(json.error ? null : json);
    setLoading(false);
  }, [month, adminFetch]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const classMax = Math.max(...(data?.classRanking.map((c) => c.count) ?? [1]));
  const dayMax = Math.max(...(data?.dayRanking.map((d) => d.count) ?? [1]));
  const teacherMax = Math.max(...(data?.teacherRanking.map((t) => t.count) ?? [1]));

  return (
    <div className={styles.analyticsTab}>
      {/* 月選択 */}
      <div className={styles.analyticsMonthRow}>
        <label className={styles.formLabel}>月を選択</label>
        <select
          className={styles.monthSelect}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {loading && <p className={styles.emptyMsg}>読み込み中...</p>}

      {!loading && data && (
        <>
          {/* サマリーカード */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryValue}>{data.totalAttendance}</span>
              <span className={styles.summaryLabel}>延べ出席人数</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryValue}>{data.totalSessions}</span>
              <span className={styles.summaryLabel}>開催レッスン数</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryValue}>{data.avgPerSession}</span>
              <span className={styles.summaryLabel}>1レッスン平均</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryValue}>{data.topClass}</span>
              <span className={styles.summaryLabel}>最多クラス</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryValue}>{data.topDay}曜</span>
              <span className={styles.summaryLabel}>最多曜日</span>
            </div>
          </div>

          {/* クラス別 */}
          <div className={styles.analyticsSection}>
            <h3 className={styles.analyticsSectionTitle}>クラス別 出席数</h3>
            <BarChart
              items={data.classRanking.map((c) => ({ label: c.title, count: c.count }))}
              max={classMax}
            />
          </div>

          {/* 曜日別 */}
          <div className={styles.analyticsSection}>
            <h3 className={styles.analyticsSectionTitle}>曜日別 出席数</h3>
            <BarChart
              items={data.dayRanking
                .filter((d) => d.count > 0)
                .map((d) => ({ label: `${d.day}曜`, count: d.count }))}
              max={dayMax}
            />
          </div>

          {/* 先生別 */}
          <div className={styles.analyticsSection}>
            <h3 className={styles.analyticsSectionTitle}>先生別 出席数</h3>
            <BarChart
              items={data.teacherRanking.map((t) => ({ label: t.teacher, count: t.count }))}
              max={teacherMax}
            />
          </div>
        </>
      )}

      {!loading && data?.totalAttendance === 0 && (
        <p className={styles.emptyMsg}>この月のデータはありません</p>
      )}
    </div>
  );
}
