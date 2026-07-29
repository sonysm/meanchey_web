import type { MetadataRoute } from "next";
import { getNews } from "@/lib/news";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://meanchey.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${BASE_URL}/about-us`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/contact-us`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/search`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.6,
        },
    ];

    let newsRoutes: MetadataRoute.Sitemap = [];
    try {
        const articles = await getNews(200, 0);
        newsRoutes = articles.map((article) => ({
            url: `${BASE_URL}/news/${article.id}`,
            lastModified: new Date(article.updatedAt),
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));
    } catch {
        // silently skip if news fetch fails
    }

    return [...staticRoutes, ...newsRoutes];
}
