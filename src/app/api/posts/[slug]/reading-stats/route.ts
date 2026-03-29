import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/posts/[slug]/reading-stats — track reading analytics
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // const limited = rateLimit(request, { limit: 10, windowSeconds: 60 });
  // if (limited) return limited;

  try {
    const { slug } = await params;
    const body = await request.json();
    const { scrollDepth, timeOnPage, completed } = body;

    // Validate input
    const depth = Math.min(Math.max(Number(scrollDepth) || 0, 0), 100);
    const time = Math.min(Math.max(Math.round(Number(timeOnPage) || 0), 0), 3600); // cap at 1 hour
    const isCompleted = depth >= 90;
    const isBounce = time < 10 && depth < 20;

    const post = await prisma.post.findUnique({
      where: { slug, published: true, deletedAt: null },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert reading stat for today
    const existing = await prisma.readingStat.findUnique({
      where: { postId_date: { postId: post.id, date: today } },
    });

    if (existing) {
      const newTotal = existing.totalReads + 1;
      // Running average for scroll depth and time
      const newAvgDepth =
        (existing.avgScrollDepth * existing.totalReads + depth) / newTotal;
      const newAvgTime =
        (existing.avgTimeOnPage * existing.totalReads + time) / newTotal;

      await prisma.readingStat.update({
        where: { id: existing.id },
        data: {
          avgScrollDepth: Math.round(newAvgDepth * 100) / 100,
          avgTimeOnPage: Math.round(newAvgTime),
          totalReads: newTotal,
          bounces: isBounce ? existing.bounces + 1 : existing.bounces,
          completions: isCompleted ? existing.completions + 1 : existing.completions,
        },
      });
    } else {
      await prisma.readingStat.create({
        data: {
          postId: post.id,
          date: today,
          avgScrollDepth: depth,
          avgTimeOnPage: time,
          totalReads: 1,
          bounces: isBounce ? 1 : 0,
          completions: isCompleted ? 1 : 0,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording reading stats:", error);
    return NextResponse.json({ error: "Failed to record stats" }, { status: 500 });
  }
}
