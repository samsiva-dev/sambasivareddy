import prisma from "@/lib/prisma";
import { resend, emailFromDigest } from "@/lib/resend";
import {
  monthlyDigestEmailHtml,
  monthlyDigestEmailText,
} from "@/lib/email-templates";
import { absoluteUrl } from "@/lib/utils";
import { siteConfig } from "@/lib/constants";

interface SendDigestResult {
  sent: number;
  posts: number;
  month: string;
}

/**
 * Send a monthly digest email to all active subscribers.
 * Fetches all posts published in the given month/year.
 * Returns stats about how many emails were sent.
 */
export async function sendMonthlyDigest(
  year: number,
  month: number // 1-based (1 = January)
): Promise<SendDigestResult> {
  if (!resend) {
    throw new Error("Resend is not configured. Set RESEND_API_KEY in your environment.");
  }

  // Date range for the given month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const monthName = startDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Fetch posts published in that month
  const posts = await prisma.post.findMany({
    where: {
      published: true,
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      createdAt: true,
    },
  });

  if (posts.length === 0) {
    return { sent: 0, posts: 0, month: monthName };
  }

  // Fetch active subscribers
  const subscribers = await prisma.subscriber.findMany({
    where: { active: true },
    select: { email: true, id: true },
  });

  if (subscribers.length === 0) {
    return { sent: 0, posts: posts.length, month: monthName };
  }

  const siteUrl = siteConfig.url;

  // Send in batches of 50
  const batchSize = 50;
  let sent = 0;

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((subscriber) => {
        const unsubscribeUrl = absoluteUrl(
          `/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}&id=${subscriber.id}`
        );

        const digestPosts = posts.map((p) => ({
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          publishedAt: p.createdAt,
        }));

        return resend!.emails.send({
          from: emailFromDigest,
          to: subscriber.email,
          subject: `${monthName} Digest — ${siteConfig.name}`,
          html: monthlyDigestEmailHtml({
            month: monthName,
            posts: digestPosts,
            unsubscribeUrl,
            siteUrl,
          }),
          text: monthlyDigestEmailText({
            month: monthName,
            posts: digestPosts,
            unsubscribeUrl,
            siteUrl,
          }),
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
          },
        });
      })
    );

    sent += results.filter((r) => r.status === "fulfilled").length;
  }

  console.log(
    `Monthly digest for ${monthName}: sent to ${sent}/${subscribers.length} subscribers (${posts.length} posts)`
  );

  return { sent, posts: posts.length, month: monthName };
}
