import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://meanchey.org";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin/", "/api/", "/auth/", "/login/", "/signup/"],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
