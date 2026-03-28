"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface ReadingProgressBarProps {
  slug?: string;
  totalWords?: number;
}

export function ReadingProgressBar({ slug, totalWords }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);

  const updateProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    setProgress(scrollPercent);

    // Track max scroll depth
    if (scrollPercent > maxScrollRef.current) {
      maxScrollRef.current = scrollPercent;
    }

    // Estimate remaining reading time
    if (totalWords && scrollPercent > 0 && scrollPercent < 100) {
      const remaining = ((100 - scrollPercent) / 100) * totalWords;
      const mins = Math.ceil(remaining / 200); // 200 wpm
      setMinutesLeft(mins);
    } else if (scrollPercent >= 100) {
      setMinutesLeft(0);
    }

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
  }, [slug, totalWords]);

  // Send reading stats on page unload
  useEffect(() => {
    if (!slug) return;

    const sendStats = () => {
      const timeOnPage = Math.round((Date.now() - startTimeRef.current) / 1000);
      const scrollDepth = Math.round(maxScrollRef.current);

      navigator.sendBeacon(
        `/api/posts/${encodeURIComponent(slug)}/reading-stats`,
        JSON.stringify({ scrollDepth, timeOnPage, completed: scrollDepth >= 90 })
      );
    };

    window.addEventListener("beforeunload", sendStats);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sendStats();
    });

    return () => {
      window.removeEventListener("beforeunload", sendStats);
    };
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
    <>
      <div className="fixed top-16 left-0 z-50 h-0.5 w-full bg-transparent">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {minutesLeft !== null && minutesLeft > 0 && progress > 5 && progress < 95 && (
        <div className="fixed top-[4.5rem] right-4 z-50 rounded-full bg-background/80 backdrop-blur-sm border px-3 py-1 text-xs text-muted-foreground shadow-sm">
          ~{minutesLeft} min left
        </div>
      )}
    </>
  );
}
