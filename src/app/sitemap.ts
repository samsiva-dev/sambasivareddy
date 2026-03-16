import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { siteConfig } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: siteConfig.url, changeFrequency: "monthly" as const, priority: 1 },
    { url: `${siteConfig.url}/about`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${siteConfig.url}/projects`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${siteConfig.url}/blog`, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${siteConfig.url}/contact`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${siteConfig.url}/resume`, changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    const blogPosts = posts.map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...blogPosts];
  } catch {
    // Database may not be reachable at build time (e.g. Railway internal network)
    return staticPages;
  }
}
