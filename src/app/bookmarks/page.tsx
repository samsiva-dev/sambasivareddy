"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Trash2 } from "lucide-react";

interface BookmarkEntry {
  title: string;
  savedAt: number;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Record<string, BookmarkEntry>>({});

  function load() {
    const stored = JSON.parse(localStorage.getItem("bookmarks") || "{}");
    setBookmarks(stored);
  }

  useEffect(() => {
    load();
    window.addEventListener("bookmarks-changed", load);
    return () => window.removeEventListener("bookmarks-changed", load);
  }, []);

  function remove(slug: string) {
    const updated = { ...bookmarks };
    delete updated[slug];
    localStorage.setItem("bookmarks", JSON.stringify(updated));
    setBookmarks(updated);
  }

  function clearAll() {
    localStorage.setItem("bookmarks", "{}");
    setBookmarks({});
  }

  const entries = Object.entries(bookmarks).sort(
    ([, a], [, b]) => b.savedAt - a.savedAt
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bookmark className="h-7 w-7" />
            Reading List
          </h1>
          <p className="text-muted-foreground mt-1">
            Posts you've saved to read later. Stored locally in your browser.
          </p>
        </div>
        {entries.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            No saved posts yet. Click the bookmark icon on any blog post to save it here.
          </p>
          <Button asChild>
            <Link href="/blog">Browse the blog</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(([slug, entry]) => (
            <Card key={slug} className="group">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <Link
                  href={`/blog/${slug}`}
                  className="flex-1 min-w-0 hover:text-primary transition-colors"
                >
                  <h3 className="font-medium truncate">{entry.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Saved {new Date(entry.savedAt).toLocaleDateString()}
                  </p>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => remove(slug)}
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
