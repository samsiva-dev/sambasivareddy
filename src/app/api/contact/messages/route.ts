import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isValidRevealToken } from "@/app/api/admin/verify-email/route";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(0, local.length - 2))}@${domain}`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const revealToken = searchParams.get("reveal");

  const adminEmail = session.user?.email || "";
  const revealed = revealToken ? isValidRevealToken(adminEmail, revealToken) : false;

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const maskedMessages = messages.map((m) => ({
    ...m,
    email: revealed ? m.email : maskEmail(m.email),
  }));

  return NextResponse.json({ messages: maskedMessages, revealed });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, read } = await request.json();

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { read },
    });

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    await prisma.contactMessage.delete({ where: { id } });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
