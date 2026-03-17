"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Loader2, Check, AlertCircle } from "lucide-react";

export function ScheduledCard() {
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "info" | "error";
    message: string;
  } | null>(null);

  async function handlePublish() {
    setPublishing(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/publish-scheduled", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setResult({ type: "error", message: data.error || "Failed" });
        return;
      }

      if (data.published === 0) {
        setResult({ type: "info", message: data.message });
      } else {
        setResult({ type: "success", message: data.message });
      }
    } catch {
      setResult({ type: "error", message: "Network error. Please try again." });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Scheduled Posts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Publish all posts whose scheduled date has passed.
        </p>
        <Button onClick={handlePublish} disabled={publishing} size="sm">
          {publishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish Due Posts"
          )}
        </Button>

        {result && (
          <div
            className={`flex items-start gap-2 rounded-md p-3 text-sm mt-4 ${
              result.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : result.type === "info"
                  ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {result.type === "success" ? (
              <Check className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <span>{result.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
