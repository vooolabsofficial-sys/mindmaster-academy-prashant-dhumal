"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, GraduationCap, User, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { getUnreadCountForStudent } from "@/lib/messageStore";
import { useLanguage } from "@/lib/LanguageContext";

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const { t } = useLanguage();

  const navItems = [
    { href: "/home", label: t("nav.home"), icon: Home },
    { href: "/courses", label: t("nav.courses"), icon: BookOpen },
    { href: "/my-courses", label: t("nav.myLearning"), icon: GraduationCap },
    { href: "/support", label: t("nav.support"), icon: MessageCircle },
    { href: "/profile", label: t("nav.profile"), icon: User },
  ];

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
    return () => window.removeEventListener("mma_messages_changed", update);
  }, []);

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 sm:px-2 py-1 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] touch-manipulation"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
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
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center min-h-[46px] min-w-[48px] sm:min-w-[56px] py-1 px-1 sm:px-2 rounded-2xl transition-all duration-150 relative active:scale-95 touch-manipulation cursor-pointer ${
                isActive
                  ? "text-blue-700 font-extrabold"
                  : "text-slate-600 hover:text-slate-900 font-semibold"
              }`}
            >
              <div
                className={`p-1 rounded-2xl transition-all relative ${
                  isActive ? "bg-blue-50 scale-105 shadow-2xs" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-700 stroke-[2.4]" : "stroke-[1.9]"}`} />
                {/* Unread badge for Support tab */}
                {item.href === "/support" && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] sm:text-[11px] mt-0.5 tracking-tight truncate max-w-[62px] sm:max-w-none text-center ${isActive ? "text-blue-700 font-bold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

