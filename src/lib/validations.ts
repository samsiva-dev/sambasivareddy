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
  publishAt: z.string().optional().or(z.literal("")), // ISO date string or empty
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  seriesId: z.string().optional().or(z.literal("")),
  seriesOrder: z.number().int().min(1).optional(),
});

export const subscriberSchema = z.object({
  email: z.string().email("Invalid email address"),
  interests: z.array(z.string()).default([]),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(5000),
});

export const commentSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  content: z.string().min(1, "Comment is required").max(2000),
  parentId: z.string().optional(),
});

export type PostInput = z.infer<typeof postSchema>;
export type SubscriberInput = z.infer<typeof subscriberSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
