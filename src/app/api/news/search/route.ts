import { NextRequest, NextResponse } from "next/server";

import { searchNews } from "@/lib/news";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const text = (searchParams.get("text") ?? searchParams.get("q") ?? "").trim();
    const countryCode = (searchParams.get("country_code") ?? "kh").trim() || "kh";

    const requestedLimit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
    const requestedOffset = Number(searchParams.get("offset") ?? 0);

    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;
    const offset = Number.isFinite(requestedOffset) && requestedOffset >= 0
        ? requestedOffset
        : 0;

    if (!text) {
        return NextResponse.json({
            data: [],
            hasMore: false,
            nextOffset: offset,
        });
    }

    const { data, hasMore, nextOffset } = await searchNews(text, limit, offset, countryCode);

    return NextResponse.json({
        data,
        hasMore,
        nextOffset,
    });
}
