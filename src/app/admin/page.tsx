import { getRecentNews, statusColors } from "@/lib/news";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const recentNews = await getRecentNews(5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Recent news from your API
          </p>
        </div>
        <Link href="/admin/news/create">
          <Button>+ Create News</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Recent News ({recentNews.length})
          </CardTitle>
          <Link href="/admin/news">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentNews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No news found.</p>
          ) : (
            <div className="space-y-3">
              {recentNews.map((news) => (
                <div
                  key={news.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{news.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {news.category?.name ?? "Uncategorized"} •{" "}
                      {new Date(news.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[news.status]}`}
                  >
                    {news.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
