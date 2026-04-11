import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "質問できる大人バレエ教室 Y-de-ONE｜新宿・高田馬場・落合・東中野",
  description: "新宿・高田馬場エリアの大人バレエ教室 Y-de-ONE（ワイデワン）。入会金なし・初心者歓迎。50代・60代から始める方も多数。体験レッスン3,300円。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
