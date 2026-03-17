import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { siteConfig } from "@/lib/constants";
import { resend, emailFromHello } from "@/lib/resend";
import { unsubscribeEmailHtml, unsubscribeEmailText } from "@/lib/email-templates";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const id = searchParams.get("id");

  if (!email || !id) {
    return new NextResponse(unsubscribePage("Invalid unsubscribe link.", false), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { id, email },
    });

    if (!subscriber) {
      return new NextResponse(
        unsubscribePage("Subscriber not found or already unsubscribed.", false),
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    await prisma.subscriber.update({
      where: { id },
      data: { active: false },
    });

    // Send unsubscribe confirmation email
    if (resend && subscriber.email) {
      resend.emails
        .send({
          from: emailFromHello,
          to: subscriber.email,
          subject: "You've been unsubscribed",
          html: unsubscribeEmailHtml(),
          text: unsubscribeEmailText(),
        })
        .catch((err) => console.error("Unsubscribe email failed:", err));
    }

    return new NextResponse(
      unsubscribePage("You have been successfully unsubscribed.", true),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse(
      unsubscribePage("Something went wrong. Please try again.", false),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

function unsubscribePage(message: string, success: boolean): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribe - ${siteConfig.name}</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:40px; max-width:400px; text-align:center; }
    h1 { font-size:20px; color:#0f172a; margin:0 0 12px; }
    p { font-size:14px; color:#64748b; margin:0 0 24px; }
    a { display:inline-block; color:#0f172a; font-size:14px; font-weight:500; text-decoration:underline; }
    .icon { font-size:40px; margin-bottom:16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "✓" : "✗"}</div>
    <h1>${success ? "Unsubscribed" : "Error"}</h1>
    <p>${message}</p>
    <a href="${siteConfig.url}">← Back to ${siteConfig.name}</a>
  </div>
</body>
</html>`.trim();
}
