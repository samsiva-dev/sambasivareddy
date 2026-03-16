import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { subscriberSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = subscriberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.active) {
        return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
      }
      // Reactivate
      await prisma.subscriber.update({
        where: { email },
        data: { active: true },
      });
      return NextResponse.json({ message: "Subscription reactivated" });
    }

    await prisma.subscriber.create({ data: { email } });

    return NextResponse.json({ message: "Subscribed successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error subscribing:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
