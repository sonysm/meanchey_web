import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAuthSession } from "@/lib/auth";

const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;

export async function POST(req: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: "API URL not configured" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = sessionValue ? parseAuthSession(sessionValue) : null;

  if (!session || !session.loginToken || (!session.isEmployer && session.userTypeId !== 1)) {
    return NextResponse.json({ message: "Unauthorized. Must be admin or employer." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    formData.append("login_token", session.loginToken);
    
    // Add default country_code if not present
    if (!formData.has("country_code")) {
      formData.append("country_code", "kh");
    }

    const url = new URL("/com-save", API_BASE_URL);
    const response = await fetch(url.toString(), {
      method: "POST",
      body: formData, // passing raw formData handles multipart boundary natively
    });

    const raw = await response.text();
    let data: unknown = null;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to create company", data },
        { status: response.status }
      );
    }

    // Usually meanchey API returns error_code 0 for success
    const result = data as { error_code?: number; error_message?: string };
    if (result.error_code !== 0 && result.error_code !== undefined) {
      return NextResponse.json(
        { message: result.error_message || "Failed to create company", data },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Company created successfully", data });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
