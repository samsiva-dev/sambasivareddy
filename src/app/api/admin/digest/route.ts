import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMonthlyDigest } from "@/lib/send-digest";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { year, month } = body;

    // Validate input
    const y = Number(year);
    const m = Number(month);

    if (!y || !m || m < 1 || m > 12 || y < 2020 || y > 2100) {
      return NextResponse.json(
        { error: "Invalid year or month. Month must be 1-12." },
        { status: 400 }
      );
    }

    const result = await sendMonthlyDigest(y, m);

    if (result.posts === 0) {
      return NextResponse.json(
        {
          message: `No published posts found for ${result.month}. Digest not sent.`,
          ...result,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: `Digest for ${result.month} sent to ${result.sent} subscriber${result.sent !== 1 ? "s" : ""} (${result.posts} post${result.posts !== 1 ? "s" : ""}).`,
      ...result,
    });
  } catch (error) {
    console.error("Digest send error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send digest";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
