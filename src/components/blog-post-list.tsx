"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { formatDate, calculateReadingTime } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  createdAt: string;
  tags: { id: string; name: string; slug: string }[];
  author: { name: string | null; image: string | null };
  series?: { title: string; slug: string } | null;
  seriesOrder?: number | null;
}

interface BlogPostListProps {
  initialPosts: Post[];
  initialTotal: number;
  tag?: string;
  search?: string;
}

export function BlogPostList({ initialPosts, initialTotal, tag, search }: BlogPostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset when search/tag changes
  useEffect(() => {
    setPosts(initialPosts);
    setPage(1);
    setHasMore(initialPosts.length < initialTotal);
  }, [initialPosts, initialTotal]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({ page: String(nextPage), limit: "10" });
      if (tag) params.set("tag", tag);
      if (search) params.set("search", search);

      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const newPosts: Post[] = data.posts || [];

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNew = newPosts.filter((p: Post) => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      setPage(nextPage);
      setHasMore(nextPage < (data.pagination?.totalPages || 1));
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, tag, search]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, [loadMore, hasMore, loading]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">
          {search ? `No posts found for "${search}"` : "No posts yet. Check back soon!"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group block">
              <Card className="hover:shadow-md transition-all border-transparent hover:border-border">
                <CardContent className="p-6">
                  {post.series && (
                    <div className="text-xs text-primary font-medium mb-1">
                      {post.series.title}
                      {post.seriesOrder != null && ` · Part ${post.seriesOrder}`}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <time>{formatDate(post.createdAt)}</time>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {calculateReadingTime(post.content)}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map((t) => (
                        <Badge key={t.id} variant="secondary" className="text-xs">
                          {t.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </article>
        ))}
      </div>

      {/* Infinite scroll sentinel + manual Load More fallback */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <div ref={sentinelRef} className="h-1" />
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading more posts...</span>
            </div>
          ) : (
            <Button variant="outline" onClick={loadMore}>
              Load More
            </Button>
          )}
        </div>
      )}

      {!hasMore && posts.length > 10 && (
        <p className="text-center text-sm text-muted-foreground mt-8">
          You&apos;ve reached the end — {posts.length} posts loaded.
        </p>
      )}
    </>
  );
}
