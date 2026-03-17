import prisma from "@/lib/prisma";
import { resend, emailFromBlog } from "@/lib/resend";
import { newPostEmailHtml, newPostEmailText } from "@/lib/email-templates";
import { absoluteUrl } from "@/lib/utils";

interface NotifySubscribersParams {
  postTitle: string;
  postSlug: string;
  postExcerpt: string | null;
}

/**
 * Send an email notification to all active subscribers about a new blog post.
 * Runs in the background — does not throw on failure so it won't break the API response.
 */
export async function notifySubscribers({
  postTitle,
  postSlug,
  postExcerpt,
}: NotifySubscribersParams) {
  if (!resend) {
    console.warn("Resend not configured — skipping subscriber notifications.");
    return;
  }

  try {
    const subscribers = await prisma.subscriber.findMany({
      where: { active: true },
      select: { email: true, id: true },
    });

    if (subscribers.length === 0) return;

    const postUrl = absoluteUrl(`/blog/${postSlug}`);

    // Send in batches of 50 to respect rate limits
    const batchSize = 50;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map((subscriber) => {
          const unsubscribeUrl = absoluteUrl(
            `/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}&id=${subscriber.id}`
          );

          return resend!.emails.send({
            from: emailFromBlog,
            to: subscriber.email,
            subject: `New Post: ${postTitle}`,
            html: newPostEmailHtml({
              postTitle,
              postExcerpt: postExcerpt || "",
              postUrl,
              unsubscribeUrl,
            }),
            text: newPostEmailText({
              postTitle,
              postExcerpt: postExcerpt || "",
              postUrl,
              unsubscribeUrl,
            }),
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
            },
          });
        })
      );
    }

    console.log(`Notified ${subscribers.length} subscribers about: ${postTitle}`);
  } catch (error) {
    console.error("Error notifying subscribers:", error);
    // Don't throw — this is a background task
  }
}
