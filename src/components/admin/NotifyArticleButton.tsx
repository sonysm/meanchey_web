"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type NotifyArticleButtonProps = {
    articleId: string;
    articleTitle: string;
    coverImage?: string;
};

export default function NotifyArticleButton({ articleId, articleTitle, coverImage }: NotifyArticleButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const normalizedCoverImage = typeof coverImage === "string" ? coverImage.trim() : "";
    const hasCoverImage = normalizedCoverImage.length > 0;

    const handleSend = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/articles/${articleId}/notify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ title: articleTitle, imageUrl: normalizedCoverImage }),
            });

            const payload = (await response.json().catch(() => ({}))) as { message?: string };

            if (!response.ok) {
                window.alert(payload.message ?? "Failed to send notification");
                return;
            }

            setOpen(false);
            window.alert("Push notification sent successfully");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Send push notification"
                title="Send push notification"
                className="text-muted-foreground hover:text-blue-500"
                onClick={() => setOpen(true)}
            >
                <Bell size={15} />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Push Notification</DialogTitle>
                        <DialogDescription>
                            This will send a push notification about this article to all subscribed mobile users.
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        <span className="font-medium text-foreground">Article: </span>
                        {articleTitle}
                    </p>
                    {hasCoverImage ? (
                        <div className="space-y-2 mt-2">
                            <p className="text-xs text-muted-foreground">Thumbnail to send:</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={normalizedCoverImage}
                                alt={articleTitle}
                                className="h-24 w-full max-w-xs rounded object-cover border border-border"
                            />
                        </div>
                    ) : (
                        <p className="text-xs text-amber-600 mt-2">
                            No cover image found for this article. Notification may show title/body only.
                        </p>
                    )}
                    <DialogFooter className="mt-2">
                        <Button variant="outline" disabled={isLoading} onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={() => { void handleSend(); }} disabled={isLoading}>
                            {isLoading ? "Sending…" : "Send Notification"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
