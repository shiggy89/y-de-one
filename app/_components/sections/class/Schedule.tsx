import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import { supabaseAdmin } from "@/lib/supabase";
import styles from "./Schedule.module.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const START_MINUTES = 12 * 60 + 30;
const END_MINUTES = 21 * 60;
const TOTAL_MINUTES = END_MINUTES - START_MINUTES;

type ClassTemplate = {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  title: string;
  teacher: string;
  color_type: "pink" | "blue" | "yellow";
  has_stretch: boolean;
  top_offset_pct: number;
};

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

export default async function Schedule() {
  const { data } = await supabaseAdmin
    .from("class_templates")
    .select("id, day_of_week, start_time, end_time, title, teacher, color_type, has_stretch, top_offset_pct")
    .eq("is_active", true)
    .order("sort_order");

  const lessons = (data ?? []) as ClassTemplate[];

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
            {lessons.filter((l) => l.day_of_week === day).map((l) => (
              <article
                key={`${l.day_of_week}-${l.start_time}-${l.id}`}
                className={`${styles.lessonBlock} ${styles[l.color_type]}`}
                style={blockStyle(l.start_time, l.end_time, Number(l.top_offset_pct))}
              >
                <p className={styles.time}>
                  {l.start_time}-{l.end_time}
                </p>
                <p className={styles.lessonTitle}>{l.title}</p>
                <p className={styles.teacher}>{l.teacher}</p>
                {l.has_stretch && (
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
    <div id="schedule" className={styles.scheduleBlock}>
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
