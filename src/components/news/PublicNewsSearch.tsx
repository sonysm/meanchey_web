"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { News } from "@/types/news";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchResponse = {
    data?: News[];
};

const RESULT_LIMIT = 6;

export default function PublicNewsSearch() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<News[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const normalizedQuery = query.trim();

    const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!normalizedQuery) {
            setResults([]);
            setHasSearched(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/news/search?text=${encodeURIComponent(normalizedQuery)}&limit=${RESULT_LIMIT}&offset=0`,
                {
                    method: "GET",
                },
            );

            const payload = (await response.json().catch(() => ({}))) as SearchResponse;
            if (!response.ok) {
                setError("Search failed. Please try again.");
                return;
            }

            setResults(Array.isArray(payload.data) ? payload.data : []);
        } catch {
            setError("Search failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const goToFullResults = () => {
        if (!normalizedQuery) {
            return;
        }

        router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`);
    };

    return (
        <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-medium">Find news</p>
            <form className="space-y-3" onSubmit={handleSearch}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search articles..."
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button type="submit" size="sm" disabled={isLoading}>
                        {isLoading ? "Searching..." : "Search"}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={goToFullResults}
                        disabled={!normalizedQuery}
                    >
                        View all
                    </Button>
                </div>
            </form>

            {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}

            {hasSearched && !isLoading ? (
                <div className="mt-4 space-y-2">
                    {results.length > 0 ? results.map((item) => (
                        <Link
                            key={item.id}
                            href={`/news/${item.id}`}
                            className="block rounded-lg border border-border/70 px-3 py-2 hover:bg-muted/50"
                        >
                            <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                        </Link>
                    )) : (
                        <p className="text-xs text-muted-foreground">No results found.</p>
                    )}
                </div>
            ) : null}
        </div>
    );
}
