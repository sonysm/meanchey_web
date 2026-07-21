"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { useMemo, useState } from "react";

import type { News } from "@/types/news";
import { Button } from "@/components/ui/button";

type SearchResultsFeedProps = {
    query: string;
    initialItems: News[];
    initialOffset: number;
    initialHasMore: boolean;
    batchSize: number;
};

type SearchResponse = {
    data?: News[];
    hasMore?: boolean;
    nextOffset?: number;
};

export default function SearchResultsFeed({
    query,
    initialItems,
    initialOffset,
    initialHasMore,
    batchSize,
}: SearchResultsFeedProps) {
    const [items, setItems] = useState<News[]>(initialItems);
    const [offset, setOffset] = useState(initialOffset);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const loadMore = async () => {
        if (isLoading || !hasMore) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/news/search?text=${encodeURIComponent(query)}&limit=${batchSize}&offset=${offset}`,
                {
                    method: "GET",
                },
            );

            const payload = (await response.json().catch(() => ({}))) as SearchResponse;
            if (!response.ok) {
                setError("Failed to load more results.");
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
            setError("Failed to load more results.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {uniqueItems.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
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
                            <h2 className="line-clamp-2 text-base font-medium">{item.title}</h2>
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
                ))}
            </div>

            <div className="flex flex-col items-center gap-2 pt-1">
                {hasMore ? (
                    <Button onClick={() => { void loadMore(); }} disabled={isLoading}>
                        {isLoading ? "Loading..." : "Load more results"}
                    </Button>
                ) : null}
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
        </div>
    );
}
