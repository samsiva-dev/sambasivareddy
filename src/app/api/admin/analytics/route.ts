import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/analytics — dashboard analytics data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Overall stats
    const [
      totalViews,
      totalPosts,
      publishedPosts,
      totalSubscribers,
      subscribersThisMonth,
      totalMessages,
      totalComments,
      pendingComments,
    ] = await Promise.all([
      prisma.post.aggregate({ _sum: { views: true } }),
      prisma.post.count(),
      prisma.post.count({ where: { published: true } }),
      prisma.subscriber.count({ where: { active: true } }),
      prisma.subscriber.count({
        where: {
          active: true,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.contactMessage.count(),
      prisma.comment.count({ where: { approved: true } }),
      prisma.comment.count({ where: { approved: false } }),
    ]);

    // Total reactions
    const reactions = await prisma.post.aggregate({
      _sum: {
        likes: true,
        reactionFire: true,
        reactionMind: true,
        reactionIdea: true,
        reactionClap: true,
      },
    });

    const totalReactions =
      (reactions._sum.likes || 0) +
      (reactions._sum.reactionFire || 0) +
      (reactions._sum.reactionMind || 0) +
      (reactions._sum.reactionIdea || 0) +
      (reactions._sum.reactionClap || 0);

    // Popular posts (top 10 by views)
    const popularByViews = await prisma.post.findMany({
      where: { published: true },
      orderBy: { views: "desc" },
      take: 10,
      select: {
        title: true,
        slug: true,
        views: true,
        likes: true,
        reactionFire: true,
        reactionMind: true,
        reactionIdea: true,
        reactionClap: true,
        createdAt: true,
      },
    });

    // Posts per month (last 12 months)
    const postsOverTime = await prisma.post.findMany({
      where: {
        published: true,
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlyPosts: Record<string, number> = {};
    postsOverTime.forEach((p) => {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthlyPosts[key] = (monthlyPosts[key] || 0) + 1;
    });

    // Subscriber growth (last 12 months)
    const subscriberGrowth = await prisma.subscriber.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlySubscribers: Record<string, number> = {};
    subscriberGrowth.forEach((s) => {
      const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthlySubscribers[key] = (monthlySubscribers[key] || 0) + 1;
    });

    // Scheduled posts
    const scheduledPosts = await prisma.post.findMany({
      where: {
        published: false,
        publishAt: { gt: new Date() },
      },
      orderBy: { publishAt: "asc" },
      select: { id: true, title: true, slug: true, publishAt: true },
    });

    // Daily view trends (last 30 days)
    const dailyViewStats = await prisma.dailyViewStat.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
    });

    const dailyViews: Record<string, number> = {};
    dailyViewStats.forEach((stat) => {
      const key = stat.date.toISOString().split("T")[0];
      dailyViews[key] = (dailyViews[key] || 0) + stat.views;
    });

    // Popular tags (by total views of their posts)
    const tagsWithViews = await prisma.tag.findMany({
      include: {
        posts: {
          where: { published: true },
          select: { views: true, likes: true },
        },
      },
    });

    const popularTags = tagsWithViews
      .map((tag) => ({
        name: tag.name,
        slug: tag.slug,
        postCount: tag.posts.length,
        totalViews: tag.posts.reduce((sum, p) => sum + p.views, 0),
        totalLikes: tag.posts.reduce((sum, p) => sum + p.likes, 0),
      }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 10);

    // Monthly views trend (last 12 months)
    const allMonthlyViewStats = await prisma.dailyViewStat.findMany({
      where: { date: { gte: twelveMonthsAgo } },
      select: { date: true, views: true },
    });

    const monthlyViews: Record<string, number> = {};
    allMonthlyViewStats.forEach((stat) => {
      const key = `${stat.date.getFullYear()}-${String(stat.date.getMonth() + 1).padStart(2, "0")}`;
      monthlyViews[key] = (monthlyViews[key] || 0) + stat.views;
    });

    // Reading analytics (last 30 days aggregate)
    const readingStats = await prisma.readingStat.findMany({
      where: { date: { gte: thirtyDaysAgo } },
    });

    let totalReadTime = 0;
    let totalScrollDepth = 0;
    let totalBounces = 0;
    let totalCompletions = 0;
    let totalReadEntries = 0;

    readingStats.forEach((stat) => {
      totalReadTime += stat.avgTimeOnPage * stat.totalReads;
      totalScrollDepth += stat.avgScrollDepth * stat.totalReads;
      totalBounces += stat.bounces;
      totalCompletions += stat.completions;
      totalReadEntries += stat.totalReads;
    });

    const readingAnalytics = {
      avgTimeOnPage: totalReadEntries > 0 ? Math.round(totalReadTime / totalReadEntries) : 0,
      avgScrollDepth: totalReadEntries > 0 ? Math.round(totalScrollDepth / totalReadEntries) : 0,
      bounceRate: totalReadEntries > 0 ? Math.round((totalBounces / totalReadEntries) * 100) : 0,
      completionRate: totalReadEntries > 0 ? Math.round((totalCompletions / totalReadEntries) * 100) : 0,
      totalReads: totalReadEntries,
    };

    return NextResponse.json({
      overview: {
        totalViews: totalViews._sum.views || 0,
        totalReactions,
        totalPosts,
        publishedPosts,
        totalSubscribers,
        subscribersThisMonth,
        totalMessages,
        totalComments,
        pendingComments,
      },
      reactionBreakdown: {
        heart: reactions._sum.likes || 0,
        fire: reactions._sum.reactionFire || 0,
        mind: reactions._sum.reactionMind || 0,
        idea: reactions._sum.reactionIdea || 0,
        clap: reactions._sum.reactionClap || 0,
      },
      popularByViews,
      monthlyPosts,
      monthlySubscribers,
      monthlyViews,
      dailyViews,
      popularTags,
      scheduledPosts,
      readingAnalytics,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
