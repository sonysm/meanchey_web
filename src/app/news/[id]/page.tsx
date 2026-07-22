import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";

import { getNewsById } from "@/lib/news";
import ArticleBody from "@/components/news/ArticleBody";
import { Button } from "@/components/ui/button";
import PublicNavbar from "@/components/news/PublicNavbar";

const normalizeIsoDate = (value: string | undefined): string | undefined => {
    if (!value) {
        return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return undefined;
    }

    return parsed.toISOString();
};

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const article = await getNewsById(id);

    if (!article) {
        return {
            title: "Article Not Found | Meanchey News",
        };
    }

    const title = `${article.title} | Meanchey News`;
    const url = `/news/${article.id}`;
    const imageUrl = article.coverImage || "/meanchey-logo.svg";
    const publishedTime = normalizeIsoDate(article.publishedAt || article.createdAt);
    const modifiedTime = normalizeIsoDate(article.updatedAt);
    const author = (article.companyName ?? article.authorName)?.trim() || "Meanchey News";

    return {
        title,
        authors: [{ name: author }],
        alternates: {
            canonical: url,
        },
        openGraph: {
            title,
            url,
            type: "article",
            siteName: "Meanchey News",
            publishedTime,
            modifiedTime,
            authors: [author],
            tags: article.tags,
            images: [
                {
                    url: imageUrl,
                    alt: article.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            images: [imageUrl],
        },
    };
}

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

    const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://meanchey.org"}/news/${article.id}`;
    const publishIso = normalizeIsoDate(article.publishedAt || article.createdAt);
    const modifiedIso = normalizeIsoDate(article.updatedAt);
    const articleAuthor = (article.companyName ?? article.authorName)?.trim() || "Meanchey News";
    const schemaImage = article.coverImage || `${process.env.NEXT_PUBLIC_SITE_URL || "https://meanchey.org"}/meanchey-logo.svg`;
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: article.title,
        image: [schemaImage],
        datePublished: publishIso,
        dateModified: modifiedIso || publishIso,
        mainEntityOfPage: canonicalUrl,
        author: {
            "@type": "Organization",
            name: articleAuthor,
        },
        publisher: {
            "@type": "Organization",
            name: "Meanchey News",
            logo: {
                "@type": "ImageObject",
                url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://meanchey.org"}/meanchey-logo.svg`,
            },
        },
    };

    return (
        <div className="min-h-dvh bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(articleSchema),
                }}
            />
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
