import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { commentSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { notifyNewComment } from "@/lib/notify-admin";
import { validateCsrfToken } from "@/lib/csrf";

// GET /api/posts/[slug]/comments - Get approved comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await prisma.post.findUnique({
      where: { slug, published: true },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId: post.id, approved: true, deletedAt: null },
      select: { id: true, name: true, content: true, createdAt: true, parentId: true, isAdmin: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/posts/[slug]/comments - Submit a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // const limited = rateLimit(request, { limit: 5, windowSeconds: 300 });
  // if (limited) return limited;

  try {
    const { slug } = await params;

    const post = await prisma.post.findUnique({
      where: { slug, published: true },
      select: { id: true, title: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();

    const csrfToken = body.csrfToken || request.headers.get("x-csrf-token");
    if (!await validateCsrfToken(csrfToken)) {
      return NextResponse.json({ error: "Invalid or expired CSRF token" }, { status: 403 });
    }

    const validation = commentSchema.safeParse({ ...body, postId: post.id });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, content, parentId } = validation.data;

    // If parentId is provided, validate it exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true },
      });
      if (!parentComment || parentComment.postId !== post.id) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 400 });
      }
    }

    await prisma.comment.create({
      data: { postId: post.id, name, email, content, parentId: parentId || null },
    });

    // Notify admin via Discord/Slack (fire-and-forget)
    notifyNewComment(post.title, name);

    return NextResponse.json(
      { message: "Comment submitted and awaiting moderation" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to submit comment" }, { status: 500 });
  }
}
