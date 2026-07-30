import { NextRequest, NextResponse } from "next/server";

import { getFeaturedNews } from "@/lib/news";

const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 18;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const requestedLimit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
    const requestedOffset = Number(searchParams.get("offset") ?? 0);

    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;
    const offset = Number.isFinite(requestedOffset) && requestedOffset >= 0
        ? requestedOffset
        : 0;

    const items = await getFeaturedNews(limit + 1, offset);
    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;

    return NextResponse.json({
        data,
        hasMore,
        nextOffset: offset + data.length,
    });
}
