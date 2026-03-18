import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/subscribers - List all subscribers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "active" | "inactive" | "all"
    const format = searchParams.get("format"); // "csv" for export

    const where: any = {};
    if (status === "active") where.active = true;
    else if (status === "inactive") where.active = false;

    const subscribers = await prisma.subscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // CSV export
    if (format === "csv") {
      const csvRows = ["email,subscribed_date,status"];
      for (const sub of subscribers) {
        csvRows.push(
          `${sub.email},${sub.createdAt.toISOString()},${sub.active ? "active" : "inactive"}`
        );
      }
      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const counts = await Promise.all([
      prisma.subscriber.count({ where: { active: true } }),
      prisma.subscriber.count({ where: { active: false } }),
    ]);

    return NextResponse.json({
      subscribers,
      counts: { active: counts[0], inactive: counts[1], total: counts[0] + counts[1] },
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

// DELETE /api/admin/subscribers - Remove a subscriber
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Subscriber ID required" }, { status: 400 });
    }

    await prisma.subscriber.delete({ where: { id } });

    return NextResponse.json({ message: "Subscriber removed" });
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 });
  }
}

// PATCH /api/admin/subscribers - Toggle active/inactive
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, active } = await request.json();

    if (!id || typeof active !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.update({
      where: { id },
      data: { active },
    });

    return NextResponse.json({ subscriber });
  } catch (error) {
    console.error("Error updating subscriber:", error);
    return NextResponse.json({ error: "Failed to update subscriber" }, { status: 500 });
  }
}
