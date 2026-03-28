import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// GET /api/admin/series — list all series
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const series = await prisma.series.findMany({
      include: {
        posts: {
          where: { deletedAt: null },
          select: { id: true, title: true, slug: true, seriesOrder: true, published: true },
          orderBy: { seriesOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ series });
  } catch (error) {
    console.error("Error fetching series:", error);
    return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 });
  }
}

// POST /api/admin/series — create a new series
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = slugify(title.trim());

    const existing = await prisma.series.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A series with this title already exists" }, { status: 409 });
    }

    const series = await prisma.series.create({
      data: {
        title: title.trim(),
        slug,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    console.error("Error creating series:", error);
    return NextResponse.json({ error: "Failed to create series" }, { status: 500 });
  }
}
