"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  PlaySquare, 
  FileText, 
  Award, 
  Settings, 
  HelpCircle
} from "lucide-react";
import { getUnreadCountForStudent } from "@/lib/messageStore";

const NAV_ITEMS = [
  { href: "/home", altHref: "/", label: "Home", icon: Home },
  { href: "/my-courses", label: "My Courses", icon: PlaySquare },
  { href: "/notes", label: "Study Vault (PDFs)", icon: FileText },
  { href: "/certificate", label: "Certificates", icon: Award },
  { href: "/profile", label: "Settings & Support", icon: Settings, hasUnread: true },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [studentName, setStudentName] = useState("Student");

  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem("mindmaster_user_profile");
        if (raw) {
          const p = JSON.parse(raw);
          if (p.full_name) setStudentName(p.full_name.split(" ")[0]);
          const studentId = p.id || p.phone || "std-01";
          setUnreadCount(getUnreadCountForStudent(studentId));
        }
      } catch {
        setUnreadCount(0);
      }
    };
    update();
    window.addEventListener("mma_messages_changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("mma_messages_changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <>
      {/* Desktop Expandable Navigation Rail */}
      <aside 
        className="group/rail hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-50 w-[68px] hover:w-60 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-out select-none overflow-hidden hover:shadow-xl text-slate-800 dark:text-slate-100"
      >
        {/* Top Brand Monogram */}
        <div className="h-18 flex items-center px-[18px] border-b border-slate-200/70 dark:border-slate-800 shrink-0">
          <Link href="/home" className="flex items-center gap-3.5 group/logo cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-black text-xs tracking-tight shrink-0 shadow-xs group-hover/logo:scale-105 transition-transform">
              MM
            </div>
            <div className="min-w-0 opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block leading-none">
                MINDMASTER
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 mt-1 block">
                ACADEMY PORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* Core Navigation Items */}
        <nav className="flex-1 py-6 flex flex-col gap-1.5 px-2.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.altHref && pathname === item.altHref) ||
              (item.href !== "/home" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center h-11 px-3 rounded-xl transition-all duration-200 group/item cursor-pointer ${
                  isActive
                    ? "bg-blue-50 dark:bg-slate-800 text-[#2563EB] dark:text-blue-400 font-bold shadow-[inset_3px_0_0_#2563EB] dark:shadow-[inset_3px_0_0_#3B82F6]"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <Icon 
                    className={`w-5 h-5 transition-transform duration-200 group-hover/item:scale-110 ${
                      isActive ? "text-[#2563EB] dark:text-blue-400 stroke-[2.2]" : "text-slate-500 dark:text-slate-400 stroke-[1.8]"
                    }`} 
                  />
                </div>

                {/* Expanded Label */}
                <span className="ml-3 text-xs tracking-wide whitespace-nowrap opacity-0 group-hover/rail:opacity-100 group-hover/rail:translate-x-0 -translate-x-2 transition-all duration-200 delay-75">
                  {item.label}
                </span>

                {/* Notification Badge */}
                {item.hasUnread && unreadCount > 0 && (
                  <span className="absolute right-3 w-4 h-4 rounded-full bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover/rail:opacity-100 transition-opacity">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Utility & Student Profile Badge */}
        <div className="p-3 border-t border-slate-200/70 dark:border-slate-800 shrink-0 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/40">
          <Link
            href="/help"
            className="flex items-center h-10 px-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400 stroke-[1.8]" />
            </div>
            <span className="ml-3 text-xs tracking-wide whitespace-nowrap opacity-0 group-hover/rail:opacity-100 transition-all duration-200 delay-75">
              How to Use Guide
            </span>
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="relative w-8 h-8 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {studentName[0] || "S"}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#0F172A]" />
            </div>
            <div className="min-w-0 opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-none truncate max-w-[130px]">
                {studentName}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                Active Member
              </span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Backdrop Scrim on Rail Hover */}
      <div 
        className="hidden lg:block fixed inset-0 bg-slate-900/20 dark:bg-black/50 backdrop-blur-xs z-40 pointer-events-none opacity-0 group-hover/rail:opacity-100 transition-opacity duration-300"
        aria-hidden="true"
      />
    </>
  );
}
