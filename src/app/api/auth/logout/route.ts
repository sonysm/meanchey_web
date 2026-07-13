import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const buildClearedCookieResponse = () => {
    const response = NextResponse.json({ message: "Logged out" }, { status: 200 });

    response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: "",
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
    });

    return response;
};

export async function POST() {
    return buildClearedCookieResponse();
}

export async function GET(request: NextRequest) {
    // Ignore accidental GETs (e.g. prefetch) to avoid clearing a valid session.
    return NextResponse.redirect(new URL("/admin", request.url));
}
