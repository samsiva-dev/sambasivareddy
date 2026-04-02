import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// POST /api/draft/[token] - Verify email and get draft content
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find the draft share by token
    const draftShare = await prisma.draftShare.findUnique({
      where: { token },
      include: {
        post: {
          include: {
            author: { select: { name: true, image: true } },
            tags: true,
          },
        },
      },
    });

    if (!draftShare) {
      return NextResponse.json(
        { error: "Invalid or expired share link" },
        { status: 404 }
      );
    }

    // Check if share has expired
    if (draftShare.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This share link has expired" },
        { status: 410 }
      );
    }

    // Verify email matches
    if (draftShare.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "You are not authorized to view this draft" },
        { status: 403 }
      );
    }

    // Update viewedAt timestamp
    await prisma.draftShare.update({
      where: { id: draftShare.id },
      data: { viewedAt: new Date() },
    });

    return NextResponse.json({
      post: draftShare.post,
      expiresAt: draftShare.expiresAt,
    });
  } catch (error) {
    console.error("Error verifying draft access:", error);
    return NextResponse.json(
      { error: "Failed to verify access" },
      { status: 500 }
    );
  }
}

// GET /api/draft/[token] - Check if token is valid (without email verification)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Find the draft share by token
    const draftShare = await prisma.draftShare.findUnique({
      where: { token },
      select: {
        id: true,
        expiresAt: true,
        post: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!draftShare) {
      return NextResponse.json(
        { error: "Invalid share link" },
        { status: 404 }
      );
    }

    // Check if share has expired
    if (draftShare.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This share link has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      postTitle: draftShare.post.title,
      expiresAt: draftShare.expiresAt,
    });
  } catch (error) {
    console.error("Error checking draft token:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}
