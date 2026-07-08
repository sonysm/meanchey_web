import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, parseAuthSession } from "@/lib/auth";

export async function GET() {
    const cookieStore = await cookies();
    const session = parseAuthSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);

    if (!session) {
        return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json({ data: session });
}
