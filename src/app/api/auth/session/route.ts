import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, parseAuthSession } from "@/lib/auth";

export async function GET() {
    const cookie = cookies().get(AUTH_COOKIE_NAME)?.value;
    const session = parseAuthSession(cookie);

    return NextResponse.json({ data: session });
}