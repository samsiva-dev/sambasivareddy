import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { postSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { notifySubscribers } from "@/lib/notify-subscribers";
import { sanitizeContent } from "@/lib/sanitize";

// PUT /api/posts/edit/[id] - Update a post (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = postSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { tags: tagNames, publishAt, ...postData } = validation.data;

    // Sanitize HTML content
    postData.content = sanitizeContent(postData.content);

    const publishAtDate = publishAt ? new Date(publishAt) : null;

    if (publishAtDate && publishAtDate > new Date()) {
      postData.published = false;
    }

    // Check if post exists
    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...postData,
        coverImage: postData.coverImage || null,
        ogImage: postData.ogImage || null,
        publishAt: publishAtDate,
        tags: {
          set: [],
          connect: tagConnections,
        },
      },
      include: {
        author: { select: { name: true, image: true } },
        tags: true,
      },
    });

    // Revalidate blog pages so changes appear immediately
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    if (existingPost.slug !== post.slug) {
      revalidatePath(`/blog/${existingPost.slug}`);
    }

    // Notify subscribers if post was just published (draft → published)
    if (post.published && !existingPost.published) {
      notifySubscribers({
        postTitle: post.title,
        postSlug: post.slug,
        postExcerpt: post.excerpt,
      }).catch(console.error);
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// DELETE /api/posts/edit/[id] - Delete a post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.post.delete({ where: { id } });

    revalidatePath("/blog");
    revalidatePath(`/blog/${existingPost.slug}`);

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
