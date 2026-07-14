"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";

import type { News } from "@/types/news";
import { Button } from "@/components/ui/button";

type PublicNewsFeedProps = {
    initialItems: News[];
    initialOffset: number;
    batchSize: number;
};

type FeedResponse = {
    data?: News[];
    hasMore?: boolean;
    nextOffset?: number;
};

const NewsCard = ({ item }: { item: News }) => {
    return (
        <article className="overflow-hidden rounded-2xl border border-border bg-card">
            {item.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-44 w-full object-cover"
                />
            ) : (
                <div className="h-44 w-full bg-muted" />
            )}
            <div className="space-y-2 p-4">
                <h3 className="line-clamp-2 text-base font-medium">{item.title}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {item.excerpt || "Open article to read the full story."}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> {item.viewCount?.toLocaleString() ?? 0}
                    </span>
                </div>
                <Link href={`/news/${item.id}`}>
                    <Button variant="outline" size="sm" className="mt-1 w-full">Read more</Button>
                </Link>
            </div>
        </article>
    );
};

export default function PublicNewsFeed({
    initialItems,
    initialOffset,
    batchSize,
}: PublicNewsFeedProps) {
    const [items, setItems] = useState<News[]>(initialItems);
    const [offset, setOffset] = useState(initialOffset);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const uniqueItems = useMemo(() => {
        const seen = new Set<string>();
        const deduped: News[] = [];

        for (const item of items) {
            if (seen.has(item.id)) {
                continue;
            }
            seen.add(item.id);
            deduped.push(item);
        }

        return deduped;
    }, [items]);

    const handleLoadMore = async () => {
        if (isLoading || !hasMore) {
            return;
        }

        setIsLoading(true);
        setLoadError(null);

        try {
            const response = await fetch(`/api/news?offset=${offset}&limit=${batchSize}`, {
                method: "GET",
            });

            const payload = (await response.json().catch(() => ({}))) as FeedResponse;
            if (!response.ok) {
                setLoadError("Failed to load more news.");
                return;
            }

            const nextItems = Array.isArray(payload.data) ? payload.data : [];
            if (nextItems.length === 0) {
                setHasMore(false);
                return;
            }

            setItems((prev) => [...prev, ...nextItems]);
            setOffset(typeof payload.nextOffset === "number" ? payload.nextOffset : offset + nextItems.length);
            setHasMore(Boolean(payload.hasMore));
        } catch {
            setLoadError("Failed to load more news.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {uniqueItems.map((item) => (
                    <NewsCard key={item.id} item={item} />
                ))}
            </div>

            <div className="flex flex-col items-center gap-2 pt-2">
                {hasMore ? (
                    <Button onClick={() => { void handleLoadMore(); }} disabled={isLoading}>
                        {isLoading ? "Loading..." : "Load more"}
                    </Button>
                ) : (
                    <p className="text-sm text-muted-foreground">You reached the end.</p>
                )}
                {loadError ? <p className="text-xs text-destructive">{loadError}</p> : null}
            </div>
        </div>
    );
}
