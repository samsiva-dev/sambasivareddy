"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setTags(Array.isArray(data) ? data : data.tags || []))
      .catch(() => {});
  }, []);

  const toggleInterest = (slug: string) => {
    setSelectedInterests((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      // Fetch CSRF token
      const csrfRes = await fetch("/api/csrf");
      const { token: csrfToken } = await csrfRes.json();

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, interests: selectedInterests, csrfToken }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("Thanks for subscribing!");
        setEmail("");
        setSelectedInterests([]);
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold">Stay Updated</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get notified when I publish new articles. No spam, unsubscribe anytime.
      </p>
      {tags.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Select categories you&apos;re interested in:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const selected = selectedInterests.includes(tag.slug);
              return (
                <Badge
                  key={tag.id}
                  variant={selected ? "default" : "outline"}
                  className={`cursor-pointer text-xs transition-colors ${
                    selected ? "" : "hover:bg-accent"
                  }`}
                  onClick={() => toggleInterest(tag.slug)}
                >
                  {selected && <span className="mr-1">✓</span>}
                  {tag.name}
                </Badge>
              );
            })}
          </div>
          {selectedInterests.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {selectedInterests.length} selected — you&apos;ll only get emails about these topics
            </p>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "..." : "Subscribe"}
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        By subscribing, you agree to our{" "}
        <a href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </a>
        .
      </p>
      {message && (
        <p
          className={`mt-2 text-sm ${
            status === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
