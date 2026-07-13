"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type DeleteArticleButtonProps = {
    articleId: string;
    title: string;
};

export default function DeleteArticleButton({
    articleId,
    title,
}: DeleteArticleButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (isDeleting) {
            return;
        }

        const confirmed = window.confirm(`Delete article \"${title}\"? This action cannot be undone.`);
        if (!confirmed) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/articles/${articleId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => ({}))) as { message?: string };
                window.alert(payload.message ?? "Failed to delete article");
                return;
            }

            router.refresh();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            aria-label={`Delete ${title}`}
            onClick={() => {
                void handleDelete();
            }}
            disabled={isDeleting}
        >
            <Trash2 size={15} />
        </Button>
    );
}
