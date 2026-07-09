import { getNews, statusColors } from "@/lib/news";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Eye, Trash2 } from "lucide-react";

export default async function NewsListPage() {
  const articles = await getNews(50, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">News</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all your news articles
          </p>
        </div>
        <Link href="/admin/news/create">
          <Button>+ Create News</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Articles ({articles.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((news) => (
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
                        <p className="font-medium text-sm line-clamp-1">
                          {news.title}
                        </p>
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
                      {news.category?.name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[news.status]}`}
                    >
                      {news.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{(news.viewCount ?? 0).toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(news.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/news/${news.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye size={15} />
                        </Button>
                      </Link>
                      <Link href={`/admin/news/${news.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil size={15} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
