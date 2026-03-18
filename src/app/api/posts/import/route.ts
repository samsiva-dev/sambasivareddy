import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

// POST /api/posts/import - Parse a Markdown file and return post data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".md") && !file.name.endsWith(".mdx")) {
      return NextResponse.json(
        { error: "Only .md and .mdx files are supported" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const { data: frontmatter, content: markdownContent } = matter(text);

    // Convert markdown to HTML
    const result = await remark().use(remarkHtml, { sanitize: false }).process(markdownContent);
    const htmlContent = result.toString();

    // Build post data from frontmatter
    const postData = {
      title: frontmatter.title || file.name.replace(/\.mdx?$/, ""),
      slug: frontmatter.slug || "",
      content: htmlContent,
      excerpt: frontmatter.excerpt || frontmatter.description || "",
      coverImage: frontmatter.coverImage || frontmatter.cover_image || frontmatter.image || "",
      published: frontmatter.published ?? false,
      featured: frontmatter.featured ?? false,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      publishAt: frontmatter.publishAt || "",
      metaTitle: frontmatter.metaTitle || "",
      metaDescription: frontmatter.metaDescription || frontmatter.description || "",
      ogImage: frontmatter.ogImage || "",
    };

    return NextResponse.json({ postData });
  } catch (error) {
    console.error("Error importing markdown:", error);
    return NextResponse.json({ error: "Failed to parse markdown file" }, { status: 500 });
  }
}
