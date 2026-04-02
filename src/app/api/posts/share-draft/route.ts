import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

// POST /api/posts/share-draft - Create or get existing draft share link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postId, email } = body;

    if (!postId || !email) {
      return NextResponse.json(
        { error: "Post ID and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if share already exists for this email and post
    const existingShare = await prisma.draftShare.findUnique({
      where: {
        postId_email: {
          postId,
          email: email.toLowerCase(),
        },
      },
    });

    if (existingShare && existingShare.expiresAt > new Date()) {
      // Return existing non-expired share
      return NextResponse.json({
        share: existingShare,
        shareUrl: `${process.env.NEXTAUTH_URL || ""}/draft/${existingShare.token}`,
      });
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create or update the share
    const draftShare = await prisma.draftShare.upsert({
      where: {
        postId_email: {
          postId,
          email: email.toLowerCase(),
        },
      },
      update: {
        token,
        expiresAt,
        viewedAt: null,
      },
      create: {
        postId,
        email: email.toLowerCase(),
        token,
        expiresAt,
      },
    });

    return NextResponse.json({
      share: draftShare,
      shareUrl: `${process.env.NEXTAUTH_URL || ""}/draft/${draftShare.token}`,
    });
  } catch (error) {
    console.error("Error creating draft share:", error);
    return NextResponse.json(
      { error: "Failed to create draft share" },
      { status: 500 }
    );
  }
}

// GET /api/posts/share-draft - Get all draft shares for a post
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const shares = await prisma.draftShare.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ shares });
  } catch (error) {
    console.error("Error fetching draft shares:", error);
    return NextResponse.json(
      { error: "Failed to fetch draft shares" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/share-draft - Revoke a draft share
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      return NextResponse.json(
        { error: "Share ID is required" },
        { status: 400 }
      );
    }

    await prisma.draftShare.delete({
      where: { id: shareId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft share:", error);
    return NextResponse.json(
      { error: "Failed to delete draft share" },
      { status: 500 }
    );
  }
}
