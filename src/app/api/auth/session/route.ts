import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, parseAuthSession } from "@/lib/auth";

export async function GET() {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = await parseAuthSession(cookie);

    return NextResponse.json({ data: session });
}