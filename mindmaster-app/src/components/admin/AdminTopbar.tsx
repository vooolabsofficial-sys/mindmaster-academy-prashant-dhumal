"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { StaffUser, hasStaffPermission, StaffPermission } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffUsers,
  setCurrentStaff,
  logoutStaff,
} from "@/lib/staffStore";
import { getUnreadCountForStaff } from "@/lib/messageStore";

interface NavItem {
  label: string;
  href: string;
  icon: string;
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
    try {
      await fetch("/api/staff/logout", { method: "POST" });
    } catch {}
    logoutStaff();
    router.push("/staff/login");
  };

  const isSubRoute = pathname?.startsWith("/sub");
  const isSubAdmin = currentStaff.role === "sub_admin" || isSubRoute;
  const homeHref = isSubAdmin ? "/sub" : "/admin";

  const adminNavItems: NavItem[] = [
    { label: "Overview", href: "/admin", icon: "📊" },
    { label: "Courses", href: "/admin/courses", icon: "📚", permission: "courses.manage" },
    { label: "Videos", href: "/admin/videos", icon: "🎬", permission: "videos.manage" },
    { label: "Playlist Import", href: "/admin/playlist", icon: "📥", permission: "videos.manage" },
    { label: "Coupons", href: "/admin/coupons", icon: "🏷️", permission: "coupons.manage" },
    { label: "Free Grants", href: "/admin/grants", icon: "🎁", permission: "freegrant.manage" },
    { label: "Sub-Admins", href: "/admin/sub-admins", icon: "👥", badge: "Admin", adminOnly: true },
    { label: "Student Finder", href: "/admin/students", icon: "🎓", permission: "students.view" },
    { label: "Messages", href: "/admin/messages", icon: "💬", badge: msgUnread > 0 ? `${msgUnread}` : undefined, permission: "messages.manage" },
    { label: "Analytics Hub", href: "/admin/reports", icon: "📈", permission: "reports.view" },
    { label: "Digital Books Manager", href: "/admin/notes", icon: "📖", permission: "notes.books.manage" },
    { label: "My Activity", href: "/admin/my-activity", icon: "⏱️" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️", badge: "Config", adminOnly: true },
    { label: "Audit Trail", href: "/admin/audit", icon: "📜", adminOnly: true },
  ];

  const subNavItems: NavItem[] = [
    { label: "Dashboard", href: "/sub", icon: "📊" },
    { label: "Messages", href: "/sub/messages", icon: "💬", badge: msgUnread > 0 ? `${msgUnread}` : undefined, permission: "messages.manage" },
    { label: "Student Finder", href: "/sub/students", icon: "🎓", permission: "students.view" },
    { label: "Offline Grants", href: "/sub/grants", icon: "🎁", permission: "freegrant.manage" },
    { label: "My Activity", href: "/sub/activity", icon: "⏱️" },
  ];

  const rawItems = isSubAdmin ? subNavItems : adminNavItems;
  const filteredNavItems = rawItems.filter((item) => {
    if (item.adminOnly && currentStaff.role !== "main_admin") return false;
    if (item.permission && !hasStaffPermission(currentStaff, item.permission)) return false;
    return true;
  });

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E4E8F8] px-3 sm:px-4 md:px-8 flex items-center justify-between shadow-sm">
        {/* Left: Mobile Hamburger & Brand Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open staff menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href={homeHref} className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#0B57D0] to-[#0A1128] flex items-center justify-center text-white shadow-md font-bold text-base sm:text-lg group-hover:scale-105 transition-transform shrink-0">
              🧠
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-[#0E1B3D] text-sm sm:text-base leading-none font-heading">
                  MindMaster
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-[#EBF3FE] text-[#0B57D0] shrink-0">
                  {currentStaff.role === "main_admin" ? "Admin" : "Sub-Admin"}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-[#5A6478] leading-none mt-1">
                Prashant Dhumal • Narhe Centre
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Persona Switcher, Notifications, Role Chip & Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick Persona Switcher for Testing RBAC */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#F5F7FF] border border-[#E4E8F8] px-3 py-1 rounded-full text-xs">
            <span className="text-[#8A94A6] text-[10px] uppercase font-bold">Switch:</span>
            <select
              value={currentStaff.id}
              onChange={(e) => handlePersonaSwitch(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#0E1B3D] focus:outline-none cursor-pointer"
            >
              {allStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role === "main_admin" ? "Admin" : "Sub-Admin"})
                </option>
              ))}
            </select>
          </div>

          {/* Notifications Icon (Strictly In-App) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F5F7FF] hover:bg-[#EEF4FF] border border-[#E4E8F8] flex items-center justify-center text-sm text-[#0E1B3D] transition-colors relative cursor-pointer"
              title="In-App System Alerts"
            >
              🔔
              {msgUnread > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-1 ring-2 ring-white">
                  {msgUnread > 9 ? "9+" : msgUnread}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-[#E4E8F8] rounded-2xl shadow-xl p-4 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4E8F8]">
                  <span className="font-bold text-[#0E1B3D]">In-App Broadcasts</span>
                  <span className="text-[10px] text-[#8A94A6] bg-slate-100 px-2 py-0.5 rounded-full">
                    No WhatsApp
                  </span>
                </div>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F5F7FF] border border-[#E4E8F8]">
                    <p className="font-semibold text-[#0E1B3D]">New Course Enrollment</p>
                    <p className="text-[#5A6478] text-[11px] mt-0.5">
                      Aditi Patil enrolled in Vedic Maths Speed Foundation.
                    </p>
                    <span className="text-[10px] text-[#8A94A6]">10 mins ago</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F5F7FF] border border-[#E4E8F8]">
                    <p className="font-semibold text-[#0E1B3D]">Coupon System Ready</p>
                    <p className="text-[#5A6478] text-[11px] mt-0.5">
                      System is active for creating coupon codes and managing student fee grants.
                    </p>
                    <span className="text-[10px] text-[#8A94A6]">System Update</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lavender Role Chip */}
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE] shadow-sm shrink-0">
            <span className="text-xs">
              {currentStaff.role === "main_admin" ? "👑" : "🛡️"}
            </span>
            <span className="hidden sm:inline text-xs font-extrabold uppercase tracking-wide">
              {currentStaff.role === "main_admin" ? "Main Admin" : "Sub-Admin"}
            </span>
          </div>

          {/* Staff Avatar with status ring */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-[#E4E8F8]">
            <div className="relative">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4338CA] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-[#DDD6FE]">
                {currentStaff.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-[#0E1B3D] leading-tight">
                {currentStaff.name}
              </p>
              <p className="text-[10px] text-[#7C3AED] font-semibold">
                {currentStaff.phone}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-xs text-[#8A94A6] hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

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
            className="w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between p-4 overflow-y-auto animate-in slide-in-from-left duration-250"
          >
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    🧠
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">MindMaster</h3>
                    <p className="text-[10px] text-slate-500">Staff Console</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Staff Profile Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Staff</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {currentStaff.role === "main_admin" ? "MAIN ADMIN" : "SUB-ADMIN"}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">{currentStaff.name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{currentStaff.phone}</p>
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
                          ? "bg-blue-600 text-white font-bold shadow-xs"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
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
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="text-[10px] text-slate-400 font-mono">
                Staff ID: {currentStaff.staffId || currentStaff.id}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
