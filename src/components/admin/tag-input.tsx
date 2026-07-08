"use client";

import { useMemo, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TagInputProps = {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
};

const normalizeTag = (value: string): string => value.trim().replace(/\s+/g, " ");

export default function TagInput({
    value,
    onChange,
    placeholder = "Type a tag and press Enter",
}: TagInputProps) {
    const [draft, setDraft] = useState("");

    const tags = useMemo(() => {
        return Array.isArray(value) ? value : [];
    }, [value]);

    const addTag = (raw: string) => {
        const next = normalizeTag(raw);
        if (!next) {
            return;
        }

        if (tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
            return;
        }

        onChange([...tags, next]);
    };

    const removeTag = (index: number) => {
        onChange(tags.filter((_, i) => i !== index));
    };

    const addFromDraft = () => {
        addTag(draft);
        setDraft("");
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter" && event.key !== ",") {
            return;
        }

        event.preventDefault();
        addFromDraft();
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        const text = event.clipboardData.getData("text");
        if (!text.includes(",")) {
            return;
        }

        event.preventDefault();
        const parts = text.split(",").map((part) => normalizeTag(part)).filter(Boolean);
        if (parts.length === 0) {
            return;
        }

        const merged = [...tags];
        for (const part of parts) {
            if (!merged.some((tag) => tag.toLowerCase() === part.toLowerCase())) {
                merged.push(part);
            }
        }

        onChange(merged);
        setDraft("");
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={placeholder}
                />
                <Button type="button" variant="secondary" onClick={addFromDraft}>
                    Add
                </Button>
            </div>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                        <Badge key={`${tag}-${index}`} variant="secondary" className="h-auto py-1">
                            <span>{tag}</span>
                            <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label={`Remove ${tag}`}
                            >
                                x
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
