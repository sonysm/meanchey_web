import { getNewsById } from "@/lib/news";
import {
    AUTH_COOKIE_NAME,
    getAuthSessionFromCookieValue,
    getFirstRecord,
    getNumberValue,
} from "@/lib/auth";
import { revalidatePath } from "next/cache";
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

const isOwnedByUser = (authorId: string, userId: number | undefined): boolean => {
    if (!authorId || !userId || userId <= 0) {
        return false;
    }

    return authorId === String(userId);
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
            value.error_message ??
            nestedData?.message ??
            nestedData?.error ??
            nestedData?.detail ??
            nestedData?.msg ??
            nestedData?.error_message;
        if (typeof message === "string" && message.trim().length > 0) {
            return message;
        }
    }

    return fallback;
};

const readJson = async (response: Response): Promise<unknown> => {
    const raw = await response.text();

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as unknown;
    } catch {
        return raw;
    }
};

type DeleteBodyKind = "json" | "form";

const buildDeleteJsonPayload = (id: string | number, loginToken: string) => {
    return {
        id,
        login_token: loginToken,
        access_token: loginToken,
    };
};

const buildDeleteFormPayload = (id: string | number, loginToken: string) => {
    const formData = new FormData();
    formData.append("id", String(id));
    formData.append("login_token", loginToken);
    formData.append("access_token", loginToken);
    return formData;
};

const resolveSessionUserId = async (
    loginToken: string,
    existingUserId?: number,
): Promise<number | undefined> => {
    if (existingUserId && existingUserId > 0) {
        return existingUserId;
    }

    if (!API_BASE_URL) {
        return undefined;
    }

    try {
        const profileResponse = await fetch(new URL("/profile", API_BASE_URL), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ login_token: loginToken }),
            cache: "no-store",
        });

        if (!profileResponse.ok) {
            return undefined;
        }

        const profileData = await readJson(profileResponse);
        const profileRecord = getFirstRecord(profileData);
        if (!profileRecord) {
            return undefined;
        }

        const userId = getNumberValue(profileRecord, ["user_id", "userId", "id", "uid"]);
        return userId > 0 ? userId : undefined;
    } catch {
        return undefined;
    }
};

export async function GET(request: NextRequest, context: RouteContext) {
    const session = getAuthSessionFromCookieValue(request.cookies.get(AUTH_COOKIE_NAME)?.value);
    if (!session?.isEmployer || !session.loginToken) {
        return NextResponse.json(
            { message: "Employer login is required" },
            { status: 401 },
        );
    }

    const sessionUserId = await resolveSessionUserId(session.loginToken, session.userId);
    if (!sessionUserId) {
        return NextResponse.json(
            { message: "Employer login is required" },
            { status: 401 },
        );
    }

    const { id } = await context.params;
    const article = await getNewsById(id);

    if (!article) {
        return NextResponse.json({ message: "Article not found" }, { status: 404 });
    }

    if (!isOwnedByUser(article.authorId, sessionUserId)) {
        return NextResponse.json(
            { message: "You can only edit your own articles" },
            { status: 403 },
        );
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

    const sessionUserId = await resolveSessionUserId(session.loginToken, session.userId);
    if (!sessionUserId) {
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

    const article = await getNewsById(id);
    if (!article) {
        return NextResponse.json({ message: "Article not found" }, { status: 404 });
    }

    if (!isOwnedByUser(article.authorId, sessionUserId)) {
        return NextResponse.json(
            { message: "You can only edit your own articles" },
            { status: 403 },
        );
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

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const sessionUserId = await resolveSessionUserId(session.loginToken, session.userId);
    if (!sessionUserId) {
        return NextResponse.json(
            { message: "Employer login is required" },
            { status: 401 },
        );
    }

    const { id } = await context.params;
    const article = await getNewsById(id);
    if (!article) {
        return NextResponse.json({ message: "Article not found" }, { status: 404 });
    }

    if (!isOwnedByUser(article.authorId, sessionUserId)) {
        return NextResponse.json(
            { message: "You can only delete your own articles" },
            { status: 403 },
        );
    }

    const resolvedId = Number(id) || id;
    const deleteEndpointCandidates = [
        // Primary endpoint used by mobile app contract.
        "/article-del",
        "/article-delete",
        // Common fallbacks across API variants.
        "/article-remove",
        "/article/delete",
        "/article/remove",
        `/article-delete/${resolvedId}`,
        `/article-remove/${resolvedId}`,
        `/article/delete/${resolvedId}`,
        `/article/remove/${resolvedId}`,
    ];

    const requestCandidates: Array<{ method: "POST" | "DELETE"; bodyKind: DeleteBodyKind }> = [
        // Keep first attempt identical to mobile app behavior.
        { method: "POST", bodyKind: "json" },
        { method: "POST", bodyKind: "form" },
        { method: "DELETE", bodyKind: "json" },
        { method: "DELETE", bodyKind: "form" },
    ];

    let lastStatus = 502;
    let lastData: unknown = null;
    const attempts: string[] = [];

    for (const endpoint of deleteEndpointCandidates) {
        for (const candidate of requestCandidates) {
            const url = new URL(endpoint, API_BASE_URL);
            const isJson = candidate.bodyKind === "json";
            const body = isJson
                ? JSON.stringify(buildDeleteJsonPayload(resolvedId, session.loginToken))
                : buildDeleteFormPayload(resolvedId, session.loginToken);
            const headers = isJson ? { "Content-Type": "application/json" } : undefined;

            attempts.push(`${candidate.method} ${endpoint} (${candidate.bodyKind})`);

            const response = await fetch(url.toString(), {
                method: candidate.method,
                headers,
                body,
            });

            const data = await readJson(response);
            if (response.ok) {
                revalidatePath("/admin");
                revalidatePath("/admin/news");
                return NextResponse.json({ message: "Article deleted", data });
            }

            lastStatus = response.status;
            lastData = data;

            // Keep trying alternative endpoint/method combinations for route/method mismatches.
            if (response.status === 404 || response.status === 405) {
                continue;
            }

            return NextResponse.json(
                {
                    message: extractMessage(data, `Failed to delete article (${response.status})`),
                    data,
                },
                { status: response.status },
            );
        }
    }

    return NextResponse.json(
        {
            message: extractMessage(lastData, `Failed to delete article (${lastStatus})`),
            data: lastData,
            attempts,
        },
        { status: lastStatus },
    );
}
