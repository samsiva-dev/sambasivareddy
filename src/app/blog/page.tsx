import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NewsletterForm } from "@/components/newsletter-form";
import { siteConfig } from "@/lib/constants";
import { formatDate, calculateReadingTime } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { Clock, Search } from "lucide-react";
import { BlogSearch } from "@/components/blog-search";

export const metadata: Metadata = {
  title: "Blog",
  description: `Technical articles and thoughts by ${siteConfig.author.name} on software engineering, web development, and technology.`,
};

interface BlogPageProps {
  searchParams: Promise<{ page?: string; tag?: string; search?: string }>;
}

async function getPosts(page: number, tag?: string, search?: string) {
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: any = { published: true };

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
        Thoughts on software engineering, web development, and technology.
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

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {search ? `No posts found for "${search}"` : "No posts yet. Check back soon!"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.id}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <Card className="hover:shadow-md transition-all border-transparent hover:border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <time>{formatDate(post.createdAt)}</time>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {calculateReadingTime(post.content)}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold group-hover:text-primary transition-colors mb-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>
                    )}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.map((t) => (
                          <Badge key={t.id} variant="secondary" className="text-xs">
                            {t.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          {page > 1 && (
            <Link
              href={`/blog?page=${page - 1}${tag ? `&tag=${tag}` : ""}${search ? `&search=${search}` : ""}`}
              className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/blog?page=${page + 1}${tag ? `&tag=${tag}` : ""}${search ? `&search=${search}` : ""}`}
              className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}

      {/* Newsletter */}
      <div className="mt-16">
        <NewsletterForm />
      </div>
    </div>
  );
}
