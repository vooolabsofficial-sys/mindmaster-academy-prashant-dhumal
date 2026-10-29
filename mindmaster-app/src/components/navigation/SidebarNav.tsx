"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  User, 
  MessageCircle, 
  Brain, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getUnreadCountForStudent } from "@/lib/messageStore";

const NAV_ITEMS = [
  { href: "/home", altHref: "/", label: "Home", icon: Home },
  { href: "/courses", label: "Courses", badge: "5 Live", icon: BookOpen },
  { href: "/my-courses", label: "My Learning", icon: GraduationCap },
  { href: "/books", label: "Books", icon: FileText },
  { href: "/help", label: "How to Use", badge: "Guide", icon: HelpCircle },
  { href: "/support", label: "Support", icon: MessageCircle, hasMsgBadge: true },
  { href: "/profile", label: "Profile", icon: User },
];

export default function SidebarNav() {
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
    return () => window.removeEventListener("mma_messages_changed", update);
  }, []);

  return (
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 bg-white border-r border-slate-200 h-screen sticky top-0 px-5 py-7 justify-between shrink-0 shadow-[4px_0_24px_rgba(15,23,42,0.03)] z-30 select-none">
      <div className="flex flex-col gap-8">
        {/* Brand Header - Prominent, Larger & Clear */}
        <Link href="/home" className="flex items-center gap-3.5 px-2 group">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Brain className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="font-black text-xl text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
              MindMaster
            </div>
            <div className="text-xs font-bold text-blue-600 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Student Academy</span>
            </div>
          </div>
        </Link>

        {/* Portal Navigation Section - Bigger Tap Targets & Readable Font */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-4 mb-1">
            Menu Navigation
          </span>

          <nav className="flex flex-col gap-1.5">
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
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-extrabold translate-x-1"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white stroke-[2.4]" : "text-slate-500 stroke-[1.9]"}`} />
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.hasMsgBadge && unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: Offline Desk & Support Card - Larger & Prominent */}
      <div className="flex flex-col gap-3.5">
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-50/30 border border-emerald-200 text-slate-900 p-5 rounded-3xl shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider uppercase text-emerald-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Satara Flagship Hub
            </span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>

          <div>
            <h4 className="text-sm font-extrabold leading-snug text-slate-900">
              Need classroom drills or offline study guidance?
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Connect directly with academy mentors and Prashant Sir.
            </p>
          </div>

          <a
            href="tel:+918459344077"
            className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 text-white text-xs font-bold text-center hover:bg-blue-700 shadow-sm shadow-blue-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>📞</span>
            <span>Helpline: +91 84593 44077</span>
          </a>
        </div>

        {/* Footer Meta */}
        <div className="px-3 text-xs text-slate-500 flex items-center justify-between font-semibold">
          <span>MindMaster Academy</span>
          <span className="text-emerald-600 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Portal
          </span>
        </div>

        {/* Help & Legal Policies Deep Links */}
        <div className="px-3 pt-0.5 flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <Link href="/help" className="hover:text-blue-600 font-bold text-blue-600 transition">Guide</Link>
          <span>•</span>
          <Link href="/privacy-policy" className="hover:text-blue-600 transition">Privacy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-blue-600 transition">Terms</Link>
          <span>•</span>
          <Link href="/refund-policy" className="hover:text-blue-600 transition">Refunds</Link>
        </div>
      </div>
    </aside>
  );
}
