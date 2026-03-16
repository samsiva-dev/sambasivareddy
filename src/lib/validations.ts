import { z } from "zod";

export const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
});

export const subscriberSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type PostInput = z.infer<typeof postSchema>;
export type SubscriberInput = z.infer<typeof subscriberSchema>;
