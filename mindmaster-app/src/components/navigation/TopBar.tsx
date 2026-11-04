"use client";

import React from "react";
import Link from "next/link";
import { Search, Sun, Moon } from "lucide-react";
import StudentNotificationBell from "@/components/notifications/StudentNotificationBell";
import { useTheme } from "@/lib/ThemeContext";

export default function TopBar() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-8 py-3 select-none text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Brand & Academic Portal Tag */}
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

        {/* Right: Only Essential Utilities (Theme Toggle & Notification Bell) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 1-Click Day / Night Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to Daylight Mode" : "Switch to Night Mode"}
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

          {/* In-App Notifications Dropdown */}
          <StudentNotificationBell />
        </div>
      </div>
    </header>
  );
}
