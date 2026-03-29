import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { notifyContactMessage } from "@/lib/notify-admin";
import { validateCsrfToken } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  // const limited = rateLimit(request, { limit: 5, windowSeconds: 300 });
  // if (limited) return limited;

  try {
    const body = await request.json();

    const csrfToken = body.csrfToken || request.headers.get("x-csrf-token");
    if (!await validateCsrfToken(csrfToken)) {
      return NextResponse.json({ error: "Invalid or expired CSRF token" }, { status: 403 });
    }
    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return NextResponse.json({ error: "Invalid input", errors }, { status: 400 });
    }

    const { name, email, subject, message } = validation.data;

    const contactMessage = await prisma.contactMessage.create({
      data: { name, email, subject, message },
    });

    notifyContactMessage(name, subject);

    return NextResponse.json(
      { message: "Message sent successfully", id: contactMessage.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving contact message:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
