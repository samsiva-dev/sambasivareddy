"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  MailOpen,
  Trash2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string | Date;
}

export function MessageList() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Email reveal state
  const [revealToken, setRevealToken] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verifyStep, setVerifyStep] = useState<"idle" | "sending" | "code" | "verifying">("idle");
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/contact/messages", window.location.origin);
      if (revealToken) url.searchParams.set("reveal", revealToken);

      const res = await fetch(url.toString());
      const data = await res.json();
      setMessages(data.messages || []);
      setRevealed(data.revealed || false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [revealToken]);

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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Email reveal banner */}
      {!revealed ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <EyeOff className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Sender emails are hidden
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Verify your identity to reveal email addresses and reply.
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

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No messages yet.</p>
          </CardContent>
        </Card>
      ) : (
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
                      <span className={!revealed ? "opacity-60" : ""}>{msg.email}</span>
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
                    {revealed && (
                      <div className="mt-4">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}>
                            Reply via Email <ExternalLink className="ml-2 h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
