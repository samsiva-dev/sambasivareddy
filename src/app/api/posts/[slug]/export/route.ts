import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import TurndownService from "turndown";

// GET /api/posts/[slug]/export - Export a post as Markdown with frontmatter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const post = await prisma.post.findUnique({
      where: { slug },
      include: { tags: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Convert HTML content to Markdown
    const turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    const markdown = turndown.turndown(post.content);

    // Build frontmatter
    const frontmatter: Record<string, unknown> = {
      title: post.title,
      slug: post.slug,
      published: post.published,
      featured: post.featured,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };

    if (post.excerpt) frontmatter.excerpt = post.excerpt;
    if (post.coverImage) frontmatter.coverImage = post.coverImage;
    if (post.tags.length > 0) frontmatter.tags = post.tags.map((t) => t.name);
    if (post.metaTitle) frontmatter.metaTitle = post.metaTitle;
    if (post.metaDescription) frontmatter.metaDescription = post.metaDescription;
    if (post.ogImage) frontmatter.ogImage = post.ogImage;
    if (post.publishAt) frontmatter.publishAt = post.publishAt.toISOString();

    // Build YAML frontmatter manually to avoid extra dependency
    const yamlLines = ["---"];
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        yamlLines.push(`${key}:`);
        value.forEach((v) => yamlLines.push(`  - "${String(v).replace(/"/g, '\\"')}"`));
      } else if (typeof value === "string") {
        yamlLines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    }
    yamlLines.push("---");

    const fileContent = yamlLines.join("\n") + "\n\n" + markdown;

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="${post.slug}.md"`,
      },
    });
  } catch (error) {
    console.error("Error exporting post:", error);
    return NextResponse.json({ error: "Failed to export post" }, { status: 500 });
  }
}
