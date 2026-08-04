import { AUTH_COOKIE_NAME, getAuthSessionFromCookieValue } from "@/lib/auth";
import { FCM_ANDROID_PACKAGE, FCM_APNS_BUNDLE_ID, FCM_ARTICLE_TOPIC, getFirebaseMessaging } from "@/lib/firebase-admin";
import type { Message } from "firebase-admin/messaging";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

// POST /api/admin/articles/[id]/notify
// Body: { title: string; imageUrl?: string }
export async function POST(request: NextRequest, context: RouteContext) {
    const session = getAuthSessionFromCookieValue(request.cookies.get(AUTH_COOKIE_NAME)?.value);
    if (!session?.isEmployer || !session.loginToken) {
        return NextResponse.json({ message: "Employer login is required" }, { status: 401 });
    }

    const { id } = await context.params;

    let body: unknown;
    try {
        body = await request.json() as unknown;
    } catch {
        return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const title = typeof b.title === "string" ? b.title : "";
    const imageUrl = typeof b.imageUrl === "string" && b.imageUrl.trim().length > 0 ? b.imageUrl.trim() : undefined;

    console.debug("POST /api/admin/articles/[id]/notify", { id, title, imageUrl });
    try {
        const messaging = getFirebaseMessaging();

        const message: Message = {
            topic: FCM_ARTICLE_TOPIC,
            notification: {
                title: "Meanchey News",
                body: title || "New article published",
                ...(imageUrl ? { imageUrl } : {}),
            },
            android: {
                ...(FCM_ANDROID_PACKAGE ? { restrictedPackageName: FCM_ANDROID_PACKAGE } : {}),
                notification: {
                    ...(imageUrl ? { imageUrl } : {}),
                },
            },
            apns: {
                ...(FCM_APNS_BUNDLE_ID ? { headers: { "apns-topic": FCM_APNS_BUNDLE_ID } } : {}),
                ...(imageUrl ? { fcmOptions: { imageUrl } } : {}),
            },
            data: {
                id,
                type: "article",
                title: "Article",
                detail: title,
                ...(imageUrl ? { image: imageUrl } : {}),
            },
        };

        await messaging.send(message);

        return NextResponse.json({ message: "Notification sent" });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send notification";
        return NextResponse.json({ message }, { status: 500 });
    }
}
