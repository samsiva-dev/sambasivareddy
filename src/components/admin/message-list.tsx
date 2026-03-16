"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MailOpen, Trash2, ExternalLink } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function MessageList({ initialMessages }: { initialMessages: ContactMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRead = async (id: string, currentRead: boolean) => {
    try {
      const res = await fetch("/api/contact/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: !currentRead }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, read: !currentRead } : m))
        );
      }
    } catch (error) {
      console.error("Failed to update message:", error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const res = await fetch("/api/contact/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const markAsReadAndExpand = (id: string, isRead: boolean) => {
    setExpandedId(expandedId === id ? null : id);
    if (!isRead) {
      toggleRead(id, false);
    }
  };

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No messages yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <Card
          key={msg.id}
          className={`transition-colors ${!msg.read ? "border-primary/50 bg-primary/5" : ""}`}
        >
          <CardContent className="p-4">
            <div
              className="flex items-start justify-between gap-4 cursor-pointer"
              onClick={() => markAsReadAndExpand(msg.id, msg.read)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!msg.read && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                      New
                    </Badge>
                  )}
                  <h3 className={`font-medium truncate ${!msg.read ? "font-semibold" : ""}`}>
                    {msg.subject}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{msg.name}</span>
                  <span>·</span>
                  <span>{msg.email}</span>
                  <span>·</span>
                  <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
                {expandedId !== msg.id && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">{msg.message}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRead(msg.id, msg.read);
                  }}
                  title={msg.read ? "Mark as unread" : "Mark as read"}
                >
                  {msg.read ? (
                    <MailOpen className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMessage(msg.id);
                  }}
                  title="Delete message"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {expandedId === msg.id && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}>
                      Reply via Email <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
