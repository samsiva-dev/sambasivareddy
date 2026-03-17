"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  slug: string;
}

/**
 * Invisible component that fires a single view-tracking request when the post loads.
 * Uses sessionStorage to avoid counting the same post view twice per session.
 */
export function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");

    fetch(`/api/posts/${slug}/views`, { method: "POST" }).catch(() => {});
  }, [slug]);

  return null;
}
