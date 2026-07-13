"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  PlusCircle,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AuthSession } from "@/lib/auth";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "All News",
    href: "/admin/news",
    icon: Newspaper,
  },
  {
    label: "Create News",
    href: "/admin/news/create",
    icon: PlusCircle,
  },
];

export function AdminSidebar({
  user,
}: {
  user?: AuthSession | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const visibleNavItems = user?.isEmployer
    ? navItems
    : navItems.filter((item) => item.href !== "/admin/news/create");

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        {!collapsed && (
          <span className="font-bold text-lg text-sidebar-foreground tracking-tight">
            Meanchey
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {visibleNavItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href, item.exact)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && item.label}
            </span>
          </Link>
        ))}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4 space-y-2">
        <Link href="/admin/settings">
          <span
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Settings size={18} className="shrink-0" />
            {!collapsed && "Settings"}
          </span>
        </Link>

        {!collapsed && (
          <div className="space-y-3 px-3 py-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {(user?.displayName?.[0] ?? "A").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user?.displayName ?? "Guest"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email ?? "Sign in to manage articles"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-2"
                  onClick={() => void handleLogout()}
                  disabled={isLoggingOut}
                >
                  <LogOut size={16} />
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </Button>
              ) : (
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "w-full justify-center",
                  )}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
