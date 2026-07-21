import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import PublicNavbar from "@/components/news/PublicNavbar";
import SearchResultsFeed from "@/components/news/SearchResultsFeed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchNews } from "@/lib/news";

const SEARCH_BATCH_SIZE = 12;

type SearchPageProps = {
    searchParams: Promise<{
        q?: string;
    }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = (params.q ?? "").trim();

    const initialResults = query
        ? await searchNews(query, SEARCH_BATCH_SIZE, 0, "kh")
        : { data: [], hasMore: false, nextOffset: 0 };

    return (
        <div className="min-h-dvh bg-background">
            <PublicNavbar />

            <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
                <div className="flex items-center justify-between gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft size={16} /> Back to Home
                        </Button>
                    </Link>
                </div>

                <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                    <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Search</p>
                    <form action="/search" method="GET" className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                name="q"
                                defaultValue={query}
                                placeholder="Search news articles..."
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>
                </section>

                {query ? (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-semibold tracking-tight">
                                Results for "{query}"
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {initialResults.data.length} in first batch
                            </p>
                        </div>

                        {initialResults.data.length > 0 ? (
                            <SearchResultsFeed
                                query={query}
                                initialItems={initialResults.data}
                                initialOffset={initialResults.nextOffset}
                                initialHasMore={initialResults.hasMore}
                                batchSize={SEARCH_BATCH_SIZE}
                            />
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
                                No articles matched your search.
                            </div>
                        )}
                    </section>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
                        Enter a keyword to search news articles.
                    </div>
                )}
            </main>
        </div>
    );
}
