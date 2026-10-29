"use client";

import Link from "next/link";
import { Search, Brain, Globe, Download } from "lucide-react";
import { useState, useEffect } from "react";
import StudentNotificationBell from "@/components/notifications/StudentNotificationBell";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageModal from "@/components/common/LanguageModal";

export default function TopBar() {
  const [studentName, setStudentName] = useState("Student");
  const [studentGrade, setStudentGrade] = useState("MindMaster Academy");
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
        if (p.grade) setStudentGrade(`${p.grade} • Maharashtra`);
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
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 md:px-8 py-2.5 sm:py-3.5 transition-all select-none shadow-[0_2px_12px_rgba(15,23,42,0.03)] touch-manipulation">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
        {/* Left: Mobile Brand & Centre Badge */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          <Link
            href="/home"
            aria-label="MindMaster Home"
            className="lg:hidden flex items-center gap-2 touch-target-44 active:scale-95 transition"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/25 shrink-0">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <span className="font-black text-sm sm:text-base text-slate-900 tracking-tight">MindMaster</span>
          </Link>

          {/* Centre Badge - Prominent */}
          <div className="hidden sm:inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t("topbar.portalBadge")}</span>
          </div>
        </div>

        {/* Center: Search Bar - Wider & Taller */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label="Search courses, memory formulas, and lessons"
              placeholder={t("topbar.searchPlaceholder")}
              className="w-full pl-12 pr-14 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 transition shadow-2xs"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg text-xs font-bold bg-white text-slate-400 border border-slate-200 shadow-2xs pointer-events-none">
              ⌘ K
            </span>
          </div>
        </div>

        {/* Right: Actions - Larger & Touch-Friendly */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Persistent One-Click Language Switcher (EN | मराठी) + Always-Visible English Reset */}
          <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold shadow-2xs">
            {currentLanguage !== "en" ? (
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1"
                title="Reset language back to English"
              >
                <span>Switch to English</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-600 text-white shadow-xs cursor-pointer"
                title="English (Primary Default)"
              >
                EN
              </button>
            )}
            <button
              type="button"
              onClick={() => setLanguage("mr")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer ${
                currentLanguage === "mr"
                  ? "bg-slate-200 text-slate-800"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="मराठी (Marathi)"
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => setIsLangModalOpen(true)}
              className="p-1 text-slate-500 hover:text-blue-600 rounded-full transition cursor-pointer ml-0.5"
              title="All 8 Indian Languages"
              aria-label="Language options"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Install App PWA CTA */}
          {isInstallable && (
            <button
              type="button"
              onClick={handleInstallClick}
              aria-label="Install App"
              title="Install App"
              className="touch-target-44 flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm shadow-blue-500/25 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* In-App Notifications Bell Dropdown */}
          <StudentNotificationBell />

          {/* Student Profile Pill - Enriched & Bigger */}
          <Link
            href="/profile"
            aria-label={`Student Profile: ${studentName}`}
            className="flex items-center gap-3 p-1.5 sm:pr-4 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 active:scale-98 transition cursor-pointer min-h-[44px]"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-black flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/25">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-extrabold text-slate-900 leading-tight">
                {studentName}
              </span>
              <span className="text-xs text-slate-600 font-medium leading-tight mt-0.5">
                {studentGrade}
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Language Selection Modal */}
      <LanguageModal isOpen={isLangModalOpen} onClose={() => setIsLangModalOpen(false)} />
    </header>
  );
}
