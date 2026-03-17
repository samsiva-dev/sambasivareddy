import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit Post",
};

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!post) {
    notFound();
  }

  return (
    <PostForm
      initialData={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || "",
        coverImage: post.coverImage || "",
        published: post.published,
        featured: post.featured,
        publishAt: post.publishAt ? new Date(post.publishAt).toISOString().slice(0, 16) : "",
        tags: post.tags,
        metaTitle: post.metaTitle || "",
        metaDescription: post.metaDescription || "",
        ogImage: post.ogImage || "",
      }}
    />
  );
}
