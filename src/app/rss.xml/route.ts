import { NextResponse } from "next/server";
import { Feed } from "feed";
import prisma from "@/lib/prisma";
import { siteConfig } from "@/lib/constants";

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: { author: { select: { name: true } }, tags: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const feed = new Feed({
    title: siteConfig.title,
    description: siteConfig.description,
    id: siteConfig.url,
    link: siteConfig.url,
    language: "en",
    favicon: `${siteConfig.url}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, ${siteConfig.name}`,
    author: {
      name: siteConfig.author.name,
      email: siteConfig.author.email,
      link: siteConfig.url,
    },
  });

  posts.forEach((post) => {
    feed.addItem({
      title: post.title,
      id: `${siteConfig.url}/blog/${post.slug}`,
      link: `${siteConfig.url}/blog/${post.slug}`,
      description: post.excerpt || "",
      content: post.content,
      author: [
        {
          name: post.author.name || siteConfig.name,
          link: siteConfig.url,
        },
      ],
      date: new Date(post.createdAt),
      category: post.tags.map((t) => ({ name: t.name })),
      image: post.coverImage || undefined,
    });
  });

  return new NextResponse(feed.rss2(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
