"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Schedule.module.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const START_MINUTES = 12 * 60 + 30; // 12:30
const END_MINUTES = 21 * 60; // 21:00
const TOTAL_MINUTES = END_MINUTES - START_MINUTES;

type Lesson = {
  day: (typeof DAYS)[number];
  start: string;
  end: string;
  title: string;
  teacher: string;
  type: "pink" | "blue" | "yellow";
  stretch?: boolean;
  topOffsetPct?: number;
};

const LESSONS: Lesson[] = [
  { day: "Tue", start: "13:00", end: "14:30", title: "バレエ\n入門", teacher: "門馬和樹", type: "pink", stretch: true },
  { day: "Tue", start: "14:30", end: "15:05", title: "プレモダン", teacher: "門馬和樹", type: "blue" },
  { day: "Wed", start: "13:00", end: "14:30", title: "バレエ\n基礎", teacher: "門馬和樹", type: "pink" },
  { day: "Wed", start: "15:00", end: "16:30", title: "モダンバレエ", teacher: "門馬和樹", type: "blue" },
  { day: "Wed", start: "19:15", end: "20:45", title: "バレエ\n基礎", teacher: "青山佳樹", type: "pink" },
  { day: "Thu", start: "13:00", end: "14:30", title: "バレエ\n基礎", teacher: "青山佳樹", type: "pink" },
  { day: "Thu", start: "14:30", end: "15:05", title: "ポワント", teacher: "青山佳樹", type: "yellow" },
  { day: "Thu", start: "15:30", end: "17:00", title: "モダンバレエ", teacher: "青山佳樹", type: "blue", stretch: true },
  { day: "Thu", start: "19:30", end: "21:00", title: "モダンバレエ", teacher: "門馬和樹", type: "blue", stretch: true },
  { day: "Fri", start: "15:00", end: "16:30", title: "バレエ\n入門", teacher: "青山佳樹", type: "pink", stretch: true },
  { day: "Fri", start: "16:30", end: "17:05", title: "ポワント", teacher: "青山佳樹", type: "yellow" },
  { day: "Sat", start: "12:30", end: "14:00", title: "バレエ\n入門基礎", teacher: "門馬和樹", type: "pink", topOffsetPct: 3.4 },
  { day: "Sat", start: "14:30", end: "16:00", title: "バレエ\n基礎", teacher: "青山佳樹", type: "pink" },
  { day: "Sat", start: "16:30", end: "18:00", title: "モダンバレエ", teacher: "青山佳樹", type: "blue", stretch: true },
  { day: "Sun", start: "12:30", end: "14:00", title: "バレエ\n入門", teacher: "青山佳樹", type: "pink", topOffsetPct: 3.4 },
  { day: "Sun", start: "14:30", end: "16:00", title: "バレエ\n基礎", teacher: "青山佳樹", type: "pink" },
  { day: "Sun", start: "16:00", end: "16:35", title: "ポワント", teacher: "青山佳樹", type: "yellow" },
];

const toMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const blockStyle = (start: string, end: string, topOffsetPct = 0) => {
  const baseTop = ((toMinutes(start) - START_MINUTES) / TOTAL_MINUTES) * 100;
  const duration = toMinutes(end) - toMinutes(start);
  const baseHeight = (duration / TOTAL_MINUTES) * 100;
  const minHeightPct = duration <= 40 ? 10 : 2;
  const top = baseTop + topOffsetPct;
  const height = Math.max(minHeightPct, Math.min(baseHeight - 0.5, 100 - top));
  return { top: `${top}%`, height: `${height}%` };
};

export default function Schedule() {
  const renderBoard = (days: readonly (typeof DAYS)[number][]) => (
    <div className={styles.scheduleBoard}>
      <div
        className={styles.dayHeaderRow}
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {days.map((day) => (
          <div key={day} className={styles.dayHeaderCell}>
            {day}
          </div>
        ))}
      </div>
      <div
        className={styles.dayColumns}
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {days.map((day) => (
          <div key={`${day}-col`} className={styles.dayColumn}>
            {day === "Mon" && (
              <p className={styles.closedDay} aria-label="月曜日は休講日">
                休
                <br />
                講
                <br />
                日
              </p>
            )}
            {LESSONS.filter((lesson) => lesson.day === day).map((lesson) => (
              <article
                key={`${lesson.day}-${lesson.start}-${lesson.title}`}
                className={`${styles.lessonBlock} ${styles[lesson.type]}`}
                style={blockStyle(lesson.start, lesson.end, lesson.topOffsetPct)}
              >
                <p className={styles.time}>
                  {lesson.start}-{lesson.end}
                </p>
                <p className={styles.lessonTitle}>
                  {lesson.title}
                </p>
                <p className={styles.teacher}>{lesson.teacher}</p>
                {lesson.stretch && (
                  <Image
                    className={styles.stretchDummy}
                    src="/images/class/paw-icon.png"
                    alt="ストレッチあり（ダミー）"
                    width={40}
                    height={31}
                  />
                )}
              </article>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.scheduleBlock}>
      <Heading2
        className={styles.scheduleHeading}
        title={
          <>
            ワイデワン レッスンスケジュール
            <br />
            週6日・昼から夜まで開講
          </>
        }
        lead="火〜日曜日、13時〜21時の幅広い時間帯で開講。高田馬場・落合・東中野・新宿エリアで、ご自身のペースでバレエを続けられます。"
      />
      <div className={styles.scheduleLegend}>
        <Image
          className={styles.pawIcon}
          src="/images/class/paw-icon.png"
          alt="足跡アイコン"
          width={64}
          height={64}
        />
        <span>ストレッチ有り</span>
      </div>
      <div className={styles.scheduleScroll}>
        {renderBoard(DAYS)}
      </div>
      <div className={styles.scheduleCtaWrap}>
        <SectionCtaButton />
      </div>
    </div>
  );
}
