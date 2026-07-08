import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const response = NextResponse.redirect(new URL("/login", request.url));

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
}
