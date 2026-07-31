import { AUTH_COOKIE_NAME, getAuthSessionFromCookieValue } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

const extractMessage = (value: unknown, fallback: string): string => {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }
    if (isRecord(value)) {
        const nestedData = isRecord(value.data) ? value.data : null;
        const message =
            value.message ??
            value.error ??
            value.detail ??
            value.msg ??
            nestedData?.message ??
            nestedData?.error;
        if (typeof message === "string" && message.trim().length > 0) {
            return message;
        }
    }
    return fallback;
};

// POST /api/admin/articles/[id]/feature
// Body: { feature: 0 | 1 }
export async function POST(request: NextRequest, context: RouteContext) {
    if (!API_BASE_URL) {
        return NextResponse.json(
            { message: "MEANCHEY_API_BASE_URL is not configured" },
            { status: 500 },
        );
    }

    const session = getAuthSessionFromCookieValue(request.cookies.get(AUTH_COOKIE_NAME)?.value);
    if (!session?.isEmployer || !session.loginToken) {
        return NextResponse.json(
            { message: "Employer login is required" },
            { status: 401 },
        );
    }

    const { id } = await context.params;

    let body: unknown;
    try {
        body = await request.json() as unknown;
    } catch {
        return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    const featureValue = isRecord(body) ? body.feature : undefined;
    if (featureValue !== 0 && featureValue !== 1) {
        return NextResponse.json(
            { message: "feature must be 0 or 1" },
            { status: 400 },
        );
    }

    const payload = {
        id: Number(id) || id,
        feature: featureValue,
        login_token: session.loginToken,
    };

    const url = new URL("/article/update-feature", API_BASE_URL);
    const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let data: unknown = null;
    try {
        data = raw ? (JSON.parse(raw) as unknown) : null;
    } catch {
        data = raw;
    }

    if (!response.ok) {
        return NextResponse.json(
            { message: extractMessage(data, `Failed to update featured status (${response.status})`) },
            { status: response.status },
        );
    }

    revalidatePath("/admin/news");
    revalidatePath("/featured");
    revalidatePath("/");

    return NextResponse.json({ message: "Featured status updated", data });
}
