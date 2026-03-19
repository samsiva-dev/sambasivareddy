import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { notifySubscribers } from "@/lib/notify-subscribers";

// GET /api/cron/publish-scheduled — cron-safe endpoint (no session required)
// Secured via CRON_SECRET header or query param
export async function GET(request: NextRequest) {
  // Verify authorization via secret token
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const providedSecret =
    authHeader?.replace("Bearer ", "") || querySecret;

  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const duePosts = await prisma.post.findMany({
      where: {
        published: false,
        publishAt: { not: null, lte: now },
      },
      select: { id: true, title: true, slug: true, excerpt: true },
    });

    if (duePosts.length === 0) {
      return NextResponse.json({ message: "No posts due", published: 0 });
    }

    await prisma.post.updateMany({
      where: { id: { in: duePosts.map((p) => p.id) } },
      data: { published: true },
    });

    for (const post of duePosts) {
      notifySubscribers({
        postTitle: post.title,
        postSlug: post.slug,
        postExcerpt: post.excerpt,
      }).catch(console.error);
    }

    revalidatePath("/blog");

    return NextResponse.json({
      message: `Published ${duePosts.length} post(s)`,
      published: duePosts.length,
      titles: duePosts.map((p) => p.title),
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish scheduled posts" },
      { status: 500 }
    );
  }
}
