import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "大人バレエ・モダンバレエ教室 Y-de-ONE｜高田馬場・新宿",
  description: "新宿・高田馬場エリアの大人バレエ教室 Y-de-ONE（ワイデワン）。入会金なし・初心者歓迎。50代・60代から始める方も多数。体験レッスン3,300円。",
  verification: {
    google: "0JQECYL7i3H4EQnKZaVDUR3AlVnjta_2m9yjTGL1fCM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-LFPKC48DGG"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LFPKC48DGG');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
