"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Users,
  Download,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
}

interface Counts {
  active: number;
  inactive: number;
  total: number;
}

export function SubscriberManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [counts, setCounts] = useState<Counts>({ active: 0, inactive: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Email reveal state
  const [revealToken, setRevealToken] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verifyStep, setVerifyStep] = useState<"idle" | "sending" | "code" | "verifying">("idle");
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/subscribers", window.location.origin);
      url.searchParams.set("status", filter);
      if (revealToken) url.searchParams.set("reveal", revealToken);

      const res = await fetch(url.toString());
      const data = await res.json();
      setSubscribers(data.subscribers || []);
      setCounts(data.counts || { active: 0, inactive: 0, total: 0 });
      setRevealed(data.revealed || false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [filter, revealToken]);

  const handleToggle = async (id: string, active: boolean) => {
    setActionInProgress(id);
    try {
      await fetch("/api/admin/subscribers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      setSubscribers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active } : s))
      );
    } catch {
      // ignore
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently remove this subscriber?")) return;
    setActionInProgress(id);
    try {
      await fetch(`/api/admin/subscribers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    } finally {
      setActionInProgress(null);
    }
  };

  const handleExport = () => {
    if (!revealToken) {
      alert("Please verify your identity first to export subscriber data.");
      return;
    }
    window.open(
      `/api/admin/subscribers?status=${filter}&format=csv&reveal=${encodeURIComponent(revealToken)}`,
      "_blank"
    );
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

  return (
    <div>
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{counts.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{counts.inactive}</p>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{counts.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Email reveal banner */}
      {!revealed ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <EyeOff className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Subscriber emails are hidden
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Verify your identity to reveal emails and export data.
              </p>
              {verifyStep === "idle" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={handleSendCode}
                >
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

      {/* Filter + Export */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(["active", "inactive", "all"] as const).map((s) => (
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
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : subscribers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No {filter !== "all" ? filter : ""} subscribers</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subscribers.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`font-medium truncate ${!revealed ? "text-muted-foreground" : ""}`}>
                  {sub.email}
                </span>
                <Badge variant={sub.active ? "default" : "secondary"}>
                  {sub.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {formatDate(sub.createdAt)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  title={sub.active ? "Deactivate" : "Activate"}
                  onClick={() => handleToggle(sub.id, !sub.active)}
                  disabled={actionInProgress === sub.id}
                >
                  {sub.active ? (
                    <ToggleRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete"
                  onClick={() => handleDelete(sub.id)}
                  disabled={actionInProgress === sub.id}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
