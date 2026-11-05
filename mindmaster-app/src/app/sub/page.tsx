"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  UserCheck, 
  MessageSquare, 
  GraduationCap, 
  Activity, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Lock,
  Layers,
  Sparkles,
  HelpCircle,
  Tag,
  Users,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import CategoryManagerModal from "@/components/admin/CategoryManagerModal";
import { getCurrentStaff, getAuditLogs, getStaffStudents } from "@/lib/staffStore";
import { getUnreadCountForStaff, getConversationsForStaff } from "@/lib/messageStore";
import { StaffUser, AuditLogEntry, hasStaffPermission } from "@/lib/types";

export default function SubAdminRootPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

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

  return (
    <AdminShell>
      <div className="space-y-6 sm:space-y-8 font-sans pb-12">
        {/* ========================================================================= */}
        {/* SECTION 0: WELCOME & ASSIGNED OPERATIONAL AUTHORITY BANNER */}
        {/* ========================================================================= */}
        <section className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xs transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
                    Welcome, {staff.name}!
                  </h1>
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Sub-Admin Console</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                    {staff.staffId || staff.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                  MindMaster Academy Staff Console • Operational authority assigned by Main Admin (Satara &amp; Pune Hub).
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" /> Active Scopes:
                  </span>
                  {staff.permissions && staff.permissions.length > 0 ? (
                    staff.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No custom scopes assigned yet</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/sub/activity"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all active:scale-95 shadow-2xs"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>View My Activity</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 1: STATS TILES (Sub-Admin Allowed Scopes Only) */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Messages Tile */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-500 transition-all group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  STUDENT SUPPORT &amp; MESSAGES
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading mt-2 tabular-nums">
                {conversationCount} <span className="text-sm font-normal text-slate-500">Threads</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {hasMsgPerm
                  ? `${msgUnread} unread queries requiring staff response`
                  : "Access gated (requires messages.manage)"}
              </p>
            </div>
            {hasMsgPerm && (
              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <Link href="/sub/messages" className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                  <span>Open Support Inbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {msgUnread > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-900/50 tabular-nums">
                    {msgUnread} New
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Student Cohorts Tile */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-500 transition-all group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  STUDENT COHORTS (VIEW ONLY)
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading mt-2 tabular-nums">
                {studentCount} <span className="text-sm font-normal text-slate-500">Learners</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {hasStudentPerm
                  ? "360° profile lookup (drill telemetry reserved for Admin)"
                  : "Access gated (requires students.view)"}
              </p>
            </div>
            {hasStudentPerm && (
              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <Link href="/sub/students" className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                  <span>Search Learners</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Personal Activity Tile */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-500 transition-all group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  OPERATOR AUDIT FEED
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading mt-2 tabular-nums">
                {logs.length} <span className="text-sm font-normal text-slate-500">Actions</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Personal mutating operations logged under {staff.staffId || staff.id}
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <Link href="/sub/activity" className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1">
                <span>View Activity Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: PERMITTED MODULE LAUNCHERS */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                Permitted Module Launchers
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Direct links to sub-admin operations matching your provisioned authority.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/50">
              {staff.permissions.length} Scopes Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {/* 1. Student Finder & Grants Launcher */}
            {hasStudentPerm && (
              <Link
                href="/sub/students"
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-500 hover:bg-white dark:hover:bg-slate-800 transition-all duration-150 flex items-start gap-3.5 group shadow-2xs hover:shadow-xs active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Student Finder &amp; Grants
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Look up students, offline admissions &amp; access validity
                  </p>
                </div>
              </Link>
            )}

            {/* 2. Messages Launcher */}
            {hasMsgPerm && (
              <Link
                href="/sub/messages"
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-500 hover:bg-white dark:hover:bg-slate-800 transition-all duration-150 flex items-start gap-3.5 group shadow-2xs hover:shadow-xs active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Student Support Desk
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Direct two-pane messaging and student assistance
                  </p>
                </div>
              </Link>
            )}

            {/* 3. My Activity Launcher */}
            <Link
              href="/sub/activity"
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 hover:bg-white dark:hover:bg-slate-800 transition-all duration-150 flex items-start gap-3.5 group shadow-2xs hover:shadow-xs active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  My Activity
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Personal audit trail and chronological actions
                </p>
              </div>
            </Link>

            {/* 4. SOP Guide Launcher */}
            <Link
              href="/admin/guide"
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-amber-500 hover:bg-white dark:hover:bg-slate-800 transition-all duration-150 flex items-start gap-3.5 group shadow-2xs hover:shadow-xs active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  SOP Guide
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Standard operating procedures for customer care &amp; calls
                </p>
              </div>
            </Link>

            {/* 5. Dynamic Categories Manager Launcher */}
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-500 hover:bg-white dark:hover:bg-slate-800 transition-all duration-150 flex items-start gap-3.5 group text-left cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Category Manager
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Create, edit, reorder &amp; sync dynamic curriculum categories
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: RECENT AUDIT ACTIVITY TABLE */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                Recent Assigned Activity &amp; Logs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified actions dispatched under staff ID: {staff.staffId || staff.id}.
              </p>
            </div>
            <Link
              href="/sub/activity"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View Full Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              No recent activity recorded for your account yet. Mutating actions will appear here automatically.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {log.entityName || log.entityId}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">
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
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span><strong>Main Admin Safeguards:</strong> Master Settings, Sub-Admin management, Financial/Watch Telemetry Reports, and Deletion operations remain securely reserved for Main Admin (Prashant Sir).</span>
          </div>
        </div>

        {/* Dynamic Category Manager Modal for Sub-Admin */}
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
        />
      </div>
    </AdminShell>
  );
}