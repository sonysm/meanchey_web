import { NextRequest, NextResponse } from "next/server";

import {
    AUTH_COOKIE_NAME,
    getAuthCompanies,
    getFirstRecord,
    getNumberValue,
    getStringValue,
    resolveEmployerFlag,
    serializeAuthSession,
} from "@/lib/auth";

const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
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

const extractMessage = (value: unknown, fallback: string): string => {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }

    if (isRecord(value)) {
        const message = value.message ?? value.error ?? value.detail;
        if (typeof message === "string" && message.trim().length > 0) {
            return message;
        }
    }

    return fallback;
};

const getCompanyId = (profile: Record<string, unknown>): number => {
    const companies = [profile.my_company, profile.myCompany, profile.company, profile.companies];

    for (const candidate of companies) {
        const record = getFirstRecord(candidate);
        if (!record) {
            continue;
        }

        const companyId = getNumberValue(record, ["id", "company_id", "cid"]);
        if (companyId > 0) {
            return companyId;
        }
    }

    return 0;
};

export async function POST(request: NextRequest) {
    if (!API_BASE_URL) {
        return NextResponse.json(
            { message: "MEANCHEY_API_BASE_URL is not configured" },
            { status: 500 },
        );
    }

    const body = (await request.json()) as {
        username?: string;
        password?: string;
    };

    const username = (body.username ?? "").trim();
    const password = (body.password ?? "").trim();

    if (!username || !password) {
        return NextResponse.json(
            { message: "Username and password are required" },
            { status: 400 },
        );
    }

    const loginResponse = await fetch(new URL("/login", API_BASE_URL), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, pwd: password }),
    });

    const loginData = await readJson(loginResponse);
    if (!loginResponse.ok) {
        return NextResponse.json(
            {
                message: extractMessage(loginData, "Invalid login credentials"),
                data: loginData,
            },
            { status: loginResponse.status },
        );
    }

    const loginRecord = getFirstRecord(loginData);
    const loginToken = loginRecord
        ? getStringValue(loginRecord, ["login_token", "loginToken", "token"])
        : "";

    if (!loginToken) {
        return NextResponse.json(
            { message: "Login token was not returned by the API" },
            { status: 502 },
        );
    }

    const profileResponse = await fetch(new URL("/profile", API_BASE_URL), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ login_token: loginToken }),
    });

    const profileData = await readJson(profileResponse);
    if (!profileResponse.ok) {
        return NextResponse.json(
            {
                message: extractMessage(profileData, "Failed to load profile"),
                data: profileData,
            },
            { status: profileResponse.status },
        );
    }

    const profileRecord = getFirstRecord(profileData);
    if (!profileRecord) {
        return NextResponse.json(
            { message: "Profile response was empty" },
            { status: 502 },
        );
    }

    const companyId = getCompanyId(profileRecord);
    const isEmployer = resolveEmployerFlag(profileRecord, loginRecord);
    const userTypeId = getNumberValue(profileRecord, ["user_type_id", "userTypeId"]);

    const authSession = {
        loginToken,
        userTypeId,
        isEmployer,
        displayName: getStringValue(profileRecord, ["display_name", "displayName", "name"]),
        email: getStringValue(profileRecord, ["email"]),
        companyId,
        companies: getAuthCompanies(profileRecord),
    };

    const response = NextResponse.json({
        message: "Login successful",
        data: authSession,
    });

    response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: serializeAuthSession(authSession),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
    });

    // response.cookies.set({
    //     name: 'debug-meanchey-auth',
    //     value: serializeAuthSession(authSession),
    //     httpOnly: false,
    //     sameSite: 'lax',
    //     secure: false,
    //     path: '/',
    //     maxAge: 60 * 60
    // });

    return response;
}
