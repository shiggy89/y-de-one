"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <header className="header">
      <div className="inner inner-header">
        <div className="header-left">
          <Link href="/">
            <Image
              className="site-logo"
              src="/images/ydeone-logo.png"
              alt="質問できる大人バレエ教室 Y-de-ONE ロゴ"
              width={300}
              height={103}
            />
          </Link>
        </div>
        <button
          className="nav-toggle"
          aria-label="メニューを開く"
          onClick={handleToggle}
          // onClick={()=> {setIsOpen(!isOpen)}}
        >
          {isOpen ? (
            <i className="fa-solid fa-xmark"></i>
            ) : (
            <i className="fa-solid fa-bars"></i>
          )}
        </button>
        <nav className="header-right">
          <ul className={`global-nav ${isOpen ? "is-open" : ""}`}>
            <li><Link href="/">ホーム</Link></li>
            <li><Link href="#">クラス</Link></li>
            <li><Link href="#">料金</Link></li>
            <li><Link href="#">講師</Link></li>
            <li><Link href="#">アクセス</Link></li>
            <li><Link href="#">動画</Link></li>
            <li><Link href="#">体験レッスン</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}