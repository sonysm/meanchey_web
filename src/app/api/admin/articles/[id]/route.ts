import { getNewsById } from "@/lib/news";
import {
    AUTH_COOKIE_NAME,
    getAuthCompanies,
    getCompanyId,
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
type DetailItem = {
    vdo?: unknown;
    audio?: unknown;
    file?: unknown;
    title?: unknown;
    text?: unknown;
    imgs?: unknown;
    order_no?: unknown;
};

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

const DATA_URL_PATTERN = /^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/;

const isDataUrl = (value: string): boolean => {
    return DATA_URL_PATTERN.test(value);
};

const dataUrlToBlob = (dataUrl: string): { blob: Blob; extension: string } | null => {
    const match = dataUrl.match(DATA_URL_PATTERN);
    if (!match) {
        return null;
    }

    const mimeType = match[1] ?? "application/octet-stream";
    const base64Payload = match[2] ?? "";

    try {
        const binary = Buffer.from(base64Payload, "base64");
        const slashIndex = mimeType.indexOf("/");
        const subtype = slashIndex >= 0 ? mimeType.slice(slashIndex + 1) : "bin";
        const extension = subtype.split("+")[0] || "bin";
        const blob = new Blob([binary], { type: mimeType });

        return { blob, extension };
    } catch {
        return null;
    }
};

const normalizeDetailPayload = (detail: unknown): DetailItem[] => {
    if (!Array.isArray(detail)) {
        return [{ order_no: 0, text: { insert: "" }, imgs: [], audio: "", vdo: "", file: null, title: null }];
    }

    return detail.map((item, index) => {
        const source = isRecord(item) ? item : {};
        const sourceImgs = Array.isArray(source.imgs)
            ? source.imgs
                .map((img) => extractImageName(img))
                .filter((img): img is string => Boolean(img))
            : [];

        return {
            vdo: source.vdo ?? "",
            audio: source.audio ?? "",
            file: source.file ?? null,
            title: source.title ?? null,
            text: source.text ?? { insert: "" },
            imgs: sourceImgs,
            order_no: Number(source.order_no ?? index),
        };
    });
};

const extractUploadedImages = (value: unknown): string[] => {
    if (typeof value === "string" && value.trim().length > 0) {
        return [value.trim()];
    }

    if (Array.isArray(value)) {
        return value
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => item.trim());
    }

    if (!isRecord(value)) {
        return [];
    }

    const candidates = [
        value.imgs,
        value.images,
        value.files,
        value.data,
        value.info,
        value.result,
    ];

    for (const candidate of candidates) {
        const found = extractUploadedImages(candidate);
        if (found.length > 0) {
            return found;
        }
    }

    const singles = [value.img, value.image, value.file, value.filename, value.file_name, value.name];
    for (const candidate of singles) {
        if (typeof candidate === "string" && candidate.trim().length > 0) {
            return [candidate.trim()];
        }
    }

    return [];
};

const uploadArticleImages = async (
    apiBaseUrl: string,
    loginToken: string,
    imageDataUrls: string[],
): Promise<string[]> => {
    if (imageDataUrls.length === 0) {
        return [];
    }

    const formData = new FormData();
    formData.append("login_token", loginToken);
    formData.append("access_token", loginToken);
    formData.append("country_code", "kh");

    for (let index = 0; index < imageDataUrls.length; index += 1) {
        const dataUrl = imageDataUrls[index];
        const encoded = dataUrlToBlob(dataUrl);

        if (!encoded) {
            throw new Error("Invalid embedded image format");
        }

        formData.append("imgs[]", encoded.blob, `image-${index}.${encoded.extension || "jpg"}`);
    }

    const uploadUrl = new URL("/article-imgs/upload", apiBaseUrl);
    const response = await fetch(uploadUrl.toString(), {
        method: "POST",
        body: formData,
    });

    const raw = await response.text();
    let data: unknown = null;
    try {
        data = raw ? (JSON.parse(raw) as unknown) : null;
    } catch {
        data = raw;
    }

    if (!response.ok) {
        throw new Error(extractMessage(data, `Failed to upload article images (${response.status})`));
    }

    const uploaded = extractUploadedImages(data);
    if (uploaded.length !== imageDataUrls.length) {
        throw new Error("Article image upload returned incomplete file list");
    }

    return uploaded;
};

const resolveDetailWithUploadedImages = async (
    apiBaseUrl: string,
    loginToken: string,
    detail: unknown,
): Promise<DetailItem[]> => {
    const normalized = normalizeDetailPayload(detail);

    const imageDataUrls: string[] = [];
    for (const item of normalized) {
        const imgs = Array.isArray(item.imgs)
            ? item.imgs.filter((img): img is string => typeof img === "string")
            : [];

        for (const image of imgs) {
            if (isDataUrl(image)) {
                imageDataUrls.push(image);
            }
        }
    }

    if (imageDataUrls.length === 0) {
        return normalized;
    }

    const uploadedFileNames = await uploadArticleImages(apiBaseUrl, loginToken, imageDataUrls);
    let uploadIndex = 0;

    return normalized.map((item) => {
        const imgs = Array.isArray(item.imgs)
            ? item.imgs.filter((img): img is string => typeof img === "string")
            : [];

        const nextImgs = imgs.map((img) => {
            if (!isDataUrl(img)) {
                return img;
            }

            const uploadedName = uploadedFileNames[uploadIndex];
            uploadIndex += 1;
            return uploadedName;
        });

        return {
            ...item,
            imgs: nextImgs,
        };
    });
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

const resolveSessionCompanyId = async (
    loginToken: string,
    existingCompanyId?: number,
): Promise<number | undefined> => {
    if (existingCompanyId && existingCompanyId > 0) {
        return existingCompanyId;
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

        const companyId = getCompanyId(profileRecord);
        if (companyId > 0) {
            return companyId;
        }

        const companies = getAuthCompanies(profileRecord);
        return companies.length > 0 ? companies[0]?.id : undefined;
    } catch {
        return undefined;
    }
};

const loadAllowedCompanyIds = async (
    loginToken: string,
    cookieCompanyIds: number[],
): Promise<Set<number>> => {
    const allowedCompanyIds = new Set(
        cookieCompanyIds
            .map((companyId) => Number(companyId))
            .filter((companyId) => Number.isFinite(companyId) && companyId > 0),
    );

    if (allowedCompanyIds.size > 0 || !API_BASE_URL) {
        return allowedCompanyIds;
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
            return allowedCompanyIds;
        }

        const profileData = await readJson(profileResponse);
        const profileRecord = getFirstRecord(profileData);
        if (!profileRecord) {
            return allowedCompanyIds;
        }

        for (const company of getAuthCompanies(profileRecord)) {
            allowedCompanyIds.add(company.id);
        }

        const fallbackCompanyId = getCompanyId(profileRecord);
        if (fallbackCompanyId > 0) {
            allowedCompanyIds.add(fallbackCompanyId);
        }
    } catch {
        return allowedCompanyIds;
    }

    return allowedCompanyIds;
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

    if (!session?.isEmployer || !session.loginToken) {
        return NextResponse.json(
            { message: "Employer login is required" },
            { status: 401 },
        );
    }

    const sessionCompanyId = await resolveSessionCompanyId(session.loginToken, session.companyId);

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
        companyId?: string;
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

    const allowedCompanyIds = await loadAllowedCompanyIds(
        session.loginToken,
        (session.companies ?? []).map((company) => company.id),
    );

    const selectedCompanyId = Number(body.companyId ?? 0);
    let payloadCompanyId: number | undefined;

    if (selectedCompanyId > 0) {
        if (allowedCompanyIds.size > 0 && !allowedCompanyIds.has(selectedCompanyId)) {
            return NextResponse.json(
                { message: "Selected host company is not linked to this account" },
                { status: 403 },
            );
        }
        payloadCompanyId = selectedCompanyId;
    } else if (sessionCompanyId && sessionCompanyId > 0) {
        payloadCompanyId = sessionCompanyId;
    } else if (allowedCompanyIds.size > 0) {
        payloadCompanyId = Array.from(allowedCompanyIds)[0];
    }

    let detailPayload: DetailItem[];
    try {
        detailPayload = await resolveDetailWithUploadedImages(
            API_BASE_URL,
            session.loginToken,
            toDetailPayload(body.content ?? ""),
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to process article images";
        return NextResponse.json({ message }, { status: 400 });
    }

    const payload = {
        id: Number(id) || id,
        ...(payloadCompanyId ? { cid: payloadCompanyId } : {}),
        title,
        detail: detailPayload,
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
        //console.debug("news.resolveCoverImage: using explicit cover", { response, data });
        return NextResponse.json(
            { message: "Failed to update article", data },
            { status: response.status },
        );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/news");
    revalidatePath("/");
    revalidatePath("/search");

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
                revalidatePath("/");
                revalidatePath("/search");
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
