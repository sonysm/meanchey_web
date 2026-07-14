import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";

import { getNewsById } from "@/lib/news";
import ArticleBody from "@/components/news/ArticleBody";
import { Button } from "@/components/ui/button";
import PublicNavbar from "@/components/news/PublicNavbar";

export default async function PublicNewsDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const article = await getNewsById(id);

    if (!article) {
        notFound();
    }

    return (
        <div className="min-h-dvh bg-background">
            <PublicNavbar />
            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft size={16} /> Back to News
                        </Button>
                    </Link>
                    <div className="text-xs text-muted-foreground">
                        {new Date(article.createdAt).toLocaleDateString()}
                    </div>
                </div>

                <article className="mx-auto w-full max-w-3xl space-y-6">
                    <header className="space-y-4">
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{article.title}</h1>
                        {article.titleKh ? (
                            <p className="text-base text-muted-foreground sm:text-lg">{article.titleKh}</p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>By {(article.companyName ?? article.authorName) || "Meanchey"}</span>
                            <span className="inline-flex items-center gap-1">
                                <Eye size={14} /> {article.viewCount?.toLocaleString() ?? 0}
                            </span>
                            {article.tags?.slice(0, 6).map((tag) => (
                                <span key={tag} className="rounded-full border border-border px-2 py-1">#{tag}</span>
                            ))}
                        </div>
                    </header>

                    {article.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={article.coverImage}
                            alt={article.title}
                            className="h-auto w-full rounded-2xl border border-border object-cover"
                        />
                    ) : null}

                    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                        <ArticleBody
                            content={article.content}
                            photoPath={article.photoPath}
                            id={article.id}
                            title={article.title}
                        />
                    </section>
                </article>
            </main>
        </div>
    );
}
