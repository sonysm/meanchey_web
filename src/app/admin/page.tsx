import { mockNews } from "@/lib/news";
import { Newspaper, Eye, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const published = mockNews.filter((n) => n.status === "published").length;
  const drafts = mockNews.filter((n) => n.status === "draft").length;
  const totalViews = mockNews.reduce((s, n) => s + (n.viewCount ?? 0), 0);

  const stats = [
    {
      label: "Total News",
      value: mockNews.length,
      icon: Newspaper,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Published",
      value: published,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Drafts",
      value: drafts,
      icon: FileText,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Total Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, Admin 👋
          </p>
        </div>
        <Link href="/admin/news/create">
          <Button>+ Create News</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent News */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent News</CardTitle>
          <Link href="/admin/news">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockNews.slice(0, 5).map((news) => (
              <div
                key={news.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="text-sm font-medium line-clamp-1">
                    {news.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {news.category?.name} •{" "}
                    {new Date(news.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    news.status === "published"
                      ? "bg-green-100 text-green-700"
                      : news.status === "draft"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {news.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
