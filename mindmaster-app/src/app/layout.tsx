import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://app.mindmasteracademy.com"),
  title: {
    default: "MindMaster Academy | Prashant Dhumal - Memory & Vedic Maths Training",
    template: "%s | MindMaster Academy",
  },
  description: "MindMaster Academy - Prashant Dhumal's premier training portal for Memory Techniques, Vedic Maths, Superfast Calendar and Police Bharti prep, Pune.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MindMaster Academy",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B57D0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import MaintenanceBanner from "@/components/common/MaintenanceBanner";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans antialiased">
        <MaintenanceBanner />
        <ServiceWorkerRegister />
        <PwaInstallPrompt />
        <Toaster richColors position="top-right" closeButton />
        {children}
      </body>
    </html>
  );
}
