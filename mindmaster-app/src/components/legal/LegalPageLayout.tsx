"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShieldCheck, 
  FileText, 
  RotateCcw, 
  ArrowLeft, 
  Clock, 
  Globe, 
  ChevronRight, 
  ChevronDown, 
  LifeBuoy, 
  PhoneCall, 
  Mail, 
  Building2, 
  Sparkles,
  ExternalLink,
  Languages
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageModal from "@/components/common/LanguageModal";

export interface TableOfContentItem {
  id: string;
  titleEn: string;
  titleMr: string;
}

export interface KeyTakeawayItem {
  icon: React.ReactNode;
  titleEn: string;
  titleMr: string;
  descEn: string;
  descMr: string;
  badgeEn?: string;
  badgeMr?: string;
  color?: "blue" | "emerald" | "amber" | "purple";
}

interface LegalPageLayoutProps {
  currentTab: "privacy" | "terms" | "refund";
  titleEn: string;
  titleMr: string;
  subtitleEn: string;
  subtitleMr: string;
  badgeEn?: string;
  badgeMr?: string;
  bannerSrc: string;
  bannerAlt: string;
  lastUpdatedEn?: string;
  lastUpdatedMr?: string;
  tableOfContents: TableOfContentItem[];
  keyTakeaways: KeyTakeawayItem[];
  children: (lang: "en" | "mr") => React.ReactNode;
}

export default function LegalPageLayout({
  currentTab,
  titleEn,
  titleMr,
  subtitleEn,
  subtitleMr,
  badgeEn = "Official Academy Policy • 2026 Edition",
  badgeMr = "अधिकृत अकॅडमी धोरण • २०२६ आवृत्ती",
  bannerSrc,
  bannerAlt,
  lastUpdatedEn = "October 2026",
  lastUpdatedMr = "ऑक्टोबर २०२६",
  tableOfContents,
  keyTakeaways,
  children,
}: LegalPageLayoutProps) {
  // Use global LanguageContext with safe fallback
  const langContext = useLanguage();
  const activeLangCode = langContext?.currentLanguage;
  const isMarathi = activeLangCode === "mr";
  const displayLang: "en" | "mr" = isMarathi ? "mr" : "en";

  const [activeSection, setActiveSection] = useState<string>(
    tableOfContents[0]?.id || ""
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // Smooth scroll tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0% -60% 0%" }
    );

    tableOfContents.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tableOfContents]);

  const handleLanguageToggle = (target: "en" | "mr") => {
    if (langContext?.setLanguage) {
      langContext.setLanguage(target);
    }
  };

  const scrollToId = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = target.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6 pb-24 text-slate-800 select-none">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2 text-xs">
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isMarathi ? "माइंडमास्टर ॲपवर परत जा" : "Back to MindMaster App"}</span>
          </Link>
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <span>MindMaster</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">
              {currentTab === "privacy" && (isMarathi ? "गोपनीयता धोरण" : "Privacy Policy")}
              {currentTab === "terms" && (isMarathi ? "नियम व अटी" : "Terms & Conditions")}
              {currentTab === "refund" && (isMarathi ? "परतावा धोरण" : "Refund Policy")}
            </span>
          </div>
        </div>

        {/* Top Header Card */}
        <header className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm mb-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div className="flex-1 space-y-3">
              {/* Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isMarathi ? badgeMr : badgeEn}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>
                    {isMarathi ? `अद्यतन: ${lastUpdatedMr}` : `Updated: ${lastUpdatedEn}`}
                  </span>
                </span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {isMarathi ? titleMr : titleEn}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
                {isMarathi ? subtitleMr : subtitleEn}
              </p>
            </div>

            {/* Language Switcher Bar with All App Languages */}
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <div className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-blue-600" />
                <span>
                  Language / भाषा: <strong className="text-blue-600">{isMarathi ? "मराठी (Marathi)" : "English (Primary)"}</strong>
                </span>
              </div>

              {/* Language Selector: English First, Opens Full Modal with All Languages on Click */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLangModalOpen(true)}
                  aria-label="Select Language / सर्व भाषा पहा"
                  title="Click to view all languages in MindMaster App"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 shadow-2xs active:scale-95"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isMarathi ? "मराठी (Marathi)" : "English (Primary)"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isMarathi && (
                  <button
                    type="button"
                    onClick={() => handleLanguageToggle("en")}
                    className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <span>← Switch to English</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Top Quick Tab Navigation across all 3 policies */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link
              href="/privacy-policy"
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                currentTab === "privacy"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80"
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{isMarathi ? "गोपनीयता धोरण" : "Privacy Policy"}</span>
            </Link>

            <Link
              href="/terms"
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                currentTab === "terms"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>{isMarathi ? "नियम व अटी (DRM)" : "Terms & Anti-Piracy"}</span>
            </Link>

            <Link
              href="/refund-policy"
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                currentTab === "refund"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80"
              }`}
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>{isMarathi ? "परतावा व रद्द करण्याचे धोरण" : "Refund & Cancellation"}</span>
            </Link>
          </div>

          {/* Visual Banner Image */}
          <div className="relative w-full h-44 sm:h-60 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs mt-6 bg-slate-900">
            <Image
              src={bannerSrc}
              alt={bannerAlt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover object-center"
            />
          </div>
        </header>

        {/* Visual Summary Cards: "Key Takeaways in 30 Seconds" */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isMarathi ? "३० सेकंदात महत्त्वाचे मुद्दे" : "Key Takeaways in 30 Seconds"}
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {isMarathi ? "जलद सारांश" : "Quick Summary"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {keyTakeaways.map((item, index) => {
              const colorClasses = {
                blue: "bg-blue-50/80 border-blue-200 text-blue-900",
                emerald: "bg-emerald-50/80 border-emerald-200 text-emerald-900",
                amber: "bg-amber-50/80 border-amber-200 text-amber-900",
                purple: "bg-purple-50/80 border-purple-200 text-purple-900",
              }[item.color || "blue"];

              const badgeColors = {
                blue: "bg-blue-100 text-blue-800",
                emerald: "bg-emerald-100 text-emerald-800",
                amber: "bg-amber-100 text-amber-800",
                purple: "bg-purple-100 text-purple-800",
              }[item.color || "blue"];

              return (
                <div
                  key={index}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-sm ${colorClasses}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      {(item.badgeEn || item.badgeMr) && (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${badgeColors}`}>
                          {isMarathi ? item.badgeMr : item.badgeEn}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm leading-snug">
                      {isMarathi ? item.titleMr : item.titleEn}
                    </h3>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {isMarathi ? item.descMr : item.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Main Body Grid: Sticky TOC on Left + Clauses on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Mobile Collapsible TOC Jump Bar */}
          <div className="lg:hidden col-span-1 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs sticky top-20 z-20">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between text-xs font-black text-slate-800 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>
                  {isMarathi ? "विषय सूची (Jump to Section)" : "Table of Contents (Jump to Section)"}
                </span>
              </span>
              {mobileMenuOpen ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {mobileMenuOpen && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1 max-h-60 overflow-y-auto">
                {tableOfContents.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToId(item.id)}
                    className={`text-left py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      activeSection === item.id
                        ? "bg-blue-600 text-white font-extrabold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>
                      {idx + 1}. {isMarathi ? item.titleMr : item.titleEn}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Left-Side Sticky Table of Contents (3 Cols) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {isMarathi ? "विषय सूची" : "Table of Contents"}
                </span>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {tableOfContents.length} {isMarathi ? "कलमे" : "Sections"}
                </span>
              </div>

              <nav className="flex flex-col gap-1">
                {tableOfContents.map((item, idx) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToId(item.id)}
                      className={`text-left py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer group ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs font-extrabold translate-x-1"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className={`text-[10px] w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="truncate">
                          {isMarathi ? item.titleMr : item.titleEn}
                        </span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isActive ? "text-white" : "text-slate-400 group-hover:translate-x-0.5"
                      }`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Grievance Officer Card in Sidebar */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-3xl p-5 border border-blue-200 text-slate-800 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    {isMarathi ? "तक्रार निवारण अधिकारी" : "Grievance Officer"}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">Prashant Dhumal Sir</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                {isMarathi
                  ? "काही शंका, तक्रार किंवा परताव्याबाबत अडचण असल्यास आमच्या सातारा मुख्यालयाशी थेट संपर्क साधा."
                  : "For statutory grievances, data concerns, or duplicate payment verification, reach out directly."}
              </p>

              <div className="space-y-1.5 pt-1 text-xs">
                <a
                  href="tel:+918459344077"
                  className="flex items-center gap-2 font-bold text-blue-700 hover:text-blue-900 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                  <span>+91 84593 44077</span>
                </a>
                <a
                  href="mailto:mindmasterdhumal@gmail.com"
                  className="flex items-center gap-2 font-bold text-blue-700 hover:text-blue-900 transition truncate"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate">mindmasterdhumal@gmail.com</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Right-Side Detailed Legal Content (8 Cols) */}
          <main className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-800 text-xs sm:text-sm leading-relaxed">
              {children(displayLang)}
            </div>

            {/* Official Head Office Footer Badge */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">
                    MindMaster Academy • Head Office
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Near Powai Naka, Satara (415001) | Pune Campus: Zeal Chowk, Narhe, Pune
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/support"
                  className="flex-1 sm:flex-none text-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>{isMarathi ? "सपोर्ट तिकीट तयार करा" : "Create Support Ticket"}</span>
                </Link>
              </div>
            </div>

            {/* In-App Support Ticket Desk Callout Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-50/40 border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                  {isMarathi ? "थेट मदत कक्ष" : "Direct Student Helpdesk"}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {isMarathi
                    ? "काही अडचण किंवा प्रश्न आहे का?"
                    : "Need clarification on policy or payments?"}
                </h4>
                <p className="text-xs text-slate-600">
                  {isMarathi
                    ? "विद्यार्थी प्रोफाईलवरून थेट सपोर्ट तिकीट तयार करा किंवा व्हॉट्सॲपवर संपर्क साधा."
                    : "Raise an In-App Support Ticket from Student Settings or reach out to our Satara Helpdesk directly."}
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                <a
                  href="https://wa.me/918459344077?text=Namaskar%20Prashant%20Sir%2C%20I%20have%20a%20query%20regarding%20MindMaster%20Academy%20policies."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none text-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>WhatsApp: +91 84593 44077</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* Full 8 Indian Languages Modal */}
      <LanguageModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </AppShell>
  );
}
