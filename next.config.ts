import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // デモ環境は検索エンジンにインデックスさせない（meta タグと合わせた二重の保険）
  async headers() {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["192.168.3.3"],
};

export default nextConfig;
