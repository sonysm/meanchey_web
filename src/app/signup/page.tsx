import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import PublicNavbar from "@/components/news/PublicNavbar";

export default function SignupComingSoonPage() {
    return (
        <div className="min-h-dvh bg-background">
            <PublicNavbar showAuthActions={false} />
            <main className="mx-auto flex min-h-[calc(100dvh-73px)] w-full max-w-3xl items-center justify-center px-4 py-10">
                <div className="w-full rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Coming Soon</p>
                    <h1 className="mt-2 text-2xl font-semibold">Sign up is not available yet</h1>
                    <p className="mt-3 text-sm text-muted-foreground">
                        We are preparing user accounts for reactions, bookmarks, and personalized news.
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-2">
                        <Link href="/">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft size={16} /> Back to News
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button>Sign in</Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
