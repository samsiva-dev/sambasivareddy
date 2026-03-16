import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { postSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// GET /api/posts - Get all posts (public: published only, admin: all)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.role === "admin";

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const all = searchParams.get("all") === "true";
    const skip = (page - 1) * limit;

    const where: any = {};

    // Only show published posts to non-admin users
    if (!isAdmin || !all) {
      where.published = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tag) {
      where.tags = { some: { slug: tag } };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { name: true, image: true } },
          tags: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST /api/posts - Create a new post (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = postSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { tags: tagNames, ...postData } = validation.data;

    // Generate slug if not provided
    if (!postData.slug) {
      postData.slug = slugify(postData.title);
    }

    // Check if slug already exists
    const existingPost = await prisma.post.findUnique({
      where: { slug: postData.slug },
    });

    if (existingPost) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }

    // Create or connect tags
    const tagConnections = await Promise.all(
      tagNames.map(async (name: string) => {
        const slug = slugify(name);
        const tag = await prisma.tag.upsert({
          where: { slug },
          create: { name, slug },
          update: {},
        });
        return { id: tag.id };
      })
    );

    const post = await prisma.post.create({
      data: {
        ...postData,
        coverImage: postData.coverImage || null,
        ogImage: postData.ogImage || null,
        authorId: (session.user as any).id,
        tags: { connect: tagConnections },
      },
      include: {
        author: { select: { name: true, image: true } },
        tags: true,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
