"use client";

import React, { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { StaffUser, AuditLogEntry } from "@/lib/types";
import { getCurrentStaff, getAuditLogs } from "@/lib/staffStore";

// Action badge icons & color mapping
function getActionBadge(action: string) {
  const a = action.toUpperCase();
  if (a.includes("STUDENT") || a.includes("360")) {
    return { icon: "🎓", bg: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (a.includes("COURSE")) {
    return { icon: "📚", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  }
  if (a.includes("VIDEO") || a.includes("LESSON")) {
    return { icon: "🎬", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (a.includes("COUPON")) {
    return { icon: "🏷️", bg: "bg-purple-50 text-purple-700 border-purple-200" };
  }
  if (a.includes("SUBADMIN") || a.includes("STAFF")) {
    return { icon: "👥", bg: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (a.includes("DELETE")) {
    return { icon: "🗑️", bg: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if (a.includes("SETTING") || a.includes("CONFIG")) {
    return { icon: "⚙️", bg: "bg-slate-100 text-slate-800 border-slate-200" };
  }
  return { icon: "⚡", bg: "bg-[#EEF4FF] text-[#0B57D0] border-[#D0E2FF]" };
}

export default function MyActivityPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [myLogs, setMyLogs] = useState<AuditLogEntry[]>([]);
  const [filterType, setFilterType] = useState<"all" | "student" | "course" | "coupon" | "video">("all");

  const filterLogsForSelf = (current: StaffUser) => {
    const allLogs = getAuditLogs();
    return allLogs.filter(
      (l) =>
        l.staffId === current.id ||
        (current.staffId && l.staffId === current.staffId) ||
        (l.staffName && current.name && l.staffName.toLowerCase() === current.name.toLowerCase())
    );
  };

  useEffect(() => {
    const current = getCurrentStaff();
    setStaff(current);
    setMyLogs(filterLogsForSelf(current));

    const handleStaffChange = () => {
      const refreshed = getCurrentStaff();
      setStaff(refreshed);
      setMyLogs(filterLogsForSelf(refreshed));
    };

    window.addEventListener("mma_staff_changed", handleStaffChange);
    return () => window.removeEventListener("mma_staff_changed", handleStaffChange);
  }, []);

  const displayedLogs = myLogs.filter((log) => {
    if (filterType === "all") return true;
    return log.entityType.toLowerCase() === filterType.toLowerCase();
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading tracking-tight">
                  My Activity Timeline
                </h1>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF]">
                  staff_id = {staff.staffId || staff.id}
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Personal chronological audit trail filtered for <span className="font-semibold text-[#0E1B3D]">{staff.name}</span> ({staff.email}).
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3.5 py-1.5 bg-[#E6F0FF] text-[#0B57D0] rounded-full text-xs font-bold border border-[#D0E2FF]">
                {myLogs.length} Personal Events
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#E4E8F8]">
            <div className="p-4 bg-[#F5F7FF] rounded-2xl">
              <p className="text-xs text-[#8A94A6]">Role & Designation</p>
              <p className="text-base font-bold text-[#0E1B3D] capitalize mt-0.5">
                {staff.role === "main_admin" ? "Founder / Supreme Admin" : "Sub-Admin Staff"}
              </p>
            </div>
            <div className="p-4 bg-[#F5F7FF] rounded-2xl">
              <p className="text-xs text-[#8A94A6]">Assigned Staff ID</p>
              <p className="text-base font-mono font-bold text-[#0B57D0] mt-0.5">
                {staff.staffId || staff.id}
              </p>
            </div>
            <div className="p-4 bg-[#F5F7FF] rounded-2xl">
              <p className="text-xs text-[#8A94A6]">Active Permission Keys</p>
              <p className="text-base font-bold text-[#0E1B3D] mt-0.5">
                {staff.permissions.length} Keys Granted
              </p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-2xl border border-[#E4E8F8]">
          <span className="text-xs font-bold text-[#5A6478] mr-2">Filter By Entity:</span>
          {[
            { key: "all", label: "All Activity" },
            { key: "student", label: "🎓 Students & 360" },
            { key: "course", label: "📚 Courses" },
            { key: "video", label: "🎬 Lessons & Videos" },
            { key: "coupon", label: "🏷️ Coupons" },
          ].map((item) => {
            const isActive = filterType === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setFilterType(item.key as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#0B57D0] text-white shadow-xs"
                    : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#E4E8F8]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Vertical Activity Timeline */}
        <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-[#0E1B3D] flex items-center gap-2">
              <span>⏱️</span> Chronological Timeline ({displayedLogs.length})
            </h2>
            <span className="text-[11px] text-[#8A94A6]">Real-time audit log binding</span>
          </div>

          {displayedLogs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-[#F5F7FF] flex items-center justify-center text-xl mx-auto mb-3">
                📜
              </div>
              <p className="text-sm font-bold text-[#0E1B3D]">No activity recorded</p>
              <p className="text-xs text-[#8A94A6] mt-1 max-w-sm mx-auto">
                Actions performed by this account (e.g., student 360 views, course updates, coupon creation) will automatically show up here.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-3 sm:before:left-4 before:w-0.5 before:bg-[#E4E8F8]">
              {displayedLogs.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#0B57D0] flex items-center justify-center text-[10px] shadow-xs group-hover:scale-110 transition-transform">
                      {badge.icon}
                    </div>

                    {/* Timeline Card */}
                    <div className="bg-[#FAFBFD] group-hover:bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl p-4 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold border ${badge.bg}`}
                          >
                            {log.action}
                          </span>
                          <span className="text-xs font-bold text-[#0E1B3D]">
                            {log.entityName || log.entityId}
                          </span>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-semibold px-2 py-0.5 bg-white rounded border border-[#E4E8F8]">
                            {log.entityType}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#8A94A6] whitespace-nowrap">
                          {log.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-[#5A6478] mt-2 leading-relaxed">
                        {log.details}
                      </p>

                      <div className="mt-3 pt-2 border-t border-[#E4E8F8]/60 flex items-center justify-between text-[10px] text-[#8A94A6]">
                        <span>Log ID: <code className="text-[#0B57D0]">{log.id}</code></span>
                        <span>Operator: <strong className="text-[#0E1B3D]">{log.staffName}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
