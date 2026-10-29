"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { StaffUser } from "@/lib/types";
import { ForensicAuditLogEntry, AuditCategory } from "@/lib/auditLogger";
import { fetchDbAuditLogs } from "@/lib/auditLogger";
import { fetchDbStaff } from "@/lib/staffStore";
import { formatIST } from "@/lib/istTime";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<ForensicAuditLogEntry[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "7d" | "month">("all");
  const [selectedLog, setSelectedLog] = useState<ForensicAuditLogEntry | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, operatorFilter, categoryFilter, dateFilter, pageSize]);

  useEffect(() => {
    fetchDbAuditLogs().then((res) => setLogs(res));
    fetchDbStaff().then((res) => setStaffUsers(res));
  }, []);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf7Days = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredLogs = logs.filter((log) => {
    // 1. Operator filter
    if (operatorFilter === "main_admin" && log.staffRole !== "main_admin") return false;
    if (operatorFilter !== "all" && operatorFilter !== "main_admin") {
      if (log.staffId !== operatorFilter && log.staff_id !== operatorFilter) return false;
    }

    // 2. Category tab filter
    if (categoryFilter === "high_risk") {
      if (log.severity !== "critical") return false;
    } else if (categoryFilter !== "all") {
      if (log.category !== categoryFilter) return false;
    }

    // 3. Date range filter (in IST)
    const logTime = new Date(log.at || log.created_at).getTime();
    if (dateFilter === "today" && logTime < startOfToday) return false;
    if (dateFilter === "yesterday" && (logTime < startOfYesterday || logTime >= startOfToday)) return false;
    if (dateFilter === "7d" && logTime < startOf7Days) return false;
    if (dateFilter === "month" && logTime < startOfMonth) return false;

    // 4. Search query
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchEntity = (log.entityName || "").toLowerCase().includes(q);
      const matchStaff = (log.staffName || "").toLowerCase().includes(q) || (log.staffId || "").toLowerCase().includes(q);
      const matchPhone = (log.targetStudentPhone || "").includes(q);
      const matchStudentName = (log.targetStudentName || "").toLowerCase().includes(q);
      const matchDetails = (log.details || "").toLowerCase().includes(q);
      if (!matchAction && !matchEntity && !matchStaff && !matchPhone && !matchStudentName && !matchDetails) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const handleExportCsv = () => {
    const headers = [
      "Log ID",
      "Timestamp (IST)",
      "Operator Name",
      "Operator Staff ID",
      "Operator Role",
      "Category",
      "Severity",
      "Action Key",
      "Target Entity Type",
      "Target Entity Name",
      "Target Student Phone",
      "Target Student Name",
      "Details / Diff",
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.recorded_at_ist || l.timestamp}"`,
      `"${l.staffName}"`,
      `"${l.staffId}"`,
      `"${l.staffRole}"`,
      `"${l.category}"`,
      `"${l.severity}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${(l.entityName || "").replace(/"/g, '""')}"`,
      `"${l.targetStudentPhone || ""}"`,
      `"${(l.targetStudentName || "").replace(/"/g, '""')}"`,
      `"${(l.details || JSON.stringify(l.diff || {})).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mindmaster_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PermissionGuard adminOnly={true}>
      <AdminShell>
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
                  Forensic Audit Trail
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                  APPEND-ONLY • IST ACCURATE
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Tamper-proof chronological log of every mutating action across admissions, cash settlements, curriculum, and security.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-4 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
              >
                <span>📥</span> Export Forensic CSV
              </button>
              <span className="px-3.5 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-bold text-[#0E1B3D]">
                Total: {filteredLogs.length}
              </span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E4E8F8] pb-3">
            {[
              { id: "all", label: "All Categories", icon: "📋" },
              { id: "admissions", label: "Admissions & Grants", icon: "🎓" },
              { id: "settlements", label: "Cash & Settlements", icon: "💰" },
              { id: "catalog", label: "Catalog & CMS Edits", icon: "📚" },
              { id: "security", label: "Logins & Security", icon: "🛡️" },
              { id: "high_risk", label: "🚨 High-Risk / Alerts", icon: "⚠️" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  categoryFilter === tab.id
                    ? tab.id === "high_risk"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-[#0E1B3D] text-white shadow-sm"
                    : "bg-white text-[#5A6478] hover:bg-[#F5F7FF] border border-[#E4E8F8]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E4E8F8] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8A94A6]">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search phone, student, staff ID, action..."
                className="w-full pl-9 pr-4 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Operator Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#5A6478] font-medium">Operator:</span>
                <select
                  value={operatorFilter}
                  onChange={(e) => setOperatorFilter(e.target.value)}
                  className="bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Staff</option>
                  <option value="main_admin">Main Admin Only</option>
                  {staffUsers
                    .filter((s) => s.role === "sub_admin")
                    .map((s) => (
                      <option key={s.id} value={s.staffId || s.id}>
                        {s.staffId || "Sub"} - {s.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#5A6478] font-medium">IST Range:</span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today (IST)</option>
                  <option value="yesterday">Yesterday (IST)</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E8F8] text-[#8A94A6] uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2">Timestamp (IST)</th>
                    <th className="pb-3">Author & Role</th>
                    <th className="pb-3">Severity & Category</th>
                    <th className="pb-3">Action Key</th>
                    <th className="pb-3">Target / Student</th>
                    <th className="pb-3">Details / Diff</th>
                    <th className="pb-3 text-right pr-2">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E8F8]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#8A94A6]">
                        No audit events found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-[#F5F7FF] cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 pl-2 text-[#5A6478] font-mono text-[11px] whitespace-nowrap">
                          {log.recorded_at_ist || log.timestamp}
                        </td>

                        <td className="py-3.5 whitespace-nowrap">
                          <span className="font-bold text-[#0E1B3D] mr-1.5">{log.staffName}</span>
                          <StatusBadge
                            status={log.staffRole === "main_admin" ? "admin" : "verified"}
                            label={log.staffRole === "main_admin" ? "Admin" : "Sub-Admin"}
                            size="sm"
                          />
                        </td>

                        <td className="py-3.5 whitespace-nowrap">
                          <StatusBadge
                            status={
                              log.severity === "critical"
                                ? "failed"
                                : log.severity === "warning"
                                ? "draft"
                                : "active"
                            }
                            label={log.severity}
                            size="sm"
                            className="mr-1.5 uppercase font-bold"
                          />
                          <span className="text-[10px] text-[#5A6478] font-medium">
                            {log.category}
                          </span>
                        </td>

                        <td className="py-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-[#EEF4FF] text-[#0B57D0] font-mono rounded font-bold text-[10px]">
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3.5 whitespace-nowrap">
                          {log.targetStudentName || log.targetStudentPhone ? (
                            <div>
                              <p className="font-bold text-[#0E1B3D]">{log.targetStudentName || "Student"}</p>
                              {log.targetStudentPhone && (
                                <p className="font-mono text-[10px] text-[#5A6478]">{log.targetStudentPhone}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#5A6478] font-medium">
                              [{log.entityType}] {log.entityName}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 text-[#5A6478] max-w-xs truncate font-mono text-[11px]">
                          {log.details}
                        </td>

                        <td className="py-3.5 text-right pr-2">
                          <span className="text-xs text-[#0B57D0] font-semibold hover:underline">
                            View Diff →
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredLogs.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#E4E8F8] text-xs text-[#5A6478]">
                <div className="flex items-center gap-2">
                  <span>
                    Showing{" "}
                    <span className="font-bold text-[#0E1B3D]">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-[#0E1B3D]">
                      {Math.min(currentPage * pageSize, filteredLogs.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-[#0E1B3D]">
                      {filteredLogs.length}
                    </span>{" "}
                    events
                  </span>
                  <span className="text-[#A4B0C6]">|</span>
                  <label className="flex items-center gap-1.5 text-xs text-[#5A6478]">
                    <span>Page size:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-2 py-1 bg-[#F5F7FF] border border-[#E4E8F8] rounded-lg font-bold text-[#0E1B3D] cursor-pointer"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E4E8F8] bg-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FF] transition cursor-pointer"
                    title="First page"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-[#E4E8F8] bg-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FF] transition cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1.5 font-bold text-[#0E1B3D]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-[#E4E8F8] bg-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FF] transition cursor-pointer"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E4E8F8] bg-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FF] transition cursor-pointer"
                    title="Last page"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Slide-over Before / After Forensic Drawer */}
          {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-xl h-full bg-white shadow-2xl p-6 overflow-y-auto space-y-6">
                <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#0E1B3D]">Forensic Event Details</h2>
                    <p className="text-xs text-[#5A6478] font-mono">Event ID: {selectedLog.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="p-2 text-[#5A6478] hover:bg-[#F5F7FF] rounded-full text-base font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Core Attributes */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#F5F7FF] p-4 rounded-2xl">
                  <div>
                    <p className="text-[#8A94A6]">Exact IST Timestamp</p>
                    <p className="font-bold text-[#0E1B3D] font-mono">{selectedLog.recorded_at_ist || selectedLog.timestamp}</p>
                  </div>
                  <div>
                    <p className="text-[#8A94A6]">Action Key</p>
                    <p className="font-bold text-[#0B57D0] font-mono">{selectedLog.action}</p>
                  </div>
                  <div>
                    <p className="text-[#8A94A6]">Operator</p>
                    <p className="font-bold text-[#0E1B3D]">{selectedLog.staffName} ({selectedLog.staffId})</p>
                  </div>
                  <div>
                    <p className="text-[#8A94A6]">Operator Role</p>
                    <p className="font-bold uppercase text-[#0E1B3D]">{selectedLog.staffRole}</p>
                  </div>
                  {selectedLog.targetStudentPhone && (
                    <div>
                      <p className="text-[#8A94A6]">Target Student Phone</p>
                      <p className="font-mono font-bold text-[#0E1B3D]">{selectedLog.targetStudentPhone}</p>
                    </div>
                  )}
                  {selectedLog.targetStudentName && (
                    <div>
                      <p className="text-[#8A94A6]">Target Student Name</p>
                      <p className="font-bold text-[#0E1B3D]">{selectedLog.targetStudentName}</p>
                    </div>
                  )}
                </div>

                {/* Before vs After Diff Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-[#8A94A6] tracking-wider">
                    Before → After Diff Tracking
                  </h3>

                  {selectedLog.diff ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-xl text-xs">
                        <p className="font-bold text-rose-800 mb-1">Previous Value (Before)</p>
                        <pre className="font-mono text-[11px] text-rose-950 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.diff.previous_value, null, 2) || "None (Created)"}
                        </pre>
                      </div>

                      <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-xs">
                        <p className="font-bold text-emerald-800 mb-1">New Value (After)</p>
                        <pre className="font-mono text-[11px] text-emerald-950 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.diff.new_value, null, 2) || "None"}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#F5F7FF] border border-[#E4E8F8] p-3 rounded-xl text-xs">
                      <p className="font-semibold text-[#0E1B3D] mb-1">Mutation Details</p>
                      <pre className="font-mono text-[11px] text-[#5A6478] overflow-x-auto whitespace-pre-wrap">
                        {selectedLog.details}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Device & Security Meta */}
                {selectedLog.meta && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase text-[#8A94A6] tracking-wider">
                      Network & Device Telemetry
                    </h3>
                    <div className="bg-[#F5F7FF] p-3 rounded-xl text-xs font-mono text-[#5A6478] space-y-1">
                      <p>IP Address: {selectedLog.meta.ip || "127.0.0.1"}</p>
                      <p>User Agent: {selectedLog.meta.userAgent || "MindMaster Staff Agent"}</p>
                      <p>Method: {selectedLog.meta.method || "MUTATION"}</p>
                      <p>Path: {selectedLog.meta.path || selectedLog.entityType}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
