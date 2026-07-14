"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthSession } from "@/lib/auth";

type PublicNavbarProps = {
    showAuthActions?: boolean;
};

export default function PublicNavbar({ showAuthActions = true }: PublicNavbarProps) {
    const router = useRouter();
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadSession = async () => {
            try {
                const response = await fetch("/api/auth/session", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                const payload = (await response.json().catch(() => ({}))) as { data?: AuthSession | null };
                if (isMounted) {
                    setSession(payload.data ?? null);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingSession(false);
                }
            }
        };

        void loadSession();

        return () => {
            isMounted = false;
        };
    }, []);

    const isAdmin = useMemo(
        () => session?.isEmployer === true || session?.userTypeId === 1,
        [session],
    );

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
            setSession(null);
            router.replace("/");
            router.refresh();
        } finally {
            setIsLoggingOut(false);
        }
    };

    const userInitial = (session?.displayName?.[0] ?? session?.email?.[0] ?? "U").toUpperCase();

    return (
        <header className="border-b border-border bg-card/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                <Link href="/" className="inline-flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/meanchey-logo.svg"
                        alt="Meanchey logo"
                        className="h-9 w-9 rounded-md"
                    />
                    <span className="text-xl font-semibold tracking-tight">Meanchey News</span>
                </Link>

                {showAuthActions ? (
                    <div className="flex items-center gap-2">
                        {session?.loginToken ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant="outline" size="sm" className="h-9 gap-2 px-2 sm:px-3">
                                        <Avatar size="sm">
                                            <AvatarFallback>{userInitial}</AvatarFallback>
                                        </Avatar>
                                        <span className="hidden max-w-[180px] truncate sm:inline">
                                            {session.displayName ?? session.email ?? "User"}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <DropdownMenuLabel>
                                        <p className="truncate text-sm font-medium">
                                            {session.displayName ?? "User"}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {session.email ?? ""}
                                        </p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {isAdmin ? (
                                        <DropdownMenuItem onClick={() => router.push("/admin")}>Admin panel</DropdownMenuItem>
                                    ) : null}
                                    <DropdownMenuItem
                                        variant="destructive"
                                        disabled={isLoggingOut}
                                        onClick={() => void handleLogout()}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {isLoggingOut ? "Logging out..." : "Log out"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Link href="/auth/login">
                                    <Button variant="outline" size="sm" disabled={isLoadingSession}>Sign in</Button>
                                </Link>
                                <Link href="/signup">
                                    <Button size="sm" disabled={isLoadingSession}>Sign up</Button>
                                </Link>
                            </>
                        )}
                    </div>
                ) : null}
            </div>
        </header>
    );
}
