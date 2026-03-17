"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REACTION_CONFIG = [
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "mind", emoji: "🧠", label: "Insightful" },
  { type: "idea", emoji: "💡", label: "Idea" },
  { type: "clap", emoji: "👏", label: "Clap" },
] as const;

type ReactionType = (typeof REACTION_CONFIG)[number]["type"];

interface ReactionBarProps {
  slug: string;
  initialReactions?: Record<ReactionType, number>;
}

export function ReactionBar({ slug, initialReactions }: ReactionBarProps) {
  const [reactions, setReactions] = useState<Record<ReactionType, number>>(
    initialReactions || { heart: 0, fire: 0, mind: 0, idea: 0, clap: 0 }
  );
  const [reacted, setReacted] = useState<Set<ReactionType>>(new Set());
  const [animating, setAnimating] = useState<ReactionType | null>(null);

  // Load reacted state from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("reactions") || "{}");
    if (stored[slug]) {
      setReacted(new Set(stored[slug]));
    }
  }, [slug]);

  // Fetch latest counts
  useEffect(() => {
    fetch(`/api/posts/${slug}/reactions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.heart !== undefined) {
          setReactions(data);
        }
      })
      .catch(() => {});
  }, [slug]);

  const handleReaction = useCallback(
    async (type: ReactionType) => {
      if (reacted.has(type)) return;

      // Optimistic update
      setReactions((prev) => ({ ...prev, [type]: prev[type] + 1 }));
      setReacted((prev) => new Set(prev).add(type));
      setAnimating(type);

      // Persist to localStorage
      const stored = JSON.parse(localStorage.getItem("reactions") || "{}");
      stored[slug] = [...(stored[slug] || []), type];
      localStorage.setItem("reactions", JSON.stringify(stored));

      try {
        const res = await fetch(`/api/posts/${slug}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        const data = await res.json();
        if (data.heart !== undefined) {
          setReactions(data);
        }
      } catch {
        // Keep optimistic update
      }

      setTimeout(() => setAnimating(null), 500);
    },
    [slug, reacted]
  );

  const total = Object.values(reactions).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {REACTION_CONFIG.map(({ type, emoji, label }) => {
          const count = reactions[type];
          const isReacted = reacted.has(type);
          const isAnimating = animating === type;

          return (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              disabled={isReacted}
              title={isReacted ? `You reacted ${label}` : label}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm border transition-all",
                "hover:scale-105 active:scale-95",
                isReacted
                  ? "border-primary/30 bg-primary/5 dark:bg-primary/10"
                  : "border-border hover:border-primary/30 hover:bg-accent",
                isReacted && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "text-base transition-transform",
                  isAnimating && "scale-125"
                )}
              >
                {emoji}
              </span>
              {count > 0 && (
                <span className="tabular-nums text-xs text-muted-foreground">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {total > 0 && (
        <p className="text-xs text-muted-foreground">
          {total} reaction{total !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
