import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import { ThemeProvider } from "@/lib/ThemeContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import MaintenanceBanner from "@/components/common/MaintenanceBanner";
import { Toaster } from "sonner";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://app.mindmasteredu.in"),
  title: {
    default: "MindMaster Academy | Prashant Dhumal — Memory & Vedic Maths Training",
    template: "%s | MindMaster Academy",
  },
  description: "MindMaster Academy — Premier cognitive development institute in Pune by Prashant Dhumal Sir. Master Superfast Vedic Maths, Photographic Memory, 500-Year Calendar Tricks & Teacher Training.",
  keywords: [
    "MindMaster Academy",
    "Prashant Dhumal",
    "Prashant Dhumal Memory Trainer",
    "Memory Training Pune",
    "Vedic Maths Course",
    "Vedic Mathematics Maharashtra",
    "Superfast Calendar Calculation",
    "Speed Math Techniques",
    "Brain Gym Narhe Pune",
    "Competitive Exam Memory Mastery",
    "Police Bharti Memory Tricks",
    "MPSC Vedic Maths",
    "Mind Master Prashant Dhumal"
  ],
  authors: [{ name: "Prashant Dhumal Sir", url: "https://mindmasteredu.in" }],
  creator: "Prashant Dhumal",
  publisher: "MindMaster Academy",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: "mr_IN",
    url: "https://app.mindmasteredu.in",
    siteName: "MindMaster Academy",
    title: "MindMaster Academy | Prashant Dhumal — Memory & Vedic Maths Training",
    description: "Train your brain with Prashant Dhumal Sir. Master Photographic Memory, Speed Vedic Maths, and Calendar calculations.",
    images: [
      {
        url: "/assets/images/memory_seminar_brain_3d.png",
        width: 1200,
        height: 630,
        alt: "MindMaster Academy - Prashant Dhumal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MindMaster Academy | Prashant Dhumal",
    description: "Master Vedic Maths and Photographic Memory with Prashant Dhumal Sir.",
    images: ["/assets/images/memory_seminar_brain_3d.png"],
  },
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

const academySchemaJson = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://mindmasteredu.in/#organization",
      "name": "MindMaster Academy",
      "alternateName": "माइंडमास्टर अकॅडमी",
      "url": "https://mindmasteredu.in",
      "logo": "https://mindmasteredu.in/assets/images/memory_seminar_brain_3d.png",
      "description": "Premier cognitive development institute offering Memory Training, Vedic Maths, Superfast Calendar calculation, and Brain Gym techniques by Prashant Dhumal Sir.",
      "founder": {
        "@type": "Person",
        "@id": "https://mindmasteredu.in/#founder",
        "name": "Prashant Dhumal",
        "jobTitle": "International Memory Trainer & Author",
        "description": "Renowned Memory Coach and Vedic Mathematics Master with 15+ years of empowering 50,000+ students and teachers across Maharashtra."
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Satara City Centre",
        "addressLocality": "Satara",
        "addressRegion": "Maharashtra",
        "postalCode": "415001",
        "addressCountry": "IN"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "2480",
        "bestRating": "5",
        "worstRating": "1"
      },
      "sameAs": [
        "https://www.youtube.com/@mindmasteracademy",
        "https://www.instagram.com/mindmasteracademy"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://mindmasteredu.in/#website",
      "url": "https://mindmasteredu.in",
      "name": "MindMaster Academy",
      "publisher": {
        "@id": "https://mindmasteredu.in/#organization"
      },
      "inLanguage": ["en", "mr"]
    }
  ]
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakarta.variable} ${inter.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(academySchemaJson),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mindmaster_theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] font-sans antialiased transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>
            <MaintenanceBanner />
            <ServiceWorkerRegister />
            <PwaInstallPrompt />
            <Toaster richColors position="top-right" closeButton />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
