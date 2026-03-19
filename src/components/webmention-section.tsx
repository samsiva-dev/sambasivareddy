"use client";

import { useEffect, useState } from "react";
import { Heart, Repeat, MessageCircle, Link as LinkIcon } from "lucide-react";

interface WebmentionEntry {
  id: string;
  source: string;
  type: string;
  authorName: string | null;
  authorUrl: string | null;
  content: string | null;
  createdAt: string;
}

interface WebmentionSectionProps {
  slug: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  like: <Heart className="h-3.5 w-3.5 text-red-500" />,
  repost: <Repeat className="h-3.5 w-3.5 text-green-500" />,
  reply: <MessageCircle className="h-3.5 w-3.5 text-blue-500" />,
  mention: <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />,
};

export function WebmentionSection({ slug }: WebmentionSectionProps) {
  const [mentions, setMentions] = useState<WebmentionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/webmention?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : { webmentions: [] }))
      .then((data) => setMentions(data.webmentions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading || mentions.length === 0) return null;

  const likes = mentions.filter((m) => m.type === "like");
  const reposts = mentions.filter((m) => m.type === "repost");
  const replies = mentions.filter((m) => m.type === "reply" || m.type === "mention");

  return (
    <div className="mt-12 pt-6 border-t">
      <h3 className="text-lg font-semibold mb-4">Webmentions</h3>

      {/* Likes and reposts summary */}
      {(likes.length > 0 || reposts.length > 0) && (
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          {likes.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-red-500" />
              {likes.length} like{likes.length !== 1 ? "s" : ""}
            </span>
          )}
          {reposts.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Repeat className="h-4 w-4 text-green-500" />
              {reposts.length} repost{reposts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Replies and mentions */}
      {replies.length > 0 && (
        <div className="space-y-3">
          {replies.map((mention) => (
            <div key={mention.id} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="mt-0.5">{typeIcons[mention.type] || typeIcons.mention}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  {mention.authorUrl ? (
                    <a
                      href={mention.authorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {mention.authorName || "Anonymous"}
                    </a>
                  ) : (
                    <span className="font-medium">
                      {mention.authorName || "Anonymous"}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(mention.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {mention.content && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {mention.content}
                  </p>
                )}
                <a
                  href={mention.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  View source
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
