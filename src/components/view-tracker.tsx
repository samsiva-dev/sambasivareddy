"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  slug: string;
  title?: string;
}

/**
 * Invisible component that fires a single view-tracking request when the post loads.
 * Uses sessionStorage to avoid counting the same post view twice per session.
 * Also records reading history in localStorage.
 */
export function ViewTracker({ slug, title }: ViewTrackerProps) {
  useEffect(() => {
    // Track view (once per session)
    const key = `viewed:${slug}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      fetch(`/api/posts/${slug}/views`, { method: "POST" }).catch(() => {});
    }

    // Record reading history in localStorage
    if (title) {
      try {
        const history: Record<string, { title: string; lastRead: number; readCount: number }> =
          JSON.parse(localStorage.getItem("reading-history") || "{}");
        const existing = history[slug];
        history[slug] = {
          title,
          lastRead: Date.now(),
          readCount: (existing?.readCount || 0) + 1,
        };

        // Keep only the last 100 entries
        const entries = Object.entries(history).sort(([, a], [, b]) => b.lastRead - a.lastRead);
        const trimmed = Object.fromEntries(entries.slice(0, 100));
        localStorage.setItem("reading-history", JSON.stringify(trimmed));

        window.dispatchEvent(new Event("reading-history-changed"));
      } catch {}
    }
  }, [slug, title]);

  return null;
}
