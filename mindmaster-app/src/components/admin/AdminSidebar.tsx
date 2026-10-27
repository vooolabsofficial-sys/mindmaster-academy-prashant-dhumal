"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StaffUser, hasStaffPermission, StaffPermission } from "@/lib/types";
import { getCurrentStaff } from "@/lib/staffStore";
import { getUnreadCountForStaff } from "@/lib/messageStore";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  adminOnly?: boolean;
  permission?: StaffPermission;
}

function isTabActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  if (href === "/sub") return pathname === "/sub" || pathname === "/sub/";
  if (href === "/admin/courses") {
    return (
      pathname.startsWith("/admin/courses") ||
      pathname.startsWith("/admin/videos") ||
      pathname.startsWith("/admin/playlist")
    );
  }
  if (href === "/admin/students" || href === "/sub/students") {
    return (
      pathname.startsWith("/admin/students") ||
      pathname.startsWith("/admin/grants") ||
      pathname.startsWith("/sub/students") ||
      pathname.startsWith("/sub/grants")
    );
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [msgUnread, setMsgUnread] = useState(0);

  useEffect(() => {
    setStaff(getCurrentStaff());
    setMsgUnread(getUnreadCountForStaff());
    const handleStaffChange = () => {
      setStaff(getCurrentStaff());
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

  const isSubRoute = pathname.startsWith("/sub");
  const isSubAdmin = staff.role === "sub_admin" || isSubRoute;

  // Streamlined navigation tabs for MAIN ADMIN (/admin/*)
  const adminNavItems: NavItem[] = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Courses & Videos", href: "/admin/courses", icon: "📚", permission: "courses.manage" },
    { label: "Digital Books", href: "/admin/notes", icon: "📖", permission: "notes.books.manage" },
    { label: "Students & Grants", href: "/admin/students", icon: "🎓", permission: "students.view" },
    { label: "Coupons", href: "/admin/coupons", icon: "🏷️", permission: "coupons.manage" },
    { label: "Support Messages", href: "/admin/messages", icon: "💬", badge: msgUnread > 0 ? `${msgUnread}` : undefined, permission: "messages.manage" },
    { label: "Sub-Admins", href: "/admin/sub-admins", icon: "👥", badge: "Admin", adminOnly: true },
    { label: "Audit Logs", href: "/admin/audit", icon: "📜", adminOnly: true },
    { label: "Settings", href: "/admin/settings", icon: "⚙️", badge: "Config", adminOnly: true },
    { label: "Reports", href: "/admin/reports", icon: "📈", adminOnly: true },
  ];

  // Dynamic navigation tabs for SUB-ADMIN matching assigned operational permissions
  const subNavItems: NavItem[] = [
    { label: "Dashboard", href: "/sub", icon: "📊" },
    { label: "Students & Grants", href: "/sub/students", icon: "🎓", permission: "students.view" },
    { label: "Support Messages", href: "/sub/messages", icon: "💬", badge: msgUnread > 0 ? `${msgUnread}` : undefined, permission: "messages.manage" },
    { label: "Courses & Videos", href: "/admin/courses", icon: "📚", permission: "courses.manage" },
    { label: "Digital Books", href: "/admin/notes", icon: "📖", permission: "notes.books.manage" },
    { label: "Coupons", href: "/admin/coupons", icon: "🏷️", permission: "coupons.manage" },
    { label: "My Activity", href: "/sub/activity", icon: "⏱️" },
  ];

  // Select target navigation array
  const rawItems = isSubAdmin ? subNavItems : adminNavItems;

  // Filter items: ONLY permitted tabs for sub-admin
  const filteredItems = rawItems.filter((item) => {
    if (item.adminOnly && staff.role !== "main_admin") return false;
    if (item.permission && !hasStaffPermission(staff, item.permission)) return false;
    return true;
  });

  // =========================================================================
  // SUB-ADMIN SIDEBAR: Exact Stitch layout with Light White Identity & Lavender Active Pills
  // =========================================================================
  if (isSubAdmin) {
    return (
      <aside className="w-64 bg-white border-r border-[#E4E8F8] flex flex-col justify-between p-4 min-h-[calc(100vh-64px)] shadow-xs text-[#0E1B3D] font-sans select-none shrink-0">
        <div className="space-y-4">
          {/* Brand & Staff Role Card */}
          <div className="p-3.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[#0B57D0] uppercase tracking-wider">
                Academic Console
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE8FF] text-[#5E35B1] border border-[#D5CCFF]">
                SUB-ADMIN
              </span>
            </div>
            <p className="text-xs text-[#0E1B3D] font-bold mt-1.5 truncate">
              {staff.name}
            </p>
            <p className="text-[10px] text-[#5A6478] font-mono mt-0.5">
              ID: {staff.staffId || staff.id} • Narhe Centre
            </p>
          </div>

          {/* Lavender Access Banner for Sub-Admins */}
          <div className="p-3 bg-[#FAF8FF] border border-[#E9E3FF] rounded-2xl text-[#5E35B1] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5E35B1] flex items-center gap-1">
                <span>🛡️</span> Sub-Admin Scoped
              </span>
              <span className="px-2 py-0.5 bg-white text-[#5E35B1] rounded-full text-[10px] font-bold shadow-xs border border-[#E9E3FF]">
                {staff.permissions.length} Modules Active
              </span>
            </div>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {staff.permissions.length === 0 ? (
                <span className="text-[9px] text-[#5A6478] italic">No active permission keys</span>
              ) : (
                staff.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-1.5 py-0.5 bg-white text-[#5E35B1] rounded text-[9px] font-mono font-bold border border-[#E9E3FF]"
                  >
                    {p.replace(".manage", "").replace(".view", "")}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Navigation Tabs (Showing ONLY Permitted Tabs) */}
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#8A94A6]">
              Permitted Tabs ({filteredItems.length})
            </div>
            {filteredItems.map((item) => {
              const isActive = isTabActive(item.href, pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs transition-all ${
                    isActive
                      ? "bg-[#EDE8FF] text-[#5E35B1] font-semibold border border-[#D5CCFF] shadow-xs"
                      : "text-[#5A6478] font-medium hover:text-[#0E1B3D] hover:bg-[#F5F7FF]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white text-[#5E35B1] border border-[#D5CCFF]"
                          : "bg-[#DDEBFF] text-[#095ABA]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-[#5E35B1]" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Regional Node Card matching Stitch sub-12/sub-06 */}
        <div className="p-3 bg-[#F5F7FF] rounded-2xl border border-[#E4E8F8] text-[11px] text-[#5A6478] mt-4">
          <div className="flex items-center space-x-1.5 font-bold text-[#0E1B3D] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#137333] animate-pulse" />
            <span>Narhe Hub Node</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-[#DFF7EA] text-[#137333] rounded font-bold">
              ONLINE
            </span>
          </div>
          <p className="text-[10px] leading-tight text-[#5A6478]">
            Scoped to Narhe study centre operations. Actions logged under {staff.staffId || staff.id}.
          </p>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // MAIN ADMIN SIDEBAR (Deep Navy Supreme Identity)
  // =========================================================================
  return (
    <aside className="w-64 bg-[#0A1128] border-r border-[#1C294F] flex flex-col justify-between p-4 min-h-[calc(100vh-64px)] shadow-2xl text-[#E2E8F0] font-sans select-none shrink-0">
      <div className="space-y-4">
        {/* Brand & Staff Role Card */}
        <div className="px-3.5 py-3.5 bg-[#101C42] border border-[#1E2D5A] rounded-2xl shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#93C5FD] uppercase tracking-wider">
              Supreme Admin
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6D28D9] text-[#EDE9FE] border border-[#7C3AED]">
              OWNER
            </span>
          </div>
          <p className="text-xs text-white font-semibold mt-1.5 truncate">
            {staff.name}
          </p>
          <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
            ID: {staff.staffId || staff.id}
          </p>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-2">
            Navigation Tabs ({filteredItems.length})
          </p>
          {filteredItems.map((item) => {
            const isActive = isTabActive(item.href, pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#0B57D0] text-white shadow-lg shadow-blue-900/50 border border-[#3B82F6]"
                    : "text-[#94A3B8] hover:bg-[#13224E] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#1E2D5A] text-[#93C5FD]"
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

      {/* Footer Info Box for Main Admin */}
      <div className="pt-4 border-t border-[#1C294F]">
        <div className="p-3 bg-[#101C42] border border-[#1E2D5A] rounded-xl text-[11px] text-[#A7F3D0]">
          <p className="font-bold flex items-center gap-1 text-[#34D399]">
            <span>⚡</span> Main Admin Access
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-tight">
            Razorpay keys, sub-admins, delete actions &amp; audit trail active.
          </p>
        </div>
      </div>
    </aside>
  );
}
