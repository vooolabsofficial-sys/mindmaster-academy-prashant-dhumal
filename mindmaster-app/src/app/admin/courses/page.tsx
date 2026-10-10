"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { Course, TargetSegmentConfig, StaffUser, HeaderTint } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffCourses,
  saveStaffCourse,
  logStaffAction,
} from "@/lib/staffStore";

const PASTEL_TINTS: { key: HeaderTint; label: string; bg: string; border: string; dot: string }[] = [
  { key: "mint",     label: "Mint",     bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-400" },
  { key: "sky",      label: "Sky",      bg: "bg-sky-50",      border: "border-sky-200",     dot: "bg-sky-400" },
  { key: "peach",    label: "Peach",    bg: "bg-orange-50",   border: "border-orange-200",  dot: "bg-orange-400" },
  { key: "lavender", label: "Lavender", bg: "bg-purple-50",   border: "border-purple-200",  dot: "bg-purple-400" },
  { key: "pink",     label: "Pink",     bg: "bg-pink-50",     border: "border-pink-200",    dot: "bg-pink-400" },
];

const TINT_ICON: Record<HeaderTint, string> = {
  mint: "🟢",
  sky: "🔵",
  peach: "🟠",
  lavender: "🟣",
  pink: "🩷",
  locked: "🔒",
};

export default function CourseManagerPage() {
  const pathname = usePathname();
  const [courses, setCourses] = useState<Course[]>([]);
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "scheduled" | "closed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "free" | "paid">("all");

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(pathname?.includes("builder"));
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form Fields State
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTint, setFormTint] = useState<HeaderTint>("sky");
  const [isFree, setIsFree] = useState(false);
  const [formPrice, setFormPrice] = useState(999);
  const [accessMonths, setAccessMonths] = useState(3);
  const [isLive, setIsLive] = useState(true);
  const [publishAt, setPublishAt] = useState("");
  const [removeAt, setRemoveAt] = useState("");

  // Target Segment Builder State
  const [segmentType, setSegmentType] = useState<TargetSegmentConfig["type"]>("all");
  const [segmentDistrict, setSegmentDistrict] = useState("Pune");
  const [segmentTaluka, setSegmentTaluka] = useState("Haveli");
  const [segmentSchool, setSegmentSchool] = useState("ZP High School");
  const [segmentCoursePrereq, setSegmentCoursePrereq] = useState("MM-01");

  // Standards (Class 5 to 12 + Open to All) State
  const [standards, setStandards] = useState<number[]>([]);

  const handleToggleAllStandards = () => {
    setStandards([]);
  };

  const handleToggleStandard = (std: number) => {
    setStandards((prev) => {
      if (prev.includes(std)) {
        return prev.filter((s) => s !== std);
      } else {
        return [...prev, std].sort((a, b) => a - b);
      }
    });
  };

  const reload = () => {
    setCourses(getStaffCourses());
    setStaff(getCurrentStaff());
  };

  useEffect(() => {
    reload();
    window.addEventListener("mma_staff_changed", reload);
    return () => window.removeEventListener("mma_staff_changed", reload);
  }, []);

  // Open Drawer for New Course
  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormCode(`MM-0${courses.length + 1}`);
    setFormTitle("");
    setFormDescription("");
    setFormTint("sky");
    setIsFree(false);
    setFormPrice(999);
    setAccessMonths(3);
    setIsLive(true);
    const now = new Date();
    setPublishAt(now.toISOString().slice(0, 16));
    setRemoveAt("");
    setSegmentType("all");
    setSegmentDistrict("Pune");
    setSegmentTaluka("Haveli");
    setSegmentSchool("ZP High School");
    setSegmentCoursePrereq("MM-01");
    setStandards([]);
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleOpenEdit = (c: Course) => {
    setEditingCourse(c);
    setFormCode(c.code);
    setFormTitle(c.title);
    setFormDescription(c.description || "");
    setFormTint(c.headerTint || "sky");
    setIsFree(c.isFree || c.pricePaise === 0);
    setFormPrice(Math.round(c.pricePaise / 100));
    setAccessMonths(c.accessMonths || 3);
    setIsLive(c.status === "live");
    setPublishAt(c.publishAt ? c.publishAt.slice(0, 16) : "");
    setRemoveAt(c.removeAt ? c.removeAt.slice(0, 16) : "");

    if (c.targetSegmentConfig) {
      setSegmentType(c.targetSegmentConfig.type);
      setSegmentDistrict(c.targetSegmentConfig.district || "Pune");
      setSegmentTaluka(c.targetSegmentConfig.taluka || "Haveli");
      setSegmentSchool(c.targetSegmentConfig.school || "");
      setSegmentCoursePrereq(c.targetSegmentConfig.courseCode || "MM-01");
    } else {
      setSegmentType("all");
    }

    setStandards(c.standards && Array.isArray(c.standards) ? [...c.standards] : []);

    setIsDrawerOpen(true);
  };

  // Save Course Handler
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCode.trim()) return;

    let computedStatus: Course["status"] = isLive ? "live" : "closed";
    if (publishAt) {
      const pubTime = new Date(publishAt).getTime();
      if (pubTime > Date.now() && isLive) {
        computedStatus = "scheduled";
      }
    }
    if (removeAt) {
      const remTime = new Date(removeAt).getTime();
      if (remTime <= Date.now()) {
        computedStatus = "removed";
      }
    }

    const targetConfig: TargetSegmentConfig = {
      type: segmentType,
      district: segmentType === "district" ? segmentDistrict : undefined,
      taluka: segmentType === "taluka" ? segmentTaluka : undefined,
      school: segmentType === "school" ? segmentSchool : undefined,
      courseCode: segmentType === "owners_of_course" ? segmentCoursePrereq : undefined,
    };

    const courseData: Course = {
      id: editingCourse ? editingCourse.id : `c-${Date.now()}`,
      code: formCode.trim().toUpperCase(),
      title: formTitle.trim(),
      titleMr: editingCourse ? editingCourse.titleMr : "",
      subtitle: editingCourse ? editingCourse.subtitle : "",
      description: formDescription.trim() || "MindMaster Certified Video Curriculum.",
      headerTint: formTint,
      pricePaise: isFree ? 0 : formPrice * 100,
      originalPricePaise: isFree ? 0 : formPrice * 100 * 2,
      isFree,
      accessMonths,
      status: computedStatus,
      badgeText: computedStatus === "scheduled" ? "UPCOMING" : isFree ? "FREE" : "POPULAR",
      badgeType: isFree ? "free" : "popular",
      imageSrc: editingCourse ? editingCourse.imageSrc : "/images/course-card.png",
      instructorName: "Prashant Dhumal",
      instructorTitle: "Memory Record Holder & Speed Maths Trainer",
      totalStudents: editingCourse ? editingCourse.totalStudents : 0,
      rating: editingCourse ? editingCourse.rating : 4.9,
      ratingCount: editingCourse ? editingCourse.ratingCount : 120,
      lessonsCount: editingCourse ? editingCourse.lessonsCount : 12,
      totalDurationHours: editingCourse ? editingCourse.totalDurationHours : 6.5,
      category: "all",
      features: editingCourse ? editingCourse.features : ["Video Lectures", "Course PDF Notes", "Completion Certificate"],
      targetSegment: "general",
      targetSegmentConfig: targetConfig,
      standards: standards.length > 0 ? [...standards].sort((a, b) => a - b) : undefined,
      publishAt: publishAt ? new Date(publishAt).toISOString() : new Date().toISOString(),
      removeAt: removeAt ? new Date(removeAt).toISOString() : null,
    };

    saveStaffCourse(courseData);

    logStaffAction(
      editingCourse ? "COURSE_UPDATE" : "COURSE_CREATE",
      "course",
      courseData.id,
      courseData.title,
      `${editingCourse ? "Updated" : "Created"} course ${courseData.code} with segment ${segmentType}, access: ${accessMonths}m, price: ₹${formPrice}`
    );

    setIsDrawerOpen(false);
    reload();
  };

  // Filter Courses Logic
  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(q) ||
      (c.titleMr && c.titleMr.toLowerCase().includes(q)) ||
      c.code.toLowerCase().includes(q);

    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "live") matchesStatus = c.status === "live";
      else if (statusFilter === "scheduled") matchesStatus = c.status === "scheduled" || c.status === "upcoming";
      else if (statusFilter === "closed") matchesStatus = c.status === "closed" || c.status === "removed";
    }

    let matchesType = true;
    if (typeFilter !== "all") {
      if (typeFilter === "free") matchesType = c.isFree || c.pricePaise === 0;
      else if (typeFilter === "paid") matchesType = !c.isFree && c.pricePaise > 0;
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <PermissionGuard permission="courses.manage">
      <AdminShell>
        <div className="space-y-6 font-sans">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
                Courses
              </h2>
              <p className="text-xs text-[#5A6478] mt-1">
                Configure curriculum offerings, target segments, visibility schedules, and course fee structures.
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-full shadow-md transition-all"
            >
              New Course +
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-4">
            <input
              type="text"
              placeholder="Search by title, code (e.g. MM-01)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl focus:outline-none focus:border-[#0B57D0] text-[#0E1B3D]"
            />

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                  Status:
                </span>
                {(["all", "live", "scheduled", "closed"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                      statusFilter === st
                        ? "bg-[#0B57D0] text-white shadow-sm"
                        : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EEF4FF] hover:text-[#0B57D0]"
                    }`}
                  >
                    {st === "all" ? "All" : st}
                  </button>
                ))}
              </div>

              {/* Type Chips */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                  Type:
                </span>
                {(["all", "free", "paid"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                      typeFilter === t
                        ? "bg-[#0E1B3D] text-white shadow-sm"
                        : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EEF4FF] hover:text-[#0E1B3D]"
                    }`}
                  >
                    {t === "all" ? "All" : t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Courses Rows */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] shadow-sm overflow-hidden">
            <div className="p-4 bg-[#FAFBFD] border-b border-[#E4E8F8] flex items-center justify-between text-xs">
              <span className="font-bold text-[#0E1B3D]">
                Showing {filteredCourses.length} Courses
              </span>
              <span className="text-[11px] text-[#8A94A6]">
                Visibility: Live AND between publish_at &amp; remove_at AND segment match
              </span>
            </div>

            <div className="divide-y divide-[#E4E8F8]">
              {filteredCourses.map((course) => {
                const targetCfg = course.targetSegmentConfig;
                let targetLabel = "All Students";
                if (targetCfg?.type === "district") targetLabel = `District: ${targetCfg.district}`;
                else if (targetCfg?.type === "taluka") targetLabel = `Taluka: ${targetCfg.taluka}`;
                else if (targetCfg?.type === "school") targetLabel = `School: ${targetCfg.school}`;
                else if (targetCfg?.type === "owners_of_course") targetLabel = `Owners: ${targetCfg.courseCode || "Prereq"}`;

                const tintIcon = TINT_ICON[course.headerTint] || "📘";
                const tintCfg = PASTEL_TINTS.find((t) => t.key === course.headerTint);

                return (
                  <div
                    key={course.id}
                    className="p-5 hover:bg-[#FAFBFD] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Pastel Icon + Course Details */}
                    <div className="flex items-start gap-4 max-w-xl">
                      {/* Pastel tint icon */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                          tintCfg ? `${tintCfg.bg} ${tintCfg.border} border` : "bg-sky-50 border border-sky-200"
                        }`}
                      >
                        {tintIcon}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-[#0E1B3D]">
                            {course.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-50 text-[#0B57D0] border border-blue-200">
                            {course.code}
                          </span>
                        </div>

                        {/* Meta Chips Row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {/* Price or FREE */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            course.isFree || course.pricePaise === 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}>
                            {course.isFree || course.pricePaise === 0
                              ? "FREE"
                              : `₹${Math.round(course.pricePaise / 100)}`}
                          </span>

                          {/* Target Segment Chip */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            🎯 {targetLabel}
                          </span>

                          {/* Standards Chip */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            🎓 {course.standards && course.standards.length > 0
                              ? (course.standards.length === 8
                                  ? "Class 5th - 12th"
                                  : `${course.standards.map((s: number) => `${s}th`).join(", ")} Std`)
                              : "All Standards"}
                          </span>

                          {/* Publish Date */}
                          <span className="text-[11px] text-[#5A6478]">
                            📅 {course.publishAt ? course.publishAt.slice(0, 10) : "Immediate"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Chip & EDIT Icon */}
                    <div className="flex items-center gap-3 self-end md:self-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          course.status === "live"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : course.status === "scheduled" || course.status === "upcoming"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : course.status === "closed"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        ● {course.status}
                      </span>

                      {/* Edit Icon Only — no delete anywhere */}
                      <button
                        onClick={() => handleOpenEdit(course)}
                        className="w-9 h-9 rounded-xl bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] border border-[#E4E8F8] flex items-center justify-center transition-colors"
                        title="Edit course"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Note */}
            <div className="p-4 bg-[#FAFBFD] border-t border-[#E4E8F8]">
              <p className="text-[11px] text-[#8A94A6] text-center font-medium">
                🔒 Deleting courses is a Main Admin action.
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SLIDE-OVER DRAWER FORM */}
          {/* ========================================================= */}
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsDrawerOpen(false)}
              />

              <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
                <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-[#E4E8F8] flex items-center justify-between bg-[#FAFBFD]">
                    <div>
                      <h2 className="text-lg font-bold text-[#0E1B3D]">
                        {editingCourse ? `Edit Course: ${editingCourse.code}` : "Create New Course"}
                      </h2>
                      <p className="text-xs text-[#5A6478] mt-0.5">
                        Set targeting rules, validity windows, and pricing tier.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-8 h-8 rounded-full bg-white border border-[#E4E8F8] flex items-center justify-center text-sm text-[#5A6478] hover:bg-slate-100"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Drawer Form Body */}
                  <form onSubmit={handleSaveCourse} className="p-6 space-y-5 text-xs">
                    {/* Title */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. Vedic Maths Speed Foundation"
                        className="w-full px-3 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs focus:outline-none focus:border-[#0B57D0]"
                      />
                    </div>

                    {/* Code (Auto) */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">Code <span className="text-[#8A94A6] font-normal">(auto-generated)</span></label>
                      <input
                        type="text"
                        required
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#F0F2FA] border border-[#E4E8F8] rounded-xl font-mono text-xs focus:outline-none text-[#5A6478]"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">Description</label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Short course description for students..."
                        rows={3}
                        className="w-full px-3 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs focus:outline-none focus:border-[#0B57D0] resize-none"
                      />
                    </div>

                    {/* Pastel Color Picker */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-2">Course Color</label>
                      <div className="flex flex-wrap gap-2">
                        {PASTEL_TINTS.map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setFormTint(t.key)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                              formTint === t.key
                                ? `${t.bg} ${t.border} border-2 shadow-sm ring-2 ring-offset-1 ring-blue-300`
                                : `bg-white border border-[#E4E8F8] hover:${t.bg}`
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${t.dot}`} />
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* TARGET SEGMENT BUILDER */}
                    <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200/60 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-[#0E1B3D] flex items-center gap-1.5">
                          <span>🎯</span> Target Segment Builder
                        </label>
                        <span className="text-[10px] text-[#0B57D0] font-bold uppercase">
                          Segment Matching
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { key: "all", label: "All Students" },
                          { key: "district", label: "District" },
                          { key: "taluka", label: "Taluka" },
                          { key: "school", label: "School" },
                          { key: "owners_of_course", label: "Owners of Course" },
                        ].map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => setSegmentType(s.key as TargetSegmentConfig["type"])}
                            className={`px-3 py-1.5 rounded-full font-bold text-[11px] transition-all ${
                              segmentType === s.key
                                ? "bg-[#0B57D0] text-white shadow-sm"
                                : "bg-white text-[#5A6478] border border-[#E4E8F8] hover:border-[#0B57D0]"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      {segmentType === "district" && (
                        <div className="pt-2">
                          <label className="block font-semibold text-[#5A6478] mb-1">Target District</label>
                          <input
                            type="text"
                            value={segmentDistrict}
                            onChange={(e) => setSegmentDistrict(e.target.value)}
                            placeholder="e.g. Pune, Satara, Kolhapur"
                            className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs focus:outline-none"
                          />
                        </div>
                      )}

                      {segmentType === "taluka" && (
                        <div className="pt-2">
                          <label className="block font-semibold text-[#5A6478] mb-1">Target Taluka</label>
                          <input
                            type="text"
                            value={segmentTaluka}
                            onChange={(e) => setSegmentTaluka(e.target.value)}
                            placeholder="e.g. Haveli, Baramati, Shirur"
                            className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs focus:outline-none"
                          />
                        </div>
                      )}

                      {segmentType === "school" && (
                        <div className="pt-2">
                          <label className="block font-semibold text-[#5A6478] mb-1">Target School Name</label>
                          <input
                            type="text"
                            value={segmentSchool}
                            onChange={(e) => setSegmentSchool(e.target.value)}
                            placeholder="e.g. ZP High School, Narhe Model School"
                            className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs focus:outline-none"
                          />
                        </div>
                      )}

                      {segmentType === "owners_of_course" && (
                        <div className="pt-2">
                          <label className="block font-semibold text-[#5A6478] mb-1">Select Prerequisite Course Code</label>
                          <select
                            value={segmentCoursePrereq}
                            onChange={(e) => setSegmentCoursePrereq(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs focus:outline-none font-bold text-[#0E1B3D]"
                          >
                            <option value="MM-01">MM-01: Foundational Active Brain</option>
                            <option value="MM-02">MM-02: Vedic Maths Speed System</option>
                            <option value="MM-03">MM-03: School Memory Foundation</option>
                            <option value="MM-04">MM-04: Police Bharti Speed & GK</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* STANDARDS (CLASS 5 TO 12 + OPEN TO ALL) CHECKBOXES */}
                    <div className="p-4 bg-gradient-to-r from-indigo-50/40 to-blue-50/40 border border-indigo-200/60 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-[#0E1B3D] flex items-center gap-1.5 text-xs">
                          <span>🎓</span> Target Standards (Class 5 to 12)
                        </label>
                        <span className="text-[10px] text-[#0B57D0] font-bold">
                          {standards.length === 0 ? "Open to All" : `${standards.length} Selected`}
                        </span>
                      </div>

                      {/* All Standards Option */}
                      <div className="pt-0.5">
                        <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          standards.length === 0
                            ? "bg-[#0B57D0] text-white border-[#0B57D0] shadow-2xs"
                            : "bg-white text-[#5A6478] border-[#E4E8F8] hover:border-[#0B57D0]"
                        }`}>
                          <input
                            type="checkbox"
                            checked={standards.length === 0}
                            onChange={handleToggleAllStandards}
                            className="w-3.5 h-3.5 rounded accent-[#0B57D0]"
                          />
                          <span>Open to All (No Specific Standard)</span>
                        </label>
                      </div>

                      {/* Specific Standard Checkboxes 5 to 12 */}
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {[5, 6, 7, 8, 9, 10, 11, 12].map((std) => {
                          const isChecked = standards.includes(std);
                          return (
                            <label
                              key={std}
                              className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                isChecked
                                  ? "bg-blue-50 border-blue-400 text-[#0B57D0] font-bold shadow-2xs"
                                  : "bg-white border-[#E4E8F8] text-[#5A6478] hover:border-blue-200"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleStandard(std)}
                                className="w-3.5 h-3.5 rounded accent-[#0B57D0]"
                              />
                              <span>{std}th</span>
                            </label>
                          );
                        })}
                      </div>

                      <p className="text-[11px] text-[#5A6478]">
                        * Note: Leaving "Open to All" selected allows this course to be available to all learners and general tracks.
                      </p>
                    </div>

                    {/* Free / Paid Toggle & Price */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0E1B3D]">Pricing</span>
                        <button
                          type="button"
                          onClick={() => setIsFree(!isFree)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isFree ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isFree ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                      <span className={`text-[11px] font-bold ${isFree ? "text-emerald-700" : "text-[#5A6478]"}`}>
                        {isFree ? "Free Course" : "Paid Course"}
                      </span>

                      {!isFree && (
                        <div>
                          <label className="block font-semibold text-[#5A6478] mb-1">
                            Course Fee (in ₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-[#5A6478] font-bold">₹</span>
                            <input
                              type="number"
                              min={99}
                              value={formPrice}
                              onChange={(e) => setFormPrice(Number(e.target.value))}
                              className="w-full pl-8 pr-4 py-2 bg-white border border-[#E4E8F8] rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Publish & Remove Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1">Publish Date</label>
                        <input
                          type="datetime-local"
                          value={publishAt}
                          onChange={(e) => setPublishAt(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1">Auto-Remove Date</label>
                        <input
                          type="datetime-local"
                          value={removeAt}
                          onChange={(e) => setRemoveAt(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Access Months Stepper */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#0E1B3D] block">Access Months</span>
                        <span className="text-[11px] text-[#5A6478]">Student course validity</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAccessMonths((m) => Math.max(1, m - 1))}
                          className="w-8 h-8 rounded-full bg-white border border-[#E4E8F8] font-bold text-base hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm text-[#0E1B3D] w-12 text-center">
                          {accessMonths} mo
                        </span>
                        <button
                          type="button"
                          onClick={() => setAccessMonths((m) => Math.min(12, m + 1))}
                          className="w-8 h-8 rounded-full bg-white border border-[#E4E8F8] font-bold text-base hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Live Toggle */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#0E1B3D] block">Live Status</span>
                        <span className={`text-[11px] font-bold ${isLive ? "text-emerald-700" : "text-[#5A6478]"}`}>
                          {isLive ? "Published Live" : "Closed / Inactive"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsLive(!isLive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isLive ? "bg-[#0B57D0]" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isLive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Drawer Submit */}
                    <div className="pt-4 border-t border-[#E4E8F8] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="px-4 py-2.5 rounded-full border border-[#E4E8F8] text-[#5A6478] font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold shadow-md"
                      >
                        Save Course
                      </button>
                    </div>
                  </form>

                  {/* Grey note at bottom of drawer */}
                  <div className="px-6 py-3 bg-[#FAFBFD] border-t border-[#E4E8F8]">
                    <p className="text-[11px] text-[#8A94A6] text-center">
                      🔒 Deleting courses is a Main Admin action.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
