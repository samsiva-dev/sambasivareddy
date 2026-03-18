"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Comment {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/posts/${encodeURIComponent(slug)}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setMessage({ type: "success", text: "Comment submitted! It will appear after moderation." });
      setName("");
      setEmail("");
      setContent("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to submit comment" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 pt-8 border-t">
      <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
        <MessageCircle className="h-6 w-6" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6 mb-10">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{comment.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mb-8">No comments yet. Be the first!</p>
      )}

      {/* Comment form */}
      <div className="rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Leave a comment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="comment-name">Name</Label>
              <Input
                id="comment-name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment-email">Email</Label>
              <Input
                id="comment-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Not displayed publicly</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment-content">Comment</Label>
            <Textarea
              id="comment-content"
              placeholder="Write your comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              maxLength={2000}
              rows={4}
            />
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="mr-2 h-4 w-4" />
            )}
            Post Comment
          </Button>
        </form>
      </div>
    </section>
  );
}
