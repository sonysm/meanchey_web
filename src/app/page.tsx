import Link from "next/link";
import { Flame, Search } from "lucide-react";

import { getNews } from "@/lib/news";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PublicNewsFeed from "@/components/news/PublicNewsFeed";
import PublicNavbar from "@/components/news/PublicNavbar";

const getCategoryChips = (tags: string[][]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const list of tags) {
    for (const tag of list) {
      const key = tag.trim().toLowerCase();
      if (!key || seen.has(key)) {
        continue;
      }

      seen.add(key);
      result.push(tag.trim());
      if (result.length >= 8) {
        return result;
      }
    }
  }

  return result;
};

export default async function Home() {
  const articles = await getNews(30, 0);

  const featured = articles[0];
  const trending = articles.slice(1, 4);
  const latestStart = featured ? 4 : 0;
  const latestBatchSize = 9;
  const latest = articles.slice(latestStart, latestStart + latestBatchSize);
  const latestInitialOffset = latestStart + latest.length;
  const categories = getCategoryChips(articles.map((item) => item.tags ?? []));

  return (
    <div className="min-h-dvh bg-background">
      <PublicNavbar />

      <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:py-10">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          {featured ? (
            <article className="overflow-hidden rounded-2xl border border-border bg-card">
              {featured.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.coverImage}
                  alt={featured.title}
                  className="h-64 w-full object-cover sm:h-80"
                />
              ) : null}
              <div className="space-y-3 p-5 sm:p-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Story</p>
                <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{featured.title}</h1>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {featured.excerpt || "Read the latest update from Meanchey News."}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(featured.createdAt).toLocaleDateString()} • {(featured.companyName ?? featured.authorName) || "Meanchey"}
                  </span>
                  <Link href={`/news/${featured.id}`}>
                    <Button size="sm">Read article</Button>
                  </Link>
                </div>
              </div>
            </article>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
              No featured article available.
            </div>
          )}

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 text-sm font-medium">Find news</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input disabled placeholder="Search (coming soon)" className="pl-9" />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 text-sm font-medium">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.length > 0 ? categories.map((chip) => (
                  <span key={chip} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {chip}
                  </span>
                )) : (
                  <span className="text-xs text-muted-foreground">No categories yet</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium"><Flame className="h-4 w-4" /> Trending</p>
              <div className="space-y-3">
                {trending.length > 0 ? trending.map((item) => (
                  <Link key={item.id} href={`/news/${item.id}`} className="block rounded-lg p-2 hover:bg-muted/50">
                    <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </Link>
                )) : (
                  <p className="text-xs text-muted-foreground">No trending articles.</p>
                )}
              </div>
            </div>
          </aside>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest News</h2>
            <Link href="/admin/news" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Manage in admin
            </Link>
          </div>
          <PublicNewsFeed
            initialItems={latest}
            initialOffset={latestInitialOffset}
            batchSize={latestBatchSize}
          />
        </section>
      </main>
    </div>
  );
}
