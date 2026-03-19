import prisma from "@/lib/prisma";
import { notifySubscribers } from "@/lib/notify-subscribers";
import { notifyScheduledPublished } from "@/lib/notify-admin";

let lastCheck = 0;
const CHECK_INTERVAL_MS = 60_000; // at most once per minute

/**
 * Lightweight check that publishes any scheduled posts whose publishAt
 * has passed. Called from server-rendered blog pages to ensure posts
 * go live without relying solely on an external cron service.
 *
 * Throttled to run at most once per minute per server instance.
 */
export async function publishDueScheduledPosts(): Promise<void> {
  const now = Date.now();
  if (now - lastCheck < CHECK_INTERVAL_MS) return;
  lastCheck = now;

  try {
    const duePosts = await prisma.post.findMany({
      where: {
        published: false,
        publishAt: { not: null, lte: new Date() },
      },
      select: { id: true, title: true, slug: true, excerpt: true },
    });

    if (duePosts.length === 0) return;

    await prisma.post.updateMany({
      where: { id: { in: duePosts.map((p) => p.id) } },
      data: { published: true },
    });

    // Send newsletter emails to subscribers
    for (const post of duePosts) {
      notifySubscribers({
        postTitle: post.title,
        postSlug: post.slug,
        postExcerpt: post.excerpt,
      }).catch(console.error);
    }

    // Notify admin via Discord/Slack
    notifyScheduledPublished(duePosts.map((p) => p.title));
  } catch (error) {
    // Silent — non-critical path; next request will retry
    console.error("Auto-publish check failed:", error);
  }
}
