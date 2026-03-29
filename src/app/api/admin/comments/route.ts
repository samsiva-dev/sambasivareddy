import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isValidRevealToken } from "@/app/api/admin/verify-email/route";
import { notifyCommentReply } from "@/lib/notify-comment-reply";

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

    const { id, approved, restore } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const data: any = {};
    if (typeof approved === "boolean") data.approved = approved;
    if (restore === true) data.deletedAt = null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data,
      include: { post: { select: { title: true, slug: true } } },
    });

    // When approving a reply, notify the parent commenter (fire-and-forget)
    if (approved === true && comment.parentId) {
      notifyCommentReply({
        parentCommentId: comment.parentId,
        replierName: comment.name,
        replyContent: comment.content,
        postSlug: comment.post.slug,
        postTitle: comment.post.title,
        isAdminReply: comment.isAdmin,
      }).catch(() => {});
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

// POST /api/admin/comments - Admin reply to a comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { parentId, content } = await request.json();

    if (!parentId || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "parentId and content are required" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Reply too long (max 2000 chars)" }, { status: 400 });
    }

    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, postId: true, post: { select: { title: true, slug: true } } },
    });

    if (!parentComment) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
    }

    const adminName = session.user?.name || "Admin";
    const adminEmail = session.user?.email || "";

    const reply = await prisma.comment.create({
      data: {
        postId: parentComment.postId,
        parentId,
        name: adminName,
        email: adminEmail,
        content: content.trim(),
        isAdmin: true,
        approved: true, // admin replies are auto-approved
      },
    });

    // Notify the parent commenter (fire-and-forget)
    notifyCommentReply({
      parentCommentId: parentId,
      replierName: adminName,
      replyContent: content.trim(),
      postSlug: parentComment.post.slug,
      postTitle: parentComment.post.title,
      isAdminReply: true,
    }).catch(() => {});

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("Error creating admin reply:", error);
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 });
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

    await prisma.comment.update({ where: { id }, data: { deletedAt: new Date() } });

    return NextResponse.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
