"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const NEWS_VISITED_KEY = "news_last_visited";

export function useNewsBadge() {
  const [showBadge, setShowBadge] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/news-badge");
        const { latestDate } = await res.json();
        if (!latestDate) { setShowBadge(false); return; }

        const lastVisited = localStorage.getItem(NEWS_VISITED_KEY);
        if (!lastVisited) { setShowBadge(true); return; }

        setShowBadge(new Date(latestDate) > new Date(lastVisited));
      } catch {
        setShowBadge(false);
      }
    }
    check();
  }, []);

  useEffect(() => {
    if (pathname === "/news") {
      localStorage.setItem(NEWS_VISITED_KEY, new Date().toISOString());
      setShowBadge(false);
    }
  }, [pathname]);

  return showBadge;
}
