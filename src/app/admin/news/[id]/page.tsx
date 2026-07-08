import { getNewsById, statusColors } from "@/lib/news";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import Image from "next/image";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const news = await getNewsById(id);
  if (!news) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/news">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold line-clamp-1">{news.title}</h1>
        </div>
        <Link href={`/admin/news/${news.id}/edit`}>
          <Button variant="outline" className="gap-2">
            <Pencil size={15} /> Edit
          </Button>
        </Link>
      </div>

      {news.coverImage && (
        <div className="relative h-64 w-full rounded-lg overflow-hidden">
          <Image
            src={news.coverImage}
            alt={news.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[news.status]}`}
        >
          {news.status}
        </span>
        {news.category && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {news.category.name}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {new Date(news.createdAt).toLocaleDateString()}
        </span>
        {news.viewCount !== undefined && (
          <span className="text-xs text-muted-foreground">
            👁 {news.viewCount.toLocaleString()} views
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content</CardTitle>
        </CardHeader>
        <CardContent>
          {news.excerpt && (
            <p className="text-muted-foreground text-sm mb-4 italic border-l-2 border-primary pl-3">
              {news.excerpt}
            </p>
          )}
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />
        </CardContent>
      </Card>

      {news.tags && news.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {news.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
