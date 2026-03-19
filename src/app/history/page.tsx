"use client";

import { useSyncExternalStore, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Trash2 } from "lucide-react";

interface HistoryEntry {
  title: string;
  lastRead: number;
  readCount: number;
}

function formatLastRead(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const emptyHistory = "{}";

function getHistorySnapshot(): string {
  if (typeof window === "undefined") return emptyHistory;
  return localStorage.getItem("reading-history") || emptyHistory;
}

function getServerSnapshot(): string {
  return emptyHistory;
}

export default function ReadingHistoryPage() {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback);
    window.addEventListener("reading-history-changed", callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener("reading-history-changed", callback);
    };
  }, []);

  const raw = useSyncExternalStore(subscribe, getHistorySnapshot, getServerSnapshot);
  let history: Record<string, HistoryEntry>;
  try {
    history = JSON.parse(raw);
  } catch {
    history = {};
  }

  function remove(slug: string) {
    const updated = { ...history };
    delete updated[slug];
    localStorage.setItem("reading-history", JSON.stringify(updated));
    window.dispatchEvent(new Event("reading-history-changed"));
  }

  function clearAll() {
    localStorage.setItem("reading-history", "{}");
    window.dispatchEvent(new Event("reading-history-changed"));
  }

  const entries = Object.entries(history).sort(
    ([, a], [, b]) => b.lastRead - a.lastRead
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-7 w-7" />
            Reading History
          </h1>
          <p className="text-muted-foreground mt-1">
            Posts you&apos;ve recently read. Stored locally in your browser.
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
          <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            No reading history yet. Start reading blog posts to see them here.
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
                    Read {formatLastRead(entry.lastRead)}
                    {entry.readCount > 1 && ` · ${entry.readCount} visits`}
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
