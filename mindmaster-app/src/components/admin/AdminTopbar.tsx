"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  AlertCircle,
  Search,
  Globe,
  ChevronDown,
  Sun,
  Moon,
  Bell,
  Crown,
  ShieldCheck,
  Brain,
  User,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { StaffUser, hasStaffPermission, StaffPermission, StudentRecord } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffUsers,
  setCurrentStaff,
  logoutStaff,
  getStaffStudents,
} from "@/lib/staffStore";
import { getUnreadCountForStaff } from "@/lib/messageStore";
import { useLanguage } from "@/lib/LanguageContext";
import { useTheme } from "@/lib/ThemeContext";
import LanguageModal from "@/components/common/LanguageModal";
import MindMasterLogo from "@/components/common/MindMasterLogo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  adminOnly?: boolean;
  permission?: StaffPermission;
}

export default function AdminTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentStaff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [allStaff, setAllStaff] = useState<StaffUser[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [msgUnread, setMsgUnread] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Language & Theme hooks
  const { currentLanguage, setLanguage, languageInfo } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // Global Student Quick Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentRecord[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setStaff(getCurrentStaff());
    setAllStaff(getStaffUsers());
    setMsgUnread(getUnreadCountForStaff());

    const handleStaffChange = () => {
      setStaff(getCurrentStaff());
      setAllStaff(getStaffUsers());
      setMsgUnread(getUnreadCountForStaff());
    };
    const handleMsgChange = () => setMsgUnread(getUnreadCountForStaff());

    window.addEventListener("mma_staff_changed", handleStaffChange);
    window.addEventListener("mma_messages_changed", handleMsgChange);
    return () => {
      window.removeEventListener("mma_staff_changed", handleStaffChange);
      window.removeEventListener("mma_messages_changed", handleMsgChange);
    };
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle live student search with 250ms debounce
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    searchDebounceTimerRef.current = setTimeout(() => {
      try {
        const allStudents = getStaffStudents();
        const filtered = allStudents
          .filter((s) => {
            const name = (s.name || (s as any).studentName || "").toLowerCase();
            const phone = (s.phone || "").toLowerCase();
            const district = (s.district || "").toLowerCase();
            return name.includes(q) || phone.includes(q) || district.includes(q);
          })
          .slice(0, 6);

        setSearchResults(filtered);
        setIsSearchOpen(true);
      } catch {
        setSearchResults([]);
      }
    }, 250);
  };

  const handleSelectStudent = (student: StudentRecord) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    window.dispatchEvent(
      new CustomEvent("mma_open_student_drawer", { detail: { student, phone: student.phone } })
    );
  };

  const handlePersonaSwitch = (staffId: string) => {
    const target = allStaff.find((s) => s.id === staffId);
    if (target) {
      if (target.mustChangePassword) {
        setCurrentStaff(target);
        router.push("/staff/change-password");
        return;
      }
      setCurrentStaff(target);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/staff/logout", { method: "POST" });
    } catch {}
    try {
      document.cookie = "mma_staff_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      sessionStorage.clear();
    } catch {}
    logoutStaff();
    setShowLogoutConfirm(false);
    setIsLoggingOut(false);
    router.replace("/staff/login");
    router.refresh();
  };

  const isSubRoute = pathname?.startsWith("/sub");
  const isSubAdmin = currentStaff.role === "sub_admin" || isSubRoute;
  const homeHref = isSubAdmin ? "/sub" : "/admin";

  const adminNavItems: NavItem[] = [
    { label: "Dashboard", href: "/admin", icon: <Brain className="w-4 h-4" /> },
    { label: "Courses & Videos", href: "/admin/courses", icon: <Brain className="w-4 h-4" />, permission: "courses.manage" },
    { label: "PDF Books", href: "/admin/notes", icon: <Brain className="w-4 h-4" />, permission: "notes.books.manage" },
    { label: "Students & Grants", href: "/admin/students", icon: <User className="w-4 h-4" />, permission: "students.view" },
    { label: "Coupons", href: "/admin/coupons", icon: <Brain className="w-4 h-4" />, permission: "coupons.manage" },
    { label: "Support Desk", href: "/admin/messages", icon: <Brain className="w-4 h-4" />, badge: msgUnread > 0 ? `${msgUnread}` : undefined, permission: "messages.manage" },
    { label: "Sub-Admins", href: "/admin/sub-admins", icon: <ShieldCheck className="w-4 h-4" />, badge: "Admin", adminOnly: true },
    { label: "Audit Logs", href: "/admin/audit", icon: <Clock className="w-4 h-4" />, adminOnly: true },
    { label: "Settings", href: "/admin/settings", icon: <Brain className="w-4 h-4" />, badge: "Config", adminOnly: true },
    { label: "Reports", href: "/admin/reports", icon: <Brain className="w-4 h-4" />, adminOnly: true },
  ];

  const subNavItems: NavItem[] = [
    { label: "Dashboard", href: "/sub", icon: <Brain className="w-4 h-4" /> },
    { label: "Students & Grants", href: "/sub/students", icon: <User className="w-4 h-4" />, permission: "students.view" },
    { label: "Support Desk", href: "/sub/messages", icon: <Brain className="w-4 h-4" />, badge: msgUnread > 0 ? `${msgUnread}` : undefined, permission: "messages.manage" },
    { label: "My Activity", href: "/sub/activity", icon: <Clock className="w-4 h-4" /> },
    { label: "SOP Guide", href: "/admin/guide", icon: <HelpCircle className="w-4 h-4" />, badge: "SOP" },
  ];

  const rawItems = isSubAdmin ? subNavItems : adminNavItems;
  const filteredNavItems = rawItems.filter((item) => {
    if (item.adminOnly && currentStaff.role !== "main_admin") return false;
    if (item.permission && !hasStaffPermission(currentStaff, item.permission)) return false;
    return true;
  });

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 md:px-6 flex items-center justify-between shadow-xs text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-200">
        {/* Left: Mobile Hamburger & Academy Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Open staff menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href={homeHref} className="flex items-center gap-2 sm:gap-2.5 group">
            <MindMasterLogo size="sm" className="group-hover:scale-105 transition-transform shrink-0" />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-none font-heading tracking-tight">
                  MindMaster
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#2563EB] dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                  {currentStaff.role === "main_admin" ? "Admin" : "Sub-Admin"}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-1">
                Prashant Dhumal • Staff Console
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Global Student Lookup Bar */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setIsSearchOpen(true);
              }}
              placeholder="Search student by Phone or Name..."
              className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2563EB] focus:bg-white dark:focus:bg-slate-800 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Search Live Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1E293B] border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>Direct Student Lookup</span>
                <span>{searchResults.length} Match{searchResults.length === 1 ? "" : "es"}</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    No matching student found. Search by full 10-digit phone or name.
                  </div>
                ) : (
                  searchResults.map((st) => (
                    <button
                      key={st.id || st.phone}
                      type="button"
                      onClick={() => handleSelectStudent(st)}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-3 transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {st.name || (st as any).studentName}
                          </span>
                          {st.district && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {st.district}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-[#2563EB] shrink-0" />
                          <span>{st.phone}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#2563EB] dark:text-blue-400 shrink-0 flex items-center gap-1">
                        <span>360° Drawer</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Persona Switcher, Language, Theme Toggle, Alerts & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Persona Switcher for Staff Testing */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 px-3 py-1 rounded-xl text-xs">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold">Staff:</span>
            <select
              value={currentStaff.id}
              onChange={(e) => handlePersonaSwitch(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              {allStaff.map((s) => (
                <option key={s.id} value={s.id} className="text-slate-900 dark:text-slate-900">
                  {s.name} ({s.role === "main_admin" ? "Admin" : "Sub-Admin"})
                </option>
              ))}
            </select>
          </div>

          {/* 1-Click Day / Night Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to Clean Daylight Mode" : "Switch to Soft Matte Dark Mode"}
            title={isDark ? "Daylight Mode (Light)" : "Night Study Mode (Dark)"}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 flex items-center justify-center text-xs font-medium"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
            ) : (
              <Moon className="w-4 h-4 text-[#2563EB] stroke-[2.2]" />
            )}
          </button>

          {/* Direct 1-Click Language Switcher (English Primary | Marathi) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                currentLanguage === "en"
                  ? "bg-[#2563EB] text-white shadow-2xs font-extrabold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="English (Primary Language)"
            >
              <span>EN</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage("mr")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                currentLanguage === "mr"
                  ? "bg-[#2563EB] text-white shadow-2xs font-extrabold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="मराठी (Marathi)"
            >
              <span>मराठी</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLangModalOpen(true)}
              aria-label="Select Other Languages"
              title="Other Languages / इतर भाषा..."
              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Notifications Icon (In-App Only) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors relative cursor-pointer"
              title="In-App System Alerts"
            >
              <Bell className="w-4 h-4" />
              {msgUnread > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-1 ring-2 ring-white dark:ring-slate-900">
                  {msgUnread > 9 ? "9+" : msgUnread}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white">In-App Broadcasts</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-semibold">
                    Live Feed
                  </span>
                </div>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <p className="font-semibold text-slate-900 dark:text-white">Recent Support Activity</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {msgUnread > 0 ? `${msgUnread} unread message threads waiting.` : "All support inquiries are up to date."}
                    </p>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <p className="font-semibold text-slate-900 dark:text-white">Device Lock System</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      DRM single-device lock active. Use Student 360° Drawer to release locks.
                    </p>
                    <span className="text-[10px] text-slate-400">Security Active</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clean Role Chip */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shadow-2xs shrink-0">
            {currentStaff.role === "main_admin" ? (
              <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            )}
            <span className="hidden sm:inline text-[11px] font-extrabold uppercase tracking-wide">
              {currentStaff.role === "main_admin" ? "Admin" : "Sub-Admin"}
            </span>
          </div>

          {/* Staff Avatar with status ring */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="relative">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {currentStaff.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>

            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {currentStaff.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {currentStaff.phone}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="p-1.5 sm:p-2 text-xs text-slate-400 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Language Modal */}
      <LanguageModal isOpen={isLangModalOpen} onClose={() => setIsLangModalOpen(false)} />

      {/* Mobile Slide-Over Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex md:hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 max-w-[85vw] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 h-full shadow-2xl flex flex-col justify-between p-4 overflow-y-auto animate-in slide-in-from-left duration-250"
          >
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">MindMaster</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Staff Console</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Staff Profile Card */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Staff</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                    {currentStaff.role === "main_admin" ? "ADMIN" : "SUB-ADMIN"}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">{currentStaff.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{currentStaff.phone}</p>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {filteredNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? "bg-[#2563EB] text-white font-bold shadow-xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? "bg-white/20 text-white" : "bg-blue-100 dark:bg-blue-900/50 text-[#2563EB] dark:text-blue-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Staff ID: {currentStaff.staffId || currentStaff.id}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Sign Out of Staff Console?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your session token on this device will be revoked.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? "Signing out..." : "Confirm Sign Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
