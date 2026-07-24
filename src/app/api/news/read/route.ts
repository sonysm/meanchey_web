import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;

export async function POST(request: NextRequest) {
    if (!API_BASE_URL) {
        return NextResponse.json({ ok: false, error: "API base URL is not configured." }, { status: 500 });
    }

    let payload: { id?: string | number } = {};

    try {
        payload = (await request.json()) as { id?: string | number };
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
    }

    const rawId = payload?.id;
    if (rawId === undefined || rawId === null || String(rawId).trim().length === 0) {
        return NextResponse.json({ ok: false, error: "Article id is required." }, { status: 400 });
    }

    const normalizedId = Number(rawId);
    const idValue = Number.isNaN(normalizedId) ? String(rawId).trim() : normalizedId;

    const body = {
        id: idValue,
        user_id: 0,
    };

    try {
        const response = await fetch(new URL("/article/read/add", API_BASE_URL), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return NextResponse.json(
                { ok: false, error: "Failed to update article view count." },
                { status: 502 },
            );
        }



        const data = await response.json().catch(() => null);
        console.debug("article/read/add", { data });
        return NextResponse.json({ ok: true, data });
    } catch {
        return NextResponse.json({ ok: false, error: "Unable to reach article view endpoint." }, { status: 502 });
    }
}
