"use client";

import React, { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { StaffUser } from "@/lib/types";
import { getCurrentStaff } from "@/lib/staffStore";
import { ForensicAuditLogEntry, fetchDbAuditLogs } from "@/lib/auditLogger";
import { getGrants } from "@/lib/grantStore";

function getActionBadge(action: string) {
  const a = action.toUpperCase();
  if (a.includes("GRANT") || a.includes("ADMISSION")) {
    return { icon: "🎓", bg: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (a.includes("CASH") || a.includes("SETTLE") || a.includes("PAYMENT")) {
    return { icon: "💰", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (a.includes("LOGIN") || a.includes("AUTH")) {
    return { icon: "🛡️", bg: "bg-purple-50 text-purple-700 border-purple-200" };
  }
  return { icon: "⚡", bg: "bg-[#EEF4FF] text-[#0B57D0] border-[#D0E2FF]" };
}

export default function SubActivityPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [myLogs, setMyLogs] = useState<ForensicAuditLogEntry[]>([]);
  const [todayAdmissions, setTodayAdmissions] = useState<number>(0);
  const [cashCollected, setCashCollected] = useState<number>(0);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    const current = getCurrentStaff();
    setStaff(current);

    const staffIdentifier = current.staffId || current.id;
    fetchDbAuditLogs(staffIdentifier).then((allLogs) => {
      // Strictly scoped: only logs where staffId matches this sub-admin
      const scoped = allLogs.filter(
        (l) =>
          l.staffId === current.id ||
          (current.staffId && l.staffId === current.staffId) ||
          l.staff_id === current.id ||
          (current.staffId && l.staff_id === current.staffId)
      );
      setMyLogs(scoped);
    });

    // Compute today's admissions and cash recorded by this sub-admin
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const allGrants = getGrants ? getGrants() : [];
    const myGrants = allGrants.filter(
      (g) =>
        (g.created_by === current.id || (current.staffId && g.created_by === current.staffId))
    );

    const todayCount = myGrants.filter((g) => {
      const t = new Date(g.created_at || (g as any).granted_at_ist || "").getTime();
      return t >= startOfToday;
    }).length;

    const totalCash = myGrants.reduce(
      (sum, g) => sum + (g.amount_paid || g.amountPaid || 0),
      0
    );

    setTodayAdmissions(todayCount);
    setCashCollected(totalCash);
  }, []);

  const displayedLogs = myLogs.filter((log) => {
    if (filterType === "all") return true;
    return log.category === filterType || log.entityType.toLowerCase() === filterType.toLowerCase();
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
                  My Activity Log
                </h1>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF]">
                  ID: {staff.staffId || staff.id}
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Read-only chronological audit log of your admissions, cash recordings, and actions in Indian Standard Time (IST).
              </p>
            </div>
            <span className="px-3.5 py-1.5 bg-[#E6F0FF] text-[#0B57D0] rounded-full text-xs font-bold border border-[#D0E2FF]">
              {myLogs.length} Personal Events
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#E4E8F8]">
            <div className="p-4 bg-[#F5F7FF] rounded-2xl">
              <p className="text-xs text-[#8A94A6]">Admissions Today</p>
              <p className="text-xl font-extrabold text-[#0E1B3D] mt-0.5">{todayAdmissions} Students</p>
            </div>
            <div className="p-4 bg-[#F5F7FF] rounded-2xl">
              <p className="text-xs text-[#8A94A6]">Total Fee Collected</p>
              <p className="text-xl font-extrabold text-emerald-600 mt-0.5">₹{cashCollected.toLocaleString("en-IN")}</p>
            </div>
            <div className="p-4 bg-[#F5F7FF] rounded-2xl">
              <p className="text-xs text-[#8A94A6]">Designation</p>
              <p className="text-xl font-bold text-[#0B57D0] mt-0.5">Sub-Admin</p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-2xl border border-[#E4E8F8]">
          <span className="text-xs font-bold text-[#5A6478] mr-2">Filter:</span>
          {[
            { key: "all", label: "All Activity" },
            { key: "admissions", label: "🎓 Admissions & Grants" },
            { key: "settlements", label: "💰 Cash Recordings" },
            { key: "security", label: "🛡️ Login History" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterType(item.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filterType === item.key
                  ? "bg-[#0B57D0] text-white shadow-xs"
                  : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#E4E8F8]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-[#0E1B3D] flex items-center gap-2">
              <span>⏱️</span> Your Activity History ({displayedLogs.length})
            </h2>
            <span className="text-xs text-[#8A94A6]">IST Timestamps</span>
          </div>

          {displayedLogs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-[#F5F7FF] flex items-center justify-center text-xl mx-auto mb-3">
                📜
              </div>
              <p className="text-sm font-bold text-[#0E1B3D]">No activity recorded</p>
              <p className="text-xs text-[#8A94A6] mt-1">
                Your admissions, grants, and logins will automatically be immutably recorded here.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-3 sm:before:left-4 before:w-0.5 before:bg-[#E4E8F8]">
              {displayedLogs.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <div key={log.id} className="relative group">
                    <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#0B57D0] flex items-center justify-center text-[10px] shadow-xs group-hover:scale-110 transition-transform">
                      {badge.icon}
                    </div>

                    <div className="bg-[#FAFBFD] group-hover:bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl p-4 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold border ${badge.bg}`}>
                            {log.action}
                          </span>
                          <span className="text-xs font-bold text-[#0E1B3D]">
                            {log.targetStudentName || log.entityName || log.entityId}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#8A94A6] whitespace-nowrap">
                          {log.recorded_at_ist || log.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-[#5A6478] mt-2 leading-relaxed">
                        {log.details}
                      </p>
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
