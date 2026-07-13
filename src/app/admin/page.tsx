import { getRecentNews } from "@/lib/news";
import { AUTH_COOKIE_NAME, parseAuthSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Pencil, Trash2 } from "lucide-react";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const session = parseAuthSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  const currentUserId = session?.userId ? String(session.userId) : "";
  const recentNews = await getRecentNews(10);

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
        <CardContent className="p-0 overflow-x-auto">
          {recentNews.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No news found.</p>
          ) : (
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-full">Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentNews.map((news) => (
                  <TableRow key={news.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {news.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={news.coverImage}
                            alt={news.title}
                            className="h-12 w-16 rounded object-cover border border-border"
                          />
                        ) : (
                          <div className="h-12 w-16 rounded border border-dashed border-border bg-muted" />
                        )}

                        <div className="min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{news.title}</p>
                          {news.titleKh && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {news.titleKh}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(news.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/news/${news.id}`}>
                          <Button variant="ghost" size="icon" aria-label={`View ${news.title}`}>
                            <Eye size={15} />
                          </Button>
                        </Link>
                        {currentUserId && news.authorId === currentUserId ? (
                          <Link href={`/admin/news/${news.id}/edit`}>
                            <Button variant="ghost" size="icon" aria-label={`Edit ${news.title}`}>
                              <Pencil size={15} />
                            </Button>
                          </Link>
                        ) : null}
                        {currentUserId && news.authorId === currentUserId ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            aria-label={`Delete ${news.title}`}
                          >
                            <Trash2 size={15} />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
