"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlaySquare, FileText, Award, Settings } from "lucide-react";
import { getUnreadCountForStudent } from "@/lib/messageStore";

const MOBILE_NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/my-courses", label: "Courses", icon: PlaySquare },
  { href: "/notes", label: "Vault", icon: FileText },
  { href: "/certificate", label: "Certificates", icon: Award },
  { href: "/profile", label: "Settings", icon: Settings, hasUnread: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem("mindmaster_user_profile");
        const studentId = raw ? JSON.parse(raw).id || JSON.parse(raw).phone || "std-01" : "std-01";
        setUnreadCount(getUnreadCountForStudent(studentId));
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
    <nav
      aria-label="Mobile Navigation Bar"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 shadow-lg pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/home" && pathname?.startsWith(item.href)) ||
            (item.href === "/home" && pathname === "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center min-h-[46px] min-w-[54px] py-1 px-1 rounded-xl transition-all duration-200 relative cursor-pointer active:scale-95 ${
                isActive
                  ? "text-[#2563EB] dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="relative p-1">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? "text-[#2563EB] dark:text-blue-400 stroke-[2.3] scale-105" : "stroke-[1.8]"
                  }`}
                />
                {item.hasUnread && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#2563EB] text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0F172A]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              <span className={`text-[10px] font-medium tracking-tight transition-colors ${
                isActive ? "text-[#2563EB] dark:text-blue-400 font-bold" : "text-slate-600 dark:text-slate-400"
              }`}>
                {item.label}
              </span>

              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#2563EB] dark:bg-blue-400 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
