"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
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

  // Email reveal state
  const [revealToken, setRevealToken] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verifyStep, setVerifyStep] = useState<"idle" | "sending" | "code" | "verifying">("idle");
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/comments", window.location.origin);
      url.searchParams.set("status", filter);
      if (revealToken) url.searchParams.set("reveal", revealToken);

      const res = await fetch(url.toString());
      const data = await res.json();
      setComments(data.comments || []);
      setRevealed(data.revealed || false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [filter, revealToken]);

  const handleSendCode = async () => {
    setVerifyStep("sending");
    setVerifyError(null);
    try {
      const res = await fetch("/api/admin/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      setVerifyStep("code");
    } catch (err: any) {
      setVerifyError(err.message);
      setVerifyStep("idle");
    }
  };

  const handleVerifyCode = async () => {
    setVerifyStep("verifying");
    setVerifyError(null);
    try {
      const res = await fetch("/api/admin/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setRevealToken(data.token);
      setVerifyStep("idle");
      setCode("");
    } catch (err: any) {
      setVerifyError(err.message);
      setVerifyStep("code");
    }
  };

  const handleHideEmails = () => {
    setRevealToken(null);
    setRevealed(false);
  };

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
      {/* Email reveal banner */}
      {!revealed ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <EyeOff className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Commenter emails are hidden
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Verify your identity to reveal commenter email addresses.
              </p>
              {verifyStep === "idle" && (
                <Button size="sm" variant="outline" className="mt-3" onClick={handleSendCode}>
                  <Mail className="mr-2 h-3 w-3" />
                  Send Verification Code
                </Button>
              )}
              {verifyStep === "sending" && (
                <div className="flex items-center gap-2 mt-3 text-sm text-amber-700 dark:text-amber-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending code to your email...
                </div>
              )}
              {(verifyStep === "code" || verifyStep === "verifying") && (
                <div className="flex items-center gap-2 mt-3">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-40 h-9"
                    maxLength={6}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && code.length === 6) handleVerifyCode();
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleVerifyCode}
                    disabled={code.length !== 6 || verifyStep === "verifying"}
                  >
                    {verifyStep === "verifying" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-1 h-3 w-3" />
                    )}
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setVerifyStep("idle"); setCode(""); setVerifyError(null); }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {verifyError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">{verifyError}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Emails revealed — verified session active
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleHideEmails}>
              <EyeOff className="mr-1 h-3 w-3" />
              Hide
            </Button>
          </div>
        </div>
      )}

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
                      <span className={`text-xs ${!revealed ? "text-muted-foreground/60" : "text-muted-foreground"}`}>{comment.email}</span>
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
