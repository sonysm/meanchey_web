"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type PersistedFeedState = {
    items: News[];
    offset: number;
    hasMore: boolean;
    scrollY: number;
    savedAt: number;
};

const FEED_STATE_KEY = "meanchey-public-feed-state-v1";
const FEED_STATE_TTL_MS = 1000 * 60 * 5;

const readPersistedState = (): PersistedFeedState | null => {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(FEED_STATE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<PersistedFeedState>;
        if (!Array.isArray(parsed.items)) {
            return null;
        }

        const savedAt = typeof parsed.savedAt === "number" ? parsed.savedAt : 0;
        if (!savedAt || Date.now() - savedAt > FEED_STATE_TTL_MS) {
            window.sessionStorage.removeItem(FEED_STATE_KEY);
            return null;
        }

        return {
            items: parsed.items,
            offset: typeof parsed.offset === "number" ? parsed.offset : parsed.items.length,
            hasMore: typeof parsed.hasMore === "boolean" ? parsed.hasMore : true,
            scrollY: typeof parsed.scrollY === "number" ? parsed.scrollY : 0,
            savedAt,
        };
    } catch {
        return null;
    }
};

const writePersistedState = (state: PersistedFeedState): void => {
    if (typeof window === "undefined") {
        return;
    }

    window.sessionStorage.setItem(FEED_STATE_KEY, JSON.stringify(state));
};

const NewsCard = ({ item, onBeforeOpen }: { item: News; onBeforeOpen: () => void }) => {
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
                <Link href={`/news/${item.id}`} onClick={onBeforeOpen}>
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
    const isHydratedRef = useRef(false);

    const persistCurrentState = (
        nextItems: News[] = items,
        nextOffset: number = offset,
        nextHasMore: boolean = hasMore,
    ) => {
        writePersistedState({
            items: nextItems,
            offset: nextOffset,
            hasMore: nextHasMore,
            scrollY: window.scrollY,
            savedAt: Date.now(),
        });
    };

    useEffect(() => {
        const persisted = readPersistedState();
        if (!persisted || persisted.items.length === 0) {
            isHydratedRef.current = true;
            return;
        }

        setItems(persisted.items);
        setOffset(persisted.offset);
        setHasMore(persisted.hasMore);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo({ top: persisted.scrollY, behavior: "auto" });
                isHydratedRef.current = true;
            });
        });
    }, []);

    useEffect(() => {
        if (!isHydratedRef.current) {
            return;
        }

        persistCurrentState(items, offset, hasMore);
    }, [items, offset, hasMore]);

    useEffect(() => {
        const onPageHide = () => {
            persistCurrentState(items, offset, hasMore);
        };

        window.addEventListener("pagehide", onPageHide);
        return () => {
            window.removeEventListener("pagehide", onPageHide);
        };
    }, [items, offset, hasMore]);

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
                persistCurrentState(items, offset, false);
                return;
            }

            const mergedItems = [...items, ...nextItems];
            const nextOffset = typeof payload.nextOffset === "number" ? payload.nextOffset : offset + nextItems.length;
            const nextHasMore = Boolean(payload.hasMore);

            setItems(mergedItems);
            setOffset(nextOffset);
            setHasMore(nextHasMore);
            persistCurrentState(mergedItems, nextOffset, nextHasMore);
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
                    <NewsCard key={item.id} item={item} onBeforeOpen={() => persistCurrentState()} />
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
