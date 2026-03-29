import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/posts/[slug]/views — get view count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { views: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ views: post.views });
  } catch (error) {
    console.error("Error fetching views:", error);
    return NextResponse.json({ error: "Failed to fetch views" }, { status: 500 });
  }
}

// POST /api/posts/[slug]/views — increment view count
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Rate limiting disabled — low traffic, uncomment when needed
  // const limited = rateLimit(request, { limit: 100, windowSeconds: 60 });
  // if (limited) return limited;

  try {
    const { slug } = await params;

    const post = await prisma.post.update({
      where: { slug },
      data: { views: { increment: 1 } },
      select: { views: true, id: true },
    });

    // Record daily view stat for analytics trends
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    prisma.dailyViewStat.upsert({
      where: { postId_date: { postId: post.id, date: today } },
      create: { postId: post.id, date: today, views: 1 },
      update: { views: { increment: 1 } },
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json({ views: post.views });
  } catch (error) {
    console.error("Error incrementing views:", error);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
