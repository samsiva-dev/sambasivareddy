import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const webmentionSchema = z.object({
  source: z.string().url("Invalid source URL"),
  target: z.string().url("Invalid target URL"),
});

// POST /api/webmention — receive incoming webmention
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const contentType = request.headers.get("content-type") || "";
    let source: string;
    let target: string;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      source = formData.get("source") as string;
      target = formData.get("target") as string;
    } else {
      const body = await request.json();
      source = body.source;
      target = body.target;
    }

    const validation = webmentionSchema.safeParse({ source, target });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Extract slug from target URL
    const targetUrl = new URL(validation.data.target);
    const pathMatch = targetUrl.pathname.match(/^\/blog\/([^/]+)\/?$/);

    if (!pathMatch) {
      return NextResponse.json(
        { error: "Target must be a blog post URL" },
        { status: 400 }
      );
    }

    const slug = pathMatch[1];

    // Verify the post exists
    const post = await prisma.post.findUnique({
      where: { slug, published: true },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Target post not found" }, { status: 404 });
    }

    // Fetch the source page to verify backlink and extract metadata
    let authorName: string | null = null;
    let authorUrl: string | null = null;
    let mentionContent: string | null = null;
    let mentionType = "mention";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const sourceRes = await fetch(validation.data.source, {
        signal: controller.signal,
        headers: { "User-Agent": "Webmention-Verifier/1.0" },
      });
      clearTimeout(timeout);

      if (!sourceRes.ok) {
        return NextResponse.json(
          { error: "Could not fetch source URL" },
          { status: 400 }
        );
      }

      const html = await sourceRes.text();

      // Verify the source actually links to the target
      if (!html.includes(validation.data.target)) {
        return NextResponse.json(
          { error: "Source does not link to target" },
          { status: 400 }
        );
      }

      // Simple h-card parsing for author info
      const nameMatch = html.match(/<[^>]*class="[^"]*p-name[^"]*"[^>]*>([^<]+)</);
      if (nameMatch) authorName = nameMatch[1].trim();

      const urlMatch = html.match(/<a[^>]*class="[^"]*u-url[^"]*"[^>]*href="([^"]+)"/);
      if (urlMatch) authorUrl = urlMatch[1];

      // Detect mention type from h-entry classes
      if (html.includes("u-like-of")) mentionType = "like";
      else if (html.includes("u-repost-of")) mentionType = "repost";
      else if (html.includes("u-in-reply-to")) mentionType = "reply";

      // Extract content (e-content)
      const contentMatch = html.match(/<[^>]*class="[^"]*e-content[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/);
      if (contentMatch) {
        // Strip HTML tags and limit length
        mentionContent = contentMatch[1]
          .replace(/<[^>]*>/g, "")
          .trim()
          .slice(0, 500);
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to verify source URL" },
        { status: 400 }
      );
    }

    // Upsert the webmention
    await prisma.webmention.upsert({
      where: {
        source_target: {
          source: validation.data.source,
          target: validation.data.target,
        },
      },
      create: {
        source: validation.data.source,
        target: validation.data.target,
        postId: post.id,
        type: mentionType,
        authorName,
        authorUrl,
        content: mentionContent,
        verified: true,
      },
      update: {
        type: mentionType,
        authorName,
        authorUrl,
        content: mentionContent,
        verified: true,
      },
    });

    return NextResponse.json({ status: "accepted" }, { status: 202 });
  } catch (error) {
    console.error("Webmention error:", error);
    return NextResponse.json({ error: "Failed to process webmention" }, { status: 500 });
  }
}

// GET /api/webmention?target=URL — get webmentions for a target URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("target");
    const slug = searchParams.get("slug");

    if (!target && !slug) {
      return NextResponse.json(
        { error: "Either 'target' or 'slug' parameter is required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { verified: true };
    if (target) where.target = target;
    if (slug) where.post = { slug };

    const webmentions = await prisma.webmention.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        source: true,
        type: true,
        authorName: true,
        authorUrl: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ webmentions });
  } catch (error) {
    console.error("Webmention fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch webmentions" }, { status: 500 });
  }
}
