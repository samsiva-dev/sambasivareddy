import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReadingProgressBar } from "@/components/reading-progress";
import { TableOfContents } from "@/components/table-of-contents";
import { NewsletterForm } from "@/components/newsletter-form";
import { siteConfig } from "@/lib/constants";
import { formatDate, calculateReadingTime, absoluteUrl } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { ArrowLeft, Clock, Calendar, Eye } from "lucide-react";
import { LikeButton } from "@/components/like-button";
import { ReactionBar } from "@/components/reaction-bar";
import { ShareButtons } from "@/components/share-buttons";
import { BookmarkButton } from "@/components/bookmark-button";
import { ViewTracker } from "@/components/view-tracker";
import { CommentSection } from "@/components/comment-section";

export const revalidate = 60;
export const dynamicParams = true;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    include: {
      author: { select: { name: true, image: true } },
      tags: true,
    },
  });

  if (!post) return null;

  const tagIds = post.tags.map((t) => t.id);
  let relatedPosts: any[] = [];

  if (tagIds.length > 0) {
    // Fetch candidate posts that share at least one tag
    const candidates = await prisma.post.findMany({
      where: {
        published: true,
        id: { not: post.id },
        tags: { some: { id: { in: tagIds } } },
      },
      include: { tags: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    // Score by shared tag count + engagement bonus
    const scored = candidates.map((c) => {
      const sharedTags = c.tags.filter((t) => tagIds.includes(t.id)).length;
      const engagement = Math.log2((c.views || 0) + (c.likes || 0) + 2);
      return { ...c, score: sharedTags * 10 + engagement };
    });

    scored.sort((a, b) => b.score - a.score);
    relatedPosts = scored.slice(0, 3);
  }

  // Fallback: fill remaining slots with recent posts
  if (relatedPosts.length < 3) {
    const excludeIds = [post.id, ...relatedPosts.map((r) => r.id)];
    const fallback = await prisma.post.findMany({
      where: {
        published: true,
        id: { notIn: excludeIds },
      },
      include: { tags: true },
      take: 3 - relatedPosts.length,
      orderBy: { views: "desc" },
    });
    relatedPosts = [...relatedPosts, ...fallback];
  }

  return { post, relatedPosts };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);

  if (!data) {
    return { title: "Post Not Found" };
  }

  const { post } = data;

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || "",
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || "",
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name || siteConfig.name],
      url: absoluteUrl(`/blog/${post.slug}`),
      images: post.ogImage
        ? [{ url: post.ogImage, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || "",
      images: post.ogImage ? [post.ogImage] : undefined,
    },
    alternates: {
      canonical: absoluteUrl(`/blog/${post.slug}`),
    },
  };
}

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true },
    });

    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    // Database may not be reachable at build time (e.g. Railway internal network)
    return [];
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const data = await getPost(slug);

  if (!data) {
    notFound();
  }

  const { post, relatedPosts } = data;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || post.ogImage,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    url: absoluteUrl(`/blog/${post.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };

  return (
    <>
      <ViewTracker slug={slug} />
      <ReadingProgressBar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-10">
          <div className="max-w-3xl">
            {/* Header */}
            <header className="mb-8">
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                      <Badge variant="secondary">{tag.name}</Badge>
                    </Link>
                  ))}
                </div>
              )}
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-lg text-muted-foreground mb-4">{post.excerpt}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <time>{formatDate(post.createdAt)}</time>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{calculateReadingTime(post.content)}</span>
                </div>
                {post.author.name && <span>by {post.author.name}</span>}
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4 shrink-0" />
                  <span>{post.views.toLocaleString()} views</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <BookmarkButton slug={post.slug} title={post.title} />
                <ShareButtons url={absoluteUrl(`/blog/${post.slug}`)} title={post.title} />
              </div>
            </header>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="mb-8 overflow-hidden rounded-lg">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Content */}
            <div
              className="prose dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Reactions */}
            <div className="mt-12 pt-6 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Enjoyed this post?</h3>
              <ReactionBar
                slug={post.slug}
                initialReactions={{
                  heart: post.likes,
                  fire: post.reactionFire,
                  mind: post.reactionMind,
                  idea: post.reactionIdea,
                  clap: post.reactionClap,
                }}
              />
            </div>

            {/* Tags bottom */}
            {post.tags.length > 0 && (
              <div className="mt-12 pt-6 border-t">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                      <Badge variant="outline">{tag.name}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section className="mt-16">
                <h2 className="text-2xl font-bold tracking-tight mb-6">Related Posts</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((related) => (
                    <Link key={related.id} href={`/blog/${related.slug}`} className="group">
                      <Card className="h-full hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                            {related.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(related.createdAt)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Comments */}
            <CommentSection slug={slug} />

            {/* Newsletter */}
            <div className="mt-16">
              <NewsletterForm />
            </div>
          </div>

          {/* Table of Contents sidebar */}
          <TableOfContents content={post.content} />
        </div>
      </article>
    </>
  );
}
