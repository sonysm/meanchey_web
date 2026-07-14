import Link from "next/link";

import { Button } from "@/components/ui/button";

type PublicNavbarProps = {
    showAuthActions?: boolean;
};

export default function PublicNavbar({ showAuthActions = true }: PublicNavbarProps) {
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
                        <Link href="/auth/login">
                            <Button variant="outline" size="sm">Sign in</Button>
                        </Link>
                        <Link href="/signup">
                            <Button size="sm">Sign up</Button>
                        </Link>
                    </div>
                ) : null}
            </div>
        </header>
    );
}
