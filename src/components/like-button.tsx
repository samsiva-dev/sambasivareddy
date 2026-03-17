"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  slug: string;
  initialLikes: number;
}

export function LikeButton({ slug, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Check localStorage to see if user already liked this post
  useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "{}");
    if (likedPosts[slug]) {
      setLiked(true);
    }
  }, [slug]);

  // Fetch latest like count on mount
  useEffect(() => {
    fetch(`/api/posts/${slug}/likes`)
      .then((res) => res.json())
      .then((data) => {
        if (data.likes !== undefined) setLikes(data.likes);
      })
      .catch(() => {});
  }, [slug]);

  const handleLike = useCallback(async () => {
    if (liked) return;

    setAnimating(true);
    setLikes((prev) => prev + 1);
    setLiked(true);

    // Persist in localStorage
    const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "{}");
    likedPosts[slug] = true;
    localStorage.setItem("likedPosts", JSON.stringify(likedPosts));

    try {
      const res = await fetch(`/api/posts/${slug}/likes`, { method: "POST" });
      const data = await res.json();
      if (data.likes !== undefined) setLikes(data.likes);
    } catch {
      // Optimistic update already applied
    }

    setTimeout(() => setAnimating(false), 600);
  }, [slug, liked]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLike}
      disabled={liked}
      className={cn(
        "gap-2 transition-all",
        liked && "border-red-200 bg-red-50 text-red-600 hover:bg-red-50 hover:text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all",
          liked && "fill-current",
          animating && "scale-125"
        )}
      />
      <span className="tabular-nums">{likes}</span>
      <span className="sr-only">
        {liked ? "You liked this post" : "Like this post"}
      </span>
    </Button>
  );
}
