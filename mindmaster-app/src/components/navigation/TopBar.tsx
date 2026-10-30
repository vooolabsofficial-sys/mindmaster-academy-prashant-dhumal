"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Globe, ChevronDown, Download, HelpCircle } from "lucide-react";
import StudentNotificationBell from "@/components/notifications/StudentNotificationBell";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageModal from "@/components/common/LanguageModal";

export default function TopBar() {
  const [studentName, setStudentName] = useState("Student");
  const [studentGrade, setStudentGrade] = useState("Pro Academy");
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const { currentLanguage, setLanguage, languageInfo, t } = useLanguage();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mindmaster_user_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.full_name) setStudentName(p.full_name);
        if (p.grade) setStudentGrade(p.grade);
      }
    } catch {}
  }, []);

  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MM";

  return (
    <header className="sticky top-0 z-30 bg-[#0A0D14]/85 backdrop-blur-2xl border-b border-white/[0.06] px-4 md:px-8 py-3 select-none text-[#F8FAFC]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Brand & OTT Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/home"
            aria-label="MindMaster Originals"
            className="lg:hidden flex items-center gap-2 active:scale-95 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0956FF] to-[#002984] flex items-center justify-center text-white font-black text-xs shadow-[0_0_12px_rgba(9,86,255,0.4)]">
              MM
            </div>
            <span className="font-extrabold text-sm tracking-tight text-[#F8FAFC]">MindMaster</span>
          </Link>

          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold text-[#94A3B8]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide">STUDIO OTT PORTAL</span>
          </div>
        </div>

        {/* Center: Search Field (Dark Glass) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label="Search courses, formulas, and masterclasses"
              placeholder="Search masterclasses, formulas, episodes..."
              className="w-full pl-10 pr-12 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:outline-none focus:border-[#0052FF] focus:bg-white/[0.07] focus:ring-1 focus:ring-[#0052FF] transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/[0.06] text-[#94A3B8] border border-white/10 pointer-events-none">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right: Language Pill, Help, Notifications & Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Language Switcher Pill */}
          <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] p-1 rounded-full">
            <button
              type="button"
              onClick={() => setIsLangModalOpen(true)}
              aria-label="Select Language"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-[#F8FAFC] hover:bg-white/[0.08] transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{currentLanguage === "en" ? "English" : languageInfo.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
            </button>

            {currentLanguage !== "en" && (
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0052FF] hover:bg-blue-600 text-white transition cursor-pointer"
                title="Switch to English"
              >
                Switch to English
              </button>
            )}
          </div>

          {/* Install App CTA */}
          {isInstallable && (
            <button
              type="button"
              onClick={handleInstallClick}
              aria-label="Install App"
              className="hidden sm:inline-flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-[#F8FAFC] px-3 py-1.5 rounded-full border border-white/[0.08] transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Install</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <StudentNotificationBell />

          {/* Help Center */}
          <Link
            href="/help"
            aria-label="How to Use Guide"
            className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.05] rounded-full transition cursor-pointer"
            title="Help &amp; Guide"
          >
            <HelpCircle className="w-4 h-4 stroke-[1.8]" />
          </Link>

          {/* Student Profile Avatar */}
          <Link
            href="/profile"
            aria-label={`Student Profile: ${studentName}`}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/[0.05] transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0956FF] to-[#002984] text-white text-xs font-black flex items-center justify-center shrink-0 ring-1 ring-white/20 shadow-[0_0_12px_rgba(0,82,255,0.3)]">
              {initials}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-[#F8FAFC] leading-none truncate max-w-[100px]">
                {studentName}
              </span>
              <span className="text-[10px] text-[#94A3B8] leading-tight mt-0.5 truncate max-w-[100px]">
                {studentGrade}
              </span>
            </div>
          </Link>
        </div>
      </div>

      <LanguageModal isOpen={isLangModalOpen} onClose={() => setIsLangModalOpen(false)} />
    </header>
  );
}
