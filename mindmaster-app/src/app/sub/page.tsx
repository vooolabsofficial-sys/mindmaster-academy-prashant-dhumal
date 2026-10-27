"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentStaff, getAuditLogs, getStaffStudents } from "@/lib/staffStore";
import { getUnreadCountForStaff, getConversationsForStaff } from "@/lib/messageStore";
import { StaffUser, AuditLogEntry, hasStaffPermission } from "@/lib/types";

export default function SubAdminRootPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);

  useEffect(() => {
    const current = getCurrentStaff();
    setStaff(current);
    setStudentCount(getStaffStudents().length);
    setMsgUnread(getUnreadCountForStaff());
    setConversationCount(getConversationsForStaff().length);

    const allLogs = getAuditLogs();
    const myLogs = allLogs.filter(
      (l) =>
        l.staffId === current.id ||
        (current.staffId && l.staffId === current.staffId) ||
        (l.staffName && current.name && l.staffName.toLowerCase() === current.name.toLowerCase())
    );
    setLogs(myLogs.slice(0, 6));

    const handleStaffChange = () => {
      const refreshed = getCurrentStaff();
      setStaff(refreshed);
      setStudentCount(getStaffStudents().length);
      setMsgUnread(getUnreadCountForStaff());
      setConversationCount(getConversationsForStaff().length);
    };

    const handleMsgChange = () => {
      setMsgUnread(getUnreadCountForStaff());
      setConversationCount(getConversationsForStaff().length);
    };

    window.addEventListener("mma_staff_changed", handleStaffChange);
    window.addEventListener("mma_messages_changed", handleMsgChange);
    return () => {
      window.removeEventListener("mma_staff_changed", handleStaffChange);
      window.removeEventListener("mma_messages_changed", handleMsgChange);
    };
  }, []);

  const hasStudentPerm = hasStaffPermission(staff, "students.view");
  const hasMsgPerm = hasStaffPermission(staff, "messages.manage");
  const hasGrantPerm = hasStaffPermission(staff, "freegrant.manage");
  const hasCoursePerm = hasStaffPermission(staff, "courses.manage");
  const hasVideoPerm = hasStaffPermission(staff, "videos.manage");
  const hasBookPerm = hasStaffPermission(staff, "notes.books.manage");
  const hasCouponPerm = hasStaffPermission(staff, "coupons.manage");

  return (
    <AdminShell>
      <div className="space-y-6 pb-12">
        {/* ========================================================================= */}
        {/* SECTION 0: WELCOME & ASSIGNED OPERATIONAL AUTHORITY BANNER */}
        {/* ========================================================================= */}
        <section className="w-full bg-white border border-[#E4E8F8] rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE8FF] border border-[#D5CCFF] text-[#5E35B1] flex items-center justify-center shrink-0 shadow-xs text-2xl">
                🧑‍💼
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold text-[#0E1B3D] font-heading tracking-tight">
                    Welcome, {staff.name}!
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EDE8FF] text-[#5E35B1] border border-[#D5CCFF]">
                    Sub-Admin Console
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#5A6478] bg-[#F5F7FF] border border-[#E4E8F8] px-2 py-0.5 rounded-full">
                    {staff.staffId || staff.id}
                  </span>
                </div>
                <p className="text-xs text-[#5A6478] font-medium leading-relaxed">
                  MindMaster Academy Staff Console • Operational authority assigned by Main Admin.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-[#0E1B3D]">Active Modules:</span>
                  {staff.permissions && staff.permissions.length > 0 ? (
                    staff.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#F5F7FF] text-[#5E35B1] border border-[#E9E3FF]"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No operational permissions assigned yet</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/sub/activity"
                className="px-4 py-2 bg-[#F5F7FF] hover:bg-[#EDE8FF] border border-[#E4E8F8] text-[#0E1B3D] text-xs font-bold rounded-full transition-colors shadow-xs"
              >
                ⏱️ View My Activity
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 1: STATS TILES (Sub-Admin Allowed Scopes Only) */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Messages Tile */}
          <div className="bg-white rounded-3xl p-5 border border-[#E4E8F8] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#8A94A6]">
                  STUDENT SUPPORT &amp; MESSAGES
                </span>
                <span className="text-lg">💬</span>
              </div>
              <p className="text-2xl font-black text-[#5E35B1] font-heading mt-2">
                {conversationCount} Conversations
              </p>
              <p className="text-xs text-[#5A6478] mt-1">
                {hasMsgPerm
                  ? `${msgUnread} unread queries requiring staff response`
                  : "Access gated (needs messages.manage)"}
              </p>
            </div>
            {hasMsgPerm && (
              <div className="pt-4 mt-2 border-t border-[#F5F7FF] flex items-center justify-between text-xs">
                <Link href="/sub/messages" className="text-[#5E35B1] font-bold hover:underline">
                  Open Support Inbox →
                </Link>
                {msgUnread > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                    {msgUnread} New
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Student Cohorts Tile */}
          <div className="bg-white rounded-3xl p-5 border border-[#E4E8F8] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#8A94A6]">
                  STUDENT COHORTS (VIEW ONLY)
                </span>
                <span className="text-lg">🎓</span>
              </div>
              <p className="text-2xl font-black text-[#0B57D0] font-heading mt-2">
                {studentCount} Learners
              </p>
              <p className="text-xs text-[#5A6478] mt-1">
                {hasStudentPerm
                  ? "360 profile lookup (drill telemetry reserved for Admin)"
                  : "Access gated (needs students.view)"}
              </p>
            </div>
            {hasStudentPerm && (
              <div className="pt-4 mt-2 border-t border-[#F5F7FF] flex items-center justify-between text-xs">
                <Link href="/sub/students" className="text-[#0B57D0] font-bold hover:underline">
                  Search Learners →
                </Link>
              </div>
            )}
          </div>

          {/* Personal Activity Tile */}
          <div className="bg-white rounded-3xl p-5 border border-[#E4E8F8] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#8A94A6]">
                  OPERATOR AUDIT FEED
                </span>
                <span className="text-lg">⏱️</span>
              </div>
              <p className="text-2xl font-black text-[#137333] font-heading mt-2">
                {logs.length} Actions
              </p>
              <p className="text-xs text-[#5A6478] mt-1">
                Personal mutating operations logged under {staff.staffId || staff.id}
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-[#F5F7FF] flex items-center justify-between text-xs">
              <Link href="/sub/activity" className="text-[#137333] font-bold hover:underline">
                View My Activity Timeline →
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: PERMITTED MODULE LAUNCHERS */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-[#E4E8F8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#0E1B3D] font-heading">
                Permitted Module Launchers
              </h2>
              <p className="text-xs text-[#5A6478]">
                Direct links to sub-admin operations matching your provisioned authority.
              </p>
            </div>
            <span className="text-xs font-bold text-[#5E35B1] bg-[#EDE8FF] px-3 py-1 rounded-full border border-[#D5CCFF]">
              {staff.permissions.length} Modules Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {/* 1. Student Finder Launcher */}
            {hasStudentPerm && (
              <Link
                href="/sub/students"
                className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF] hover:border-[#0B57D0] hover:bg-white transition-all flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E8F8] flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                  🎓
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#0E1B3D] group-hover:text-[#0B57D0]">
                    Student Finder &amp; 360° Profile
                  </h3>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">
                    Look up students, offline admissions &amp; access validity
                  </p>
                </div>
              </Link>
            )}

            {/* 2. Messages Launcher */}
            {hasMsgPerm && (
              <Link
                href="/sub/messages"
                className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF] hover:border-[#5E35B1] hover:bg-white transition-all flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E8F8] flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                  💬
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#0E1B3D] group-hover:text-[#5E35B1]">
                    Student Support Messages
                  </h3>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">
                    Direct two-pane messaging and student assistance
                  </p>
                </div>
              </Link>
            )}

            {/* 3. Offline Grants Launcher */}
            {hasGrantPerm && (
              <Link
                href="/sub/grants"
                className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF] hover:border-[#137333] hover:bg-white transition-all flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E8F8] flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                  🎁
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#0E1B3D] group-hover:text-[#137333]">
                    Offline Admissions &amp; Grants
                  </h3>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">
                    Grant offline Cash / UPI course and book access
                  </p>
                </div>
              </Link>
            )}

            {/* 4. Courses Launcher */}
            {hasCoursePerm && (
              <Link
                href="/admin/courses"
                className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF] hover:border-[#0B57D0] hover:bg-white transition-all flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E8F8] flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                  📚
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#0E1B3D] group-hover:text-[#0B57D0]">
                    Courses Manager
                  </h3>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">
                    Create and edit academy courses and validity
                  </p>
                </div>
              </Link>
            )}

            {/* 5. Videos Launcher */}
            {hasVideoPerm && (
              <Link
                href="/admin/videos"
                className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF] hover:border-[#E53935] hover:bg-white transition-all flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E8F8] flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                  🎬
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#0E1B3D] group-hover:text-[#E53935]">
                    YouTube Videos &amp; Playlists
                  </h3>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">
                    Manage lecture videos, free previews &amp; playlists
                  </p>
                </div>
              </Link>
            )}

            {/* 6. Digital Books Launcher */}
            {hasBookPerm && (
              <Link
                href="/admin/notes"
                className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF] hover:border-[#8E24AA] hover:bg-white transition-all flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E8F8] flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                  📖
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#0E1B3D] group-hover:text-[#8E24AA]">
                    Digital Books Manager
                  </h3>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">
                    Upload and manage PDF books and access
                  </p>
                </div>
              </Link>
            )}

            {/* 7. Coupons Launcher */}
            {hasCouponPerm && (
              <Link
                href="/admin/coupons"
                className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF] hover:border-[#FB8C00] hover:bg-white transition-all flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E8F8] flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                  🏷️
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#0E1B3D] group-hover:text-[#FB8C00]">
                    Discount Coupons
                  </h3>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">
                    Create and manage promo discount coupon codes
                  </p>
                </div>
              </Link>
            )}

            {/* 8. My Activity Launcher */}
            <Link
              href="/sub/activity"
              className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF] hover:border-[#137333] hover:bg-white transition-all flex items-start gap-3.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E8F8] flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                ⏱️
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#0E1B3D] group-hover:text-[#137333]">
                  My Activity
                </h3>
                <p className="text-[11px] text-[#5A6478] mt-0.5">
                  Personal audit trail and chronological actions
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: RECENT AUDIT ACTIVITY TABLE */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-[#E4E8F8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#0E1B3D] font-heading">
                Recent Assigned Activity &amp; Logs
              </h2>
              <p className="text-xs text-[#5A6478]">
                Verified actions dispatched under staff ID: {staff.staffId || staff.id}.
              </p>
            </div>
            <Link
              href="/sub/activity"
              className="text-xs font-bold text-[#0B57D0] hover:underline"
            >
              View Full Feed →
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-[#8A94A6] text-xs">
              No recent activity recorded for your account yet. Mutating actions will appear here automatically.
            </div>
          ) : (
            <div className="divide-y divide-[#E4E8F8]">
              {logs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5F7FF] text-[#0E1B3D] border border-[#E4E8F8]">
                      {log.action}
                    </span>
                    <span className="font-semibold text-[#0E1B3D]">
                      {log.entityName || log.entityId}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8A94A6]">
                    {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Scope Note */}
          <div className="p-3 bg-[#FAF8FF] border border-[#E9E3FF] rounded-2xl text-[11px] text-[#5E35B1]">
            🔒 <strong>Main Admin Safeguards:</strong> Master Settings, Sub-Admin management, System Audit Trail, Financial/Watch Telemetry Reports, and Deletion operations remain securely reserved for Main Admin (Prashant Sir).
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
