import { Metadata } from "next";
import { CommentManager } from "@/components/admin/comment-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Comments",
};

export default function AdminCommentsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Comments</h1>
        <p className="text-muted-foreground mt-1">Moderate and manage blog comments</p>
      </div>
      <CommentManager />
    </div>
  );
}
