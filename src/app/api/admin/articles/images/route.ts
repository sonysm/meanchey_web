import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getAuthSessionFromCookieValue } from "@/lib/auth";

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

    const directCandidates = [
        value.imgs,
        value.images,
        value.files,
        value.data,
        value.info,
        value.result,
    ];

    for (const candidate of directCandidates) {
        const found = extractUploadedImages(candidate);
        if (found.length > 0) {
            return found;
        }
    }

    const singleCandidates = [value.img, value.image, value.file, value.filename, value.file_name, value.name];
    for (const candidate of singleCandidates) {
        if (typeof candidate === "string" && candidate.trim().length > 0) {
            return [candidate.trim()];
        }
    }

    return [];
};

const uploadImages = async (apiBaseUrl: string, loginToken: string, files: File[]) => {
    const upstreamFormData = new FormData();
    upstreamFormData.append("login_token", loginToken);
    upstreamFormData.append("access_token", loginToken);
    upstreamFormData.append("country_code", "kh");

    for (const file of files) {
        upstreamFormData.append("imgs[]", file, "image.jpg");
    }

    const url = new URL("/article-imgs/upload", apiBaseUrl);
    const response = await fetch(url.toString(), {
        method: "POST",
        body: upstreamFormData,
    });

    const raw = await response.text();
    let data: unknown = null;
    try {
        data = raw ? (JSON.parse(raw) as unknown) : null;
    } catch {
        data = raw;
    }

    return { response, data };
};

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const inputFiles = [
        ...formData.getAll("imgs"),
        ...formData.getAll("imgs[]"),
    ].filter((value): value is File => value instanceof File);

    if (inputFiles.length === 0) {
        return NextResponse.json({ message: "No image file provided" }, { status: 400 });
    }

    const result = await uploadImages(API_BASE_URL, session.loginToken, inputFiles);

    if (!result.response.ok) {
        return NextResponse.json(
            { message: extractMessage(result.data, `Failed to upload image (${result.response.status})`), data: result.data },
            { status: result.response.status },
        );
    }

    const imgs = extractUploadedImages(result.data);
    if (imgs.length === 0) {
        return NextResponse.json(
            {
                message: "Image uploaded but no image name returned by API",
                data: result.data,
            },
            { status: 502 },
        );
    }

    return NextResponse.json({ message: "Image uploaded", imgs, data: result.data });
}
