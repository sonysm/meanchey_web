import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getAuthSessionFromCookieValue } from "@/lib/auth";
import { searchCompanies, getCompanies } from "@/lib/companies";
import { cookies } from "next/headers";

/**
 * GET /api/admin/companies?q=<search text>
 *
 * Returns companies list. If `q` is provided, proxies to /com/search.
 * Requires a valid admin session.
 */
export async function GET(request: NextRequest) {
  // Auth guard
  const cookieStore = await cookies();
  const session = getAuthSessionFromCookieValue(
    cookieStore.get(AUTH_COOKIE_NAME)?.value,
  );

  if (!session?.loginToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  try {
    const companies = q ? await searchCompanies(q) : await getCompanies();
    return NextResponse.json({ companies });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 },
    );
  }
}
