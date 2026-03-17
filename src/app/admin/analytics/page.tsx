"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Eye,
  Heart,
  Users,
  FileText,
  Flame,
  Brain,
  Lightbulb,
  HandMetal,
  TrendingUp,
  Timer,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalReactions: number;
    totalPosts: number;
    publishedPosts: number;
    totalSubscribers: number;
    subscribersThisMonth: number;
    totalMessages: number;
  };
  reactionBreakdown: {
    heart: number;
    fire: number;
    mind: number;
    idea: number;
    clap: number;
  };
  popularByViews: {
    title: string;
    slug: string;
    views: number;
    likes: number;
    reactionFire: number;
    reactionMind: number;
    reactionIdea: number;
    reactionClap: number;
    createdAt: string;
  }[];
  monthlyPosts: Record<string, number>;
  monthlySubscribers: Record<string, number>;
  scheduledPosts: {
    id: string;
    title: string;
    slug: string;
    publishAt: string;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-red-600">{error || "No data"}</p>
      </div>
    );
  }

  const { overview, reactionBreakdown, popularByViews, monthlyPosts, monthlySubscribers, scheduledPosts } = data;

  const overviewStats = [
    { label: "Total Views", value: overview.totalViews, icon: Eye },
    { label: "Total Reactions", value: overview.totalReactions, icon: Heart },
    { label: "Subscribers", value: overview.totalSubscribers, icon: Users },
    { label: "Published", value: overview.publishedPosts, icon: FileText },
  ];

  const reactionItems = [
    { emoji: "❤️", label: "Heart", count: reactionBreakdown.heart, icon: Heart },
    { emoji: "🔥", label: "Fire", count: reactionBreakdown.fire, icon: Flame },
    { emoji: "🧠", label: "Mind", count: reactionBreakdown.mind, icon: Brain },
    { emoji: "💡", label: "Idea", count: reactionBreakdown.idea, icon: Lightbulb },
    { emoji: "👏", label: "Clap", count: reactionBreakdown.clap, icon: HandMetal },
  ];

  // Build bar chart data for monthly posts
  const allMonths = Object.keys({ ...monthlyPosts, ...monthlySubscribers }).sort();
  const maxPosts = Math.max(...Object.values(monthlyPosts), 1);
  const maxSubs = Math.max(...Object.values(monthlySubscribers), 1);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your blog performance
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {overviewStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Reaction breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reactionItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xl w-8">{item.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="tabular-nums font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full transition-all"
                        style={{
                          width: `${overview.totalReactions > 0 ? (item.count / overview.totalReactions) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allMonths.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data yet
              </p>
            ) : (
              <div className="space-y-3">
                {allMonths.slice(-6).map((month) => {
                  const posts = monthlyPosts[month] || 0;
                  const subs = monthlySubscribers[month] || 0;
                  const [y, m] = month.split("-");
                  const label = new Date(Number(y), Number(m) - 1).toLocaleDateString(
                    "en-US",
                    { month: "short", year: "numeric" }
                  );
                  return (
                    <div key={month}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-xs">
                          {posts} post{posts !== 1 ? "s" : ""} · {subs} sub{subs !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex gap-1 h-3">
                        <div
                          className="bg-primary/70 rounded-sm transition-all"
                          style={{ width: `${(posts / maxPosts) * 60}%`, minWidth: posts > 0 ? "4px" : "0" }}
                          title={`${posts} posts`}
                        />
                        <div
                          className="bg-blue-400/70 rounded-sm transition-all"
                          style={{ width: `${(subs / maxSubs) * 40}%`, minWidth: subs > 0 ? "4px" : "0" }}
                          title={`${subs} subscribers`}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-primary/70" /> Posts
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-blue-400/70" /> Subscribers
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular posts */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Popular Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {popularByViews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No published posts yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Post</th>
                    <th className="text-right py-2 font-medium w-20">Views</th>
                    <th className="text-right py-2 font-medium w-24">Reactions</th>
                  </tr>
                </thead>
                <tbody>
                  {popularByViews.map((post) => {
                    const totalReact =
                      post.likes +
                      post.reactionFire +
                      post.reactionMind +
                      post.reactionIdea +
                      post.reactionClap;
                    return (
                      <tr key={post.slug} className="border-b last:border-0">
                        <td className="py-3">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {post.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="text-right tabular-nums py-3">
                          {post.views.toLocaleString()}
                        </td>
                        <td className="text-right tabular-nums py-3">
                          {totalReact.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled posts */}
      {scheduledPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Upcoming Scheduled Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <h3 className="font-medium">{post.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Scheduled for{" "}
                      {new Date(post.publishAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/edit/${post.id}`}>Edit</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
