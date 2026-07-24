"use client";

import { useEffect } from "react";

type ArticleViewTrackerProps = {
    articleId: string;
};

const VIEW_DEDUPE_WINDOW_MS = 3000;

const shouldTrackView = (articleId: string): boolean => {
    if (typeof window === "undefined") {
        return true;
    }

    const key = `meanchey:view:${articleId}`;
    const now = Date.now();
    const previous = window.sessionStorage.getItem(key);

    if (previous) {
        const lastTracked = Number(previous);
        if (Number.isFinite(lastTracked) && now - lastTracked < VIEW_DEDUPE_WINDOW_MS) {
            return false;
        }
    }

    window.sessionStorage.setItem(key, String(now));
    return true;
};

export default function ArticleViewTracker({ articleId }: ArticleViewTrackerProps) {
    useEffect(() => {
        if (!articleId) {
            return;
        }

        if (!shouldTrackView(articleId)) {
            return;
        }

        void fetch("/api/news/read", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: articleId }),
            cache: "no-store",
            keepalive: true,
        }).catch(() => {
            // Ignore tracking failures so article reading experience is unaffected.
        });
    }, [articleId]);

    return null;
}
