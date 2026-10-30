"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import StatusBadge from "@/components/ui/StatusBadge";
import SubmitButton from "@/components/ui/SubmitButton";
import Spinner from "@/components/ui/Spinner";
import { Course, StaffUser } from "@/lib/types";
import {
  getCurrentStaff,
  fetchDbCourses,
  saveCourseToSupabase,
  deleteCourseFromSupabase,
  logStaffAction,
  getStaffCourses,
} from "@/lib/staffStore";
import {
  saveLessonToSupabase,
  syncCourseLessonCount,
  ExtendedVideoRow,
} from "@/lib/playlistStore";
import {
  Play,
  Plus,
  Search,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Video,
  Layers,
  Lock,
  Tag,
  Shield,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import CategoryManagerModal from "@/components/admin/CategoryManagerModal";
import RecycleBinModal from "@/components/admin/RecycleBinModal";
import {
  CategoryItem,
  getCategories,
  DEFAULT_CATEGORIES,
  addToRecycleBin,
  restoreFromRecycleBin,
  getRecycleBinItems,
  RecycleBinItem,
} from "@/lib/categoryStore";

function YoutubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// Fallback / Initial Category Options
const TARGET_CATEGORY_OPTIONS = DEFAULT_CATEGORIES;

// Course Validity Presets
const VALIDITY_PRESETS = [
  { id: "15_days", label: "१५ दिवस (15 Days)", days: 15, months: 1 },
  { id: "1_month", label: "१ महिना (30 Days)", days: 30, months: 1 },
  { id: "3_months", label: "३ महिने (90 Days)", days: 90, months: 3 },
  { id: "6_months", label: "६ महिने (180 Days)", days: 180, months: 6 },
  { id: "12_months", label: "१ वर्ष (365 Days)", days: 365, months: 12 },
  { id: "24_months", label: "२ वर्षे (730 Days)", days: 730, months: 24 },
  { id: "lifetime", label: "आजीवन ऍक्सेस (Lifetime)", days: 3650, months: 120 },
];

function generateNextCourseCode(existingCourses: Course[]): string {
  let maxNum = 0;
  for (const c of existingCourses) {
    const m = (c.code || "").match(/^MM-(\d+)$/i);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `MM-${String(maxNum + 1).padStart(2, "0")}`;
}

interface FetchedPlaylistItem {
  videoId: string;
  title: string;
  durationSec: number;
  durationFormatted: string;
  thumbnailUrl: string;
  position: number;
  isFree: boolean;
  selected: boolean;
}

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
  const [isSaving, setIsSaving] = useState(false);

  // YouTube Fetcher State
  const [youtubeInputUrl, setYoutubeInputUrl] = useState("");
  const [isFetchingYt, setIsFetchingYt] = useState(false);
  const [ytFetchError, setYtFetchError] = useState<string | null>(null);
  const [ytFetchSuccess, setYtFetchSuccess] = useState<string | null>(null);
  const [fetchedPlaylistVideos, setFetchedPlaylistVideos] = useState<FetchedPlaylistItem[]>([]);

  // Form Fields State
  const [formCode, setFormCode] = useState("MM-01");
  const [formTitle, setFormTitle] = useState("");
  const [formTitleMr, setFormTitleMr] = useState("");
  const [targetCategoryKey, setTargetCategoryKey] = useState("school_5_10");
  const [formDescription, setFormDescription] = useState("");
  const [formThumbnail, setFormThumbnail] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [formPrice, setFormPrice] = useState(199);
  const [formOriginalPrice, setFormOriginalPrice] = useState(999);

  // Validity Mode: "preset" | "custom_days" | "custom_months" | "fixed_date"
  const [validityMode, setValidityMode] = useState<"preset" | "custom_days" | "custom_months" | "fixed_date">("preset");
  const [selectedPresetId, setSelectedPresetId] = useState("6_months");
  const [customDays, setCustomDays] = useState(45);
  const [customMonths, setCustomMonths] = useState(18);
  const [fixedExpiryDate, setFixedExpiryDate] = useState("");

  const [formStatus, setFormStatus] = useState<"live" | "upcoming" | "draft">("live");
  const [isLive, setIsLive] = useState(true);
  const [segmentType, setSegmentType] = useState<"all" | "district" | "standard">("all");

  // Dynamic Categories State
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Recycle Bin & Undo Toast State
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [recycleCount, setRecycleCount] = useState(0);
  const [undoToast, setUndoToast] = useState<{ id: string; title: string } | null>(null);

  // Delete Modal State
  const [deleteModalCourse, setDeleteModalCourse] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Courses from Supabase (Source of Truth)
  const reloadFromSupabase = async () => {
    setIsLoading(true);
    setStaff(getCurrentStaff());
    try {
      const dbCourses = await fetchDbCourses();
      setCourses(dbCourses);
    } catch (e) {
      console.warn("Failed to load courses from Supabase, fallback to local:", e);
      setCourses(getStaffCourses());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCategories(getCategories());
    setRecycleCount(getRecycleBinItems().length);
    reloadFromSupabase();

    const handleSync = () => reloadFromSupabase();
    const handleCatsChange = () => setCategories(getCategories());
    const handleBinChange = () => setRecycleCount(getRecycleBinItems().length);

    window.addEventListener("mma_courses_changed", handleSync);
    window.addEventListener("mma_categories_changed", handleCatsChange);
    window.addEventListener("mma_recycle_bin_changed", handleBinChange);
    return () => {
      window.removeEventListener("mma_courses_changed", handleSync);
      window.removeEventListener("mma_categories_changed", handleCatsChange);
      window.removeEventListener("mma_recycle_bin_changed", handleBinChange);
    };
  }, []);

  const isMainAdmin = staff.role === "main_admin";

  // Calculate current effective validity label & months
  const getEffectiveValidity = () => {
    if (validityMode === "preset") {
      const p = VALIDITY_PRESETS.find((x) => x.id === selectedPresetId) || VALIDITY_PRESETS[3];
      return { label: p.label, days: p.days, months: p.months, removeAt: null };
    }
    if (validityMode === "custom_days") {
      const days = Math.max(1, customDays);
      const months = Math.max(1, Math.ceil(days / 30));
      return { label: `${days} दिवस (${days} Days)`, days, months, removeAt: null };
    }
    if (validityMode === "custom_months") {
      const months = Math.max(1, customMonths);
      const days = months * 30;
      return { label: `${months} महिने (${months} Months)`, days, months, removeAt: null };
    }
    if (validityMode === "fixed_date" && fixedExpiryDate) {
      const targetTime = new Date(fixedExpiryDate).getTime();
      const diffMs = targetTime - Date.now();
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const months = Math.max(1, Math.ceil(days / 30));
      return {
        label: `परीक्षा दिनांक: ${fixedExpiryDate}`,
        days,
        months,
        removeAt: new Date(fixedExpiryDate).toISOString(),
      };
    }
    return { label: "६ महिने (6 Months)", days: 180, months: 6, removeAt: null };
  };

  // Open Drawer for New Course
  const handleOpenAdd = () => {
    setEditingCourse(null);
    const nextCode = generateNextCourseCode(courses);
    setFormCode(nextCode);
    setFormTitle("");
    setFormTitleMr("");
    setTargetCategoryKey("school_5_10");
    setFormDescription("");
    setFormThumbnail("");
    setIsFree(false);
    setFormPrice(199);
    setFormOriginalPrice(999);
    setValidityMode("preset");
    setSelectedPresetId("6_months");
    setCustomDays(45);
    setCustomMonths(18);
    setFixedExpiryDate("");
    setFormStatus("live");
    setYoutubeInputUrl("");
    setYtFetchError(null);
    setYtFetchSuccess(null);
    setFetchedPlaylistVideos([]);
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleOpenEdit = (c: Course) => {
    setEditingCourse(c);
    setFormCode(c.code);
    setFormTitle(c.title);
    setFormTitleMr(c.titleMr || c.title);
    setFormDescription(c.description || "");
    setFormThumbnail(c.imageSrc || "");
    setIsFree(Boolean(c.isFree) || c.pricePaise === 0);
    setFormPrice(Math.round(c.pricePaise / 100));
    setFormOriginalPrice(Math.round((c.originalPricePaise || c.pricePaise * 2) / 100));
    setFormStatus(c.status === "upcoming" ? "upcoming" : c.status === "closed" ? "draft" : "live");

    // Match Target Category
    const currentCats = categories.length > 0 ? categories : TARGET_CATEGORY_OPTIONS;
    const matchedCategory = currentCats.find((t) => {
      if (t.key === c.category) return true;
      if (c.category === "trainer") return t.key === "teacher_training" || t.key === "educators";
      if (c.category === "memory") return t.key === "vedic_memory";
      if (c.standards && c.standards.includes(11)) return t.key === "junior_college_11_12";
      if (c.standards && c.standards.includes(5) && c.standards.length === 2) return t.key === "scholarship_nmms";
      return false;
    }) || currentCats[0];
    setTargetCategoryKey(matchedCategory ? matchedCategory.key : "school_5_10");

    // Match Validity
    if (c.removeAt) {
      setValidityMode("fixed_date");
      setFixedExpiryDate(c.removeAt.slice(0, 10));
    } else if (c.validityDays && c.validityDays !== c.accessMonths * 30) {
      setValidityMode("custom_days");
      setCustomDays(c.validityDays);
    } else {
      setValidityMode("preset");
      const matchedPreset = VALIDITY_PRESETS.find((p) => p.months === (c.accessMonths || 6));
      setSelectedPresetId(matchedPreset ? matchedPreset.id : "6_months");
    }

    setYoutubeInputUrl(c.youtubeUrl || "");
    setYtFetchError(null);
    setYtFetchSuccess(null);
    setFetchedPlaylistVideos([]);
    setIsDrawerOpen(true);
  };

  // Fetch YouTube Info (Video or Playlist)
  const handleFetchFromYouTube = async () => {
    if (!youtubeInputUrl.trim()) {
      setYtFetchError("कृपया YouTube Playlist किंवा Video ची लिंक टाका.");
      return;
    }

    setIsFetchingYt(true);
    setYtFetchError(null);
    setYtFetchSuccess(null);

    try {
      const res = await fetch("/api/youtube/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeInputUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "YouTube माहिती आयात करता आली नाही.");
      }

      // Populate Title & Description
      if (data.title) {
        setFormTitle(data.title);
        if (!formTitleMr) {
          setFormTitleMr(data.title);
        }
      }

      if (data.description) {
        setFormDescription(data.description);
      }

      if (data.thumbnailUrl) {
        setFormThumbnail(data.thumbnailUrl);
      }

      // Playlist vs Single Video items
      if (data.items && Array.isArray(data.items)) {
        const mappedItems: FetchedPlaylistItem[] = data.items.map((item: any, idx: number) => ({
          videoId: item.videoId,
          title: item.title,
          durationSec: item.durationSec || 900,
          durationFormatted: item.durationFormatted || "15:00",
          thumbnailUrl: item.thumbnailUrl || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
          position: idx + 1,
          isFree: idx === 0, // First video free by default
          selected: true,
        }));
        setFetchedPlaylistVideos(mappedItems);

        setYtFetchSuccess(
          data.type === "playlist"
            ? `🎉 YouTube प्लेलिस्ट यशस्वीपणे लोड झाली! ${mappedItems.length} लेक्चर्स सापडले.`
            : `🎉 YouTube व्हिडिओची माहिती यशस्वीपणे लोड झाली!`
        );
      }
    } catch (err: any) {
      console.error("YouTube Fetch Error:", err);
      setYtFetchError(err.message || "YouTube URL तपासा किंवा इंटरनेट कनेक्शन तपासा.");
    } finally {
      setIsFetchingYt(false);
    }
  };

  // Toggle Video Selection in Playlist Import List
  const handleTogglePlaylistItemSelect = (idx: number) => {
    setFetchedPlaylistVideos((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, selected: !v.selected } : v))
    );
  };

  // Toggle Free Demo Preview for a video in Playlist Import List
  const handleTogglePlaylistItemFree = (idx: number) => {
    setFetchedPlaylistVideos((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, isFree: !v.isFree } : v))
    );
  };

  // Save Course Handler (100% Live Supabase Sync)
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("कृपया कोर्सचे नाव प्रविष्ट करा.");
      return;
    }

    setIsSaving(true);
    const currentCats = categories.length > 0 ? categories : TARGET_CATEGORY_OPTIONS;
    const selectedTargetCategory =
      currentCats.find((t) => t.key === targetCategoryKey) ||
      currentCats[0] ||
      TARGET_CATEGORY_OPTIONS[0];

    const validity = getEffectiveValidity();

    const courseData: Course = {
      id: editingCourse ? editingCourse.id : `c-${Date.now()}`,
      code: formCode.trim().toUpperCase(),
      title: formTitle.trim(),
      titleMr: formTitleMr.trim() || formTitle.trim(),
      subtitle: editingCourse ? editingCourse.subtitle : "प्रशांत धुमाळ सर • MindMaster Certified",
      description: formDescription.trim() || "MindMaster Certified Video Training Curriculum.",
      headerTint: "sky",
      pricePaise: isFree ? 0 : formPrice * 100,
      originalPricePaise: isFree ? 0 : (formOriginalPrice || formPrice * 2) * 100,
      isFree,
      accessMonths: validity.months,
      validityDays: validity.days,
      validityLabel: validity.label,
      status: formStatus === "draft" ? "closed" : formStatus,
      badgeText: isFree ? "मोफत (FREE)" : selectedTargetCategory.badge,
      badgeType: isFree ? "free" : "popular",
      imageSrc:
        formThumbnail.trim() ||
        (fetchedPlaylistVideos[0]?.videoId
          ? `https://i.ytimg.com/vi/${fetchedPlaylistVideos[0].videoId}/maxresdefault.jpg`
          : "/assets/images/student_mindmaps_notebook.png"),
      instructorName: "Prashant Dhumal Sir",
      instructorTitle: "International Memory Record Holder & Author",
      totalStudents: editingCourse ? editingCourse.totalStudents : 0,
      rating: editingCourse ? editingCourse.rating : 5.0,
      ratingCount: editingCourse ? editingCourse.ratingCount : 1,
      lessonsCount: editingCourse
        ? editingCourse.lessonsCount
        : fetchedPlaylistVideos.filter((v) => v.selected).length,
      totalDurationHours: editingCourse ? editingCourse.totalDurationHours : 10.0,
      category: selectedTargetCategory.category,
      audienceType: selectedTargetCategory.audienceType,
      standards: selectedTargetCategory.standards,
      features: [
        `वैधता: ${validity.label}`,
        "सर्व व्हिडिओ लेक्चर्स (HD Video)",
        "डिजिटल वर्कबुक व नोट्स (PDF)",
        "अधिकृत ई-सर्टिफिकेट",
      ],
      removeAt: validity.removeAt,
      publishAt: new Date().toISOString(),
      youtubeUrl: youtubeInputUrl.trim() || undefined,
    };

    try {
      // 1. Save Course to Supabase
      const { data: savedCourse, error: courseErr } = await saveCourseToSupabase(courseData);
      if (courseErr) {
        throw new Error(courseErr.message || "Course save failed in Supabase");
      }

      const activeCourseId = savedCourse ? savedCourse.id : courseData.id;

      // 2. If playlist videos were fetched, save all selected lessons to Supabase
      const videosToSave = fetchedPlaylistVideos.filter((v) => v.selected);
      if (videosToSave.length > 0) {
        for (let i = 0; i < videosToSave.length; i++) {
          const v = videosToSave[i];
          const newLesson: ExtendedVideoRow = {
            id: `vid-${Date.now()}-${i + 1}`,
            lessonId: `les-${Date.now()}-${i + 1}`,
            lessonTitle: v.title,
            courseId: activeCourseId,
            courseTitle: courseData.title,
            videoType: "youtube",
            videoId: v.videoId,
            position: i + 1,
            durationSec: v.durationSec,
            isFree: v.isFree,
            status: "active",
            publishAt: new Date().toISOString(),
            removeAt: null,
            validityDays: 30,
            views: 0,
            avgWatchPercent: 0,
          };
          await saveLessonToSupabase(newLesson);
        }
        await syncCourseLessonCount(activeCourseId);
      }

      logStaffAction(
        editingCourse ? "COURSE_UPDATE" : "COURSE_CREATE",
        "course",
        activeCourseId,
        courseData.title,
        `${editingCourse ? "Updated" : "Created"} course ${courseData.code} (${courseData.titleMr}) with ${videosToSave.length} lessons`
      );

      setIsDrawerOpen(false);
      await reloadFromSupabase();
    } catch (saveErr: any) {
      console.error("Save course error:", saveErr);
      alert(`कोर्स सेव्ह करताना त्रुटी आली: ${saveErr.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Move Course to Recycle Bin (Soft Delete with Undo Loop)
  const handleConfirmDelete = async () => {
    if (!deleteModalCourse) return;
    if (staff.role !== "main_admin") {
      alert("Unauthorized: Course deletion is strictly reserved for Main Admin.");
      setDeleteModalCourse(null);
      return;
    }
    setIsDeleting(true);
    try {
      const courseToDelete = deleteModalCourse;

      // 1. Move to Recycle Bin
      const binItem = addToRecycleBin({
        itemType: "course",
        itemId: courseToDelete.id,
        title: courseToDelete.titleMr || courseToDelete.title,
        subtitle: `${courseToDelete.code} • ${courseToDelete.badgeText || "कोर्स"}`,
        data: courseToDelete,
      });

      // 2. Mark as closed in Supabase so students don't see it
      await saveCourseToSupabase({ ...courseToDelete, status: "closed" });

      logStaffAction(
        "COURSE_DELETE",
        "course",
        courseToDelete.id,
        courseToDelete.title,
        `Main admin moved course ${courseToDelete.code} to Recycle Bin`
      );

      setDeleteModalCourse(null);
      await reloadFromSupabase();

      // 3. Show 1-Click Undo Toast
      setUndoToast({
        id: binItem.id,
        title: courseToDelete.titleMr || courseToDelete.title,
      });
      setTimeout(() => {
        setUndoToast((prev) => (prev?.id === binItem.id ? null : prev));
      }, 8000);
    } catch (err: any) {
      alert(`कोर्स हटवताना त्रुटी आली: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // 1-Click Undo Course Deletion
  const handleUndoCourseDelete = async () => {
    if (!undoToast) return;
    const res = await restoreFromRecycleBin(undoToast.id);
    if (res.success) {
      setUndoToast(null);
      await reloadFromSupabase();
    }
  };

  // Filter Courses Logic (Excludes courses currently in the Recycle Bin)
  const recycleCourseIds = new Set(
    getRecycleBinItems()
      .filter((i) => i.itemType === "course")
      .map((i) => i.itemId)
  );

  const filteredCourses = courses.filter((c) => {
    if (recycleCourseIds.has(c.id)) return false;

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
                  अभ्यासक्रम व्यवस्थापन (Courses Hub)
                </span>
                <span className="text-xs text-slate-400 font-semibold">• {courses.length} कोर्सेस उपलब्ध</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
                Courses &amp; Curriculum Builder
              </h2>
              <p className="text-xs text-[#5A6478] mt-1">
                YouTube व्हिडिओ किंवा प्लेलिस्ट लिंक टाकून थेट कोर्स तयार करा आणि लाइव्ह डेटाबेसवर सेव्ह करा.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-3 bg-white border border-[#CCD7E6] hover:border-[#0B57D0] hover:bg-blue-50 text-[#0E1B3D] hover:text-[#0B57D0] text-xs font-bold rounded-2xl shadow-xs transition-all shrink-0"
              >
                <Tag className="w-4 h-4 text-purple-600" />
                <span>प्रवर्ग व्यवस्थापन (Categories)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRecycleBinOpen(true)}
                className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all border shadow-xs shrink-0 ${
                  recycleCount > 0
                    ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                    : "bg-white border-[#CCD7E6] text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Trash2 className="w-4 h-4 text-amber-600" />
                <span>कचरापेटी (Recycle Bin)</span>
                {recycleCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white leading-none">
                    {recycleCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-2xl shadow-md transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>नवीन कोर्स तयार करा (+ Create Course)</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="कोर्सचे नाव किंवा कोड शोधा (उदा. MM-01, पोलीस भरती, वैदिक गणित)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl focus:outline-none focus:border-[#0B57D0] text-[#0E1B3D]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                  स्थिती (Status):
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
                    {st === "all" ? "सर्व (All)" : st === "live" ? "Live" : st === "scheduled" ? "Upcoming" : "Closed"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                  प्रकार (Type):
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
                    {t === "all" ? "सर्व (All)" : t === "free" ? "मोफत (Free)" : "Paid"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Courses Grid / Cards (Clean YouTube Thumbnail Cards, No Header Tints) */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] shadow-sm overflow-hidden">
            <div className="p-4 bg-[#FAFBFD] border-b border-[#E4E8F8] flex items-center justify-between text-xs">
              <span className="font-bold text-[#0E1B3D]">
                एकूण {filteredCourses.length} कोर्सेस उपलब्ध
              </span>
              <span className="text-[11px] text-[#8A94A6] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Supabase Database Sync
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mb-4 shadow-inner">
                  🎬
                </div>
                <h4 className="font-extrabold text-base text-[#0E1B3D]">
                  कोणताही कोर्स सापडला नाही (No Courses Found)
                </h4>
                <p className="text-xs text-[#5A6478] max-w-md mt-1 mb-5 leading-relaxed">
                  वरील <strong>&quot;+ Create Course&quot;</strong> बटणावर क्लिक करा आणि YouTube लिंक टाकून एका मिनिटात पहिला कोर्स तयार करा.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="px-6 py-2.5 bg-[#0B57D0] text-white text-xs font-bold rounded-full shadow hover:bg-blue-700 transition"
                >
                  + पहिला कोर्स तयार करा
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
                {filteredCourses.map((course) => {
                  const priceRupees = Math.round(course.pricePaise / 100);
                  const origRupees = Math.round((course.originalPricePaise || 0) / 100);
                  const thumb = course.imageSrc || "/assets/images/student_mindmaps_notebook.png";

                  return (
                    <div
                      key={course.id}
                      className="group bg-white rounded-2xl border border-[#E4E8F8] hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden"
                    >
                      {/* Course Thumbnail Image */}
                      <div className="relative w-full h-44 bg-slate-900 overflow-hidden">
                        <Image
                          src={thumb}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono text-[11px] font-extrabold border border-white/20">
                            {course.code}
                          </span>
                          <StatusBadge status={course.status} size="sm" className="backdrop-blur-md" />
                        </div>

                        {/* Bottom Thumbnail Overlay: Price & Duration */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                          <div className="font-bold">
                            {course.isFree || course.pricePaise === 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-extrabold text-[11px]">
                                FREE
                              </span>
                            ) : (
                              <span>
                                ₹{priceRupees}{" "}
                                {origRupees > priceRupees && (
                                  <span className="line-through text-slate-300 text-[10px] ml-1">
                                    ₹{origRupees}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.validityLabel || `${course.accessMonths || 6} महिने`}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="font-extrabold text-sm text-[#0E1B3D] line-clamp-1 group-hover:text-[#0B57D0] transition-colors">
                            {course.titleMr || course.title}
                          </h3>
                          {course.titleMr && course.titleMr !== course.title && (
                            <p className="text-[11px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                              {course.title}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                            {course.description}
                          </p>
                        </div>

                        {/* Meta Tags */}
                        <div className="pt-2 border-t border-[#F0F2F9] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="text-slate-600 font-semibold flex items-center gap-1">
                            <Video className="w-3.5 h-3.5 text-blue-600" />
                            {course.lessonsCount || 0} लेक्चर्स
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {course.badgeText || "Course"}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F0F2F9]">
                          <button
                            onClick={() => handleOpenEdit(course)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B57D0] text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {isMainAdmin && (
                            <button
                              onClick={() => setDeleteModalCourse(course)}
                              className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
                              title="Delete Course"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SLIDE-OVER DRAWER FORM */}
          {/* ========================================================= */}
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                onClick={() => !isSaving && setIsDrawerOpen(false)}
              />

              <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
                  {/* Drawer Header */}
                  <div className="p-6 bg-[#0E1B3D] text-white flex items-center justify-between shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-extrabold">
                          {formCode}
                        </span>
                        <h3 className="font-extrabold text-lg font-heading">
                          {editingCourse ? "कोर्स संपादित करा (Edit Course)" : "नवीन कोर्स तयार करा (New Course)"}
                        </h3>
                      </div>
                      <p className="text-xs text-blue-200 mt-1">
                        YouTube द्वारे थेट डेटा भरा किंवा खालील माहिती भरा.
                      </p>
                    </div>
                    <button
                      onClick={() => !isSaving && setIsDrawerOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Drawer Body Form */}
                  <form onSubmit={handleSaveCourse} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                    {/* ---------------------------------------------------------------- */}
                    {/* 1. YOUTUBE IMPORT BOX (Direct Link & Auto-Fetch) */}
                    {/* ---------------------------------------------------------------- */}
                    <div className="p-5 bg-gradient-to-br from-red-50 via-slate-50 to-blue-50 border-2 border-red-200/70 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-extrabold text-sm text-[#0E1B3D] flex items-center gap-2">
                          <YoutubeIcon className="w-5 h-5 text-red-600" />
                          <span>YouTube वरून थेट कोर्स भरा (Instant YouTube Import)</span>
                        </label>
                        <span className="text-[10px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          Playlist किंवा Video Link
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        YouTube Playlist किंवा Single Video ची लिंक पेस्ट करा. कोर्सचे नाव, वर्णन, HD थंबनेल आणि सर्व लेक्चर्स एका सेकंदात आपोआप भरले जातील!
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={youtubeInputUrl}
                          onChange={(e) => {
                            setYoutubeInputUrl(e.target.value);
                            setYtFetchError(null);
                          }}
                          placeholder="https://www.youtube.com/playlist?list=... किंवा https://youtu.be/..."
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-red-500 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleFetchFromYouTube}
                          disabled={isFetchingYt || !youtubeInputUrl.trim()}
                          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          {isFetchingYt ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>शोधत आहे...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>माहिती मिळवा (Fetch)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {ytFetchError && (
                        <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-800 text-[11px] flex items-center gap-2 font-semibold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{ytFetchError}</span>
                        </div>
                      )}

                      {ytFetchSuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2 font-semibold">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>{ytFetchSuccess}</span>
                        </div>
                      )}

                      {/* Display Fetched Playlist Videos Preview */}
                      {fetchedPlaylistVideos.length > 0 && (
                        <div className="pt-2 space-y-2 border-t border-slate-200">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                            <span>सापडलेले लेक्चर्स ({fetchedPlaylistVideos.filter((v) => v.selected).length}/{fetchedPlaylistVideos.length} निवडले):</span>
                            <span className="text-[10px] text-slate-500">पहिले लेक्चर मोफत डेमो म्हणून सेट करा</span>
                          </div>
                          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 p-2 space-y-1.5">
                            {fetchedPlaylistVideos.map((v, idx) => (
                              <div
                                key={v.videoId + idx}
                                className={`flex items-center justify-between gap-3 p-2 rounded-lg text-xs transition ${
                                  v.selected ? "bg-slate-50" : "opacity-40"
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={v.selected}
                                    onChange={() => handleTogglePlaylistItemSelect(idx)}
                                    className="w-4 h-4 rounded accent-red-600 cursor-pointer"
                                  />
                                  <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                                  <span className="font-bold text-slate-800 truncate">{v.title}</span>
                                  <span className="text-[10px] text-slate-400 shrink-0">({v.durationFormatted})</span>
                                </div>

                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 cursor-pointer shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={v.isFree}
                                    onChange={() => handleTogglePlaylistItemFree(idx)}
                                    className="w-3.5 h-3.5 rounded accent-emerald-600"
                                  />
                                  <span>Free Demo</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ---------------------------------------------------------------- */}
                    {/* 2. AUTO-GENERATED COURSE CODE & TARGET CATEGORY */}
                    {/* ---------------------------------------------------------------- */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Course Code (Auto)</span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={formCode}
                          className="w-full px-3 py-2.5 bg-slate-100 border border-[#E4E8F8] rounded-xl font-mono text-xs font-extrabold text-[#0B57D0] cursor-not-allowed"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-[#0E1B3D] flex items-center gap-1">
                            <Tag className="w-3 h-3 text-purple-600" />
                            <span>लक्ष्य प्रवर्ग (Target Category) *</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>प्रवर्गे मॅनेज / नवीन (+ / Edit)</span>
                          </button>
                        </div>
                        <select
                          value={targetCategoryKey}
                          onChange={(e) => setTargetCategoryKey(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                        >
                          {(categories.length > 0 ? categories : TARGET_CATEGORY_OPTIONS).map((cat) => (
                            <option key={cat.key} value={cat.key}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* ---------------------------------------------------------------- */}
                    {/* 3. COURSE TITLES (Regional / Marathi & English) */}
                    {/* ---------------------------------------------------------------- */}
                    <div className="space-y-3">
                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1 flex items-center justify-between">
                          <span>कोर्सचे नाव (Course Title in Marathi / Regional) *</span>
                          {formTitleMr.trim().length >= 3 && (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> मान्य
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formTitleMr}
                            onChange={(e) => setFormTitleMr(e.target.value)}
                            placeholder="उदा. महाराष्ट्र पोलीस भरती १००% परिपूर्ण तयारी किंवा ५०० वर्षांचे कॅलेंडर"
                            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none transition-all ${
                              formTitleMr.trim().length >= 3
                                ? "bg-emerald-50/15 border border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                                : "bg-[#F5F7FF] border border-[#E4E8F8] focus:border-[#0B57D0]"
                            }`}
                          />
                          {formTitleMr.trim().length >= 3 && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1 flex items-center justify-between">
                          <span>Course Title (English) *</span>
                          {formTitle.trim().length >= 3 && (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Valid
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="e.g. Memory Science &amp; Vedic Maths Mastery"
                            className={`w-full px-3 py-2.5 rounded-xl text-xs text-[#0E1B3D] focus:outline-none transition-all ${
                              formTitle.trim().length >= 3
                                ? "bg-emerald-50/15 border border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                                : "bg-[#F5F7FF] border border-[#E4E8F8] focus:border-[#0B57D0]"
                            }`}
                          />
                          {formTitle.trim().length >= 3 && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ---------------------------------------------------------------- */}
                    {/* 4. DESCRIPTION & HD THUMBNAIL */}
                    {/* ---------------------------------------------------------------- */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">कोर्सचे वर्णन (Course Description)</label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="विद्यार्थी या कोर्समध्ये काय शिकणार आहेत..."
                        rows={3}
                        className="w-full px-3 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs focus:outline-none focus:border-[#0B57D0] resize-none"
                      />
                    </div>

                    {/* HD Thumbnail Input with Live Preview */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <label className="block font-bold text-[#0E1B3D]">HD Thumbnail Image URL</label>
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-slate-300 shrink-0 bg-slate-900">
                          {formThumbnail ? (
                            <Image src={formThumbnail} alt="Thumbnail" fill className="object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 font-bold text-[10px]">
                              No Photo
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={formThumbnail}
                          onChange={(e) => setFormThumbnail(e.target.value)}
                          placeholder="https://i.ytimg.com/vi/... किंवा इमेज लिंक"
                          className="flex-1 px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* ---------------------------------------------------------------- */}
                    {/* 5. PRICING & FREE MASTERCLASS TOGGLE */}
                    {/* ---------------------------------------------------------------- */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#0E1B3D] block text-xs">कोर्स फी व सवलत (Pricing & Fee)</span>
                          <span className="text-[11px] text-[#5A6478]">
                            {isFree ? "हा कोर्स विद्यार्थ्यांसाठी पूर्णपणे मोफत आहे (₹0)" : `विद्यार्थी भरतील: ₹${formPrice} (मूळ किंमत: ₹${formOriginalPrice})`}
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
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block font-bold text-[#0E1B3D] mb-1">Selling Price (₹) *</label>
                            <input
                              type="number"
                              min={0}
                              value={formPrice}
                              onChange={(e) => setFormPrice(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#0E1B3D] mb-1">Original Price (₹)</label>
                            <input
                              type="number"
                              min={0}
                              value={formOriginalPrice}
                              onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ---------------------------------------------------------------- */}
                    {/* 6. FULL COURSE VALIDITY CUSTOMIZATION (Days, Months, Date, Lifetime) */}
                    {/* ---------------------------------------------------------------- */}
                    <div className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#0E1B3D] flex items-center gap-1.5 text-xs">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>कोर्स वैधता (Full Validity Customization)</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-300">
                          {getEffectiveValidity().label}
                        </span>
                      </div>

                      {/* Mode Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          { key: "preset", label: "जलद पर्याय (Quick Presets)" },
                          { key: "custom_days", label: "कस्टम दिवस (Days)" },
                          { key: "custom_months", label: "कस्टम महिने (Months)" },
                          { key: "fixed_date", label: "परीक्षेची तारीख (Fixed Date)" },
                        ].map((m) => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setValidityMode(m.key as any)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                              validityMode === m.key
                                ? "bg-amber-600 text-white shadow-sm"
                                : "bg-white text-slate-700 border border-amber-200 hover:border-amber-400"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {/* Preset Buttons */}
                      {validityMode === "preset" && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                          {VALIDITY_PRESETS.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPresetId(p.id)}
                              className={`p-2 rounded-xl text-center font-bold text-xs border transition ${
                                selectedPresetId === p.id
                                  ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                  : "bg-white text-slate-700 border-amber-200 hover:border-amber-400"
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Custom Days Input */}
                      {validityMode === "custom_days" && (
                        <div className="pt-2 flex items-center gap-3">
                          <label className="font-bold text-slate-700 text-xs">दिवसांची संख्या:</label>
                          <input
                            type="number"
                            min={1}
                            value={customDays}
                            onChange={(e) => setCustomDays(Number(e.target.value))}
                            className="w-32 px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-xs text-amber-900 focus:outline-none"
                          />
                          <span className="text-slate-500 font-semibold text-xs">दिवस (Days)</span>
                        </div>
                      )}

                      {/* Custom Months Input */}
                      {validityMode === "custom_months" && (
                        <div className="pt-2 flex items-center gap-3">
                          <label className="font-bold text-slate-700 text-xs">महिन्यांची संख्या:</label>
                          <input
                            type="number"
                            min={1}
                            value={customMonths}
                            onChange={(e) => setCustomMonths(Number(e.target.value))}
                            className="w-32 px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-xs text-amber-900 focus:outline-none"
                          />
                          <span className="text-slate-500 font-semibold text-xs">महिने (Months)</span>
                        </div>
                      )}

                      {/* Fixed Expiry Date */}
                      {validityMode === "fixed_date" && (
                        <div className="pt-2 flex items-center gap-3">
                          <label className="font-bold text-slate-700 text-xs">अंतिम तारीख निवडा:</label>
                          <input
                            type="date"
                            value={fixedExpiryDate}
                            onChange={(e) => setFixedExpiryDate(e.target.value)}
                            className="px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-xs text-amber-900 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* ---------------------------------------------------------------- */}
                    {/* 7. COURSE STATUS SELECTOR */}
                    {/* ---------------------------------------------------------------- */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <span className="font-bold text-[#0E1B3D] block text-xs">कोर्स प्रसिद्धी स्थिती (Course Status)</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: "live", label: "Live", desc: "विद्यार्थ्यांना लगेच उपलब्ध" },
                          { key: "upcoming", label: "Upcoming", desc: "Coming Soon बॅज" },
                          { key: "draft", label: "Draft", desc: "फक्त ॲडमिनसाठी" },
                        ].map((st) => (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => setFormStatus(st.key as any)}
                            className={`p-2.5 rounded-xl text-center border font-bold text-xs transition ${
                              formStatus === st.key
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div>{st.label}</div>
                            <div className="text-[10px] font-normal opacity-80 mt-0.5">{st.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => setIsDrawerOpen(false)}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                      >
                        रद्द करा (Cancel)
                      </button>

                      <SubmitButton
                        type="submit"
                        loading={isSaving}
                        loadingText="सेव्ह करत आहे... (Saving to Supabase)"
                        className="px-6 py-2.5 rounded-xl text-xs"
                      >
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>कोर्स सेव्ह करा (Save to Supabase)</span>
                        </span>
                      </SubmitButton>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Move to Recycle Bin Confirmation Modal */}
          {deleteModalCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-amber-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-[#0E1B3D]">
                    हा कोर्स रीसायकल बिनमध्ये हलवायचा आहे का?
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    <strong>{deleteModalCourse.titleMr || deleteModalCourse.title}</strong> ({deleteModalCourse.code}) हा कोर्स विद्यार्थ्यांसाठी लपवला जाईल आणि रीसायकल बिनमध्ये हलवला जाईल. तुम्ही तो कधीही <strong>पूर्ववत (Undo / Restore)</strong> करू शकता.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    disabled={isDeleting}
                    onClick={() => setDeleteModalCourse(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    रद्द करा (Cancel)
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>रीसायकल बिनमध्ये हलवा (Trash)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1-Click Undo Floating Toast */}
          {undoToast && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0E1B3D] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-400/30">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-amber-400">🗑️</span>
                <span>
                  <strong>{undoToast.title}</strong> कचरापेटीत हलवला आहे.
                </span>
              </div>
              <button
                type="button"
                onClick={handleUndoCourseDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>पूर्ववत करा (Undo)</span>
              </button>
              <button
                type="button"
                onClick={() => setUndoToast(null)}
                className="text-slate-400 hover:text-white text-xs font-bold ml-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Category Manager Modal */}
          <CategoryManagerModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            onCategoriesChanged={() => setCategories(getCategories())}
          />

          {/* Recycle Bin Modal */}
          <RecycleBinModal
            isOpen={isRecycleBinOpen}
            onClose={() => setIsRecycleBinOpen(false)}
            onRestored={() => reloadFromSupabase()}
          />
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
