"use client";

import { useEffect, useState, useCallback } from "react";

interface ReadingProgressBarProps {
  slug?: string;
}

export function ReadingProgressBar({ slug }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  const updateProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    setProgress(scrollPercent);

    // Persist scroll position if slug is provided
    if (slug) {
      try {
        const positions: Record<string, { scroll: number; percent: number; timestamp: number }> =
          JSON.parse(localStorage.getItem("reading-positions") || "{}");
        positions[slug] = {
          scroll: scrollTop,
          percent: Math.round(scrollPercent),
          timestamp: Date.now(),
        };

        // Keep only last 50 entries
        const entries = Object.entries(positions)
          .sort(([, a], [, b]) => b.timestamp - a.timestamp)
          .slice(0, 50);
        localStorage.setItem("reading-positions", JSON.stringify(Object.fromEntries(entries)));
      } catch {}
    }
  }, [slug]);

  useEffect(() => {
    // Restore scroll position on mount
    if (slug) {
      try {
        const positions = JSON.parse(localStorage.getItem("reading-positions") || "{}");
        const saved = positions[slug];
        if (saved && saved.percent < 95) {
          // Small delay to allow the page to render
          const timer = setTimeout(() => {
            window.scrollTo({ top: saved.scroll, behavior: "smooth" });
          }, 300);
          return () => clearTimeout(timer);
        }
      } catch {}
    }
  }, [slug]);

  useEffect(() => {
    window.addEventListener("scroll", updateProgress);
    return () => window.removeEventListener("scroll", updateProgress);
  }, [updateProgress]);

  return (
    <div className="fixed top-16 left-0 z-50 h-0.5 w-full bg-transparent">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
