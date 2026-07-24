"use client";

import { useEffect } from "react";

type ArticleViewTrackerProps = {
    articleId: string;
};

export default function ArticleViewTracker({ articleId }: ArticleViewTrackerProps) {
    useEffect(() => {
        if (!articleId) {
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
