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

    // Overall stats
    const [
      totalViews,
      totalPosts,
      publishedPosts,
      totalSubscribers,
      subscribersThisMonth,
      totalMessages,
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
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const postsOverTime = await prisma.post.findMany({
      where: {
        published: true,
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group posts by month
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

    return NextResponse.json({
      overview: {
        totalViews: totalViews._sum.views || 0,
        totalReactions,
        totalPosts,
        publishedPosts,
        totalSubscribers,
        subscribersThisMonth,
        totalMessages,
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
      scheduledPosts,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
