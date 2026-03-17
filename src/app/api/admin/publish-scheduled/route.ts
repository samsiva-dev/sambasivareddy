import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notifySubscribers } from "@/lib/notify-subscribers";

// POST /api/admin/publish-scheduled — publish all posts whose publishAt has passed
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find all unpublished posts whose scheduled time has passed
    const duePosts = await prisma.post.findMany({
      where: {
        published: false,
        publishAt: { lte: now },
      },
      select: { id: true, title: true, slug: true, excerpt: true },
    });

    if (duePosts.length === 0) {
      return NextResponse.json({
        message: "No scheduled posts are due for publishing.",
        published: 0,
      });
    }

    // Publish them all
    await prisma.post.updateMany({
      where: { id: { in: duePosts.map((p) => p.id) } },
      data: { published: true },
    });

    // Notify subscribers for each published post
    for (const post of duePosts) {
      notifySubscribers({
        postTitle: post.title,
        postSlug: post.slug,
        postExcerpt: post.excerpt,
      }).catch(console.error);
    }

    revalidatePath("/blog");

    const titles = duePosts.map((p) => p.title);

    return NextResponse.json({
      message: `Published ${duePosts.length} scheduled post${duePosts.length !== 1 ? "s" : ""}.`,
      published: duePosts.length,
      titles,
    });
  } catch (error) {
    console.error("Scheduled publish error:", error);
    return NextResponse.json({ error: "Failed to publish scheduled posts" }, { status: 500 });
  }
}
