"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { Course, TargetSegmentConfig, StaffUser, HeaderTint } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffCourses,
  saveStaffCourse,
  deleteStaffCourse,
  toggleCourseStatus,
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

const CATEGORY_OPTIONS = [
  { key: "memory", label: "Memory Techniques" },
  { key: "vedic", label: "Vedic Maths" },
  { key: "police", label: "Police Bharti Special" },
  { key: "calendar", label: "Calendar Technique" },
  { key: "all", label: "School Curriculum" },
  { key: "free", label: "Free Masterclass" },
];

const THUMBNAIL_PRESETS = [
  { label: "MindMaps Notebook", url: "/assets/images/student_mindmaps_notebook.png" },
  { label: "Vedic Maths Abacus", url: "/assets/images/vedic_maths_abacus_3d.png" },
  { label: "Calendar Technique 3D", url: "/assets/images/superfast_calendar_3d.png" },
  { label: "Police Bharti / Exam", url: "/assets/images/police_bharti_exam_hall.png" },
];

export default function CourseManagerPage() {
  const pathname = usePathname();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [formTitleMr, setFormTitleMr] = useState("");
  const [formCategory, setFormCategory] = useState<string>("memory");
  const [formDescription, setFormDescription] = useState("");
  const [formTint, setFormTint] = useState<HeaderTint>("sky");
  const [formThumbnail, setFormThumbnail] = useState("/assets/images/student_mindmaps_notebook.png");
  const [isFree, setIsFree] = useState(false);
  const [formPrice, setFormPrice] = useState(199);
  const [formOriginalPrice, setFormOriginalPrice] = useState(999);
  const [accessMonths, setAccessMonths] = useState(6);
  const [isLive, setIsLive] = useState(true);
  const [formStatus, setFormStatus] = useState<"live" | "upcoming" | "draft">("live");
  const [publishAt, setPublishAt] = useState("");
  const [removeAt, setRemoveAt] = useState("");

  // Target Segment Builder State
  const [segmentType, setSegmentType] = useState<TargetSegmentConfig["type"]>("all");
  const [segmentDistrict, setSegmentDistrict] = useState("Pune");
  const [segmentTaluka, setSegmentTaluka] = useState("Haveli");
  const [segmentSchool, setSegmentSchool] = useState("ZP High School");
  const [segmentCoursePrereq, setSegmentCoursePrereq] = useState("MM-01");

  // Standards & Flexible Audience State
  const [audienceMode, setAudienceMode] = useState<"all" | "competitive" | "school">("all");
  const [standards, setStandards] = useState<number[]>([]);

  // Delete Confirmation Modal State (Main Admin Only)
  const [deleteModalCourse, setDeleteModalCourse] = useState<Course | null>(null);

  const handleToggleAllStandards = () => {
    setAudienceMode("all");
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
    setIsLoading(false);
  };

  useEffect(() => {
    reload();
    window.addEventListener("mma_staff_changed", reload);
    window.addEventListener("mma_courses_changed", reload);
    return () => {
      window.removeEventListener("mma_staff_changed", reload);
      window.removeEventListener("mma_courses_changed", reload);
    };
  }, []);

  const isMainAdmin = staff.role === "main_admin";

  // Open Drawer for New Course
  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormCode(`MM-0${courses.length + 1}`);
    setFormTitle("");
    setFormTitleMr("");
    setFormCategory("memory");
    setFormDescription("");
    setFormTint("sky");
    setFormThumbnail("/assets/images/student_mindmaps_notebook.png");
    setIsFree(false);
    setFormPrice(199);
    setFormOriginalPrice(999);
    setAccessMonths(6);
    setIsLive(true);
    setFormStatus("live");
    const now = new Date();
    setPublishAt(now.toISOString().slice(0, 16));
    setRemoveAt("");
    setSegmentType("all");
    setSegmentDistrict("Pune");
    setSegmentTaluka("Haveli");
    setSegmentSchool("ZP High School");
    setSegmentCoursePrereq("MM-01");
    setStandards([]);
    setAudienceMode("all");
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleOpenEdit = (c: Course) => {
    setEditingCourse(c);
    setFormCode(c.code);
    setFormTitle(c.title);
    setFormTitleMr(c.titleMr || "");
    setFormCategory((c.category as any) || "memory");
    setFormDescription(c.description || "");
    setFormTint(c.headerTint || "sky");
    setFormThumbnail(c.imageSrc || "/assets/images/student_mindmaps_notebook.png");
    setIsFree(c.isFree || c.pricePaise === 0);
    setFormPrice(Math.round(c.pricePaise / 100));
    setFormOriginalPrice(Math.round((c.originalPricePaise || c.pricePaise * 2) / 100));
    setAccessMonths(c.accessMonths || 6);
    setIsLive(c.status === "live");
    setFormStatus(c.status === "upcoming" ? "upcoming" : c.status === "closed" ? "draft" : "live");
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

    if (c.audienceType) {
      setAudienceMode(c.audienceType);
    } else if (c.category === "police") {
      setAudienceMode("competitive");
    } else if (c.standards && c.standards.length > 0) {
      setAudienceMode("school");
    } else {
      setAudienceMode("all");
    }

    setStandards(c.standards && Array.isArray(c.standards) ? [...c.standards] : []);

    setIsDrawerOpen(true);
  };

  // Toggle Live / Closed status
  const handleToggleStatus = (c: Course) => {
    toggleCourseStatus(c.id);
    reload();
  };

  // Confirm delete handler (Main Admin only)
  const handleConfirmDelete = () => {
    if (!deleteModalCourse) return;
    deleteStaffCourse(deleteModalCourse.id);
    setDeleteModalCourse(null);
    reload();
  };

  // Save Course Handler
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCode.trim()) {
      alert("Please enter course title and code.");
      return;
    }

    let computedStatus: Course["status"] = formStatus === "draft" ? "closed" : formStatus;
    if (publishAt) {
      const pubTime = new Date(publishAt).getTime();
      if (pubTime > Date.now() && isLive && formStatus === "live") {
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
      titleMr: formTitleMr.trim() || formTitle.trim(),
      subtitle: editingCourse ? editingCourse.subtitle : "Prashant Dhumal Sir Certified Video Training",
      description: formDescription.trim() || "MindMaster Certified Video Curriculum.",
      headerTint: formTint,
      pricePaise: isFree ? 0 : formPrice * 100,
      originalPricePaise: isFree ? 0 : (formOriginalPrice || formPrice * 2) * 100,
      isFree,
      accessMonths,
      status: computedStatus,
      badgeText: computedStatus === "scheduled" ? "UPCOMING" : isFree ? "FREE" : "POPULAR",
      badgeType: isFree ? "free" : "popular",
      imageSrc: formThumbnail.trim() || "/assets/images/student_mindmaps_notebook.png",
      instructorName: "Prashant Dhumal",
      instructorTitle: "Memory Record Holder & Speed Maths Trainer",
      totalStudents: editingCourse ? editingCourse.totalStudents : 0,
      rating: editingCourse ? editingCourse.rating : 4.9,
      ratingCount: editingCourse ? editingCourse.ratingCount : 120,
      lessonsCount: editingCourse ? editingCourse.lessonsCount : 12,
      totalDurationHours: editingCourse ? editingCourse.totalDurationHours : 6.5,
      category: formCategory as any,
      audienceType: audienceMode,
      standards:
        audienceMode === "school"
          ? [...standards].sort((a, b) => a - b)
          : audienceMode === "all"
          ? [5, 6, 7, 8, 9, 10, 11, 12]
          : undefined,
      features: editingCourse ? editingCourse.features : [
        "Full Video Lectures",
        "Downloadable PDF Notes",
        "Mastery Certification"
      ],
      targetSegment: "general",
      targetSegmentConfig: targetConfig,
      publishAt: publishAt ? new Date(publishAt).toISOString() : new Date().toISOString(),
      removeAt: removeAt ? new Date(removeAt).toISOString() : null,
    };

    saveStaffCourse(courseData);

    logStaffAction(
      editingCourse ? "COURSE_UPDATE" : "COURSE_CREATE",
      "course",
      courseData.id,
      courseData.title,
      `${editingCourse ? "Updated" : "Created"} course ${courseData.code} (${courseData.titleMr || courseData.title}) with category ${formCategory}, access: ${accessMonths}m, price: ₹${formPrice}`
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
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#0B57D0] border border-blue-200">
                  Courses Hub
                </span>
                <span className="text-xs text-slate-400 font-semibold">• {courses.length} courses available</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
                Courses &amp; Curriculum Manager
              </h2>
              <p className="text-xs text-[#5A6478] mt-1">
                Create new courses, set price and duration, and publish curriculum for Classes 5th - 12th or open to all.
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-full shadow-md transition-all shrink-0"
            >
              <span>+ Create Course</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-4">
            <input
              type="text"
              placeholder="Search by title or code (e.g. MM-01)..."
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
                Total {filteredCourses.length} courses
              </span>
              <span className="text-[11px] text-[#8A94A6]">
                Prashant Dhumal Academy • Real-time Database
              </span>
            </div>

            {isLoading ? (
              <div className="divide-y divide-[#E4E8F8]">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 flex items-center gap-4 animate-pulse">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                      <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                      <div className="h-3 bg-slate-100 rounded-md w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-3 shadow-inner">
                  📚
                </div>
                <h4 className="font-extrabold text-base text-[#0E1B3D]">
                  No courses found yet
                </h4>
                <p className="text-xs text-[#5A6478] max-w-md mt-1 mb-4">
                  Click the <strong>&quot;+ Create Course&quot;</strong> button above to create a new course directly.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="px-5 py-2.5 bg-[#0B57D0] text-white text-xs font-bold rounded-full shadow hover:bg-blue-700 transition"
                >
                  + Create First Course
                </button>
              </div>
            ) : (
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

                  const priceRupees = Math.round(course.pricePaise / 100);
                  const origRupees = Math.round((course.originalPricePaise || 0) / 100);

                  return (
                    <div
                      key={course.id}
                      className="p-5 hover:bg-[#FAFBFD] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Pastel Icon + Course Details */}
                      <div className="flex items-start gap-4 max-w-2xl">
                        {/* Course Thumbnail or Pastel Tint */}
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#E4E8F8] shrink-0 bg-slate-100 flex items-center justify-center shadow-2xs">
                          {course.imageSrc ? (
                            <Image
                              src={course.imageSrc}
                              alt={course.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-2xl">{tintIcon}</span>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-sm text-[#0E1B3D]">
                              {course.titleMr ? course.titleMr : course.title}
                            </h3>
                            {course.titleMr && course.titleMr !== course.title && (
                              <span className="text-xs text-slate-400 font-medium">
                                ({course.title})
                              </span>
                            )}
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
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>
                              {course.isFree || course.pricePaise === 0 ? (
                                "FREE"
                              ) : (
                                <span>
                                  ₹{priceRupees}{" "}
                                  {origRupees > priceRupees && (
                                    <span className="line-through text-slate-400 text-[10px] font-normal ml-1">
                                      ₹{origRupees}
                                    </span>
                                  )}
                                </span>
                              )}
                            </span>

                            {/* Access Duration */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              ⏳ {course.accessMonths >= 36 ? "Lifetime" : `${course.accessMonths || 6} Months Validity`}
                            </span>

                            {/* Category Chip */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                              🏷️ {course.category || "General"}
                            </span>

                            {/* Standards Chip */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              🎓 {course.standards && course.standards.length > 0
                                ? (course.standards.length === 8
                                    ? "Classes 5th - 12th"
                                    : `Class ${course.standards.map((s: number) => `${s}th`).join(", ")}`)
                                : "Open to All"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Chip & Actions */}
                      <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(course)}
                          title="Click to toggle Live/Closed"
                          className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all border ${
                            course.status === "live"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : course.status === "scheduled" || course.status === "upcoming"
                              ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          ● {course.status === "live" ? "Live" : course.status === "upcoming" ? "Upcoming" : "Draft"}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(course)}
                          className="px-3 py-1.5 rounded-xl bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] border border-[#E4E8F8] text-xs font-bold flex items-center gap-1.5 transition-colors"
                          title="Edit course"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>

                        {/* Delete Button (Main Admin Only) */}
                        {isMainAdmin && (
                          <button
                            onClick={() => setDeleteModalCourse(course)}
                            className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center transition-colors"
                            title="Delete course"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer Note */}
            <div className="p-4 bg-[#FAFBFD] border-t border-[#E4E8F8]">
              <p className="text-[11px] text-[#8A94A6] text-center font-medium">
                🔒 Course modifications and new courses are saved directly into the database.
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

              <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
                  {/* Drawer Header */}
                  <div className="p-6 bg-[#0E1B3D] text-white flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-lg font-heading">
                        {editingCourse ? "Edit Course" : "Create New Course"}
                      </h3>
                      <p className="text-xs text-blue-200 mt-0.5">
                        Prashant Dhumal Sir Academy • Full Dynamic Curriculum
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Drawer Body Form */}
                  <form onSubmit={handleSaveCourse} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                    {/* Course Code & Category */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1">Course Code *</label>
                        <input
                          type="text"
                          required
                          value={formCode}
                          onChange={(e) => setFormCode(e.target.value)}
                          placeholder="e.g. MM-01, VEDIC-01"
                          className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl font-mono text-xs focus:outline-none focus:border-[#0B57D0]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1">Category *</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0B57D0]"
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.key} value={cat.key}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Course Titles (Regional / Marathi & English) */}
                    <div className="space-y-3">
                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1">
                          Course Title (Regional / Marathi) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formTitleMr}
                          onChange={(e) => setFormTitleMr(e.target.value)}
                          placeholder="e.g. Superfast Vedic Maths or Memory Technique"
                          className="w-full px-3 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1">
                          Course Title (English) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder="e.g. Superfast Vedic Maths & Speed Calculation"
                          className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs focus:outline-none focus:border-[#0B57D0]"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">Course Description</label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="What will students learn (Short course description)..."
                        rows={3}
                        className="w-full px-3 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs focus:outline-none focus:border-[#0B57D0] resize-none"
                      />
                    </div>

                    {/* Thumbnail Image Selection & URL */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-[#0E1B3D]">Thumbnail Image</label>
                        <span className="text-[10px] text-slate-500 font-semibold">Select preset or paste URL</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-300 shrink-0 bg-white">
                          <Image
                            src={formThumbnail}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <input
                          type="text"
                          value={formThumbnail}
                          onChange={(e) => setFormThumbnail(e.target.value)}
                          placeholder="https://... or /assets/images/..."
                          className="flex-1 px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {THUMBNAIL_PRESETS.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => setFormThumbnail(preset.url)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              formThumbnail === preset.url
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-700 border-slate-200 hover:border-blue-400"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* FLEXIBLE AUDIENCE SELECTOR (UNIVERSAL SKILLS, COMPETITIVE, SCHOOL) */}
                    <div className="p-4 bg-gradient-to-r from-indigo-50/40 to-blue-50/40 border border-indigo-200/60 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-[#0E1B3D] flex items-center gap-1.5 text-xs">
                          <span>🎯</span> Target Audience (Who can learn?)
                        </label>
                        <span className="text-[10px] text-[#0B57D0] font-bold">
                          {audienceMode === "all"
                            ? "All Age Groups"
                            : audienceMode === "competitive"
                            ? "Competitive Exams"
                            : `${standards.length} Classes`}
                        </span>
                      </div>

                      {/* 3 Quick Mode Selector Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAudienceMode("all");
                            setStandards([]);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 text-center cursor-pointer ${
                            audienceMode === "all"
                              ? "bg-[#0B57D0] text-white border-[#0B57D0] shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          <span>🌟 Open to All</span>
                          <span className={`text-[10px] font-normal ${audienceMode === "all" ? "text-blue-100" : "text-slate-500"}`}>
                            Open to All (Skills)
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAudienceMode("competitive");
                            setStandards([]);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 text-center cursor-pointer ${
                            audienceMode === "competitive"
                              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
                          }`}
                        >
                          <span>👮 Competitive Exams</span>
                          <span className={`text-[10px] font-normal ${audienceMode === "competitive" ? "text-amber-100" : "text-slate-500"}`}>
                            Police / Recruitment
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAudienceMode("school");
                            if (standards.length === 0) setStandards([5, 6, 7, 8, 9, 10, 11, 12]);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 text-center cursor-pointer ${
                            audienceMode === "school"
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                          }`}
                        >
                          <span>📚 School Classes</span>
                          <span className={`text-[10px] font-normal ${audienceMode === "school" ? "text-indigo-100" : "text-slate-500"}`}>
                            Class 5th - 12th
                          </span>
                        </button>
                      </div>

                      {/* Mode description & conditional standard checkboxes */}
                      {audienceMode === "all" && (
                        <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200/60 text-[11px] text-blue-900 font-medium">
                          💡 <strong>Memory, Calendar, Vedic Tricks:</strong> This course is not restricted to a specific standard and will be available on the homepage for all students (Class 5th to Competitive Exams).
                        </div>
                      )}

                      {audienceMode === "competitive" && (
                        <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 font-medium">
                          👮 <strong>Police Bharti & Careers:</strong> This course is tailored specifically for students preparing for competitive exams, police recruitment, and public services.
                        </div>
                      )}

                      {audienceMode === "school" && (
                        <div className="space-y-2 pt-1">
                          <div className="text-[11px] font-bold text-slate-700">
                            Select relevant school standards (Class 5 to 12):
                          </div>
                          <div className="grid grid-cols-4 gap-2">
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
                                  <span>Class {std}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PRICING & FEE STRUCTURE */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#0E1B3D] block">Course Pricing & Discounts</span>
                          <span className="text-[11px] text-[#5A6478]">
                            {isFree ? "Free Course (₹0)" : `Students pay: ₹${formPrice} (Original: ₹${formOriginalPrice})`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsFree(!isFree)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isFree ? "bg-emerald-500" : "bg-blue-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isFree ? "translate-x-1" : "translate-x-6"
                            }`}
                          />
                        </button>
                      </div>

                      {!isFree && (
                        <div className="space-y-3 pt-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold text-[#0E1B3D] mb-1">
                                Selling Price (₹) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-[#5A6478] font-bold">₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={formPrice}
                                  onChange={(e) => setFormPrice(Number(e.target.value))}
                                  className="w-full pl-7 pr-3 py-2 bg-white border border-[#E4E8F8] rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block font-bold text-[#0E1B3D] mb-1">
                                Original Price (₹)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-[#5A6478] font-bold">₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={formOriginalPrice}
                                  onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                                  className="w-full pl-7 pr-3 py-2 bg-white border border-[#E4E8F8] rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Quick Price Presets */}
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block mb-1">Quick Price Presets:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {[99, 149, 199, 299, 499, 999].map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => {
                                    setFormPrice(p);
                                    if (formOriginalPrice <= p) setFormOriginalPrice(p * 2);
                                  }}
                                  className={`px-3 py-1 rounded-lg text-xs font-extrabold border transition-all ${
                                    formPrice === p
                                      ? "bg-[#0B57D0] text-white border-[#0B57D0]"
                                      : "bg-white text-slate-700 border-[#E4E8F8] hover:border-blue-300"
                                  }`}
                                >
                                  ₹{p}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* VALIDITY DURATION */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0E1B3D]">Validity Duration</span>
                        <span className="text-xs font-bold text-[#0B57D0]">
                          {accessMonths >= 36 ? "Lifetime Access" : `${accessMonths} Months`}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {[
                          { m: 3, label: "3 Months" },
                          { m: 6, label: "6 Months" },
                          { m: 12, label: "1 Year (12m)" },
                          { m: 36, label: "Lifetime" },
                        ].map((item) => (
                          <button
                            key={item.m}
                            type="button"
                            onClick={() => setAccessMonths(item.m)}
                            className={`py-2 px-1 rounded-xl font-bold text-xs border text-center transition-all ${
                              accessMonths === item.m
                                ? "bg-[#0B57D0] text-white border-[#0B57D0] shadow-sm"
                                : "bg-white text-[#5A6478] border-[#E4E8F8] hover:border-blue-300"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* STATUS SELECTOR */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <span className="font-bold text-[#0E1B3D] block">Course Status</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: "live", label: "Live", desc: "Visible to students" },
                          { key: "upcoming", label: "Upcoming", desc: "Coming soon badge" },
                          { key: "draft", label: "Draft", desc: "Admin only" },
                        ].map((st) => (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => {
                              setFormStatus(st.key as any);
                              setIsLive(st.key === "live");
                            }}
                            className={`p-2 rounded-xl text-center border font-bold text-xs transition-all ${
                              formStatus === st.key
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div>{st.label}</div>
                            <div className="text-[9px] font-normal opacity-80 mt-0.5">{st.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* TARGET SEGMENT BUILDER (ADVANCED FILTERING) */}
                    <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200/60 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-[#0E1B3D] flex items-center gap-1.5">
                          <span>🎯</span> Target Geographic Segment
                        </label>
                        <span className="text-[10px] text-[#0B57D0] font-bold uppercase">
                          Optional
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { key: "all", label: "All Students (All)" },
                          { key: "district", label: "Specific District" },
                          { key: "taluka", label: "Specific Taluka" },
                          { key: "school", label: "Specific School" },
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
                          <label className="block font-semibold text-[#5A6478] mb-1">District Name</label>
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
                          <label className="block font-semibold text-[#5A6478] mb-1">Taluka Name</label>
                          <input
                            type="text"
                            value={segmentTaluka}
                            onChange={(e) => setSegmentTaluka(e.target.value)}
                            placeholder="e.g. Haveli, Karveer, Wai"
                            className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs focus:outline-none"
                          />
                        </div>
                      )}

                      {segmentType === "school" && (
                        <div className="pt-2">
                          <label className="block font-semibold text-[#5A6478] mb-1">School Name</label>
                          <input
                            type="text"
                            value={segmentSchool}
                            onChange={(e) => setSegmentSchool(e.target.value)}
                            placeholder="e.g. ZP High School, Narhe Model School"
                            className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Publish & Remove Scheduling */}
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
                        <label className="block font-bold text-[#0E1B3D] mb-1">Expiration Date (Auto-Remove)</label>
                        <input
                          type="datetime-local"
                          value={removeAt}
                          onChange={(e) => setRemoveAt(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Drawer Submit Actions */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E4E8F8]">
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="px-5 py-2.5 rounded-full border border-[#E4E8F8] font-bold text-xs text-[#5A6478] hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-xs rounded-full shadow-md transition-all"
                      >
                        {editingCourse ? "Save Changes" : "Save & Publish Course"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MAIN ADMIN DELETE CONFIRMATION MODAL */}
          {/* ========================================================= */}
          {deleteModalCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-100 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Delete Course Permanently?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    You are about to permanently delete <strong>&quot;{deleteModalCourse.title}&quot; ({deleteModalCourse.code})</strong>. This course will immediately be removed from students' catalog.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDeleteModalCourse(null)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full shadow transition-all"
                  >
                    Yes, Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
