import { Metadata } from "next";
import { MessageList } from "@/components/admin/message-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messages - Admin",
};

export default function AdminMessagesPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Manage contact form submissions
          </p>
        </div>
      </div>

      <MessageList />
    </div>
  );
}
