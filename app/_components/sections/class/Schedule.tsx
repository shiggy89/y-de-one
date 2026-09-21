"use client";

import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Schedule.module.css";
import { localePath, makeT, type Lang } from "@/lib/i18n";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const START_MINUTES = 12 * 60 + 30; // 12:30
const END_MINUTES = 21 * 60; // 21:00
const TOTAL_MINUTES = END_MINUTES - START_MINUTES;

type Lesson = {
  day: (typeof DAYS)[number];
  start: string;
  end: string;
  title: string;
  titleEn: string;
  teacher: string;
  teacherEn: string;
  type: "pink" | "blue" | "yellow" | "gray";
  stretch?: boolean;
  topOffsetPct?: number;
};

const LESSONS: Lesson[] = [
  { day: "Tue", start: "13:00", end: "14:30", title: "バレエ\n入門", titleEn: "Ballet\nIntroduction", teacher: "門馬和樹", teacherEn: "Kazuki Momma", type: "pink", stretch: true },
  { day: "Tue", start: "14:30", end: "15:05", title: "プレモダン", titleEn: "Pre-Modern", teacher: "門馬和樹", teacherEn: "Kazuki Momma", type: "blue" },
  { day: "Tue", start: "19:30", end: "21:00", title: "モダンバレエ", titleEn: "Modern Ballet", teacher: "青山佳樹", teacherEn: "Yoshiki Aoyama", type: "blue", stretch: true },
  { day: "Wed", start: "13:00", end: "14:30", title: "バレエ\n入門基礎", titleEn: "Ballet Intro\n& Basics", teacher: "門馬和樹", teacherEn: "Kazuki Momma", type: "pink" },
  { day: "Wed", start: "15:00", end: "16:30", title: "モダンバレエ", titleEn: "Modern Ballet", teacher: "門馬和樹", teacherEn: "Kazuki Momma", type: "blue", stretch: true },
  { day: "Wed", start: "19:15", end: "20:45", title: "バレエ\n入門基礎合同", titleEn: "Ballet Intro\n& Basics\n(combined)", teacher: "青山佳樹", teacherEn: "Yoshiki Aoyama", type: "pink" },
  { day: "Thu", start: "13:00", end: "14:30", title: "バレエ\n入門基礎合同", titleEn: "Ballet Intro\n& Basics\n(combined)", teacher: "青山佳樹", teacherEn: "Yoshiki Aoyama", type: "pink" },
  { day: "Thu", start: "14:30", end: "15:05", title: "ポワント", titleEn: "Pointe", teacher: "青山佳樹", teacherEn: "Yoshiki Aoyama", type: "yellow" },
  { day: "Thu", start: "15:30", end: "17:00", title: "モダンバレエ", titleEn: "Modern Ballet", teacher: "青山佳樹", teacherEn: "Yoshiki Aoyama", type: "blue", stretch: true },
  { day: "Thu", start: "19:30", end: "21:00", title: "モダンバレエ", titleEn: "Modern Ballet", teacher: "門馬和樹", teacherEn: "Kazuki Momma", type: "blue", stretch: true },
  { day: "Fri", start: "15:00", end: "16:30", title: "バレエ\n入門", titleEn: "Ballet\nIntroduction", teacher: "青山佳樹", teacherEn: "Yoshiki Aoyama", type: "pink", stretch: true },
  { day: "Fri", start: "16:30", end: "17:05", title: "ポワント", titleEn: "Pointe", teacher: "青山佳樹", teacherEn: "Yoshiki Aoyama", type: "yellow" },
  { day: "Sat", start: "12:30", end: "14:00", title: "バレエ\n入門基礎合同", titleEn: "Ballet Intro\n& Basics\n(combined)", teacher: "門馬和樹", teacherEn: "Kazuki Momma", type: "pink", topOffsetPct: 3.4 },
  { day: "Sat", start: "14:30", end: "16:00", title: "モダンバレエ", titleEn: "Modern Ballet", teacher: "青山佳樹", teacherEn: "Yoshiki Aoyama", type: "blue" },
  { day: "Sat", start: "16:30", end: "18:00", title: "リハーサル", titleEn: "Rehearsal", teacher: "", teacherEn: "", type: "gray" },
  { day: "Sun", start: "12:30", end: "14:00", title: "バレエ\n入門基礎合同", titleEn: "Ballet Intro\n& Basics\n(combined)", teacher: "青山佳樹", teacherEn: "Yoshiki Aoyama", type: "pink", topOffsetPct: 3.4 },
  { day: "Sun", start: "14:00", end: "14:35", title: "ポワント", titleEn: "Pointe", teacher: "青山佳樹", teacherEn: "Yoshiki Aoyama", type: "yellow" },
  { day: "Sun", start: "15:00", end: "16:30", title: "リハーサル", titleEn: "Rehearsal", teacher: "", teacherEn: "", type: "gray" },
];

const toMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const blockStyle = (start: string, end: string, topOffsetPct = 0) => {
  const baseTop = ((toMinutes(start) - START_MINUTES) / TOTAL_MINUTES) * 100;
  const duration = toMinutes(end) - toMinutes(start);
  const baseHeight = (duration / TOTAL_MINUTES) * 100;
  const minHeightPct = duration <= 40 ? 10 : duration <= 60 ? 14 : 2;
  const top = baseTop + topOffsetPct;
  const height = Math.max(minHeightPct, Math.min(baseHeight - 0.5, 100 - top));
  return { top: `${top}%`, height: `${height}%` };
};

export default function Schedule({ lang = "ja" }: { lang?: Lang }) {
  const t = makeT(lang);
  const today = new Date();
  const isJuly2026 = today.getFullYear() === 2026 && today.getMonth() === 6;
  const visibleLessons = isJuly2026
    ? LESSONS.filter((l) => !(l.day === "Tue" && l.start === "19:30"))
    : LESSONS;

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
              <p className={styles.closedDay} aria-label={t("月曜日は休講日", "Closed on Mondays") as string}>
                {t(<>休
                <br />
                講
                <br />
                日</>, "Closed")}
              </p>
            )}
            {visibleLessons.filter((lesson) => lesson.day === day).map((lesson) => (
              <article
                key={`${lesson.day}-${lesson.start}-${lesson.title}`}
                className={`${styles.lessonBlock} ${styles[lesson.type]}`}
                style={blockStyle(lesson.start, lesson.end, lesson.topOffsetPct)}
              >
                <p className={styles.time}>
                  {lesson.start}-{lesson.end}
                </p>
                <p className={styles.lessonTitle}>
                  {t(lesson.title, lesson.titleEn)}
                </p>
                {lesson.teacher && <p className={styles.teacher}>{t(lesson.teacher, lesson.teacherEn)}</p>}
                {lesson.stretch && (
                  <Image
                    className={styles.stretchDummy}
                    src="/images/class/paw-icon.png"
                    alt={t("ストレッチあり（ダミー）", "Includes stretching") as string}
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
    <div id="schedule" className={styles.scheduleBlock}>
      <Heading2
        className={styles.scheduleHeading}
        title={
          t(<>
            ワイデワン レッスンスケジュール
            <br />
            週6日・昼から夜まで開講
          </>, <>
            Y-de-ONE lesson schedule
            <br />
            Six days a week, from midday to evening
          </>)
        }
        lead={t("火〜日曜日、13時〜21時の幅広い時間帯で開講。高田馬場・落合・東中野・新宿エリアで、ご自身のペースでバレエを続けられます。", "Open Tuesday to Sunday, 13:00 to 21:00, in the Takadanobaba, Ochiai, Higashi-Nakano and Shinjuku area. Keep dancing at your own pace.")}
      />
      <div className={styles.scheduleLegend}>
        <Image
          className={styles.pawIcon}
          src="/images/class/paw-icon.png"
          alt={t("足跡アイコン", "Paw print icon") as string}
          width={64}
          height={64}
        />
        <span>{t("ストレッチ有り", "Includes stretching")}</span>
      </div>
      <div className={styles.scheduleScroll}>
        {renderBoard(DAYS)}
      </div>
      <p className={styles.scheduleNote}>
        <i className="fa-solid fa-circle-info" aria-hidden="true" />
        <span>{t("クラスが変更になっている場合がございます。", <>Classes may change.{" "}</>)}<br className={styles.mobileOnlyBreak} />{t("最新の休講・振替情報は", "For the latest closures and substitutions, see ")}<a href={localePath(lang, "/lesson-info")}>{t("こちら", "the schedule changes page")}</a></span>
      </p>
      <div className={styles.scheduleCtaWrap}>
        <SectionCtaButton lang={lang} />
      </div>
    </div>
  );
}
