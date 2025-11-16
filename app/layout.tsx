import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner"
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap", // Optimize font loading
    preload: true,
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
    preload: true,
});

export const metadata: Metadata = {
    title: {
        default: "Marketinni - Real-Time Stock Market Tracking & Alerts",
        template: "%s | Marketinni"
    },
    description: "Track real-time stock prices, get personalized alerts and explore detailed company insights. Your comprehensive stock market dashboard.",
    keywords: ["stocks", "market", "trading", "watchlist", "alerts", "finance", "investment"],
    authors: [{ name: "Marketinni" }],
    creator: "Marketinni",
    publisher: "Marketinni",
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://stock-market-dev.vercel.app",
        title: "Marketinni - Real-Time Stock Market Tracking",
        description: "Track real-time stock prices, get personalized alerts and explore detailed company insights.",
        siteName: "Marketinni",
    },
    twitter: {
        card: "summary_large_image",
        title: "Marketinni - Real-Time Stock Market Tracking",
        description: "Track real-time stock prices, get personalized alerts and explore detailed company insights.",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
        <head>
            {/* Preconnect to improve performance */}
            <link rel="preconnect" href="https://s3.tradingview.com" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://s3.tradingview.com" />
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        {children}
        <Toaster richColors position="top-right" />
        <SpeedInsights />
        </body>
        </html>
    );
}