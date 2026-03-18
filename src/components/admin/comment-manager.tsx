"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Comment {
  id: string;
  name: string;
  email: string;
  content: string;
  approved: boolean;
  createdAt: string;
  post: { title: string; slug: string };
}

export function CommentManager() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comments?status=${filter}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const handleApprove = async (id: string, approved: boolean) => {
    setActionInProgress(id);
    try {
      await fetch("/api/admin/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approved }),
      });
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, approved } : c))
      );
    } catch {
      // ignore
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment permanently?")) return;
    setActionInProgress(id);
    try {
      await fetch(`/api/admin/comments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["pending", "approved", "all"] as const).map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No {filter !== "all" ? filter : ""} comments</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{comment.name}</span>
                      <span className="text-xs text-muted-foreground">{comment.email}</span>
                      <Badge variant={comment.approved ? "default" : "secondary"}>
                        {comment.approved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(comment.createdAt)}</span>
                      <span>on</span>
                      <Link
                        href={`/blog/${comment.post.slug}`}
                        className="text-primary hover:underline truncate max-w-[200px]"
                      >
                        {comment.post.title}
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!comment.approved ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Approve"
                        onClick={() => handleApprove(comment.id, true)}
                        disabled={actionInProgress === comment.id}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Unapprove"
                        onClick={() => handleApprove(comment.id, false)}
                        disabled={actionInProgress === comment.id}
                      >
                        <XCircle className="h-4 w-4 text-yellow-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      onClick={() => handleDelete(comment.id)}
                      disabled={actionInProgress === comment.id}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
