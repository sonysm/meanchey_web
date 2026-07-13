import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
    AUTH_COOKIE_NAME,
    getAuthCompanies,
    getCompanyId,
    getFirstRecord,
    getNumberValue,
    getStringValue,
    parseAuthSession,
    resolveEmployerFlag,
    serializeAuthSession,
} from "@/lib/auth";

const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;

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

export async function GET() {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = parseAuthSession(cookie);

    if (!session?.loginToken) {
        return NextResponse.json({ data: null });
    }

    if (!API_BASE_URL) {
        return NextResponse.json({ data: session });
    }

    try {
        const profileResponse = await fetch(new URL("/profile", API_BASE_URL), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ login_token: session.loginToken }),
            cache: "no-store",
        });

        if (!profileResponse.ok) {
            return NextResponse.json({ data: session });
        }

        const profileData = await readJson(profileResponse);
        const profileRecord = getFirstRecord(profileData);
        if (!profileRecord) {
            return NextResponse.json({ data: session });
        }

        const userTypeId = getNumberValue(profileRecord, ["user_type_id", "userTypeId"]);
        const nextSession = {
            ...session,
            userTypeId: userTypeId > 0 ? userTypeId : session.userTypeId,
            isEmployer: resolveEmployerFlag(profileRecord) || session.isEmployer,
            displayName:
                getStringValue(profileRecord, ["display_name", "displayName", "name"]) ||
                session.displayName,
            email: getStringValue(profileRecord, ["email"]) || session.email,
            companyId: getCompanyId(profileRecord) || session.companyId,
            companies: getAuthCompanies(profileRecord),
        };

        const response = NextResponse.json({ data: nextSession });
        response.cookies.set({
            name: AUTH_COOKIE_NAME,
            value: serializeAuthSession(nextSession),
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 14,
        });

        return response;
    } catch {
        return NextResponse.json({ data: session });
    }
}
