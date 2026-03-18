"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Users,
  Download,
  Trash2,
  ToggleLeft,
  ToggleRight,
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

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscribers?status=${filter}`);
      const data = await res.json();
      setSubscribers(data.subscribers || []);
      setCounts(data.counts || { active: 0, inactive: 0, total: 0 });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [filter]);

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
    window.open(`/api/admin/subscribers?status=${filter}&format=csv`, "_blank");
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
                <span className="font-medium truncate">{sub.email}</span>
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
