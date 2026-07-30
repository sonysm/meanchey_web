import { Sparkles } from "lucide-react";

import { getFeaturedNews } from "@/lib/news";
import PublicNavbar from "@/components/news/PublicNavbar";
import FeaturedNewsFeed from "@/components/news/FeaturedNewsFeed";

const BATCH_SIZE = 9;

export default async function FeaturedPage() {
    const initialItems = await getFeaturedNews(BATCH_SIZE + 1, 0);
    const hasMore = initialItems.length > BATCH_SIZE;
    const items = hasMore ? initialItems.slice(0, BATCH_SIZE) : initialItems;

    return (
        <div className="min-h-dvh bg-background">
            <PublicNavbar />

            <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h1 className="text-2xl font-semibold">អត្ថបទជ្រើសរើស</h1>
                </div>

                <FeaturedNewsFeed
                    initialItems={items}
                    initialOffset={items.length}
                    batchSize={BATCH_SIZE}
                />
            </main>
        </div>
    );
}
