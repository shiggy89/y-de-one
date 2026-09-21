import styles from "./DemoBanner.module.css";

// デモ環境だけに出る帯。ここが本番ではないこと、何も送信されないことを常に伝える。
export default function DemoBanner() {
  return (
    <div className={styles.banner} role="status">
      <span className={styles.badge}>DEMO</span>
      <span className={styles.text}>Sample data only. No LINE messages or emails are sent.</span>
      <a className={styles.link} href="/demo">
        Switch view
      </a>
    </div>
  );
}
