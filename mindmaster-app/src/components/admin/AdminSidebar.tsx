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
  Tag,
  ShieldCheck,
  History,
  Activity,
  BarChart3,
  Globe,
  Settings,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  GraduationCap,
} from "lucide-react";
import { StaffUser, hasStaffPermission, StaffPermission } from "@/lib/types";
import { getCurrentStaff } from "@/lib/staffStore";
import { getUnreadCountForStaff } from "@/lib/messageStore";
import { useLanguage } from "@/lib/LanguageContext";
import MindMasterLogo from "@/components/common/MindMasterLogo";

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
  const { currentLanguage } = useLanguage();
  const isMarathi = currentLanguage === "mr";

  // Collapsible category state (defaults to open, active category stays open)
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

  // 4 Enterprise Groups for MAIN ADMIN & Permitted STAFF
  const adminCategories: NavCategory[] = [
    {
      id: "overview",
      name: isMarathi ? "विहंगावलोकन व सपोर्ट" : "Overview & Support",
      icon: <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />,
      items: [
        { label: isMarathi ? "डॅशबोर्ड" : "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
        {
          label: isMarathi ? "सपोर्ट टिकट्स" : "Support Tickets",
          href: "/admin/messages",
          icon: <MessageSquare className="w-4 h-4" />,
          badge: msgUnread > 0 ? `${msgUnread}` : undefined,
          permission: "messages.manage",
        },
      ],
    },
    {
      id: "learning",
      name: isMarathi ? "अध्ययन स्टुडिओ" : "Learning Studio",
      icon: <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />,
      items: [
        { label: isMarathi ? "कंटेंट स्टुडिओ" : "Content Studio", href: "/admin/courses", icon: <BookOpen className="w-4 h-4" />, permission: "courses.manage" },
        { label: isMarathi ? "व्हिडिओ लायब्ररी" : "Video Library", href: "/admin/videos", icon: <Video className="w-4 h-4" />, permission: "videos.manage" },
        { label: isMarathi ? "युट्यूब सिंक" : "YouTube Sync", href: "/admin/playlist", icon: <ListPlus className="w-4 h-4" />, permission: "courses.manage" },
        { label: isMarathi ? "ई-बुक्स व नोट्स" : "PDF Books", href: "/admin/notes", icon: <FileText className="w-4 h-4" />, permission: "notes.books.manage" },
      ],
    },
    {
      id: "students",
      name: isMarathi ? "विद्यार्थी व ऍक्सेस" : "Students & Access",
      icon: <Users className="w-3.5 h-3.5 text-emerald-500" />,
      items: [
        { label: isMarathi ? "विद्यार्थी CRM" : "Students", href: "/admin/students", icon: <Users className="w-4 h-4" />, permission: "students.view" },
        { label: isMarathi ? "कोर्स ग्रँट्स" : "Course Grants", href: "/admin/grants", icon: <Gift className="w-4 h-4" />, adminOnly: true },
        { label: isMarathi ? "कूपन कोड्स" : "Coupons", href: "/admin/coupons", icon: <Tag className="w-4 h-4" />, permission: "coupons.manage" },
      ],
    },
    {
      id: "system",
      name: isMarathi ? "प्रणाली व नियंत्रण" : "System & Control",
      icon: <Settings className="w-3.5 h-3.5 text-slate-500" />,
      items: [
        { label: isMarathi ? "सब-ॲडमिन" : "Sub-Admins", href: "/admin/sub-admins", icon: <ShieldCheck className="w-4 h-4" />, badge: "Admin", adminOnly: true },
        { label: isMarathi ? "ऑडिट लॉग्स" : "Audit Logs", href: "/admin/audit", icon: <History className="w-4 h-4" />, adminOnly: true },
        { label: isMarathi ? "माझी ॲक्टिव्हिटी" : "My Activity", href: "/admin/my-activity", icon: <Activity className="w-4 h-4" /> },
        { label: isMarathi ? "रिपोर्ट्स" : "Reports", href: "/admin/reports", icon: <BarChart3 className="w-4 h-4" />, adminOnly: true },
        { label: isMarathi ? "वेबसाईट CMS" : "Website CMS", href: "/admin/website-cms", icon: <Globe className="w-4 h-4" />, badge: "CMS", adminOnly: true },
        { label: isMarathi ? "सेटिंग्ज" : "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" />, badge: "Config", adminOnly: true },
        { label: isMarathi ? "मार्गदर्शिका" : "SOP Guide", href: "/admin/guide", icon: <HelpCircle className="w-4 h-4" />, badge: "SOP" },
      ],
    },
  ];

  // =========================================================================
  // SUB-ADMIN WORKSPACE SIDEBAR
  // =========================================================================
  if (isSubAdmin) {
    const subNavItems: NavItem[] = [
      { label: isMarathi ? "डॅशबोर्ड" : "Dashboard", href: "/sub", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: isMarathi ? "विद्यार्थी शोध" : "Students Finder", href: "/sub/students", icon: <Users className="w-4 h-4" />, permission: "students.view" },
      {
        label: isMarathi ? "सपोर्ट टिकट्स" : "Support Tickets",
        href: "/sub/messages",
        icon: <MessageSquare className="w-4 h-4" />,
        badge: msgUnread > 0 ? `${msgUnread}` : undefined,
        permission: "messages.manage",
      },
      { label: isMarathi ? "माझी ॲक्टिव्हिटी" : "My Activity", href: "/sub/activity", icon: <Activity className="w-4 h-4" /> },
      { label: isMarathi ? "मार्गदर्शिका" : "SOP Guide", href: "/admin/guide", icon: <HelpCircle className="w-4 h-4" />, badge: "SOP" },
    ];

    const filteredSubItems = subNavItems.filter((item) => {
      if (item.adminOnly && staff.role !== "main_admin") return false;
      if (item.permission && !hasStaffPermission(staff, item.permission)) return false;
      return true;
    });

    return (
      <aside className="w-64 bg-white dark:bg-[#1E293B] border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between p-4 min-h-[calc(100vh-64px)] shadow-xs text-slate-800 dark:text-slate-100 font-sans select-none shrink-0 transition-colors duration-200">
        <div className="space-y-4">
          {/* Sub-Admin Workspace Badge Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2563EB] dark:text-blue-400 flex items-center gap-1.5">
                <MindMasterLogo size="xs" />
                <span>Staff Console</span>
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80">
                Sub-Admin
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 truncate">
              {staff.name}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              ID: {staff.staffId || staff.id} • Satara Centre
            </p>
          </div>

          {/* Permitted Keys Indicator */}
          <div className="p-2.5 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Active Scope</span>
              </span>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 font-mono">
                {staff.permissions.length} Keys
              </span>
            </div>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {staff.permissions.length === 0 ? (
                <span className="text-[9px] text-slate-500 italic">Standard Support Scope</span>
              ) : (
                staff.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-1.5 py-0.5 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 rounded text-[9px] font-mono font-bold border border-purple-200/60 dark:border-purple-800/60"
                  >
                    {p.replace(".manage", "").replace(".view", "")}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Navigation Items (Showing Permitted Items) */}
          <nav className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Permitted Workspace ({filteredSubItems.length})
            </div>
            {filteredSubItems.map((item) => {
              const isActive = isTabActive(item.href, pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#2563EB] text-white shadow-xs font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-blue-100 dark:bg-blue-900/50 text-[#2563EB] dark:text-blue-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sub-Admin Footer SOP Link */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 mt-4 space-y-1.5">
          <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Satara Support Hub</span>
          </div>
          <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">
            Staff actions are recorded in security audit trail.
          </p>
          <Link
            href="/admin/guide"
            className="flex items-center justify-between text-[10px] font-bold text-[#2563EB] dark:text-blue-400 hover:underline pt-1 border-t border-slate-200 dark:border-slate-700"
          >
            <span>Staff SOP Guidelines</span>
            <span>→</span>
          </Link>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // MAIN ADMIN SIDEBAR (4 Clean Labeled Enterprise Categories)
  // =========================================================================
  return (
    <aside className="w-64 bg-white dark:bg-[#1E293B] border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between p-3.5 min-h-[calc(100vh-64px)] shadow-xs text-slate-800 dark:text-slate-100 font-sans select-none shrink-0 overflow-y-auto transition-colors duration-200">
      <div className="space-y-4">
        {/* Brand & Staff Role Card */}
        <div className="px-3.5 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2563EB] dark:text-blue-400 flex items-center gap-1.5">
              <MindMasterLogo size="xs" />
              <span>Supreme Admin</span>
            </span>
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80">
              OWNER
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 truncate">
            {staff.name}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            ID: {staff.staffId || staff.id}
          </p>
        </div>

        {/* 4 Clean Labeled Groups */}
        <div className="space-y-3 pt-1">
          {adminCategories.map((cat) => {
            // Filter category items based on permissions
            const visibleItems = cat.items.filter((item) => {
              if (item.adminOnly && staff.role !== "main_admin") return false;
              if (item.permission && !hasStaffPermission(staff, item.permission)) return false;
              return true;
            });

            if (visibleItems.length === 0) return null;

            // Keep open if current path is active within this category
            const hasActiveRoute = visibleItems.some((item) => isTabActive(item.href, pathname));
            const isCollapsed = collapsedCategories[cat.id] === true && !hasActiveRoute;

            return (
              <div key={cat.id} className="space-y-1">
                {/* Category Header with Collapse Toggle */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer select-none"
                >
                  <span className="flex items-center gap-1.5">
                    {cat.icon}
                    <span>{cat.name}</span>
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 font-normal">
                      ({visibleItems.length})
                    </span>
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>

                {/* Category Items */}
                {!isCollapsed && (
                  <div className="space-y-0.5 transition-all duration-200">
                    {visibleItems.map((item) => {
                      const isActive = isTabActive(item.href, pathname);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-[#2563EB] text-white shadow-xs font-bold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
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
                                  : "bg-blue-100 dark:bg-blue-900/50 text-[#2563EB] dark:text-blue-300"
                              }`}
                            >
                              {item.badge}
                            </span>
                          ) : isActive ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
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
      <div className="pt-3 mt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Operational Console</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
            Role-based controls &amp; DRM lock management active.
          </p>
          <Link
            href="/admin/guide"
            className="flex items-center justify-between text-[10px] font-bold text-[#2563EB] dark:text-blue-400 hover:underline pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-700"
          >
            <span>Staff SOP Manual</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
