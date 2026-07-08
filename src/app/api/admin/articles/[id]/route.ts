import { getNewsById } from "@/lib/news";
import { AUTH_COOKIE_NAME, getAuthSessionFromCookieValue } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;

type DeltaOperation = { insert?: unknown; attributes?: Record<string, unknown> };
type DeltaPayload = { ops?: DeltaOperation[] };

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

const isDeltaPayload = (value: unknown): value is DeltaPayload => {
    return isRecord(value) && Array.isArray(value.ops);
};

const isDetailArrayPayload = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
};

const extractImageName = (rawImage: unknown): string | null => {
    if (typeof rawImage !== "string" || !rawImage) {
        return null;
    }

    if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) {
        try {
            const pathname = new URL(rawImage).pathname;
            const file = pathname.split("/").filter(Boolean).pop();
            return file ?? rawImage;
        } catch {
            return rawImage;
        }
    }

    return rawImage;
};

const getStringField = (value: unknown): string | null => {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }
    return null;
};

const deltaToDetailPayload = (delta: DeltaPayload): unknown[] => {
    const ops = Array.isArray(delta.ops) ? delta.ops : [];

    return ops.map((op, index) => {
        const insert = op.insert;
        const item = {
            vdo: "",
            audio: "",
            file: null,
            title: null,
            text: { insert: "" },
            imgs: [] as string[],
            order_no: index,
        };

        if (typeof insert === "string") {
            item.text = { insert };
            return item;
        }

        if (isRecord(insert) && "image" in insert) {
            const imageNameFromAttr = getStringField(op.attributes?.imageName);
            const imageName = imageNameFromAttr ?? extractImageName(insert.image);
            if (imageName) {
                item.imgs = [imageName];
            }
            return item;
        }

        item.text = { insert: "\n" };
        return item;
    });
};

const toDetailPayload = (content: string): unknown => {
    if (!content) {
        return [{ order_no: 0, text: "", imgs: [], audio: "", vdo: "", file: "" }];
    }

    try {
        const parsed = JSON.parse(content) as unknown;

        if (isDetailArrayPayload(parsed)) {
            return parsed;
        }

        if (isDeltaPayload(parsed)) {
            return deltaToDetailPayload(parsed);
        }

        return [{ order_no: 0, text: { insert: String(content) }, imgs: [], audio: "", vdo: "", file: null }];
    } catch {
        return [{ order_no: 0, text: { insert: content }, imgs: [], audio: "", vdo: "", file: null }];
    }
};

const toTagPayload = (tags?: string | string[]): string[] => {
    if (!tags) {
        return [];
    }

    if (Array.isArray(tags)) {
        return tags
            .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
            .filter(Boolean);
    }

    return tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
};

export async function GET(_request: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    const article = await getNewsById(id);

    if (!article) {
        return NextResponse.json({ message: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ data: article });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    if (!API_BASE_URL) {
        return NextResponse.json(
            { message: "MEANCHEY_API_BASE_URL is not configured" },
            { status: 500 },
        );
    }

    const session = getAuthSessionFromCookieValue(request.cookies.get(AUTH_COOKIE_NAME)?.value);

    if (!session?.isEmployer || !session.loginToken || !session.companyId) {
        return NextResponse.json(
            { message: "Employer login is required" },
            { status: 401 },
        );
    }

    const { id } = await context.params;
    const body = (await request.json()) as {
        title?: string;
        content?: string;
        tags?: string | string[];
    };

    const title = (body.title ?? "").trim();
    if (!title) {
        return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    const payload = {
        id: Number(id) || id,
        cid: session.companyId,
        title,
        detail: toDetailPayload(body.content ?? ""),
        tag: toTagPayload(body.tags),
        login_token: session.loginToken,
    };

    const url = new URL("/article-update", API_BASE_URL);
    const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
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
            { message: "Failed to update article", data },
            { status: response.status },
        );
    }

    return NextResponse.json({ message: "Article updated", data });
}
