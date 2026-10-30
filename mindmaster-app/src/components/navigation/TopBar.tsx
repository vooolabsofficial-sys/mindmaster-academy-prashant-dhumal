"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Globe, ChevronDown, Download, HelpCircle, Sun, Moon } from "lucide-react";
import StudentNotificationBell from "@/components/notifications/StudentNotificationBell";
import { useLanguage } from "@/lib/LanguageContext";
import { useTheme } from "@/lib/ThemeContext";
import LanguageModal from "@/components/common/LanguageModal";

export default function TopBar() {
  const [studentName, setStudentName] = useState("Student");
  const [studentGrade, setStudentGrade] = useState("Pro Academy");
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const { currentLanguage, setLanguage, languageInfo } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();

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
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-8 py-3 select-none text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Brand & Academic Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/home"
            aria-label="MindMaster Academy"
            className="lg:hidden flex items-center gap-2 active:scale-95 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-black text-xs shadow-xs">
              MM
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">MindMaster</span>
          </Link>

          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="tracking-wide">STUDENT ACADEMIC PORTAL</span>
          </div>
        </div>

        {/* Center: Search Field */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label="Search courses, formulas, and lessons"
              placeholder="Search masterclasses, formulas, lessons..."
              className="w-full pl-10 pr-12 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-[#2563EB] focus:bg-white dark:focus:bg-slate-800 transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 pointer-events-none">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right: Language, Theme Toggle, Help, Notifications & Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 1-Click Day / Night Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to Clean Daylight Mode" : "Switch to Soft Matte Dark Mode"}
            title={isDark ? "Daylight Mode (Light)" : "Night Study Mode (Dark)"}
            className="touch-target-44 min-w-[38px] min-h-[38px] p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 text-xs font-medium"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
                <span className="hidden xl:inline text-xs font-semibold">Day</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-600 stroke-[2.2]" />
                <span className="hidden xl:inline text-xs font-semibold">Night</span>
              </>
            )}
          </button>

          {/* Language Switcher Pill */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsLangModalOpen(true)}
              aria-label="Select Language"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{currentLanguage === "en" ? "English" : languageInfo.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            </button>

            {currentLanguage !== "en" && (
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#2563EB] hover:bg-blue-700 text-white transition cursor-pointer"
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
              className="hidden sm:inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Install</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <StudentNotificationBell />

          {/* Help Center */}
          <Link
            href="/help"
            aria-label="How to Use Guide"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Help & Guide"
          >
            <HelpCircle className="w-4 h-4 stroke-[1.8]" />
          </Link>

          {/* Student Profile Avatar */}
          <Link
            href="/profile"
            aria-label={`Student Profile: ${studentName}`}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-none truncate max-w-[100px]">
                {studentName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate max-w-[100px]">
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
