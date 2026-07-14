import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import PublicNavbar from "@/components/news/PublicNavbar";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
    return (
        <div className="min-h-dvh bg-background">
            <PublicNavbar />
            <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
                <div className="mb-6">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft size={16} /> Back to Home
                        </Button>
                    </Link>
                </div>

                <article className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-7">
                    <header className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Policy</p>
                        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
                        <p className="text-sm text-muted-foreground">
                            Temporary content for now. You can replace this with your final privacy policy text.
                        </p>
                    </header>

                    <section className="space-y-3 text-sm leading-7 text-muted-foreground">
                        <h2 className="text-base font-medium text-foreground">1. Information We Collect</h2>
                        <p>
                            We may collect account information such as your name, email, and profile details when
                            you sign in, as well as usage data to improve our news platform experience.
                        </p>
                    </section>

                    <section className="space-y-3 text-sm leading-7 text-muted-foreground">
                        <h2 className="text-base font-medium text-foreground">2. How We Use Information</h2>
                        <p>
                            Information is used to authenticate users, personalize content, maintain security, and
                            support core platform features.
                        </p>
                    </section>

                    <section className="space-y-3 text-sm leading-7 text-muted-foreground">
                        <h2 className="text-base font-medium text-foreground">3. Data Security</h2>
                        <p>
                            We apply technical and organizational measures to protect your data. This section is a
                            placeholder and should be updated with your official security practices.
                        </p>
                    </section>

                    <section className="space-y-3 text-sm leading-7 text-muted-foreground">
                        <h2 className="text-base font-medium text-foreground">4. Contact</h2>
                        <p>
                            For questions about this policy, contact your support team or add your official contact
                            address here.
                        </p>
                    </section>
                </article>
            </main>
        </div>
    );
}
