"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  BookOpen,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Gift,
  Calendar,
  MapPin,
  School,
  GraduationCap,
} from "lucide-react";
import { StudentRecord, Course } from "@/lib/types";
import { getStaffCourses, logStaffAction, saveStaffStudent, getStaffStudents } from "@/lib/staffStore";
import { createGrant, fetchDbGrants, Grant } from "@/lib/grantStore";
import { formatIST, isExpiredIST } from "@/lib/istTime";
import { getConversationsForStudent, Conversation } from "@/lib/messageStore";
import { toast } from "sonner";

interface StudentDrawerProps {
  student: StudentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onStudentUpdated?: () => void;
}

export default function StudentDrawer({
  student,
  isOpen,
  onClose,
  onStudentUpdated,
}: StudentDrawerProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "grants" | "tickets">("profile");
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentGrants, setStudentGrants] = useState<Grant[]>([]);
  const [studentTickets, setStudentTickets] = useState<Conversation[]>([]);
  const [isResettingDevice, setIsResettingDevice] = useState(false);
  const [deviceResetDone, setDeviceResetDone] = useState(false);

  // Quick Grant Form
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [grantMonths, setGrantMonths] = useState(3);
  const [grantReason, setGrantReason] = useState("Direct Academic Grant by Staff");
  const [isGranting, setIsGranting] = useState(false);

  useEffect(() => {
    if (!student || !isOpen) return;
    setCourses(getStaffCourses());
    setDeviceResetDone(false);

    // Fetch student's course grants
    fetchDbGrants().then((allGrants: Grant[]) => {
      const filtered = allGrants.filter(
        (g: Grant) =>
          g.scopeValue === student.phone ||
          g.scopeValue === student.id ||
          (student.district && g.scopeValue === student.district) ||
          (student.taluka && g.scopeValue === student.taluka) ||
          (student.school && g.scopeValue === student.school)
      );
      setStudentGrants(filtered);
    });

    // Fetch student's support tickets
    try {
      const tickets = getConversationsForStudent(student.phone);
      setStudentTickets(tickets || []);
    } catch {
      setStudentTickets([]);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleDeviceReset = async () => {
    setIsResettingDevice(true);
    try {
      const res = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-device", phone: student.phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset device session.");
      }
      logStaffAction(
        "DEVICE_RESET",
        "student",
        student.id,
        student.name,
        `Device session lock cleared for student ${student.name} (${student.phone})`
      );
      setDeviceResetDone(true);
      toast.success(`Device lock reset successfully for ${student.name}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset device lock.");
    } finally {
      setIsResettingDevice(false);
    }
  };

  const handleCreateQuickGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error("Please select a course to grant access.");
      return;
    }
    const targetCourse = courses.find((c) => c.id === selectedCourseId || c.code === selectedCourseId);
    if (!targetCourse) {
      toast.error("Invalid course selected.");
      return;
    }

    setIsGranting(true);
    try {
      const newGrant = createGrant({
        scopeType: "student",
        scopeValue: student.phone,
        courseScope: "one",
        courseId: targetCourse.id,
        itemType: "course",
        months: grantMonths,
        reason: grantReason.trim() || "Administrative Admission Grant",
      });

      // Update student's enrolled courses locally
      const currentCodes = student.enrolledCourseCodes || [];
      const courseCode = targetCourse.code || targetCourse.id;
      if (!currentCodes.includes(courseCode)) {
        const updatedStudent: StudentRecord = {
          ...student,
          enrolledCourseCodes: [...currentCodes, courseCode],
          enrolledCourseTitles: [...(student.enrolledCourseTitles || []), targetCourse.title],
        };
        saveStaffStudent(updatedStudent);
      }

      setStudentGrants((prev) => [newGrant, ...prev]);
      setIsGrantModalOpen(false);
      setSelectedCourseId("");
      toast.success(`Granted ${targetCourse.title} for ${grantMonths} months to ${student.name}`);
      if (onStudentUpdated) onStudentUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to grant course access.");
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-drawer-title"
          className="w-screen max-w-xl bg-white dark:bg-[#1E293B] border-l border-slate-200/80 dark:border-slate-700/60 shadow-2xl flex flex-col justify-between text-[#0F172A] dark:text-[#F1F5F9] transition-all duration-300"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200/80 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400 flex items-center justify-center font-bold text-lg ring-2 ring-blue-100 dark:ring-blue-900/50 shrink-0">
                  {student.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="student-drawer-title" className="text-lg font-black tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
                      {student.name}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      STUDENT 360°
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] font-mono mt-0.5">
                    {student.phone} • {student.standard || "School Student"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segment Tabs */}
            <div className="flex items-center gap-2 mt-5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold text-[#475569] dark:text-[#94A3B8]">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "profile"
                    ? "bg-white dark:bg-[#1E293B] text-[#2563EB] dark:text-blue-400 shadow-xs font-extrabold"
                    : "hover:text-[#0F172A] dark:hover:text-[#F1F5F9]"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile & DRM</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("grants")}
                className={`flex-1 py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "grants"
                    ? "bg-white dark:bg-[#1E293B] text-[#2563EB] dark:text-blue-400 shadow-xs font-extrabold"
                    : "hover:text-[#0F172A] dark:hover:text-[#F1F5F9]"
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Course Access ({student.enrolledCourseCodes?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tickets")}
                className={`flex-1 py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "tickets"
                    ? "bg-white dark:bg-[#1E293B] text-[#2563EB] dark:text-blue-400 shadow-xs font-extrabold"
                    : "hover:text-[#0F172A] dark:hover:text-[#F1F5F9]"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Tickets ({studentTickets.length})</span>
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: Profile & DRM Lock */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* DRM Single-Device Lock Action Box */}
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
                      <h3 className="text-xs font-extrabold text-[#0F172A] dark:text-[#F1F5F9]">
                        Single-Device Hardware Lock
                      </h3>
                    </div>
                    {deviceResetDone ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Lock Released
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> Active Bound
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                    Student account is strictly DRM-locked to 1 device. If the student switched phones or bought a new device, click below to release the session lock instantly.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDeviceReset}
                      disabled={isResettingDevice}
                      className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 dark:bg-[#3B82F6] dark:hover:bg-blue-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResettingDevice ? "animate-spin" : ""}`} />
                      <span>{isResettingDevice ? "Resetting Lock..." : "1-Click Reset Device Lock"}</span>
                    </button>
                    <a
                      href={`tel:${student.phone}`}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-[#F1F5F9] text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
                      <span>Call Student</span>
                    </a>
                  </div>
                </div>

                {/* Academic Metadata Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                    Academic Registration Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block">Standard / Class</span>
                      <strong className="text-[#0F172A] dark:text-[#F1F5F9]">{student.standard || "10th Standard / SSC"}</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block">District (HQ)</span>
                      <strong className="text-[#0F172A] dark:text-[#F1F5F9]">{student.district || "Satara"}</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block">Taluka</span>
                      <strong className="text-[#0F172A] dark:text-[#F1F5F9]">{student.taluka || "Satara"}</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block">School / Institute</span>
                      <strong className="text-[#0F172A] dark:text-[#F1F5F9] truncate block">{student.school || "Maharashtra State Board"}</strong>
                    </div>
                  </div>
                </div>

                {/* Study & Video Analytics */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                    Video & Drill Metrics
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block">Total Watch Time</span>
                      <span className="text-base font-black text-[#0F172A] dark:text-[#F1F5F9] mt-0.5 block">
                        {Math.round((student.totalWatchSec || 0) / 60)}m
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block">Completed Drills</span>
                      <span className="text-base font-black text-[#0F172A] dark:text-[#F1F5F9] mt-0.5 block">
                        {student.completedLessonsCount || 0}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block">Overall Progress</span>
                      <span className="text-base font-black text-[#2563EB] dark:text-blue-400 mt-0.5 block">
                        {student.progressPercentage || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Course Access & Grants */}
            {activeTab === "grants" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                    Enrolled Courses & Active Grants
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsGrantModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 dark:bg-[#3B82F6] dark:hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Grant Course Access</span>
                  </button>
                </div>

                {/* Quick Grant Inline Form if open */}
                {isGrantModalOpen && (
                  <form
                    onSubmit={handleCreateQuickGrant}
                    className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200 dark:border-blue-800">
                      <span className="text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
                        <span>Authorize Instant Student Grant</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsGrantModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="font-bold text-[#0F172A] dark:text-[#F1F5F9] block mb-1">
                          Select Academy Masterclass
                        </label>
                        <select
                          value={selectedCourseId}
                          onChange={(e) => setSelectedCourseId(e.target.value)}
                          required
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-[#F1F5F9] focus:outline-hidden focus:border-[#2563EB]"
                        >
                          <option value="">-- Choose Course --</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title} ({c.code || "MMA"})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-bold text-[#0F172A] dark:text-[#F1F5F9] block mb-1">
                            Access Duration
                          </label>
                          <select
                            value={grantMonths}
                            onChange={(e) => setGrantMonths(Number(e.target.value))}
                            className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-[#F1F5F9]"
                          >
                            <option value={1}>1 Month (Trial Drill)</option>
                            <option value={3}>3 Months (Standard)</option>
                            <option value={6}>6 Months (Extended)</option>
                            <option value={12}>12 Months (Annual Session)</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-[#0F172A] dark:text-[#F1F5F9] block mb-1">
                            Staff Note / Reason
                          </label>
                          <input
                            type="text"
                            value={grantReason}
                            onChange={(e) => setGrantReason(e.target.value)}
                            placeholder="e.g. Center offline payment"
                            className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-[#F1F5F9]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsGrantModalOpen(false)}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-[#0F172A] dark:text-[#F1F5F9] font-bold text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isGranting}
                          className="px-4 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                        >
                          {isGranting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
                          <span>Confirm Grant</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Enrolled Courses Cards */}
                {student.enrolledCourseCodes && student.enrolledCourseCodes.length > 0 ? (
                  <div className="space-y-2.5">
                    {student.enrolledCourseCodes.map((code, idx) => {
                      const title = student.enrolledCourseTitles?.[idx] || `Masterclass (${code})`;
                      const matchingGrant = studentGrants.find((g) => g.courseId === code || g.courseTitle === title);
                      const isExpired = matchingGrant ? isExpiredIST(matchingGrant.endsAt) : false;

                      return (
                        <div
                          key={code + idx}
                          className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-[#0F172A] dark:text-[#F1F5F9] truncate">
                                {title}
                              </h4>
                              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                                Code: <span className="font-mono">{code}</span>
                                {matchingGrant && (
                                  <> • Valid until {formatIST(matchingGrant.endsAt, { dateOnly: true })}</>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isExpired ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                Expired
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                Active Access
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                      No courses currently enrolled. Click &quot;Grant Course Access&quot; above to authorize an admission.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Support Tickets */}
            {activeTab === "tickets" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                  Support Tickets by Student ({studentTickets.length})
                </h3>

                {studentTickets.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                      No support tickets raised by this student yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {studentTickets.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            {t.category || "General Query"}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                              t.status === "Resolved"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                : t.status === "In Progress"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            ● {t.status || "Open"}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                          {t.subject || "Support Query"}
                        </h4>
                        <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] line-clamp-2">
                          {t.lastMessage || "No message body"}
                        </p>
                        <div className="flex justify-end pt-1">
                          <a
                            href="/admin/messages"
                            className="text-[11px] font-bold text-[#2563EB] dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <span>Open in Desk</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
              Registered: {student.joinedAt ? formatIST(student.joinedAt, { dateOnly: true }) : "Active Student"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-[#0F172A] dark:text-[#F1F5F9] font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Close Drawer
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
