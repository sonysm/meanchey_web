import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import PublicNavbar from "@/components/news/PublicNavbar";
import { Button } from "@/components/ui/button";

export default function AboutUsPage() {
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
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Company</p>
                        <h1 className="text-3xl font-semibold tracking-tight">About Us</h1>
                        <p className="text-sm text-muted-foreground">
                            Temporary content for now. You can replace this with your final About Us copy.
                        </p>
                    </header>

                    <section className="space-y-3 text-sm leading-7 text-muted-foreground">
                        <h2 className="text-base font-medium text-foreground">Who We Are</h2>
                        <p>
                            Meanchey News is a digital news platform focused on timely reporting and meaningful stories
                            for our community. This is placeholder text.
                        </p>
                    </section>

                    <section className="space-y-3 text-sm leading-7 text-muted-foreground">
                        <h2 className="text-base font-medium text-foreground">Our Mission</h2>
                        <p>
                            Our mission is to make trusted information more accessible through a clear, user-friendly,
                            and mobile-first reading experience.
                        </p>
                    </section>

                    <section className="space-y-3 text-sm leading-7 text-muted-foreground">
                        <h2 className="text-base font-medium text-foreground">Editorial Values</h2>
                        <p>
                            We aim for accuracy, fairness, and transparency in our reporting process. Replace this
                            section with your official editorial standards.
                        </p>
                    </section>

                    <section className="space-y-3 text-sm leading-7 text-muted-foreground">
                        <h2 className="text-base font-medium text-foreground">Get in Touch</h2>
                        <p>
                            Add your official office address, email, and phone contact details here.
                        </p>
                    </section>
                </article>
            </main>
        </div>
    );
}
