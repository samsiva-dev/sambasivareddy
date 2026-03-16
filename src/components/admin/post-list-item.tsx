"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, ExternalLink } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: Date;
  tags: { id: string; name: string; slug: string }[];
  author: { name: string | null };
}

export function PostListItem({ post }: { post: Post }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/edit/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete post");
      }
    } catch {
      alert("Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium truncate">{post.title}</h3>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
              post.published
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            }`}
          >
            {post.published ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          {post.tags.length > 0 && (
            <>
              <span>·</span>
              <div className="flex gap-1">
                {post.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-xs py-0 px-1">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 ml-4">
        {post.published && (
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/blog/${post.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/admin/edit/${post.id}`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
