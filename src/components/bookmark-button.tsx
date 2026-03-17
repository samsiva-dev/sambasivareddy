"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  slug: string;
  title: string;
  className?: string;
}

export function BookmarkButton({ slug, title, className }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "{}");
    setBookmarked(!!bookmarks[slug]);
  }, [slug]);

  function toggle() {
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "{}");
    if (bookmarks[slug]) {
      delete bookmarks[slug];
      setBookmarked(false);
    } else {
      bookmarks[slug] = { title, savedAt: Date.now() };
      setBookmarked(true);
    }
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
    // Dispatch a custom event so the bookmarks page can react
    window.dispatchEvent(new Event("bookmarks-changed"));
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      className={cn(
        "gap-2 transition-all",
        bookmarked &&
          "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-400",
        className
      )}
      title={bookmarked ? "Remove from reading list" : "Save to reading list"}
    >
      <Bookmark
        className={cn("h-4 w-4 transition-all", bookmarked && "fill-current")}
      />
      <span className="sr-only sm:not-sr-only">
        {bookmarked ? "Saved" : "Save"}
      </span>
    </Button>
  );
}
