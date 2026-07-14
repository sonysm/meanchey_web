import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AUTH_COOKIE_NAME, parseAuthSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = parseAuthSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!session?.loginToken) {
    redirect("/login");
  }

  if (!session.isEmployer && session.userTypeId !== 1) {
    redirect("/?reason=employer-required");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar user={session} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
