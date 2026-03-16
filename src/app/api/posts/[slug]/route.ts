import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/posts/[slug] - Get a single post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: { select: { name: true, image: true } },
        tags: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get related posts (same tags)
    const relatedPosts = await prisma.post.findMany({
      where: {
        published: true,
        id: { not: post.id },
        tags: {
          some: {
            id: { in: post.tags.map((t) => t.id) },
          },
        },
      },
      include: {
        tags: true,
        author: { select: { name: true, image: true } },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ post, relatedPosts });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}
