"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  ListPlus,
  FileText,
  Users,
  Gift,
  ShieldCheck,
  Tag,
  BarChart3,
  Globe,
  MessageSquare,
  History,
  Activity,
  Settings,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Zap,
  HelpCircle,
} from "lucide-react";
import { StaffUser, hasStaffPermission, StaffPermission } from "@/lib/types";
import { getCurrentStaff } from "@/lib/staffStore";
import { getUnreadCountForStaff } from "@/lib/messageStore";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  adminOnly?: boolean;
  permission?: StaffPermission;
}

interface NavCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  items: NavItem[];
}

function isTabActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  if (href === "/sub") return pathname === "/sub" || pathname === "/sub/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [msgUnread, setMsgUnread] = useState(0);

  // Collapsible category state (defaults to all expanded, active category automatically opens)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

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

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const isSubRoute = pathname.startsWith("/sub");
  const isSubAdmin = staff.role === "sub_admin" || isSubRoute;

  // 4 Standardized Collapsible Categories for MAIN ADMIN (/admin/*)
  const adminCategories: NavCategory[] = [
    {
      id: "learning",
      name: "Learning Content",
      icon: <GraduationCap className="w-3.5 h-3.5 text-blue-400" />,
      items: [
        { label: "Courses", href: "/admin/courses", icon: <BookOpen className="w-4 h-4" />, permission: "courses.manage" },
        { label: "Videos", href: "/admin/videos", icon: <Video className="w-4 h-4" />, permission: "videos.manage" },
        { label: "Playlist", href: "/admin/playlist", icon: <ListPlus className="w-4 h-4" />, permission: "courses.manage" },
        { label: "Notes & Books", href: "/admin/notes", icon: <FileText className="w-4 h-4" />, permission: "notes.books.manage" },
      ],
    },
    {
      id: "students",
      name: "Students & Access",
      icon: <Users className="w-3.5 h-3.5 text-emerald-400" />,
      items: [
        { label: "Students", href: "/admin/students", icon: <Users className="w-4 h-4" />, permission: "students.view" },
        { label: "Grants", href: "/admin/grants", icon: <Gift className="w-4 h-4" />, adminOnly: true },
        { label: "Sub-Admins", href: "/admin/sub-admins", icon: <ShieldCheck className="w-4 h-4" />, badge: "Admin", adminOnly: true },
      ],
    },
    {
      id: "growth",
      name: "Growth & CMS",
      icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
      items: [
        { label: "Coupons", href: "/admin/coupons", icon: <Tag className="w-4 h-4" />, permission: "coupons.manage" },
        { label: "Reports", href: "/admin/reports", icon: <BarChart3 className="w-4 h-4" />, adminOnly: true },
        { label: "Website CMS", href: "/admin/website-cms", icon: <Globe className="w-4 h-4" />, badge: "Studio", adminOnly: true },
      ],
    },
    {
      id: "system",
      name: "System",
      icon: <Settings className="w-3.5 h-3.5 text-purple-400" />,
      items: [
        {
          label: "Messages",
          href: "/admin/messages",
          icon: <MessageSquare className="w-4 h-4" />,
          badge: msgUnread > 0 ? `${msgUnread}` : undefined,
          permission: "messages.manage",
        },
        { label: "Audit Logs", href: "/admin/audit", icon: <History className="w-4 h-4" />, adminOnly: true },
        { label: "My Activity", href: "/admin/my-activity", icon: <Activity className="w-4 h-4" /> },
        { label: "Help & SOP Guide", href: "/admin/guide", icon: <HelpCircle className="w-4 h-4" />, badge: "SOP" },
        { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" />, badge: "Config", adminOnly: true },
      ],
    },
  ];

  // Dynamic navigation tabs for SUB-ADMIN strictly matching test and operational permissions
  const subNavItems: NavItem[] = [
    { label: "Dashboard", href: "/sub", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Student Finder", href: "/sub/students", icon: <Users className="w-4 h-4" />, permission: "students.view" },
    {
      label: "Support Messages",
      href: "/sub/messages",
      icon: <MessageSquare className="w-4 h-4" />,
      badge: msgUnread > 0 ? `${msgUnread}` : undefined,
      permission: "messages.manage",
    },
    { label: "My Activity", href: "/sub/activity", icon: <Activity className="w-4 h-4" /> },
    { label: "Help & SOP Guide", href: "/admin/guide", icon: <HelpCircle className="w-4 h-4" />, badge: "SOP" },
  ];

  // Filter Sub-Admin items
  const filteredSubItems = subNavItems.filter((item) => {
    if (item.adminOnly && staff.role !== "main_admin") return false;
    if (item.permission && !hasStaffPermission(staff, item.permission)) return false;
    return true;
  });

  // =========================================================================
  // SUB-ADMIN SIDEBAR: Clean Stitch Identity with Lavender Active Pills
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
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5E35B1] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sub-Admin Scoped</span>
              </span>
              <span className="px-2 py-0.5 bg-white text-[#5E35B1] rounded-full text-[10px] font-bold shadow-xs border border-[#E9E3FF]">
                {staff.permissions.length} Active Keys
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
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#8A94A6]">
              Permitted Tabs ({filteredSubItems.length})
            </div>
            {filteredSubItems.map((item) => {
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
                    <span className="shrink-0">{item.icon}</span>
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

        {/* Regional Node Card */}
        <div className="p-3 bg-[#F5F7FF] rounded-2xl border border-[#E4E8F8] text-[11px] text-[#5A6478] mt-4 space-y-2">
          <div className="flex items-center space-x-1.5 font-bold text-[#0E1B3D]">
            <span className="w-2 h-2 rounded-full bg-[#137333] animate-pulse" />
            <span>Narhe Hub Node</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-[#DFF7EA] text-[#137333] rounded font-bold">
              ONLINE
            </span>
          </div>
          <p className="text-[10px] leading-tight text-[#5A6478]">
            Scoped to Narhe study centre operations. Actions logged under {staff.staffId || staff.id}.
          </p>
          <Link
            href="/admin/guide"
            className="flex items-center justify-between text-[10px] font-bold text-[#5E35B1] hover:text-[#4527A0] pt-1.5 border-t border-[#E4E8F8]"
          >
            <span>Read Staff SOPs</span>
            <span>→</span>
          </Link>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // MAIN ADMIN SIDEBAR (Deep Navy Supreme Identity with 4 Collapsible Categories)
  // =========================================================================
  const isDashboardActive = pathname === "/admin" || pathname === "/admin/";

  return (
    <aside className="w-64 bg-[#0A1128] border-r border-[#1C294F] flex flex-col justify-between p-3.5 min-h-[calc(100vh-64px)] shadow-2xl text-[#E2E8F0] font-sans select-none shrink-0 overflow-y-auto">
      <div className="space-y-4">
        {/* Brand & Staff Role Card */}
        <div className="px-3.5 py-3 bg-[#101C42] border border-[#1E2D5A] rounded-2xl shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#93C5FD] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
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

        {/* Primary Dashboard Link */}
        <Link
          href="/admin"
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            isDashboardActive
              ? "bg-[#0B57D0] text-white shadow-lg shadow-blue-900/50 border border-[#3B82F6]"
              : "text-[#94A3B8] hover:bg-[#13224E] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4 shrink-0 text-[#93C5FD]" />
            <span>Dashboard</span>
          </div>
          {isDashboardActive && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
        </Link>

        {/* 4 Clean Collapsible Categories */}
        <div className="space-y-3 pt-1">
          {adminCategories.map((cat) => {
            // Filter category items based on permissions
            const visibleItems = cat.items.filter((item) => {
              if (item.adminOnly && staff.role !== "main_admin") return false;
              if (item.permission && !hasStaffPermission(staff, item.permission)) return false;
              return true;
            });

            if (visibleItems.length === 0) return null;

            // Check if active route is within this category to keep open
            const hasActiveRoute = visibleItems.some((item) => isTabActive(item.href, pathname));
            const isCollapsed = collapsedCategories[cat.id] === true && !hasActiveRoute;

            return (
              <div key={cat.id} className="space-y-1">
                {/* Category Header with Collapse Toggle */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#64748B] hover:text-[#94A3B8] transition cursor-pointer select-none"
                >
                  <span className="flex items-center gap-1.5">
                    {cat.icon}
                    <span>{cat.name}</span>
                    <span className="text-[9px] font-mono text-[#475569] font-normal">
                      ({visibleItems.length})
                    </span>
                  </span>
                  <span className="text-[#64748B]">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>

                {/* Category Items */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pl-1 transition-all duration-200">
                    {visibleItems.map((item) => {
                      const isActive = isTabActive(item.href, pathname);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-[#0B57D0] text-white shadow-md shadow-blue-900/40 border border-[#3B82F6]"
                              : "text-[#94A3B8] hover:bg-[#13224E] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="shrink-0">{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          {item.badge ? (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-[#1E2D5A] text-[#93C5FD]"
                              }`}
                            >
                              {item.badge}
                            </span>
                          ) : isActive ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info Box for Main Admin */}
      <div className="pt-3 mt-4 border-t border-[#1C294F] space-y-2">
        <div className="p-2.5 bg-[#101C42] border border-[#1E2D5A] rounded-xl text-[11px] text-[#A7F3D0]">
          <p className="font-bold flex items-center gap-1.5 text-[#34D399]">
            <Zap className="w-3.5 h-3.5" />
            <span>Main Admin Node</span>
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-tight">
            Razorpay, Sub-Admins, Delete actions &amp; Audit Trail active.
          </p>
          <Link
            href="/admin/guide"
            className="flex items-center justify-between text-[10px] font-bold text-[#93C5FD] hover:text-white pt-1.5 mt-1 border-t border-[#1E2D5A]"
          >
            <span>Staff SOP Manual</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
