import prisma from "@/lib/prisma";
import { resend, emailFromNotify } from "@/lib/resend";
import {
  commentReplyEmailHtml,
  commentReplyEmailText,
} from "@/lib/email-templates";
import { absoluteUrl } from "@/lib/utils";

interface NotifyCommentReplyParams {
  parentCommentId: string;
  replierName: string;
  replyContent: string;
  postSlug: string;
  postTitle: string;
  isAdminReply: boolean;
}

/**
 * Send an email to the parent commenter when someone replies.
 *
 * Safeguards:
 *  - Only notifies if `notifyReply` is true on the parent comment
 *  - Skips self-replies (same email)
 *  - Fire-and-forget — errors are logged but never thrown
 */
export async function notifyCommentReply({
  parentCommentId,
  replierName,
  replyContent,
  postSlug,
  postTitle,
  isAdminReply,
}: NotifyCommentReplyParams) {
  if (!resend) {
    console.warn("Resend not configured — skipping reply notification.");
    return;
  }

  try {
    const parent = await prisma.comment.findUnique({
      where: { id: parentCommentId },
      select: { name: true, email: true, notifyReply: true },
    });

    if (!parent || !parent.notifyReply) return;

    // Don't notify if the admin is replying to their own comment
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    if (parent.email.toLowerCase() === adminEmail && isAdminReply) return;

    const postUrl = absoluteUrl(`/blog/${postSlug}#comments`);

    await resend.emails.send({
      from: emailFromNotify,
      to: parent.email,
      subject: `${replierName} replied to your comment on "${postTitle}"`,
      html: commentReplyEmailHtml({
        commenterName: parent.name,
        replierName,
        replyContent,
        postTitle,
        postUrl,
        isAdminReply,
      }),
      text: commentReplyEmailText({
        commenterName: parent.name,
        replierName,
        replyContent,
        postTitle,
        postUrl,
        isAdminReply,
      }),
    });
  } catch (error) {
    console.error("Failed to send comment reply notification:", error);
  }
}
