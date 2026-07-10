import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, parseAuthSession } from "./src/lib/auth";

const isProtectedArticleRoute = (pathname: string): boolean => {
    return (
        pathname === "/admin/news/create" ||
        /^\/admin\/news\/[^/]+\/edit\/?$/.test(pathname)
    );
};

export async function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const cookieStore = request.cookies;
    const session = await parseAuthSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);

    if (pathname === "/login") {
        if (session?.isEmployer) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }

        return NextResponse.next();
    }

    if (!isProtectedArticleRoute(pathname)) {
        return NextResponse.next();
    }

    if (!session) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    if (!session.isEmployer) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("reason", "employer-required");
        loginUrl.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/login", "/admin/news/create", "/admin/news/:path*/edit"],
};
