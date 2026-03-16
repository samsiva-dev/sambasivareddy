import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { Plus, ArrowLeft } from "lucide-react";
import { PostListItem } from "@/components/admin/post-list-item";

export const metadata: Metadata = { title: "Manage Posts" };

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { tags: true, author: { select: { name: true } } },
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
            <p className="text-muted-foreground mt-1">{posts.length} total posts</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/new-post">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">No posts yet</p>
              <Button asChild>
                <Link href="/admin/new-post">Create your first post</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {posts.map((post) => (
                <PostListItem key={post.id} post={post} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
