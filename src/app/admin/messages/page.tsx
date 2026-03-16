import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { MessageList } from "@/components/admin/message-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messages - Admin",
};

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = messages.filter((m: { read: boolean }) => !m.read).length;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1">
            {messages.length} total · {unreadCount} unread
          </p>
        </div>
      </div>

      <MessageList initialMessages={messages} />
    </div>
  );
}
