import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

function getFirebaseAdmin() {
    if (getApps().length > 0) {
        return getApp();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Newlines in env vars are escaped; restore them
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Firebase Admin SDK env vars are not configured (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
    }

    return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });
}

export function getFirebaseMessaging() {
    return getMessaging(getFirebaseAdmin());
}

export const FCM_ARTICLE_TOPIC = process.env.FCM_TOPIC ?? "articles";
// Scope delivery to a specific app (optional)
export const FCM_ANDROID_PACKAGE = process.env.FCM_ANDROID_PACKAGE_NAME ?? "";
export const FCM_APNS_BUNDLE_ID = process.env.FCM_APNS_BUNDLE_ID ?? "";
