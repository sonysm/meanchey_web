import PublicNavbar from "@/components/news/PublicNavbar";

export default function ContactUsPage() {
    return (
        <div className="min-h-dvh bg-background">
            <PublicNavbar />
            <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:py-14">
                <h1 className="text-3xl font-semibold tracking-tight">Contact Us</h1>
                <p className="text-sm text-muted-foreground">
                    For partnerships, news tips, or general support, contact the Meanchey team.
                </p>

                <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <div className="space-y-2 text-sm">
                        <p>
                            <span className="font-medium">Email:</span>{" "}
                            <a href="mailto:info@meanchey.news" className="text-primary hover:underline">
                                info@meanchey.news
                            </a>
                        </p>
                        <p>
                            <span className="font-medium">Phone:</span> +855 12 345 678
                        </p>
                        <p>
                            <span className="font-medium">Address:</span> Phnom Penh, Cambodia
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
