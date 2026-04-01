"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Loader2, Reply, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Comment {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  isAdmin?: boolean;
  replies?: Comment[];
}

function CommentThread({
  comment,
  slug,
  depth = 0,
}: {
  comment: Comment;
  slug: string;
  depth?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-muted pl-4" : ""}>
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{comment.name}</span>
            {comment.isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <ShieldCheck className="h-3 w-3" />
                Author
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {comment.content}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {depth < 3 && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
          )}
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {comment.replies!.length} {comment.replies!.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
      </div>

      {showReplyForm && (
        <div className="mt-2">
          <CommentForm slug={slug} parentId={comment.id} onSuccess={() => setShowReplyForm(false)} compact />
        </div>
      )}

      {hasReplies && showReplies && (
        <div className="mt-3 space-y-3">
          {comment.replies!.map((reply) => (
            <CommentThread key={reply.id} comment={reply} slug={slug} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentForm({
  slug,
  parentId,
  onSuccess,
  compact,
}: {
  slug: string;
  parentId?: string;
  onSuccess?: () => void;
  compact?: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check — bots fill this hidden field
    if (honeypot) return;

    setSubmitting(true);
    setMessage(null);

    try {
      // Fetch CSRF token
      const csrfRes = await fetch("/api/csrf");
      const { token: csrfToken } = await csrfRes.json();

      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, content, parentId, csrfToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setMessage({ type: "success", text: "Your comment is under review by the admin. We\u2019ll confirm once it\u2019s approved and visible." });
      setName("");
      setEmail("");
      setContent("");
      onSuccess?.();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to submit comment" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={compact ? "rounded-lg border p-4" : "rounded-lg border p-6"}>
      {!compact && <h3 className="font-semibold mb-4">Leave a comment</h3>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot — hidden from users, visible to bots */}
        <div className="absolute opacity-0 h-0 w-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`comment-name${parentId || ""}`}>Name</Label>
            <Input
              id={`comment-name${parentId || ""}`}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`comment-email${parentId || ""}`}>Email</Label>
            <Input
              id={`comment-email${parentId || ""}`}
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
          <Label htmlFor={`comment-content${parentId || ""}`}>Comment</Label>
          <Textarea
            id={`comment-content${parentId || ""}`}
            placeholder={parentId ? "Write your reply..." : "Write your comment..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            maxLength={2000}
            rows={compact ? 3 : 4}
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

        <Button type="submit" disabled={submitting} size={compact ? "sm" : "default"}>
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="mr-2 h-4 w-4" />
          )}
          {parentId ? "Post Reply" : "Post Comment"}
        </Button>
      </form>
    </div>
  );
}

export function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts/${encodeURIComponent(slug)}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  // Build tree from flat list
  const buildTree = (flatComments: Comment[]): Comment[] => {
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];

    flatComments.forEach((c) => {
      map.set(c.id, { ...c, replies: [] });
    });

    flatComments.forEach((c) => {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.replies!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const commentTree = buildTree(comments);
  const totalCount = comments.length;

  return (
    <section className="mt-16 pt-8 border-t">
      <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
        <MessageCircle className="h-6 w-6" />
        Comments {totalCount > 0 && `(${totalCount})`}
      </h2>

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : commentTree.length > 0 ? (
        <div className="space-y-6 mb-10">
          {commentTree.map((comment) => (
            <CommentThread key={comment.id} comment={comment} slug={slug} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mb-8">No comments yet. Be the first!</p>
      )}

      {/* Comment form */}
      <CommentForm slug={slug} />
    </section>
  );
}
