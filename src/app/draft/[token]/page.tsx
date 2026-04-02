"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, calculateReadingTime } from "@/lib/utils";
import { ArrowLeft, Clock, Calendar, Lock, AlertCircle, Loader2, FileText } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string | null;
    image: string | null;
  };
  tags: { id: string; name: string; slug: string }[];
}

export default function DraftPreviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<"loading" | "verify" | "verified" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [post, setPost] = useState<Post | null>(null);

  // Check if token is valid on mount
  useEffect(() => {
    async function checkToken() {
      try {
        const res = await fetch(`/api/draft/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setErrorMessage(data.error || "Invalid share link");
          return;
        }

        setPostTitle(data.postTitle);
        setExpiresAt(data.expiresAt);
        setStatus("verify");
      } catch {
        setStatus("error");
        setErrorMessage("Failed to verify link");
      }
    }

    checkToken();
  }, [token]);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setVerifying(true);
    try {
      const res = await fetch(`/api/draft/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Verification failed");
        setVerifying(false);
        return;
      }

      setPost(data.post);
      setExpiresAt(data.expiresAt);
      setStatus("verified");
    } catch {
      setErrorMessage("Failed to verify email");
    } finally {
      setVerifying(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading draft...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <Card className="border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Unable to Access Draft</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email verification state
  if (status === "verify") {
    return (
      <div className="container mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Draft Preview Request</CardTitle>
            <CardDescription>
              You've been invited to preview a draft post
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{postTitle}</p>
                  {expiresAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Access expires {new Date(expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Enter your email to verify access
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage("");
                  }}
                  disabled={verifying}
                />
                {errorMessage && (
                  <p className="text-sm text-destructive">{errorMessage}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={verifying || !email.trim()}>
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & View Draft"
                )}
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground">
              Only the email address the author shared with can view this draft.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verified - show the draft post
  if (status === "verified" && post) {
    return (
      <article className="container mx-auto max-w-3xl px-4 py-16 animate-fade-in">
        {/* Draft Banner */}
        <div className="mb-8 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <Lock className="h-4 w-4" />
            <span className="font-medium">Draft Preview</span>
          </div>
          <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-500">
            This is an unpublished draft shared privately with you.
            {expiresAt && ` Access expires ${new Date(expiresAt).toLocaleDateString()}.`}
          </p>
        </div>

        {/* Header */}
        <header className="mb-8">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
              ))}
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-muted-foreground mb-4">{post.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 shrink-0" />
              <time>{formatDate(new Date(post.createdAt))}</time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{calculateReadingTime(post.content)}</span>
            </div>
            {post.author.name && <span>by {post.author.name}</span>}
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-8 overflow-hidden rounded-lg">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center">
          <p className="text-sm text-muted-foreground">
            This is a draft preview. The content may change before publication.
          </p>
        </div>
      </article>
    );
  }

  return null;
}
