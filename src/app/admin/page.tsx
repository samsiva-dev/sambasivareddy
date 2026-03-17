import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { FileText, Eye, PenLine, Plus, Tag, Users, Mail, BarChart3, Timer } from "lucide-react";
import { DigestCard } from "@/components/admin/digest-card";
import { ScheduledCard } from "@/components/admin/scheduled-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboard() {
  const [totalPosts, publishedPosts, draftPosts, totalTags, totalSubscribers, unreadMessages, totalViewsAgg, scheduledCount] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { published: true } }),
      prisma.post.count({ where: { published: false } }),
      prisma.tag.count(),
      prisma.subscriber.count({ where: { active: true } }),
      prisma.contactMessage.count({ where: { read: false } }),
      prisma.post.aggregate({ _sum: { views: true } }),
      prisma.post.count({ where: { published: false, publishAt: { gt: new Date() } } }),
    ]);

  const totalViews = totalViewsAgg._sum.views || 0;

  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { tags: true },
  });

  const stats = [
    { title: "Total Posts", value: totalPosts, icon: FileText },
    { title: "Published", value: publishedPosts, icon: Eye },
    { title: "Drafts", value: draftPosts, icon: PenLine },
    { title: "Views", value: totalViews, icon: BarChart3, href: "/admin/analytics" },
    { title: "Subscribers", value: totalSubscribers, icon: Users },
    { title: "Scheduled", value: scheduledCount, icon: Timer },
    { title: "Tags", value: totalTags, icon: Tag },
    { title: "Messages", value: unreadMessages, icon: Mail, href: "/admin/messages" },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your blog content</p>
        </div>
        <Button asChild>
          <Link href="/admin/new-post">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const content = (
            <Card key={stat.title} className={stat.href ? "hover:border-primary/50 transition-colors cursor-pointer" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          return stat.href ? (
            <Link key={stat.title} href={stat.href}>{content}</Link>
          ) : (
            <div key={stat.title}>{content}</div>
          );
        })}
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Posts</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/posts">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No posts yet. Create your first one!
            </p>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{post.title}</h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          post.published
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/edit/${post.id}`}>Edit</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Digest + Scheduled */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <DigestCard />
        <ScheduledCard />
      </div>
    </div>
  );
}
