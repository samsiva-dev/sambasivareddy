import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { NewsletterForm } from "@/components/newsletter-form";
import { siteConfig } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { BlogSearch } from "@/components/blog-search";
import { BlogPostList } from "@/components/blog-post-list";
import { publishDueScheduledPosts } from "@/lib/publish-scheduled";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: `Technical articles and thoughts by ${siteConfig.author.name} on software engineering, web development, and technology.`,
};

interface BlogPageProps {
  searchParams: Promise<{ page?: string; tag?: string; search?: string }>;
}

async function getPosts(page: number, tag?: string, search?: string) {
  // Auto-publish any due scheduled posts before fetching
  await publishDueScheduledPosts();

  const limit = 10;
  const skip = (page - 1) * limit;

  const where: any = { published: true, deletedAt: null };

  if (tag) {
    where.tags = { some: { slug: tag } };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { name: true, image: true } },
          tags: true,
          series: { select: { title: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return { posts, total, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return { posts: [], total: 0, totalPages: 0 };
  }
}

async function getTags() {
  try {
    return await prisma.tag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return [];
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const tag = params.tag;
  const search = params.search;

  const [{ posts, total, totalPages }, tags] = await Promise.all([
    getPosts(page, tag, search),
    getTags(),
  ]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <h1 className="text-4xl font-bold tracking-tight mb-4">Blog</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Thoughts on software engineering, web development, technology, books, personal growth, and more.
      </p>

      {/* Search */}
      <BlogSearch initialSearch={search} />

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/blog">
            <Badge variant={!tag ? "default" : "outline"} className="cursor-pointer">
              All
            </Badge>
          </Link>
          {tags.map((t) => (
            <Link key={t.id} href={`/blog?tag=${t.slug}`}>
              <Badge
                variant={tag === t.slug ? "default" : "outline"}
                className="cursor-pointer"
              >
                {t.name} ({t._count.posts})
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Posts — infinite scroll */}
      <BlogPostList
        initialPosts={JSON.parse(JSON.stringify(posts))}
        initialTotal={total}
        tag={tag}
        search={search}
      />

      {/* Newsletter */}
      <div className="mt-16">
        <NewsletterForm />
      </div>
    </div>
  );
}
