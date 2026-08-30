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
