import type { Metadata } from "next";
import { Geist, Noto_Sans_Khmer } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import PublicFooter from "@/components/news/PublicFooter";

import GoogleAnalytics from "@/app/analytic";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoSansKhmer = Noto_Sans_Khmer({
  variable: "--font-noto-sans-khmer",
  subsets: ["khmer", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Meanchey News",
    template: "%s | Meanchey News",
  },
  description: "ព័ត៌មានថ្មីៗ និងព្រឹត្តការណ៍ទាន់ហេតុការណ៍ពីខេត្តមានជ័យ និងទូទាំងប្រទេសកម្ពុជា — Meanchey News Platform.",
  keywords: ["Meanchey", "មានជ័យ", "Cambodia news", "ព័ត៌មាន", "Khmer news"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://meanchey.org"),
  openGraph: {
    type: "website",
    siteName: "Meanchey News",
    locale: "km_KH",
  },
  twitter: {
    card: "summary_large_image",
    site: "@meanchey",
  },
  verification: {
    google: "WDlTJjw-Y_RGHagU4AUrC06nnS7Ds6fQb3nFiq8sW24", // ← replace with your code from Google Search Console
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: ["/icon", "/favicon.ico"],
    apple: "/apple-icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || "";
  return (
    <html lang="en" className={`${geistSans.variable} ${notoSansKhmer.variable} h-full antialiased`}>
      <body>
        <FirebaseAnalytics />
        <Suspense>
          <GoogleAnalytics GA_MEASUREMENT_ID={GA_MEASUREMENT_ID} />
        </Suspense>
        <TooltipProvider>
          <div className="flex min-h-dvh flex-col">
            <main className="flex-1">{children}</main>
            <PublicFooter />
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}

