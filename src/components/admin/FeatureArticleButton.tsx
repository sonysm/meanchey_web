"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

type FeatureArticleButtonProps = {
    articleId: string;
    featured: number; // 0 or 1
};

export default function FeatureArticleButton({
    articleId,
    featured,
}: FeatureArticleButtonProps) {
    const router = useRouter();
    const [isFeatured, setIsFeatured] = useState(featured === 1);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        if (isLoading) return;
        setIsLoading(true);
        const newValue = isFeatured ? 0 : 1;
        try {
            const response = await fetch(`/api/admin/articles/${articleId}/feature`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ feature: newValue }),
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => ({}))) as { message?: string };
                window.alert(payload.message ?? "Failed to update featured status");
                return;
            }

            setIsFeatured(newValue === 1);
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isFeatured ? "Remove from featured" : "Add to featured"}
            title={isFeatured ? "Remove from featured" : "Add to featured"}
            onClick={() => { void handleToggle(); }}
            disabled={isLoading}
            className={isFeatured ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}
        >
            <Star size={15} fill={isFeatured ? "currentColor" : "none"} />
        </Button>
    );
}
