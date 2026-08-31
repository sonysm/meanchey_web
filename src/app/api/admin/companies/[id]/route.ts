import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, parseAuthSession } from "@/lib/auth";
import { deleteCompany } from "@/lib/companies";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!sessionValue) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const session = parseAuthSession(sessionValue);
  if (!session || !session.loginToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Next.js 15 requires awaiting params
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: "Missing company ID" }, { status: 400 });
  }

  const success = await deleteCompany(id, session.loginToken);

  if (!success) {
    return NextResponse.json(
      { message: "Failed to delete company. It may not exist or you might not have permission." },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: "Company deleted successfully" });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;
  if (!API_BASE_URL) {
    return NextResponse.json({ message: "API URL not configured" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = sessionValue ? parseAuthSession(sessionValue) : null;

  if (!session || !session.loginToken || session.userTypeId !== 1) {
    return NextResponse.json({ message: "Unauthorized. Must be admin." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Missing company ID" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    formData.append("login_token", session.loginToken);
    formData.append("id", id);
    
    // Add default country_code if not present
    if (!formData.has("country_code")) {
      formData.append("country_code", "kh");
    }

    const url = new URL("/com-update", API_BASE_URL);
    const response = await fetch(url.toString(), {
      method: "POST", // API accepts POST for updates usually, but we expose as PUT internally
      body: formData,
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
        { message: "Failed to update company", data },
        { status: response.status }
      );
    }

    const result = data as { error_code?: number; error_message?: string };
    if (result.error_code !== 0 && result.error_code !== undefined) {
      return NextResponse.json(
        { message: result.error_message || "Failed to update company", data },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Company updated successfully", data });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
