"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Eye,
  Heart,
  Flame,
  Brain,
  Lightbulb,
  HandMetal,
  BarChart3,
  MessageSquare,
  Globe,
  Clock,
  MousePointerClick,
} from "lucide-react";

interface PostAnalytics {
  post: {
    id: string;
    title: string;
    slug: string;
    views: number;
    likes: number;
    reactionFire: number;
    reactionMind: number;
    reactionIdea: number;
    reactionClap: number;
    createdAt: string;
    published: boolean;
  };
  dailyViews: { date: string; views: number }[];
  readingStats: {
    date: string;
    avgScrollDepth: number;
    avgTimeOnPage: number;
    totalReads: number;
    bounces: number;
    completions: number;
  }[];
  summary: {
    totalReads: number;
    avgTimeOnPage: number;
    avgScrollDepth: number;
    bounceRate: number;
    completionRate: number;
    commentsCount: number;
    webmentionsCount: number;
  };
}

export default function PostAnalyticsPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<PostAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/analytics/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-red-600">Post not found or analytics unavailable.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/posts">Back to Posts</Link>
        </Button>
      </div>
    );
  }

  const { post, dailyViews, summary } = data;
  const totalReactions =
    post.likes + post.reactionFire + post.reactionMind + post.reactionIdea + post.reactionClap;
  const maxDailyViews = Math.max(...dailyViews.map((d) => d.views), 1);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/analytics">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Published {new Date(post.createdAt).toLocaleDateString()} ·{" "}
            <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
              View post
            </Link>
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-muted p-2"><Eye className="h-4 w-4" /></div>
            <div>
              <p className="text-2xl font-bold">{post.views.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-muted p-2"><Heart className="h-4 w-4" /></div>
            <div>
              <p className="text-2xl font-bold">{totalReactions}</p>
              <p className="text-xs text-muted-foreground">Total Reactions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-muted p-2"><MessageSquare className="h-4 w-4" /></div>
            <div>
              <p className="text-2xl font-bold">{summary.commentsCount}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-muted p-2"><Globe className="h-4 w-4" /></div>
            <div>
              <p className="text-2xl font-bold">{summary.webmentionsCount}</p>
              <p className="text-xs text-muted-foreground">Webmentions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reading Analytics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">
              {summary.avgTimeOnPage > 60
                ? `${Math.floor(summary.avgTimeOnPage / 60)}m ${summary.avgTimeOnPage % 60}s`
                : `${summary.avgTimeOnPage}s`}
            </p>
            <p className="text-xs text-muted-foreground">Avg. Read Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MousePointerClick className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">{summary.avgScrollDepth}%</p>
            <p className="text-xs text-muted-foreground">Avg. Scroll Depth</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">{summary.completionRate}%</p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">{summary.bounceRate}%</p>
            <p className="text-xs text-muted-foreground">Bounce Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Reactions Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Reactions Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {[
              { emoji: "❤️", label: "Likes", count: post.likes, icon: Heart },
              { emoji: "🔥", label: "Fire", count: post.reactionFire, icon: Flame },
              { emoji: "🧠", label: "Mind", count: post.reactionMind, icon: Brain },
              { emoji: "💡", label: "Idea", count: post.reactionIdea, icon: Lightbulb },
              { emoji: "👏", label: "Clap", count: post.reactionClap, icon: HandMetal },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="text-xl">{r.emoji}</span>
                <span className="font-medium tabular-nums">{r.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Views Chart */}
      {dailyViews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Views (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[2px] h-32">
              {dailyViews.map((d) => {
                const height = (d.views / maxDailyViews) * 100;
                const label = new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <div
                    key={d.date}
                    className="flex-1 group relative"
                    title={`${label}: ${d.views} views`}
                  >
                    <div
                      className="bg-primary/70 hover:bg-primary rounded-t-sm transition-all w-full"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded px-2 py-1 shadow-md whitespace-nowrap z-10">
                      {label}: {d.views}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>
                {dailyViews.length > 0
                  ? new Date(dailyViews[0].date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </span>
              <span>
                {dailyViews.length > 0
                  ? new Date(dailyViews[dailyViews.length - 1].date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
