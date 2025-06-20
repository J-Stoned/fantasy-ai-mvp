import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { MainNav } from "@/components/navigation/MainNav";
import { QuickActions } from "@/components/navigation/QuickActions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fantasy.AI - Next-Generation Fantasy Sports Platform",
  description: "AI-powered fantasy sports platform with advanced analytics, real-time insights, and cutting-edge features. 5+ years ahead of the competition.",
  keywords: ["fantasy football", "fantasy sports", "AI analytics", "lineup optimizer", "sports betting"],
  authors: [{ name: "Fantasy.AI Team" }],
  creator: "Fantasy.AI",
  publisher: "Fantasy.AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Fantasy.AI - The Future of Fantasy Sports",
    description: "Revolutionary AI-powered fantasy sports platform with cutting-edge analytics and real-time insights.",
    type: "website",
    siteName: "Fantasy.AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fantasy.AI - Next-Generation Fantasy Sports",
    description: "AI-powered fantasy sports platform with advanced analytics and real-time insights.",
    creator: "@FantasyAI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Fantasy.AI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Fantasy.AI" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="relative min-h-screen">
            {/* Background effects */}
            <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-slate-900 pointer-events-none" />
            <div className="fixed inset-0 bg-[url('/cyber-grid.png')] opacity-5 pointer-events-none" />
            
            {/* Universal Navigation */}
            <MainNav />
            
            {/* Main content */}
            <main className="relative z-10">
              {children}
            </main>
            
            {/* Quick Actions Floating Button */}
            <QuickActions />
          </div>
        </Providers>
      </body>
    </html>
  );
}
