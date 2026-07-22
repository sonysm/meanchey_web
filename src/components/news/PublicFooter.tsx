import Image from "next/image";
import Link from "next/link";

const socialLinks = [
    {
        name: "Facebook",
        href: "https://facebook.com",
        iconClass: "fa-brands fa-facebook-f",
    },
    // {
    //     name: "Twitter",
    //     href: "https://twitter.com",
    //     iconClass: "fa-brands fa-x-twitter",
    // },
    // {
    //     name: "Instagram",
    //     href: "https://instagram.com",
    //     iconClass: "fa-brands fa-instagram",
    // },
];

const downloadLinks = [
    {
        name: "App Store",
        href: "https://www.apple.com/app-store/",
        iconClass: "fa-brands fa-app-store-ios",
    },
    {
        name: "Play Store",
        href: "https://play.google.com/store",
        iconClass: "fa-brands fa-google-play",
    },
];

export default function PublicFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-muted/30">
            <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.2fr_1fr]">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Image src="/meanchey-logo.svg" alt="Meanchey logo" width={34} height={34} className="size-[34px]" priority />
                        <h2 className="text-base font-semibold">Meanchey News</h2>
                    </div>
                    <p className="max-w-md text-sm text-muted-foreground">
                        Trusted updates, local stories, and practical news for Cambodian readers.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Copyright © {currentYear} Meanchey. All rights reserved.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Company</h3>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                            <li>
                                <Link href="/about-us" className="hover:text-foreground hover:underline">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact-us" className="hover:text-foreground hover:underline">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-foreground hover:underline">
                                    Privacy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Social</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {socialLinks.map((item) => {
                                return (
                                    <li key={item.name}>
                                        <a
                                            href={item.href}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="inline-flex items-center gap-2 hover:text-foreground hover:underline"
                                        >
                                            <i className={`${item.iconClass} text-sm`} aria-hidden="true" />
                                            <span>{item.name}</span>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Download</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {downloadLinks.map((item) => (
                                <li key={item.name}>
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="inline-flex items-center gap-2 hover:text-foreground hover:underline"
                                    >
                                        <i className={`${item.iconClass} text-sm`} aria-hidden="true" />
                                        <span>{item.name}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
}
