"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { StudentRecord, StaffUser } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffStudents,
  sendInAppNotification,
  getStaffCourses,
  logStaffAction,
} from "@/lib/staffStore";
import { exportStudentsToExcel } from "@/lib/excelExporter";
import { createStudentFuzzySearch } from "@/lib/fuzzySearch";

export default function StudentFinderPage() {
  const [currentStaff, setCurrentStaff] = useState<StaffUser>(getCurrentStaff());
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [talukaFilter, setTalukaFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState<"all" | "0-25" | "26-75" | "76-99" | "100">("all");

  // 360 Drawer State
  const [drawerStudent, setDrawerStudent] = useState<StudentRecord | null>(null);

  // In-App Notification Modal State (Strictly In-App, NO WhatsApp)
  const [notifyStudent, setNotifyStudent] = useState<StudentRecord | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifySuccess, setNotifySuccess] = useState(false);

  const courses = getStaffCourses();

  const reload = () => {
    setCurrentStaff(getCurrentStaff());
    setStudents(getStaffStudents());
  };

  useEffect(() => {
    reload();
    window.addEventListener("mma_staff_changed", reload);
    return () => window.removeEventListener("mma_staff_changed", reload);
  }, []);

  const isMainAdmin = currentStaff.role === "main_admin";

  // Distinct Filter Options
  const distinctDistricts = Array.from(new Set(students.map((s) => s.district).filter(Boolean)));
  const distinctTalukas = Array.from(new Set(students.map((s) => s.taluka).filter(Boolean))) as string[];
  const distinctSchools = Array.from(new Set(students.map((s) => s.school).filter(Boolean))) as string[];

  // Open 360 Drawer and Log to audit_log
  const handleOpen360Drawer = (student: StudentRecord) => {
    setDrawerStudent(student);
    // Mandatory requirement: log every 360 view to audit_log
    logStaffAction(
      "STUDENT_360_VIEW",
      "student",
      student.id,
      student.name,
      `Staff (${currentStaff.role}) viewed 360 profile of ${student.name} (${student.phone}, ${student.district})`
    );
  };

  // Open Notification Modal
  const handleOpenNotify = (student: StudentRecord) => {
    setNotifyStudent(student);
    setNotifTitle("Study Routine Reminder");
    setNotifMessage(`Namaskar ${student.name.split(" ")[0]}, your next video lesson is waiting in your MindMaster library!`);
    setNotifySuccess(false);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyStudent || !notifTitle.trim() || !notifMessage.trim()) return;

    sendInAppNotification(notifyStudent.id, notifTitle.trim(), notifMessage.trim());
    setNotifySuccess(true);
    setTimeout(() => {
      setNotifyStudent(null);
      setNotifySuccess(false);
    }, 1400);
  };

  // 1-Click Excel Export
  const handleExportExcel = () => {
    exportStudentsToExcel(
      filteredStudents.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        district: s.district || "Maharashtra",
        school: s.school || "N/A",
        enrolledCourses: s.enrolledCourseCodes.join(", ") || "None",
        totalPaid: (s as any).totalPaidPaise
          ? `₹${Math.round((s as any).totalPaidPaise / 100)}`
          : s.enrolledCourseCodes.length > 0
          ? "Paid Enrolled"
          : "₹0",
        joinedDate: s.joinedAt || "Recent",
        status: s.status || "Active",
      }))
    );
  };

  // Filter students with Typo-Tolerant Fuzzy Search (Fuse.js)
  const searchMatchedStudents = React.useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return students;
    const fuse = createStudentFuzzySearch(students);
    const results = fuse.search(q);
    if (results.length > 0) {
      return results.map((r) => r.item);
    }
    return students.filter((s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.phone.includes(q) ||
      s.email.toLowerCase().includes(q.toLowerCase()) ||
      (s.school && s.school.toLowerCase().includes(q.toLowerCase()))
    );
  }, [students, searchQuery]);

  const filteredStudents = searchMatchedStudents.filter((s) => {
    const matchesDistrict =
      districtFilter === "all" || s.district.toLowerCase() === districtFilter.toLowerCase();

    const matchesTaluka =
      talukaFilter === "all" || (s.taluka && s.taluka.toLowerCase() === talukaFilter.toLowerCase());

    const matchesSchool =
      schoolFilter === "all" || (s.school && s.school.toLowerCase() === schoolFilter.toLowerCase());

    const matchesCourse =
      courseFilter === "all" ||
      s.enrolledCourseCodes.includes(courseFilter) ||
      s.enrolledCourseCodes.some((c) => c.includes(courseFilter));

    // Progress Filter
    let matchesProgress = true;
    const totalLessons = s.totalLessonsCount || 20;
    const pct = Math.round((s.completedLessonsCount / totalLessons) * 100);
    if (progressFilter === "0-25") matchesProgress = pct >= 0 && pct <= 25;
    else if (progressFilter === "26-75") matchesProgress = pct > 25 && pct <= 75;
    else if (progressFilter === "76-99") matchesProgress = pct > 75 && pct < 100;
    else if (progressFilter === "100") matchesProgress = pct >= 100;

    return matchesDistrict && matchesTaluka && matchesSchool && matchesCourse && matchesProgress;
  });

  return (
    <PermissionGuard permission="students.view">
      <AdminShell>
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading tracking-tight">
                  Student Finder & 360 Telemetrics
                </h1>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF]">
                  students.view
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Lookup enrolled learners across Maharashtra, inspect watch duration, open 360 profile, and trigger direct In-App notifications.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>📊</span>
                <span>Export Excel (.xlsx)</span>
              </button>

              <div className="flex items-center gap-2 bg-[#F5F7FF] border border-[#E4E8F8] px-3.5 py-2 rounded-full text-xs">
                <span>🔔</span>
                <span className="font-bold text-[#0E1B3D]">Direct In-App & WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Filters Bar: Search, District, Taluka, School, Course, Progress */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8A94A6]">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, school, email..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-full text-xs text-[#0E1B3D] placeholder-[#8A94A6] focus:outline-none focus:ring-2 focus:ring-[#0B57D0] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A94A6] hover:text-[#0E1B3D]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Counter */}
              <div className="text-xs font-semibold text-[#5A6478] flex items-center gap-2 self-start md:self-auto">
                <span>Showing</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F5F7FF] text-[#0E1B3D] font-bold border border-[#E4E8F8]">
                  {filteredStudents.length} of {students.length} students
                </span>
              </div>
            </div>

            {/* Dropdown Selectors: District, Taluka, School, Course */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E4E8F8]">
              {/* District Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                  District:
                </label>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Districts ({distinctDistricts.length})</option>
                  {distinctDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Taluka Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                  Taluka:
                </label>
                <select
                  value={talukaFilter}
                  onChange={(e) => setTalukaFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Talukas ({distinctTalukas.length})</option>
                  {distinctTalukas.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* School Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                  School / College:
                </label>
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Schools ({distinctSchools.length})</option>
                  {distinctSchools.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                  Enrolled Course:
                </label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Progress Chips Row (Admin Only) */}
            {isMainAdmin && (
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#E4E8F8]">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                  Progress:
                </span>
                {[
                  { key: "all", label: "All Progress" },
                  { key: "0-25", label: "0-25% Starter" },
                  { key: "26-75", label: "26-75% In Progress" },
                  { key: "76-99", label: "76-99% Advanced" },
                  { key: "100", label: "🏆 100% Completed" },
                ].map((chip) => {
                  const isActive = progressFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      onClick={() => setProgressFilter(chip.key as any)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#0B57D0] text-white shadow-xs"
                          : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EEF4FF] hover:text-[#0B57D0] border border-[#E4E8F8]"
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm overflow-hidden">
            {filteredStudents.length === 0 ? (
              <div className="py-14 text-center">
                <span className="text-4xl">🎓</span>
                <h3 className="text-base font-bold text-[#0E1B3D] mt-2">No students match your criteria</h3>
                <p className="text-xs text-[#5A6478] mt-1">
                  Try adjusting the district, taluka, school, or progress filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E8F8] text-[#8A94A6] uppercase tracking-wider font-semibold">
                      <th className="pb-3.5 pl-3">Student Name</th>
                      <th className="pb-3.5">Region & School</th>
                      <th className="pb-3.5">Enrolled Courses</th>
                      {isMainAdmin && <th className="pb-3.5">Watch Telemetrics</th>}
                      <th className="pb-3.5">Status</th>
                      <th className="pb-3.5 text-right pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E8F8]">
                    {filteredStudents.map((s) => {
                      const totalLessons = s.totalLessonsCount || 20;
                      const progressPct = Math.min(100, Math.round((s.completedLessonsCount / totalLessons) * 100));

                      return (
                        <tr key={s.id} className="hover:bg-[#F9FAFF] transition-colors group">
                          {/* Student Name */}
                          <td className="py-4 pl-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#E6F0FF] text-[#0B57D0] font-bold flex items-center justify-center text-xs">
                                {s.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[#0E1B3D] text-xs">
                                  {s.name}
                                </p>
                                <p className="text-[#5A6478] font-mono text-[11px] mt-0.5">
                                  {s.phone}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Region & School */}
                          <td className="py-4">
                            <p className="font-bold text-[#0E1B3D] text-xs">
                              {s.district} {s.taluka ? `• ${s.taluka}` : ""}
                            </p>
                            <p className="text-[#5A6478] text-[11px] truncate max-w-xs mt-0.5">
                              {s.school || "School Not Specified"}
                            </p>
                          </td>

                          {/* Enrolled Courses */}
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {s.enrolledCourseCodes.map((code) => (
                                <span
                                  key={code}
                                  className="px-2 py-0.5 bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF] rounded-md font-mono text-[10px] font-bold"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Watch Progress (Main Admin Only) */}
                          {isMainAdmin && (
                            <td className="py-4">
                              <div className="w-36 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-[#0E1B3D]">{s.completedLessonsCount} / {totalLessons} done</span>
                                  <span className="text-[#0B57D0]">{progressPct}%</span>
                                </div>
                                <div className="w-full bg-[#E4E8F8] h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#0B57D0] rounded-full transition-all"
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-[#8A94A6]">
                                  {Math.floor(s.totalWatchSec / 3600)}h {Math.floor((s.totalWatchSec % 3600) / 60)}m watch time
                                </p>
                              </div>
                            </td>
                          )}

                          {/* Status */}
                          <td className="py-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ● Active
                            </span>
                          </td>

                          {/* Actions: 360 Profile + Send Alert */}
                          <td className="py-4 text-right pr-3">
                            <div className="flex items-center justify-end gap-2">
                              {/* Direct WhatsApp Button */}
                              <a
                                href={`https://wa.me/91${s.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(`Namaskar ${s.name}, Prashant Dhumal Sir / MindMaster Academy kadun sandesh:`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 bg-[#E8F8F2] hover:bg-[#D5F2E6] border border-[#C6ECD9] text-[#0A8554] rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Chat on WhatsApp"
                              >
                                <span>💬</span> WhatsApp
                              </a>

                              {/* 360 Profile Drawer Button */}
                              <button
                                onClick={() => handleOpen360Drawer(s)}
                                className="px-3 py-1.5 bg-[#EEF4FF] hover:bg-[#DDEBFF] border border-[#D0E2FF] text-[#0B57D0] rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>🔍</span> 360 View
                              </button>

                              {/* Direct Alert */}
                              <button
                                onClick={() => handleOpenNotify(s)}
                                className="px-3 py-1.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] border border-[#E4E8F8] text-[#5A6478] hover:text-[#0E1B3D] rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                                title="Send in-app notification"
                              >
                                <span>🔔</span> Alert
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 360 STUDENT TELEMETRICS DRAWER */}
          {/* ========================================================= */}
          {drawerStudent && (
            <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                onClick={() => setDrawerStudent(null)}
              />

              <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
                <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-[#E4E8F8] flex items-center justify-between bg-[#FAFBFD]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] text-[#0B57D0] font-black flex items-center justify-center text-base border border-[#D0E2FF]">
                        {drawerStudent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-[#0E1B3D] font-heading">
                            {drawerStudent.name}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ● Active
                          </span>
                        </div>
                        <p className="text-xs text-[#5A6478] mt-0.5">
                          Enrolled on {drawerStudent.joinedAt} • Active {drawerStudent.lastActiveAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* WHATSAPP CHIP */}
                      <a
                        href={`https://wa.me/91${drawerStudent.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(`Namaskar ${drawerStudent.name}, Prashant Dhumal Sir / MindMaster Academy kadun sandesh:`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-[#E8F8F2] hover:bg-[#D5F2E6] border border-[#C6ECD9] text-[#0A8554] rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>💬</span> WhatsApp
                      </a>

                      {/* CALL CHIP */}
                      <a
                        href={`tel:${drawerStudent.phone}`}
                        className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>📞</span> Call Student
                      </a>

                      <button
                        onClick={() => setDrawerStudent(null)}
                        className="w-8 h-8 rounded-full bg-white border border-[#E4E8F8] flex items-center justify-center text-sm text-[#5A6478] hover:bg-slate-100 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Drawer Body Content */}
                  <div className="p-6 space-y-6 flex-1">
                    {/* 1. Registration Details Card */}
                    <div className="bg-[#FAFBFD] border border-[#E4E8F8] rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0E1B3D] flex items-center gap-1.5">
                        <span>📋</span> Registration & Institutional Profile
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-bold">Mobile Phone</span>
                          <p className="font-mono font-bold text-[#0E1B3D] mt-0.5">{drawerStudent.phone}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-bold">Email Address</span>
                          <p className="font-semibold text-[#0E1B3D] mt-0.5 truncate">{drawerStudent.email}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-bold">District & Taluka</span>
                          <p className="font-semibold text-[#0E1B3D] mt-0.5">{drawerStudent.district}, {drawerStudent.taluka || "N/A"}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-[#8A94A6] uppercase font-bold">School / Academic Wing</span>
                          <p className="font-semibold text-[#0E1B3D] mt-0.5">{drawerStudent.school || "MindMaster Open Cohort"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-bold">Standard / Segment</span>
                          <p className="font-semibold text-[#0B57D0] mt-0.5">{drawerStudent.standard || "General Learner"}</p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Courses Taken with Expiry Chips & Progress Bars */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0E1B3D] flex items-center gap-1.5">
                        <span>📚</span> Enrolled Courses & 3-Month Access Status
                      </h3>

                      {(!drawerStudent.coursesTaken || drawerStudent.coursesTaken.length === 0) ? (
                        <div className="p-3 bg-[#F5F7FF] rounded-xl text-xs text-[#5A6478]">
                          {drawerStudent.enrolledCourseTitles.join(", ")}
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {drawerStudent.coursesTaken.map((course) => (
                            <div
                              key={course.courseId}
                              className="p-4 bg-white border border-[#E4E8F8] rounded-2xl shadow-xs space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs bg-[#EEF4FF] text-[#0B57D0] px-2 py-0.5 rounded border border-[#D0E2FF]">
                                    {course.courseCode}
                                  </span>
                                  <span className="font-bold text-xs text-[#0E1B3D]">
                                    {course.courseTitle}
                                  </span>
                                </div>

                                {/* Expiry Chip */}
                                {course.isExpired ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                    ❌ Access Expired
                                  </span>
                                ) : course.daysLeft <= 7 ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                    ⚠️ Expires in {course.daysLeft} days
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ⏳ {course.daysLeft} days access left
                                  </span>
                                )}
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-[#5A6478]">Course Completion:</span>
                                  <span className="font-bold text-[#0E1B3D]">
                                    {course.completedLessons} / {course.totalLessons} lessons ({course.progressPct}%)
                                  </span>
                                </div>
                                <div className="w-full bg-[#E4E8F8] h-2 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#0B57D0] rounded-full transition-all"
                                    style={{ width: `${course.progressPct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. ADMIN-ONLY PER-LESSON WATCH TRACKING SECTION */}
                    {isMainAdmin ? (
                      <div className="space-y-3 pt-2 border-t border-[#E4E8F8]">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0E1B3D] flex items-center gap-1.5">
                            <span>⏱️</span> Per-Lesson Watch Telemetry (Admin Only)
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            ⚡ Founder Clearance
                          </span>
                        </div>

                        {(!drawerStudent.lessonWatches || drawerStudent.lessonWatches.length === 0) ? (
                          <div className="p-4 bg-[#F5F7FF] rounded-2xl text-xs text-[#5A6478] text-center">
                            No individual lecture watch events recorded for this learner yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {drawerStudent.lessonWatches.map((w) => (
                              <div
                                key={w.lessonId}
                                className="p-3 bg-white border border-[#E4E8F8] rounded-xl flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] font-bold text-[#0B57D0]">
                                      {w.courseCode}
                                    </span>
                                    <span className="font-semibold text-[#0E1B3D]">{w.lessonTitle}</span>
                                  </div>
                                  <p className="text-[10px] text-[#5A6478] mt-0.5">
                                    Watched {Math.floor(w.watchedSec / 60)}m of {Math.floor(w.durationSec / 60)}m • {w.lastWatchedAt}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    w.isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {w.completionPct}% {w.isCompleted ? "Completed" : "Partial"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                        <span>🔒</span>
                        <span>Individual lecture-level telemetric playback history is restricted to Main Admin.</span>
                      </div>
                    )}

                    {/* 4. Activity Rows */}
                    <div className="space-y-3 pt-2 border-t border-[#E4E8F8]">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0E1B3D] flex items-center gap-1.5">
                        <span>⚡</span> Recent Learning & Portal Activity
                      </h3>

                      {(!drawerStudent.recentActivity || drawerStudent.recentActivity.length === 0) ? (
                        <div className="p-4 bg-[#F5F7FF] rounded-2xl text-xs text-[#5A6478] text-center">
                          Student has been actively enrolled. No custom activity triggers recorded.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {drawerStudent.recentActivity.map((act) => (
                            <div
                              key={act.id}
                              className="p-3 bg-[#FAFBFD] border border-[#E4E8F8] rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-[#0B57D0]"></span>
                                <div>
                                  <p className="font-bold text-[#0E1B3D] text-[11px]">{act.action}</p>
                                  <p className="text-[10px] text-[#5A6478]">{act.description}</p>
                                </div>
                              </div>
                              <span className="font-mono text-[10px] text-[#8A94A6]">{act.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-4 border-t border-[#E4E8F8] bg-[#FAFBFD] flex items-center justify-between">
                    <span className="text-[11px] text-[#8A94A6]">
                      Audit Logged: <code className="text-[#0B57D0]">STUDENT_360_VIEW</code>
                    </span>
                    <button
                      onClick={() => setDrawerStudent(null)}
                      className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Close 360 View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SEND IN-APP NOTIFICATION MODAL (NO WHATSAPP) */}
          {/* ========================================================= */}
          {notifyStudent && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-[#E4E8F8] max-w-lg w-full p-6 md:p-8 shadow-2xl animate-fadeIn space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E8F8]">
                  <div>
                    <h3 className="text-lg font-bold text-[#0E1B3D] font-heading flex items-center gap-2">
                      <span>🔔</span> Send In-App Notification
                    </h3>
                    <p className="text-xs text-[#5A6478] mt-0.5">
                      Target: <span className="font-bold text-[#0E1B3D]">{notifyStudent.name}</span> ({notifyStudent.phone})
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifyStudent(null)}
                    className="w-8 h-8 rounded-full bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#5A6478] flex items-center justify-center text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {notifySuccess ? (
                  <div className="py-8 text-center space-y-2 animate-fadeIn">
                    <span className="text-4xl">✅</span>
                    <h4 className="text-base font-bold text-[#0E1B3D]">Notification Dispatched!</h4>
                    <p className="text-xs text-[#5A6478]">
                      Delivered directly to {notifyStudent.name}'s in-app notification center.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendNotification} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                        Notification Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="e.g. Keep Going! Lesson Drill Ready"
                        className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                        Notification Message *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        placeholder="Type personalized student alert..."
                        className="w-full px-3.5 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                    </div>

                    <div className="p-3 bg-[#FAFBFD] border border-[#E4E8F8] rounded-xl text-[11px] text-[#5A6478]">
                      🔒 In-App push notifications deliver directly to the student portal on next app open without WhatsApp or third-party SMS costs.
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E8F8]">
                      <button
                        type="button"
                        onClick={() => setNotifyStudent(null)}
                        className="px-4 py-2 rounded-full border border-[#E4E8F8] text-xs font-bold text-[#5A6478] hover:bg-[#F5F7FF] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Send In-App Alert →
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
