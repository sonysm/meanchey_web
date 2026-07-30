"use client";

import { useState } from "react";
import Link from "next/link";

import type { News } from "@/types/news";
import { Button } from "@/components/ui/button";

type FeaturedNewsFeedProps = {
    initialItems: News[];
    initialOffset: number;
    batchSize: number;
};

type FeedResponse = {
    data?: News[];
    hasMore?: boolean;
    nextOffset?: number;
};

export default function FeaturedNewsFeed({ initialItems, initialOffset, batchSize }: FeaturedNewsFeedProps) {
    const [items, setItems] = useState<News[]>(initialItems);
    const [offset, setOffset] = useState(initialOffset);
    const [hasMore, setHasMore] = useState(initialItems.length >= batchSize);
    const [loading, setLoading] = useState(false);

    const loadMore = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/news/featured?limit=${batchSize}&offset=${offset}`);
            if (!res.ok) return;

            const json = (await res.json()) as FeedResponse;
            const newItems = json.data ?? [];

            setItems((prev) => [...prev, ...newItems]);
            setOffset(json.nextOffset ?? offset + newItems.length);
            setHasMore(json.hasMore ?? false);
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <p className="text-center text-sm text-muted-foreground py-12">No featured articles available.</p>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={`/news/${item.id}`}
                        className="group block overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
                    >
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
                            <h3 className="line-clamp-2 text-base font-medium transition-colors group-hover:text-primary">
                                {item.title}
                            </h3>
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                {item.excerpt || "Open article to read the full story."}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(item.createdAt).toLocaleDateString()} &bull;{" "}
                                {(item.companyName ?? item.authorName) || "Meanchey"}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center">
                    <Button variant="outline" onClick={loadMore} disabled={loading}>
                        {loading ? "Loading…" : "Load more"}
                    </Button>
                </div>
            )}
        </div>
    );
}
