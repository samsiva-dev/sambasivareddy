import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isValidRevealToken } from "@/app/api/admin/verify-email/route";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(0, local.length - 2))}@${domain}`;
}

// GET /api/admin/comments - List all comments (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "pending" | "approved" | "all"
    const revealToken = searchParams.get("reveal");

    const adminEmail = session.user?.email || "";
    const revealed = revealToken ? isValidRevealToken(adminEmail, revealToken) : false;

    const where: any = {};
    if (status === "pending") where.approved = false;
    else if (status === "approved") where.approved = true;

    const comments = await prisma.comment.findMany({
      where,
      include: {
        post: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const maskedComments = comments.map((c) => ({
      ...c,
      email: revealed ? c.email : maskEmail(c.email),
    }));

    return NextResponse.json({ comments: maskedComments, revealed });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// PATCH /api/admin/comments - Approve/unapprove a comment
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, approved } = await request.json();

    if (!id || typeof approved !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { approved },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

// DELETE /api/admin/comments - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
    }

    await prisma.comment.delete({ where: { id } });

    return NextResponse.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
