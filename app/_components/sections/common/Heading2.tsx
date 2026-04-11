"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import styles from "./Heading2.module.css";

type Heading2Props = {
  title: ReactNode,
  lead?: ReactNode,
  className?: string,
  leftClassName?: string,
  leftSrc?: string,
  leftAlt?: string,
  leftStyle?: CSSProperties,
  rightClassName?: string,
  rightSrc?: string,
  rightAlt?: string,
  rightStyle?: CSSProperties,
  width?: number,
  height?: number,
};

export default function Heading2({
  title,
  lead,
  className,
  leftClassName,
  leftSrc,
  leftStyle,
  rightClassName,
  rightSrc,
  rightStyle,
  width=1024,
  height=1024,
}: Heading2Props) {
  const leftIconClassName = [styles.headingIcon, styles.heading2IconLeft, leftClassName]
    .filter(Boolean)
    .join(" ");
  const rightIconClassName = [styles.headingIcon, styles.heading2IconRight, rightClassName]
    .filter(Boolean)
    .join(" ");

  const noIcons = !leftSrc && !rightSrc;

  return (
    <div className={`${styles.heading2} ${noIcons ? styles.heading2NoIcons : ""} ${className ?? ""}`}>
      {(leftSrc || rightSrc) && (
        <div className={styles.iconLayer} aria-hidden="true">
          {leftSrc && (
            <Image
              className={leftIconClassName}
              style={leftStyle}
              src={`/images/home/${leftSrc}`}
              alt=""
              width={width}
              height={height}
            />
          )}
          {rightSrc && (
            <Image
              className={rightIconClassName}
              style={rightStyle}
              src={`/images/home/${rightSrc}`}
              alt=""
              width={width}
              height={height}
            />
          )}
        </div>
      )}
      <Image
        className={styles.flag}
        src="/images/home/flag-icon.png"
        alt="旗のアイコン"
        width={43}
        height={43}
      />
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.waveIcons}>
        <Image className={styles.waveIcon} src="/images/home/wave-icon.png" alt="波線のアイコン" width={60} height={10} />
        <Image className={styles.waveIcon} src="/images/home/wave-icon.png" alt="波線のアイコン" width={60} height={10} />
        <Image className={styles.waveIcon} src="/images/home/wave-icon.png" alt="波線のアイコン" width={60} height={10} />
        <Image className={styles.waveIcon} src="/images/home/wave-icon.png" alt="波線のアイコン" width={60} height={10} />
      </div>
      {lead && <p className={styles.lead}>{lead}</p>}
    </div>
  );
}
