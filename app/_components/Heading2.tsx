"use client";

import Image from "next/image";

type Heading2Props = {
  title: string,
  lead?: React.ReactNode,
  leftClassName?: string,
  leftSrc?: string,
  leftAlt?: string,
  rightClassName?: string,
  rightSrc?: string,
  rightAlt?: string,
  width?: number,
  height?: number,
};

export default function Heading2({
  title,
  lead,
  leftClassName,
  leftSrc,
  leftAlt,
  rightClassName,
  rightSrc,
  rightAlt,
  width=1024,
  height=1024,
}: Heading2Props) {
  return (
    <div className="heading2">
      <Image
        src="/images/flag-icon.png"
        alt="旗のアイコン"
        width={43}
        height={43}
      />
      <h2>{title}</h2>
      <div className="wave-icons">
        <Image className="wave-icon" src="/images/wave-icon.png" alt="波線のアイコン" width={60} height={10} />
        <Image className="wave-icon" src="/images/wave-icon.png" alt="波線のアイコン" width={60} height={10} />
        <Image className="wave-icon" src="/images/wave-icon.png" alt="波線のアイコン" width={60} height={10} />
        <Image className="wave-icon" src="/images/wave-icon.png" alt="波線のアイコン" width={60} height={10} />
      </div>
      {lead && <p className="lead">{lead}</p>}
      {/* <p className="lead">{lead}</p> */}
      <div>
        {leftSrc && (
          <Image
            className={leftClassName}
            src={`/images/${leftSrc}`}
            alt={leftAlt ?? ""}
            width={width}
            height={height}
          />
        )}
        {rightSrc && (
          <Image
            className={rightClassName}
            src={`/images/${rightSrc}`}
            alt={rightAlt ?? ""}
            width={width}
            height={height}
          />
        )}
      </div>
    </div>
  );
}