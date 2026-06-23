"use client";

import { useEffect } from "react";
import { NEWS_VISITED_KEY } from "./hooks/useNewsBadge";

export function NewsReadTracker() {
  useEffect(() => {
    localStorage.setItem(NEWS_VISITED_KEY, new Date().toISOString());
  }, []);
  return null;
}
