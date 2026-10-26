"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { AuditLogEntry, StaffUser } from "@/lib/types";
import { getAuditLogs, getStaffUsers, fetchDbAuditLogs, fetchDbStaff } from "@/lib/staffStore";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffFilter, setStaffFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  useEffect(() => {
    fetchDbAuditLogs().then((res) => setLogs(res));
    fetchDbStaff().then((res) => setStaffUsers(res));
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.staffName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStaff =
      staffFilter === "all" ? true : log.staffId === staffFilter;

    const matchesEntity =
      entityFilter === "all" ? true : log.entityType === entityFilter;

    return matchesSearch && matchesStaff && matchesEntity;
  });

  return (
    <PermissionGuard adminOnly={true}>
      <AdminShell>
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
                  System Audit Trail
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Every mutating staff operation (create, update, delete, status toggle, notification dispatch) is immutably recorded for compliance.
              </p>
            </div>

            <span className="px-3.5 py-1.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-full text-xs font-semibold text-[#0E1B3D]">
              Total Events: {logs.length}
            </span>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E4E8F8] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8A94A6]">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail by keyword, staff, or action..."
                className="w-full pl-9 pr-4 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-full text-xs text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Staff Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#5A6478] font-medium">Author:</span>
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="bg-[#F5F7FF] border border-[#E4E8F8] rounded-full px-3 py-1.5 text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Staff Members</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role === "main_admin" ? "Admin" : "Sub"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#5A6478] font-medium">Entity:</span>
                <select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="bg-[#F5F7FF] border border-[#E4E8F8] rounded-full px-3 py-1.5 text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Entities</option>
                  <option value="course">Course</option>
                  <option value="video">Video</option>
                  <option value="coupon">Coupon</option>
                  <option value="subadmin">Sub-Admin</option>
                  <option value="student">Student</option>
                  <option value="settings">Settings</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs High-Density Table */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E8F8] text-[#8A94A6] uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2">Timestamp</th>
                    <th className="pb-3">Author & Role</th>
                    <th className="pb-3">Action Key</th>
                    <th className="pb-3">Target Entity</th>
                    <th className="pb-3">Mutation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E8F8]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F5F7FF] transition-colors">
                      <td className="py-3.5 pl-2 text-[#8A94A6] font-mono text-[11px] whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      <td className="py-3.5 whitespace-nowrap">
                        <span className="font-bold text-[#0E1B3D]">{log.staffName}</span>
                        <span
                          className={`ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            log.staffRole === "main_admin"
                              ? "bg-[#0E1B3D] text-white"
                              : "bg-[#DDEBFF] text-[#095ABA]"
                          }`}
                        >
                          {log.staffRole === "main_admin" ? "Admin" : "Sub"}
                        </span>
                      </td>

                      <td className="py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-[#EEF4FF] text-[#0B57D0] font-mono rounded font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3.5 font-semibold text-[#0E1B3D] whitespace-nowrap">
                        <span className="text-[10px] text-[#8A94A6] uppercase mr-1">
                          [{log.entityType}]
                        </span>
                        {log.entityName}
                      </td>

                      <td className="py-3.5 text-[#5A6478] max-w-lg">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
