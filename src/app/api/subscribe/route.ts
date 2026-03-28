import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { subscriberSchema } from "@/lib/validations";
import { resend, emailFromHello } from "@/lib/resend";
import { welcomeEmailHtml, welcomeEmailText } from "@/lib/email-templates";
import { absoluteUrl } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { notifyNewSubscriber } from "@/lib/notify-admin";
import { validateCsrfToken } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 5, windowSeconds: 300 });
  if (limited) return limited;

  try {
    const body = await request.json();

    const csrfToken = body.csrfToken || request.headers.get("x-csrf-token");
    if (!await validateCsrfToken(csrfToken)) {
      return NextResponse.json({ error: "Invalid or expired CSRF token" }, { status: 403 });
    }
    const validation = subscriberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email, interests } = validation.data;

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.active) {
        // Update interests even if already subscribed
        if (interests.length > 0) {
          await prisma.subscriber.update({
            where: { email },
            data: { interests },
          });
        }
        return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
      }
      // Reactivate
      await prisma.subscriber.update({
        where: { email },
        data: { active: true, interests },
      });

      // Send welcome-back email
      if (resend) {
        const unsubscribeUrl = absoluteUrl(
          `/api/unsubscribe?email=${encodeURIComponent(email)}&id=${existing.id}`
        );
        resend.emails
          .send({
            from: emailFromHello,
            to: email,
            subject: `Welcome back to ${"Samba Siva Reddy"}'s blog!`,
            html: welcomeEmailHtml({ unsubscribeUrl }),
            text: welcomeEmailText({ unsubscribeUrl }),
            headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
          })
          .catch((err) => console.error("Welcome-back email failed:", err));
      }

      return NextResponse.json({ message: "Subscription reactivated" });
    }

    const subscriber = await prisma.subscriber.create({ data: { email, interests } });

    // Send welcome email in the background
    if (resend) {
      const unsubscribeUrl = absoluteUrl(
        `/api/unsubscribe?email=${encodeURIComponent(email)}&id=${subscriber.id}`
      );
      resend.emails
        .send({
          from: emailFromHello,
          to: email,
          subject: `Welcome to ${"Samba Siva Reddy"}'s blog!`,
          html: welcomeEmailHtml({ unsubscribeUrl }),
          text: welcomeEmailText({ unsubscribeUrl }),
          headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
        })
        .catch((err) => console.error("Welcome email failed:", err));
    }

    notifyNewSubscriber();

    return NextResponse.json({ message: "Subscribed successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error subscribing:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
