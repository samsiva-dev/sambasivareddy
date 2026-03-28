import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/analytics/[id] — per-post analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        views: true,
        likes: true,
        reactionFire: true,
        reactionMind: true,
        reactionIdea: true,
        reactionClap: true,
        createdAt: true,
        published: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Daily views for last 30 days
    const dailyViews = await prisma.dailyViewStat.findMany({
      where: { postId: id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
    });

    // Reading stats for last 30 days
    const readingStats = await prisma.readingStat.findMany({
      where: { postId: id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
    });

    // Comments count
    const commentsCount = await prisma.comment.count({
      where: { postId: id, approved: true, deletedAt: null },
    });

    // Webmentions count
    const webmentionsCount = await prisma.webmention.count({
      where: { postId: id, verified: true },
    });

    // Aggregate reading stats
    let totalReads = 0;
    let totalTime = 0;
    let totalDepth = 0;
    let totalBounces = 0;
    let totalCompletions = 0;

    readingStats.forEach((s) => {
      totalReads += s.totalReads;
      totalTime += s.avgTimeOnPage * s.totalReads;
      totalDepth += s.avgScrollDepth * s.totalReads;
      totalBounces += s.bounces;
      totalCompletions += s.completions;
    });

    return NextResponse.json({
      post,
      dailyViews: dailyViews.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        views: d.views,
      })),
      readingStats: readingStats.map((s) => ({
        date: s.date.toISOString().split("T")[0],
        avgScrollDepth: s.avgScrollDepth,
        avgTimeOnPage: s.avgTimeOnPage,
        totalReads: s.totalReads,
        bounces: s.bounces,
        completions: s.completions,
      })),
      summary: {
        totalReads,
        avgTimeOnPage: totalReads > 0 ? Math.round(totalTime / totalReads) : 0,
        avgScrollDepth: totalReads > 0 ? Math.round(totalDepth / totalReads) : 0,
        bounceRate: totalReads > 0 ? Math.round((totalBounces / totalReads) * 100) : 0,
        completionRate: totalReads > 0 ? Math.round((totalCompletions / totalReads) * 100) : 0,
        commentsCount,
        webmentionsCount,
      },
    });
  } catch (error) {
    console.error("Error fetching post analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
