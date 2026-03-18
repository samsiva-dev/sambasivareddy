import { Metadata } from "next";
import { SubscriberManager } from "@/components/admin/subscriber-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Subscribers",
};

export default function AdminSubscribersPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Subscribers</h1>
        <p className="text-muted-foreground mt-1">
          Manage newsletter subscribers, toggle status, and export data
        </p>
      </div>
      <SubscriberManager />
    </div>
  );
}
