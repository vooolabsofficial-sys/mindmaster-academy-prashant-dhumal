"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { toast } from "sonner";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  deleteLessonFromSupabase,
  fetchDbVideos,
  getStoredVideos,
  extractYouTubeVideoId,
  ExtendedVideoRow,
  PlaylistItem,
  parseBulkYouTubeLinks,
} from "@/lib/playlistStore";
import {
  ArrowLeft,
  BookOpen,
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
  Eye,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Filter,
  Check,
  Film,
  Users,
  Info,
  ListPlus,
  RefreshCw,
  UploadCloud,
  ClipboardList,
  CheckSquare,
  Square,
} from "lucide-react";
import CategoryManagerModal from "@/components/admin/CategoryManagerModal";
import RecycleBinModal from "@/components/admin/RecycleBinModal";
import {
  CategoryItem,
  getCategories,
  saveCategory,
  renameCategory,
  deleteCategory,
  moveCategory,
  addToRecycleBin,
  restoreFromRecycleBin,
  getRecycleBinItems,
  RecycleBinItem,
} from "@/lib/categoryStore";
import { useLanguage } from "@/lib/LanguageContext";

function YoutubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// Student-Relative Course Validity Presets
const VALIDITY_PRESETS = [
  { id: "15_days", labelEn: "15 Days", labelMr: "१५ दिवस", days: 15, months: 1 },
  { id: "1_month", labelEn: "1 Month (30 Days)", labelMr: "१ महिना (३० दिवस)", days: 30, months: 1 },
  { id: "3_months", labelEn: "3 Months (90 Days)", labelMr: "३ महिने (९० दिवस)", days: 90, months: 3 },
  { id: "6_months", labelEn: "6 Months (180 Days)", labelMr: "६ महिने (१८० दिवस)", days: 180, months: 6 },
  { id: "12_months", labelEn: "1 Year (365 Days)", labelMr: "१ वर्ष (३६५ दिवस)", days: 365, months: 12 },
  { id: "24_months", labelEn: "2 Years (730 Days)", labelMr: "२ वर्षे (७३० दिवस)", days: 730, months: 24 },
  { id: "lifetime", labelEn: "Lifetime Access", labelMr: "आजीवन ऍक्सेस", days: 3650, months: 120 },
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

export default function ContentStudio({ initialTab = "courses" }: { initialTab?: "courses" | "videos" | "sync" | "categories" }) {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Spinner /></div>}>
      <ContentStudioContent initialTab={initialTab} />
    </Suspense>
  );
}

function ContentStudioContent({ initialTab = "courses" }: { initialTab?: "courses" | "videos" | "sync" | "categories" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentLanguage } = useLanguage();
  const isMarathi = currentLanguage === "mr";

  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<ExtendedVideoRow[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Studio Mode: "list" | "course_studio" | "video_studio"
  const [studioMode, setStudioMode] = useState<"list" | "course_studio" | "video_studio">("list");
  
  // Segmented Tabs: "courses" | "videos" | "sync" | "categories"
  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState<"courses" | "videos" | "sync" | "categories">(
    tabParam === "videos" || initialTab === "videos"
      ? "videos"
      : tabParam === "sync" || initialTab === "sync"
      ? "sync"
      : tabParam === "categories" || initialTab === "categories"
      ? "categories"
      : "courses"
  );

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "live" | "draft" | "unlisted">("all");
  const [sortOption, setSortOption] = useState<"date_desc" | "date_asc" | "title_asc" | "students_desc" | "views_desc">("date_desc");

  // Recycle Bin State
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [recycleCount, setRecycleCount] = useState(0);
  const [undoToast, setUndoToast] = useState<{ id: string; title: string; itemType: string } | null>(null);

  // Category Manager Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // ----------------------------------------------------
  // COURSE STUDIO (INLINE CUSTOMIZATION WORKSPACE) STATE
  // ----------------------------------------------------
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Course Form Fields
  const [formCode, setFormCode] = useState("MM-01");
  const [formTitle, setFormTitle] = useState("");
  const [formTitleMr, setFormTitleMr] = useState("");
  const [targetCategoryKey, setTargetCategoryKey] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formThumbnail, setFormThumbnail] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [formPrice, setFormPrice] = useState(999);
  const [formOriginalPrice, setFormOriginalPrice] = useState(2999);
  const [formVisibility, setFormVisibility] = useState<"live" | "draft" | "unlisted">("live");

  // Student-Relative Validity
  const [validityMode, setValidityMode] = useState<"preset" | "custom_days" | "custom_months">("preset");
  const [selectedPresetId, setSelectedPresetId] = useState("3_months");
  const [customDays, setCustomDays] = useState(90);
  const [customMonths, setCustomMonths] = useState(3);

  // Standards (School / College scope)
  const [selectedStandards, setSelectedStandards] = useState<number[]>([]);

  // YouTube Playlist / Instant Video Import State
  const [youtubeInputUrl, setYoutubeInputUrl] = useState("");
  const [isFetchingYt, setIsFetchingYt] = useState(false);
  const [ytFetchError, setYtFetchError] = useState<string | null>(null);
  const [ytFetchSuccess, setYtFetchSuccess] = useState<string | null>(null);
  const [fetchedPlaylistVideos, setFetchedPlaylistVideos] = useState<FetchedPlaylistItem[]>([]);

  // ----------------------------------------------------
  // VIDEO STUDIO (INLINE WORKSPACE) STATE
  // ----------------------------------------------------
  const [editingVideo, setEditingVideo] = useState<ExtendedVideoRow | null>(null);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [videoTargetCourseId, setVideoTargetCourseId] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoPosition, setVideoPosition] = useState(1);
  const [videoDurationMinutes, setVideoDurationMinutes] = useState(15);
  const [videoIsFreePreview, setVideoIsFreePreview] = useState(false);
  const [videoDescription, setVideoDescription] = useState("");
  const [isFetchingVideoMeta, setIsFetchingVideoMeta] = useState(false);

  // Delete Confirmation Modal
  const [deleteModalItem, setDeleteModalItem] = useState<{ id: string; title: string; type: "course" | "video" | "category" } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ----------------------------------------------------
  // YOUTUBE PLAYLIST SYNC HUB STATE & HANDLERS
  // ----------------------------------------------------
  const [syncMode, setSyncMode] = useState<"playlist" | "bulk">("playlist");
  const [syncUrl, setSyncUrl] = useState("");
  const [syncBulkText, setSyncBulkText] = useState("");
  const [syncTargetCourseId, setSyncTargetCourseId] = useState("");
  const [syncFirstIsFree, setSyncFirstIsFree] = useState(true);
  const [syncValidityDays, setSyncValidityDays] = useState(30);
  const [isFetchingSync, setIsFetchingSync] = useState(false);
  const [syncFetchError, setSyncFetchError] = useState<string | null>(null);
  const [syncFetchedVideos, setSyncFetchedVideos] = useState<PlaylistItem[]>([]);
  const [syncPlaylistMeta, setSyncPlaylistMeta] = useState<{
    title: string;
    author: string;
    thumbnailUrl: string;
    totalItems: number;
  } | null>(null);
  const [isExecutingSync, setIsExecutingSync] = useState(false);
  const [syncCreateNewCourse, setSyncCreateNewCourse] = useState(false);
  const [syncNewCourseTitle, setSyncNewCourseTitle] = useState("");
  const [syncNewCourseCategory, setSyncNewCourseCategory] = useState("memory");
  const [syncNewCoursePrice, setSyncNewCoursePrice] = useState(999);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const liveCourses = await fetchDbCourses();
      const loadedCourses = liveCourses && liveCourses.length > 0 ? liveCourses : getStaffCourses();
      setCourses(loadedCourses);
      if (loadedCourses.length > 0) {
        setSyncTargetCourseId((prev) => prev || loadedCourses[0].id);
      }

      const liveVideos = await fetchDbVideos();
      const loadedVideos = liveVideos && liveVideos.length > 0 ? liveVideos : getStoredVideos();
      setVideos(loadedVideos);

      const dynamicCategories = getCategories();
      setCategories(dynamicCategories);

      setRecycleCount(getRecycleBinItems().length);
    } catch (e) {
      console.error("Content studio data fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleCategoryChange = () => setCategories(getCategories());
    const handleRecycleChange = () => setRecycleCount(getRecycleBinItems().length);
    const handleStaffChange = () => setStaff(getCurrentStaff());

    window.addEventListener("mma_categories_changed", handleCategoryChange);
    window.addEventListener("mindmaster_categories_updated", handleCategoryChange);
    window.addEventListener("mma_recycle_bin_changed", handleRecycleChange);
    window.addEventListener("mma_staff_changed", handleStaffChange);

    return () => {
      window.removeEventListener("mma_categories_changed", handleCategoryChange);
      window.removeEventListener("mindmaster_categories_updated", handleCategoryChange);
      window.removeEventListener("mma_recycle_bin_changed", handleRecycleChange);
      window.removeEventListener("mma_staff_changed", handleStaffChange);
    };
  }, []);

  // Calculate Student-Relative Validity
  const getEffectiveValidity = () => {
    if (validityMode === "preset") {
      const p = VALIDITY_PRESETS.find((x) => x.id === selectedPresetId) || VALIDITY_PRESETS[2];
      return {
        label: isMarathi ? p.labelMr : p.labelEn,
        days: p.days,
        months: p.months,
      };
    }
    if (validityMode === "custom_days") {
      const days = Math.max(1, customDays);
      const months = Math.max(1, Math.round(days / 30));
      return {
        label: isMarathi ? `${days} दिवस` : `${days} Days`,
        days,
        months,
      };
    }
    if (validityMode === "custom_months") {
      const months = Math.max(1, customMonths);
      const days = months * 30;
      return {
        label: isMarathi ? `${months} महिने` : `${months} Months`,
        days,
        months,
      };
    }
    return {
      label: isMarathi ? "३ महिने" : "3 Months",
      days: 90,
      months: 3,
    };
  };

  // Open Course Studio
  const handleOpenCourseStudio = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormCode(course.code || "MM-01");
      setFormTitle(course.title || "");
      setFormTitleMr(course.titleMr || course.title || "");
      setTargetCategoryKey(course.category || (categories[0]?.key || ""));
      setFormDescription(course.description || "");
      setFormThumbnail(course.imageSrc || "");
      setIsFree(Boolean(course.isFree || course.pricePaise === 0));
      setFormPrice(Math.round((course.pricePaise || 99900) / 100));
      setFormOriginalPrice(Math.round((course.originalPricePaise || 299900) / 100));
      setFormVisibility(course.status === "draft" ? "draft" : "live");
      setSelectedStandards(course.standards || []);

      if (course.validityDays && course.validityDays !== course.accessMonths * 30) {
        setValidityMode("custom_days");
        setCustomDays(course.validityDays);
      } else {
        const matched = VALIDITY_PRESETS.find((p) => p.months === (course.accessMonths || 3));
        if (matched) {
          setValidityMode("preset");
          setSelectedPresetId(matched.id);
        } else {
          setValidityMode("custom_months");
          setCustomMonths(course.accessMonths || 3);
        }
      }
    } else {
      setEditingCourse(null);
      setFormCode(generateNextCourseCode(courses));
      setFormTitle("");
      setFormTitleMr("");
      setTargetCategoryKey(categories[0]?.key || "");
      setFormDescription("");
      setFormThumbnail("");
      setIsFree(false);
      setFormPrice(999);
      setFormOriginalPrice(2999);
      setFormVisibility("live");
      setSelectedStandards([]);
      setValidityMode("preset");
      setSelectedPresetId("3_months");
    }

    setYoutubeInputUrl("");
    setYtFetchError(null);
    setYtFetchSuccess(null);
    setFetchedPlaylistVideos([]);
    setStudioMode("course_studio");
  };

  // Open Video Studio
  const handleOpenVideoStudio = (video?: ExtendedVideoRow) => {
    if (video) {
      setEditingVideo(video);
      setVideoTargetCourseId(video.courseId || courses[0]?.id || "");
      setVideoLink(video.videoType === "youtube" ? `https://youtube.com/watch?v=${video.videoId}` : video.videoId);
      setVideoTitle(video.title || "");
      setVideoPosition(video.position || 1);
      setVideoDurationMinutes(Math.max(1, Math.round((video.durationSec || 900) / 60)));
      setVideoIsFreePreview(Boolean(video.isFree));
      setVideoDescription(video.description || "");
    } else {
      setEditingVideo(null);
      setVideoTargetCourseId(courses[0]?.id || "");
      setVideoLink("");
      setVideoTitle("");
      setVideoPosition(videos.length + 1);
      setVideoDurationMinutes(15);
      setVideoIsFreePreview(false);
      setVideoDescription("");
    }
    setStudioMode("video_studio");
  };

  // YouTube Playlist / Single Video Fetcher
  const handleFetchYoutubeContent = async () => {
    if (!youtubeInputUrl.trim()) return;
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

      if (!res.ok || data.error) {
        setYtFetchError(data.error || (isMarathi ? "व्हिडिओ लिंक शोधता आली नाही." : "Could not fetch YouTube content."));
        return;
      }

      if (data.type === "playlist" && data.items && data.items.length > 0) {
        if (!formTitle) setFormTitle(data.title || "YouTube Masterclass Series");
        if (!formTitleMr) setFormTitleMr(data.title || "YouTube Masterclass Series");
        if (data.items[0]?.thumbnailUrl && !formThumbnail) {
          setFormThumbnail(data.items[0].thumbnailUrl);
        }

        const itemsWithSelection: FetchedPlaylistItem[] = data.items.map((it: any, idx: number) => ({
          videoId: it.videoId,
          title: it.title,
          durationSec: it.durationSec || 900,
          durationFormatted: it.durationFormatted || "15:00",
          thumbnailUrl: it.thumbnailUrl,
          position: idx + 1,
          isFree: idx === 0,
          selected: true,
        }));

        setFetchedPlaylistVideos(itemsWithSelection);
        setYtFetchSuccess(
          isMarathi
            ? `✓ ${data.items.length} व्हिडिओ सापडले! खालील लेक्चर्स तपासा.`
            : `✓ Found ${data.items.length} videos from YouTube Playlist!`
        );
      } else if (data.type === "video") {
        if (!formTitle) setFormTitle(data.title);
        if (!formTitleMr) setFormTitleMr(data.title);
        if (data.thumbnailUrl && !formThumbnail) setFormThumbnail(data.thumbnailUrl);

        setFetchedPlaylistVideos([
          {
            videoId: data.videoId,
            title: data.title,
            durationSec: data.durationSec || 900,
            durationFormatted: data.durationFormatted || "15:00",
            thumbnailUrl: data.thumbnailUrl,
            position: 1,
            isFree: true,
            selected: true,
          },
        ]);

        setYtFetchSuccess(
          isMarathi
            ? `✓ YouTube व्हिडिओ सापडला: "${data.title}"`
            : `✓ Fetched video: "${data.title}"`
        );
      }
    } catch (err: any) {
      setYtFetchError(err.message || (isMarathi ? "नेटवर्क त्रुटी आली." : "Network connection error."));
    } finally {
      setIsFetchingYt(false);
    }
  };

  // Save Course Handler
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error(isMarathi ? "कृपया कोर्सचे नाव टाका." : "Please enter course title.");
      return;
    }

    setIsSavingCourse(true);
    const validity = getEffectiveValidity();
    const courseId = editingCourse?.id || `course_${Date.now()}`;

    const newCourse: Course = {
      id: courseId,
      code: formCode.trim().toUpperCase() || "MM-01",
      title: formTitle.trim(),
      titleMr: formTitleMr.trim() || formTitle.trim(),
      subtitle: `${validity.label} Access • English & Marathi`,
      description: formDescription.trim() || "Complete comprehensive masterclass curriculum by Prashant Dhumal Sir.",
      headerTint: editingCourse?.headerTint || "sky",
      pricePaise: isFree ? 0 : Math.round(Number(formPrice) * 100),
      originalPricePaise: isFree ? 0 : Math.round(Number(formOriginalPrice) * 100),
      isFree: Boolean(isFree),
      accessMonths: validity.months,
      validityDays: validity.days,
      validityLabel: validity.label,
      status: formVisibility,
      badgeText: isFree ? "FREE" : "POPULAR",
      badgeType: isFree ? "free" : "popular",
      imageSrc: formThumbnail.trim() || "/assets/images/student_mindmaps_notebook.png",
      instructorName: "Prashant Dhumal",
      instructorTitle: "Director & Memory Coach",
      totalStudents: editingCourse?.totalStudents || 0,
      rating: editingCourse?.rating || 4.9,
      ratingCount: editingCourse?.ratingCount || 128,
      lessonsCount: editingCourse?.lessonsCount || fetchedPlaylistVideos.length || 1,
      totalDurationHours: editingCourse?.totalDurationHours || 2,
      category: targetCategoryKey as any,
      features: [
        `${validity.label} Personal Student Access`,
        "HD Video Lectures & Speed Drills",
        "Mind Mastery & Calculation Shortcuts",
        "Verified Academy Certificate",
      ],
      standards: selectedStandards.length > 0 ? selectedStandards : undefined,
      removeAt: null, // Critical: Course itself never expires in store
    };

    try {
      await saveCourseToSupabase(newCourse);

      // Save imported YouTube playlist videos if any
      const selectedVideos = fetchedPlaylistVideos.filter((v) => v.selected);
      if (selectedVideos.length > 0) {
        for (const vid of selectedVideos) {
          const lessonTitle = vid.title || "Lesson";
          const lessonRow: ExtendedVideoRow = {
            id: `yt_${vid.videoId}_${Date.now()}`,
            lessonId: `yt_${vid.videoId}_${Date.now()}`,
            lessonTitle,
            courseId: newCourse.id,
            courseTitle: newCourse.title,
            title: lessonTitle,
            durationSec: vid.durationSec,
            isFree: vid.isFree,
            videoType: "youtube",
            videoId: vid.videoId,
            position: vid.position,
            publishAt: new Date().toISOString(),
            removeAt: null,
            validityDays: 30,
            avgWatchPercent: 0,
            status: "active",
            views: 0,
            likesCount: 0,
          };
          await saveLessonToSupabase(lessonRow);
        }
        await syncCourseLessonCount(newCourse.id);
      }

      toast.success(
        isMarathi
          ? `✓ कोर्स "${newCourse.title}" यशस्वीपणे सेव्ह केला!`
          : `✓ Course "${newCourse.title}" saved successfully!`
      );
      setStudioMode("list");
      loadData();
    } catch (err: any) {
      toast.error(err.message || (isMarathi ? "कोर्स सेव्ह करताना त्रुटी आली." : "Failed to save course."));
    } finally {
      setIsSavingCourse(false);
    }
  };

  // Fetch Single Video Details Handler
  const handleFetchSingleVideoDetails = async () => {
    const cleanUrl = videoLink.trim();
    if (!cleanUrl) {
      toast.error(isMarathi ? "कृपया प्रथम YouTube व्हिडिओ URL टाका." : "Please enter YouTube video URL first.");
      return;
    }

    setIsFetchingVideoMeta(true);
    try {
      const res = await fetch("/api/youtube/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Could not fetch video details.");
      }

      const item = data.type === "video" ? data : data.items?.[0];
      if (item) {
        setVideoTitle(item.title || "");
        if (item.durationSec) {
          setVideoDurationMinutes(Math.max(1, Math.round(item.durationSec / 60)));
        }
        if (item.description) {
          setVideoDescription(item.description);
        }
        toast.success(
          isMarathi
            ? `✓ व्हिडिओ माहिती प्राप्त झाली: "${item.title}"`
            : `✓ Video details fetched: "${item.title}"`
        );
      }
    } catch (err: any) {
      toast.error(err.message || (isMarathi ? "व्हिडिओ माहिती फेच करताना त्रुटी आली." : "Failed to fetch video."));
    } finally {
      setIsFetchingVideoMeta(false);
    }
  };

  // Save Video Handler
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      toast.error(isMarathi ? "कृपया व्हिडिओचे शीर्षक टाका." : "Please enter video title.");
      return;
    }
    const extractedId = extractYouTubeVideoId(videoLink) || videoLink.trim();
    if (!extractedId) {
      toast.error(isMarathi ? "कृपया वैध YouTube URL टाका." : "Please enter valid YouTube link.");
      return;
    }

    setIsSavingVideo(true);
    const videoId = editingVideo?.id || `yt_${extractedId}_${Date.now()}`;
    const vTitle = videoTitle.trim();
    const targetCourse = courses.find((c) => c.id === (videoTargetCourseId || courses[0]?.id));
    const lessonRow: ExtendedVideoRow = {
      id: videoId,
      lessonId: videoId,
      lessonTitle: vTitle,
      courseId: videoTargetCourseId || courses[0]?.id || "",
      courseTitle: targetCourse?.title || "Course",
      title: vTitle,
      durationSec: Math.max(60, videoDurationMinutes * 60),
      isFree: videoIsFreePreview,
      videoType: "youtube",
      videoId: extractedId,
      position: Number(videoPosition) || 1,
      description: videoDescription.trim(),
      publishAt: editingVideo?.publishAt || new Date().toISOString(),
      removeAt: null,
      validityDays: 30,
      avgWatchPercent: editingVideo?.avgWatchPercent || 0,
      status: "active",
      views: editingVideo?.views || 0,
      likesCount: editingVideo?.likesCount || 0,
    };

    try {
      await saveLessonToSupabase(lessonRow);
      if (lessonRow.courseId) {
        await syncCourseLessonCount(lessonRow.courseId);
      }

      toast.success(
        isMarathi
          ? `✓ व्हिडिओ "${lessonRow.title}" यशस्वीपणे सेव्ह केला!`
          : `✓ Video "${lessonRow.title}" saved successfully!`
      );
      setStudioMode("list");
      loadData();
    } catch (err: any) {
      toast.error(err.message || (isMarathi ? "व्हिडिओ सेव्ह करताना त्रुटी आली." : "Failed to save video."));
    } finally {
      setIsSavingVideo(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    setIsDeleting(true);

    try {
      if (deleteModalItem.type === "course") {
        const targetCourse = courses.find((c) => c.id === deleteModalItem.id);
        if (targetCourse) {
          addToRecycleBin({
            itemType: "course",
            itemId: targetCourse.id,
            title: targetCourse.title,
            subtitle: `Code: ${targetCourse.code || "MM"}`,
            data: targetCourse,
          });
        }
        await deleteCourseFromSupabase(deleteModalItem.id);
      } else if (deleteModalItem.type === "video") {
        const targetVideo = videos.find((v) => v.id === deleteModalItem.id);
        if (targetVideo) {
          addToRecycleBin({
            itemType: "video",
            itemId: targetVideo.id,
            title: targetVideo.title || targetVideo.lessonTitle || "Untitled Video",
            subtitle: `Duration: ${Math.round(targetVideo.durationSec / 60)}m`,
            data: targetVideo,
          });
        }
        await deleteLessonFromSupabase(deleteModalItem.id, targetVideo?.courseId || "");
        if (targetVideo?.courseId) {
          await syncCourseLessonCount(targetVideo.courseId);
        }
      } else if (deleteModalItem.type === "category") {
        deleteCategory(deleteModalItem.id);
      }

      setUndoToast({
        id: deleteModalItem.id,
        title: deleteModalItem.title,
        itemType: deleteModalItem.type,
      });

      toast.success(
        isMarathi
          ? `🗑️ "${deleteModalItem.title}" रीसायकल बिनमध्ये हलवले.`
          : `🗑️ "${deleteModalItem.title}" moved to Recycle Bin.`
      );

      setDeleteModalItem(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ----------------------------------------------------
  // YOUTUBE PLAYLIST SYNC LOGIC
  // ----------------------------------------------------
  const handleFetchSyncPlaylist = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = syncUrl.trim();
    if (!cleanUrl) {
      setSyncFetchError(isMarathi ? "कृपया YouTube प्लेलिस्ट URL किंवा ID टाका." : "Please enter a YouTube playlist URL or ID.");
      return;
    }

    setIsFetchingSync(true);
    setSyncFetchError(null);

    try {
      const res = await fetch("/api/youtube/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl: cleanUrl }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to fetch YouTube playlist.");
      }

      if (data.items && data.items.length > 0) {
        const mapped: PlaylistItem[] = data.items.map((it: any, idx: number) => ({
          id: `yt-sync-${it.videoId}-${idx}`,
          videoId: it.videoId,
          title: it.title || `Lesson ${idx + 1}`,
          description: it.description || "",
          durationSec: it.durationSec || 900,
          durationFormatted: it.durationFormatted || "15:00",
          thumbnailUrl: it.thumbnailUrl || `https://i.ytimg.com/vi/${it.videoId}/hqdefault.jpg`,
          selected: true,
        }));

        setSyncFetchedVideos(mapped);
        setSyncPlaylistMeta({
          title: data.title || "YouTube Course Playlist",
          author: data.author || "Prashant Dhumal",
          thumbnailUrl: data.thumbnailUrl || mapped[0]?.thumbnailUrl || "",
          totalItems: mapped.length,
        });

        if (!syncNewCourseTitle) {
          setSyncNewCourseTitle(data.title || "New Video Batch");
        }

        toast.success(
          isMarathi
            ? `✓ प्लेलिस्ट सापडली! ${mapped.length} व्हिडिओ प्राप्त झाले.`
            : `✓ Playlist found! Retrieved ${mapped.length} lessons.`
        );
      } else {
        throw new Error(isMarathi ? "या प्लेलिस्टमध्ये कोणतेही व्हिडिओ सापडले नाहीत." : "No videos found in this playlist.");
      }
    } catch (err: any) {
      setSyncFetchError(err.message || (isMarathi ? "प्लेलिस्ट फेच करताना त्रुटी आली." : "Error fetching playlist."));
      toast.error(err.message || (isMarathi ? "प्लेलिस्ट फेच करताना त्रुटी आली." : "Error fetching playlist."));
    } finally {
      setIsFetchingSync(false);
    }
  };

  const handleParseBulkText = () => {
    if (!syncBulkText.trim()) {
      toast.error(isMarathi ? "कृपया किमान एक YouTube URL पेस्ट करा." : "Please paste at least one YouTube link.");
      return;
    }

    const parsed = parseBulkYouTubeLinks(syncBulkText);
    if (parsed.length === 0) {
      toast.error(isMarathi ? "पेस्ट केलेल्या मजकुरात वैध YouTube लिंक्स सापडल्या नाहीत." : "No valid YouTube links found in the text.");
      return;
    }

    setSyncFetchedVideos(parsed);
    setSyncPlaylistMeta({
      title: "Bulk Pasted Lessons",
      author: staff.name || "Admin",
      thumbnailUrl: parsed[0]?.thumbnailUrl || "",
      totalItems: parsed.length,
    });

    toast.success(
      isMarathi
        ? `✓ ${parsed.length} व्हिडिओ यशस्वीपणे एक्सट्रॅक्ट केले!`
        : `✓ Extracted ${parsed.length} lessons from text!`
    );
  };

  const handleToggleSelectAllSync = () => {
    const allSelected = syncFetchedVideos.every((v) => v.selected);
    setSyncFetchedVideos(syncFetchedVideos.map((v) => ({ ...v, selected: !allSelected })));
  };

  const handleToggleVideoSelect = (idx: number) => {
    const updated = [...syncFetchedVideos];
    updated[idx] = { ...updated[idx], selected: !updated[idx].selected };
    setSyncFetchedVideos(updated);
  };

  const handleExecuteSync = async () => {
    const selected = syncFetchedVideos.filter((v) => v.selected);
    if (selected.length === 0) {
      toast.error(isMarathi ? "कृपया सिंक करण्यासाठी किमान एक व्हिडिओ निवडा." : "Please select at least one lesson to sync.");
      return;
    }

    let targetCourseId = syncTargetCourseId;
    let targetCourseTitle = "";

    setIsExecutingSync(true);

    try {
      if (syncCreateNewCourse) {
        if (!syncNewCourseTitle.trim()) {
          toast.error(isMarathi ? "कृपया नवीन कोर्सचे नाव प्रविष्ट करा." : "Please enter new course title.");
          setIsExecutingSync(false);
          return;
        }

        const newId = `c_yt_${Date.now()}`;
        const newCourse: Course = {
          id: newId,
          code: `YT-${Math.floor(100 + Math.random() * 900)}`,
          title: syncNewCourseTitle.trim(),
          titleMr: syncNewCourseTitle.trim(),
          subtitle: syncPlaylistMeta?.author ? `By ${syncPlaylistMeta.author}` : "YouTube Lecture Series",
          description: syncPlaylistMeta?.title || "Imported YouTube course playlist batch.",
          headerTint: "sky",
          pricePaise: syncNewCoursePrice * 100,
          originalPricePaise: syncNewCoursePrice * 200,
          isFree: syncNewCoursePrice === 0,
          accessMonths: 3,
          status: "live",
          badgeText: "NEW",
          badgeType: "new",
          imageSrc: syncPlaylistMeta?.thumbnailUrl || selected[0]?.thumbnailUrl || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
          instructorName: "Prashant Dhumal",
          instructorTitle: "Mind & Memory Expert",
          totalStudents: 0,
          rating: 5.0,
          ratingCount: 1,
          lessonsCount: selected.length,
          totalDurationHours: Number((selected.reduce((acc, v) => acc + (v.durationSec || 900), 0) / 3600).toFixed(1)),
          category: (syncNewCourseCategory as any) || "memory",
          features: ["Full Video Lectures", "Certificate upon completion", "Lifetime access support"],
          publishAt: new Date().toISOString(),
          removeAt: null,
          validityDays: syncValidityDays,
          validityLabel: `${syncValidityDays} Days`,
          youtubeUrl: syncUrl.trim() || undefined,
          youtubePlaylistId: syncUrl ? extractYouTubeVideoId(syncUrl) || undefined : undefined,
        };

        await saveCourseToSupabase(newCourse);
        targetCourseId = newId;
        targetCourseTitle = newCourse.title;
      } else {
        const found = courses.find((c) => c.id === targetCourseId);
        if (!found) {
          toast.error(isMarathi ? "कृपया लक्ष्य कोर्स निवडा." : "Please select target course.");
          setIsExecutingSync(false);
          return;
        }
        targetCourseTitle = found.title;
      }

      const existingCourseVideos = videos.filter((v) => v.courseId === targetCourseId);
      const startPos = existingCourseVideos.length;

      for (let idx = 0; idx < selected.length; idx++) {
        const it = selected[idx];
        const isFirst = idx === 0 && startPos === 0;
        const lessonRow: ExtendedVideoRow = {
          id: `vid_sync_${it.videoId}_${Date.now()}_${idx}`,
          lessonId: `les_sync_${it.videoId}_${startPos + idx + 1}`,
          lessonTitle: it.title,
          courseId: targetCourseId,
          courseTitle: targetCourseTitle,
          title: it.title,
          durationSec: it.durationSec || 900,
          isFree: isFirst ? syncFirstIsFree : false,
          videoType: "youtube",
          videoId: it.videoId,
          position: startPos + idx + 1,
          description: it.description || "",
          publishAt: new Date().toISOString(),
          removeAt: null,
          validityDays: syncValidityDays,
          avgWatchPercent: 0,
          status: "active",
          views: 0,
          likesCount: 0,
        };
        await saveLessonToSupabase(lessonRow);
      }

      await syncCourseLessonCount(targetCourseId);

      logStaffAction(
        "PLAYLIST_SYNC",
        "video",
        targetCourseId,
        targetCourseTitle,
        `Synced ${selected.length} YouTube lessons into course "${targetCourseTitle}"`
      );

      toast.success(
        isMarathi
          ? `✓ अभिनंदन! ${selected.length} लेक्चर्स "${targetCourseTitle}" मध्ये यशस्वीपणे सिंक झाले!`
          : `✓ Success! Synced ${selected.length} lessons into "${targetCourseTitle}"!`
      );

      setSyncFetchedVideos([]);
      setSyncPlaylistMeta(null);
      setSyncUrl("");
      setSyncBulkText("");
      await loadData();
      setActiveTab("videos");
    } catch (err: any) {
      toast.error(err.message || (isMarathi ? "सिंक करताना त्रुटी आली." : "Failed to sync lessons."));
    } finally {
      setIsExecutingSync(false);
    }
  };

  const handleQuickSyncCourse = (c: Course) => {
    setSyncTargetCourseId(c.id);
    setSyncCreateNewCourse(false);
    if (c.youtubeUrl) {
      setSyncUrl(c.youtubeUrl);
    }
    setActiveTab("sync");
  };

  // Filtered & Sorted Courses
  const filteredCourses = useMemo(() => {
    return courses
      .filter((c) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          c.title?.toLowerCase().includes(q) ||
          c.titleMr?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q);

        const matchesCat =
          categoryFilter === "all" ||
          c.category?.toLowerCase() === categoryFilter.toLowerCase();

        const matchesVis =
          visibilityFilter === "all" ||
          (visibilityFilter === "live" && c.status === "live") ||
          (visibilityFilter === "draft" && c.status === "draft") ||
          (visibilityFilter === "unlisted" && c.status === "unlisted");

        return matchesQuery && matchesCat && matchesVis;
      })
      .sort((a, b) => {
        if (sortOption === "title_asc") return (a.title || "").localeCompare(b.title || "");
        if (sortOption === "students_desc") return (b.totalStudents || 0) - (a.totalStudents || 0);
        return 0; // Default order
      });
  }, [courses, searchQuery, categoryFilter, visibilityFilter, sortOption]);

  // Filtered & Sorted Videos
  const filteredVideos = useMemo(() => {
    return videos
      .filter((v) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          v.title?.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q);

        const matchesCat =
          categoryFilter === "all" ||
          courses.find((c) => c.id === v.courseId)?.category?.toLowerCase() === categoryFilter.toLowerCase();

        const matchesVis =
          visibilityFilter === "all" ||
          (visibilityFilter === "live" && v.status === "active") ||
          (visibilityFilter === "draft" && v.status === "draft");

        return matchesQuery && matchesCat && matchesVis;
      })
      .sort((a, b) => {
        if (sortOption === "title_asc") return (a.title || "").localeCompare(b.title || "");
        if (sortOption === "views_desc") return (b.views || 0) - (a.views || 0);
        return (a.position || 0) - (b.position || 0);
      });
  }, [videos, courses, searchQuery, categoryFilter, visibilityFilter, sortOption]);

  // -------------------------------------------------------------------------
  // RENDER: INLINE COURSE STUDIO (ZERO SLIDE DRAWERS)
  // -------------------------------------------------------------------------
  if (studioMode === "course_studio") {
    const validity = getEffectiveValidity();

    return (
      <AdminShell>
        <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans">
          {/* Top Sticky Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStudioMode("list")}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isMarathi ? "← यादीकडे परत जा" : "← Back to Content Studio"}</span>
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {editingCourse
                      ? isMarathi ? `कोर्स संपादन: ${editingCourse.code || "MM"}` : `Edit Course: ${editingCourse.code || "MM"}`
                      : isMarathi ? "नवीन कोर्स स्टुडिओ (Create Course)" : "Create New Course"}
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isMarathi
                    ? "कोर्सचे तपशील, युट्यूब व्हिडिओ, फी व वैधता संपादित करा. बदल थेट विद्यार्थी पोर्टलवर लागू होतात."
                    : "Configure curriculum, instant YouTube imports, pricing, and student-relative validity."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStudioMode("list")}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                {isMarathi ? "रद्द करा" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSaveCourse}
                disabled={isSavingCourse}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isMarathi ? "💾 कोर्स सेव्ह करा" : "Save Course"}</span>
              </button>
            </div>
          </div>

          {/* 2-Column YouTube Studio Editor */}
          <form onSubmit={handleSaveCourse} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Main Details, YouTube Import & Curriculum */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Basic Metadata */}
              <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>{isMarathi ? "कोर्सची प्राथमिक माहिती" : "Course Details"}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isMarathi ? "कोर्स कोड *" : "Course Code *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="e.g. MM-01"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isMarathi ? "कोर्सचे नाव (English) *" : "Course Title (English) *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Memory Science & Superfast Vedic Maths Masterclass"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isMarathi ? "कोर्सचे नाव (मराठी) *" : "Course Title (Marathi Alternative)"}
                  </label>
                  <input
                    type="text"
                    value={formTitleMr}
                    onChange={(e) => setFormTitleMr(e.target.value)}
                    placeholder="उदा. मेमरी सायन्स व सुपरफास्ट वैदिक गणित मास्टरक्लास"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isMarathi ? "कोर्सचे सविस्तर वर्णन *" : "Description & Learning Outcomes"}
                  </label>
                  <textarea
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe syllabus, techniques, key benefits, and who this course is designed for..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Card 2: YouTube Instant Import & Auto-Discovery */}
              <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <YoutubeIcon className="w-5 h-5 text-red-600" />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {isMarathi ? "युट्यूब ऑटो-इम्पोर्ट (Single Video किंवा Playlist)" : "YouTube Auto-Import (Playlist or Single Video)"}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isMarathi
                          ? "युट्यूब लिंक पेस्ट करा — सिस्टीम आपोआप सर्व लेक्चर्स, थंबनेल्स आणि कालावधी आयात करेल."
                          : "Paste YouTube link to instantly extract lessons, titles, durations, and HD thumbnails."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={youtubeInputUrl}
                    onChange={(e) => setYoutubeInputUrl(e.target.value)}
                    placeholder="https://www.youtube.com/playlist?list=... or https://youtu.be/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleFetchYoutubeContent}
                    disabled={isFetchingYt || !youtubeInputUrl.trim()}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isFetchingYt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isMarathi ? "इम्पोर्ट करा" : "Auto-Fetch"}</span>
                  </button>
                </div>

                {ytFetchError && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{ytFetchError}</span>
                  </p>
                )}
                {ytFetchSuccess && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{ytFetchSuccess}</span>
                  </p>
                )}

                {/* Fetched Playlist Videos Table */}
                {fetchedPlaylistVideos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{isMarathi ? `आयात केलेले लेक्चर्स (${fetchedPlaylistVideos.length})` : `Imported Lessons (${fetchedPlaylistVideos.length})`}</span>
                      <span className="text-[11px] text-blue-600">
                        {isMarathi ? "पहिले व्याख्यान मोफत डेमो म्हणून चिन्हांकित केले आहे" : "1st lecture marked as Free Demo Preview"}
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/40">
                      {fetchedPlaylistVideos.map((vid, idx) => (
                        <div key={vid.videoId + idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={vid.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFetchedPlaylistVideos((prev) =>
                                  prev.map((v, i) => (i === idx ? { ...v, selected: checked } : v))
                                );
                              }}
                              className="rounded text-blue-600 cursor-pointer"
                            />
                            <span className="font-mono text-slate-400 text-[10px] w-5">#{idx + 1}</span>
                            <span className="font-bold text-slate-800 dark:text-white truncate max-w-xs">{vid.title}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-500 font-mono">{vid.durationFormatted}</span>
                            <label className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={vid.isFree}
                                onChange={(e) => {
                                  const isFreeVal = e.target.checked;
                                  setFetchedPlaylistVideos((prev) =>
                                    prev.map((v, i) => (i === idx ? { ...v, isFree: isFreeVal } : v))
                                  );
                                }}
                                className="rounded text-emerald-600"
                              />
                              <span>Demo</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Custom Thumbnail, Dynamic Category, Validity & Pricing */}
            <div className="space-y-6">
              {/* Card 3: Dynamic Category & Visibility */}
              <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Tag className="w-4 h-4 text-purple-600" />
                  <span>{isMarathi ? "प्रवर्ग व प्रसिद्धी (Category & Visibility)" : "Category & Visibility"}</span>
                </h3>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isMarathi ? "प्रवर्ग (Category) *" : "Dynamic Category *"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      {isMarathi ? "+ नवीन प्रवर्ग" : "+ Manage Categories"}
                    </button>
                  </div>
                  <select
                    value={targetCategoryKey}
                    onChange={(e) => setTargetCategoryKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">{isMarathi ? "प्रवर्ग निवडा (Select Category)" : "Select Category"}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.key || cat.id}>
                        {cat.label} ({cat.badge})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isMarathi ? "प्रसिद्धी स्थिती (Visibility)" : "Publish Status"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "live", label: isMarathi ? "🟢 Public" : "🟢 Published" },
                      { key: "unlisted", label: isMarathi ? "⚪ Unlisted" : "⚪ Unlisted" },
                      { key: "draft", label: isMarathi ? "🟡 Draft" : "🟡 Draft" },
                    ].map((status) => (
                      <button
                        key={status.key}
                        type="button"
                        onClick={() => setFormVisibility(status.key as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                          formVisibility === status.key
                            ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-500"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Thumbnail Upload / URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isMarathi ? "कस्टम थंबनेल (HD Image URL)" : "Custom Thumbnail URL"}
                  </label>
                  <input
                    type="url"
                    value={formThumbnail}
                    onChange={(e) => setFormThumbnail(e.target.value)}
                    placeholder="https://... or /assets/images/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 mb-2"
                  />
                  {formThumbnail ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                      <Image src={formThumbnail} alt="Thumbnail preview" fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40">
                      <Film className="w-6 h-6 mb-1 text-slate-300" />
                      <span>{isMarathi ? "थंबनेल प्रिव्ह्यू" : "16:9 Thumbnail Preview"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: STUDENT-RELATIVE COURSE VALIDITY (PER-ENROLLMENT EXPIRY) */}
              <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{isMarathi ? "विद्यार्थी ऍक्सेस वैधता (Student Validity)" : "Student Validity Duration"}</span>
                  </h3>
                  <div className="mt-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                    <span>
                      {isMarathi
                        ? "विद्यार्थी-सापेक्ष वैधता: निवडलेला कालावधी विद्यार्थ्याच्या प्रवेशाच्या किंवा खरेदीच्या वेळेपासून मोजला जातो. कोर्स ॲकॅडमी स्टोअरमध्ये कायमस्वरूपी उपलब्ध राहतो."
                        : "Per-Enrollment Countdown: Access duration counts down strictly from each student's personal enrollment timestamp. The course itself never expires in the store."}
                    </span>
                  </div>
                </div>

                {/* Validity Mode Selector */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setValidityMode("preset")}
                    className={`py-1.5 rounded-lg transition ${
                      validityMode === "preset" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isMarathi ? "प्रीसेट" : "Presets"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidityMode("custom_months")}
                    className={`py-1.5 rounded-lg transition ${
                      validityMode === "custom_months" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isMarathi ? "महिने" : "Months"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidityMode("custom_days")}
                    className={`py-1.5 rounded-lg transition ${
                      validityMode === "custom_days" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isMarathi ? "दिवस" : "Days"}
                  </button>
                </div>

                {validityMode === "preset" && (
                  <div className="grid grid-cols-2 gap-2">
                    {VALIDITY_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPresetId(p.id)}
                        className={`p-2 rounded-xl text-xs font-bold border transition text-left cursor-pointer ${
                          selectedPresetId === p.id
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-500"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div>{isMarathi ? p.labelMr : p.labelEn}</div>
                        <div className="text-[10px] text-slate-400">{p.days} days access</div>
                      </button>
                    ))}
                  </div>
                )}

                {validityMode === "custom_months" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isMarathi ? "वैधतेचे महिने (Months) *" : "Number of Months *"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={customMonths}
                      onChange={(e) => setCustomMonths(Number(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}

                {validityMode === "custom_days" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isMarathi ? "वैधतेचे दिवस (Days) *" : "Number of Days *"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1825}
                      value={customDays}
                      onChange={(e) => setCustomDays(Number(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {isMarathi ? `निवडलेली विद्यार्थी मुदत: ${validity.label}` : `Effective Student Access: ${validity.label}`}
                </div>
              </div>

              {/* Card 5: Pricing & MRP */}
              <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isMarathi ? "फी आणि किंमत" : "Pricing & Fees"}
                  </h3>
                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>{isMarathi ? "मोफत कोर्स (100% Free)" : "Free Course"}</span>
                  </label>
                </div>

                {!isFree && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {isMarathi ? "विक्री किंमत (₹ Offer) *" : "Discounted Fee (₹) *"}
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {isMarathi ? "मूळ किंमत (₹ MRP) *" : "Original MRP (₹) *"}
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formOriginalPrice}
                        onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </AdminShell>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: INLINE VIDEO STUDIO (ZERO SLIDE DRAWERS)
  // -------------------------------------------------------------------------
  if (studioMode === "video_studio") {
    return (
      <AdminShell>
        <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans">
          {/* Top Sticky Header */}
          <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStudioMode("list")}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isMarathi ? "← यादीकडे परत जा" : "← Back to Content Studio"}</span>
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-red-600" />
                  <span>
                    {editingVideo
                      ? isMarathi ? `व्हिडिओ संपादन: ${editingVideo.title}` : `Edit Video: ${editingVideo.title}`
                      : isMarathi ? "नवीन व्हिडिओ लेक्चर जोडा" : "Upload / Add Video Lecture"}
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStudioMode("list")}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                {isMarathi ? "रद्द करा" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSaveVideo}
                disabled={isSavingVideo}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isMarathi ? "व्हिडिओ सेव्ह करा" : "Save Video"}</span>
              </button>
            </div>
          </div>

          {/* Video Edit Form */}
          <form onSubmit={handleSaveVideo} className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isMarathi ? "संबंधित कोर्स (Target Course) *" : "Target Course Batch *"}
              </label>
              <select
                required
                value={videoTargetCourseId}
                onChange={(e) => setVideoTargetCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code || "MM"} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isMarathi ? "YouTube व्हिडिओ लिंक किंवा Video ID *" : "YouTube Video Link or ID *"}
                </label>
                <button
                  type="button"
                  onClick={handleFetchSingleVideoDetails}
                  disabled={isFetchingVideoMeta || !videoLink.trim()}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  {isFetchingVideoMeta ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  <span>{isMarathi ? "माहिती ऑटो-फेच करा" : "Auto-Fetch Details"}</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ किंवा dQw4w9WgXcQ"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleFetchSingleVideoDetails}
                  disabled={isFetchingVideoMeta || !videoLink.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isFetchingVideoMeta ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>{isMarathi ? "फेच" : "Fetch"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isMarathi ? "लेक्चर शीर्षक (Lesson Title) *" : "Lesson Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Session 01: Mental Math Foundations"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isMarathi ? "कालावधी (मिनिटे) *" : "Duration (Minutes) *"}
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={videoDurationMinutes}
                  onChange={(e) => setVideoDurationMinutes(Number(e.target.value) || 15)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  {isMarathi ? "मोफत डेमो प्रिव्ह्यू (Free Demo Preview)" : "Free Demo Preview"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isMarathi ? "विद्यार्थी कोर्स खरेदी करण्यापूर्वी हे व्याख्यान विनामूल्य पाहू शकतात." : "Learners can stream this lesson before enrolling."}
                </span>
              </div>
              <input
                type="checkbox"
                checked={videoIsFreePreview}
                onChange={(e) => setVideoIsFreePreview(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isMarathi ? "लेक्चरच्या नोट्स / वर्णन" : "Lesson Notes / Description"}
              </label>
              <textarea
                rows={3}
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="Key concepts, practice exercises, timestamps..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </form>
        </div>
      </AdminShell>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: YOUTUBE STUDIO "CONTENT STUDIO" MAIN VIEW
  // -------------------------------------------------------------------------
  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>{isMarathi ? "कंटेंट स्टुडिओ (Content Studio)" : "Channel Content Studio"}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isMarathi
                ? "कोर्सेस, व्हिडिओ लेक्चर्स आणि डायनॅमिक प्रवर्गांचे एकाच डॅशबोर्डवरून सुलभ व्यवस्थापन."
                : "YouTube Studio-style central management for courses, video lectures, and dynamic categories."}
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2">
            {activeTab === "courses" && (
              <button
                type="button"
                onClick={() => handleOpenCourseStudio()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isMarathi ? "+ नवीन कोर्स तयार करा" : "+ Create Course"}</span>
              </button>
            )}

            {activeTab === "videos" && (
              <button
                type="button"
                onClick={() => handleOpenVideoStudio()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isMarathi ? "+ नवीन व्हिडिओ जोडा" : "+ Add Video"}</span>
              </button>
            )}

            {activeTab === "sync" && (
              <button
                type="button"
                onClick={() => {
                  setSyncUrl("");
                  setSyncBulkText("");
                  setSyncFetchedVideos([]);
                  setSyncPlaylistMeta(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isMarathi ? "नवीन सिंक सुरू करा" : "New Playlist Sync"}</span>
              </button>
            )}

            {activeTab === "categories" && (
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isMarathi ? "+ नवीन प्रवर्ग तयार करा" : "+ Add Category"}</span>
              </button>
            )}

            {/* Recycle Bin Button */}
            <button
              type="button"
              onClick={() => setIsRecycleBinOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Recycle Bin"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{isMarathi ? "कचरापेटी" : "Trash"}</span>
              {recycleCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">
                  {recycleCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Undo Toast */}
        {undoToast && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span>
              {isMarathi ? `"${undoToast.title}" कचरापेटीत हलवले.` : `"${undoToast.title}" moved to trash.`}
            </span>
            <button
              onClick={() => {
                restoreFromRecycleBin(undoToast.id);
                setUndoToast(null);
                loadData();
              }}
              className="text-emerald-700 dark:text-emerald-300 underline cursor-pointer"
            >
              {isMarathi ? "पूर्ववत करा (Undo)" : "Undo"}
            </button>
          </div>
        )}

        {/* Segmented Top Tabs (YouTube Studio Layout) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("courses")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "courses"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isMarathi ? "कोर्सेस (Structured Batches)" : "Courses (Structured Batches)"}</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${activeTab === "courses" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
              {courses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("videos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "videos"
                ? "bg-red-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{isMarathi ? "व्हिडिओ लेक्चर्स लायब्ररी" : "Videos (Lectures Library)"}</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${activeTab === "videos" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
              {videos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sync")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "sync"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>{isMarathi ? "YouTube प्लेलिस्ट सिंक" : "YouTube Playlist Sync"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === "sync" ? "bg-white/20 text-white" : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"}`}>
              AUTO
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "categories"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{isMarathi ? "प्रवर्ग (Categories)" : "Categories"}</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${activeTab === "categories" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
              {categories.length}
            </span>
          </button>
        </div>

        {/* Advanced Filter & Search Bar */}
        {activeTab !== "sync" && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-[#1E293B] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isMarathi ? "नाव, वर्णन किंवा कोडने शोधा..." : "Filter by title, description, or code..."}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Dynamic Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="all">{isMarathi ? "सर्व प्रवर्ग (All Categories)" : "All Categories"}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.key || cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility / Sort Filter */}
            <div>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="date_desc">{isMarathi ? "नवीनतम आधी (Newest)" : "Date (Newest First)"}</option>
                <option value="title_asc">{isMarathi ? "नाव (A-Z)" : "Title (A to Z)"}</option>
                {activeTab === "courses" && <option value="students_desc">{isMarathi ? "विद्यार्थी संख्या (Most Enrolled)" : "Enrolled Students"}</option>}
                {activeTab === "videos" && <option value="views_desc">{isMarathi ? "सर्वाधिक व्ह्यूज (Most Views)" : "Views (Highest First)"}</option>}
              </select>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 1: COURSES TABLE (YOUTUBE STUDIO DATA TABLE) */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "courses" && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{isMarathi ? "कोर्स" : "Course"}</th>
                    <th className="py-3 px-3">{isMarathi ? "प्रवर्ग" : "Category"}</th>
                    <th className="py-3 px-3">{isMarathi ? "स्थिती" : "Visibility"}</th>
                    <th className="py-3 px-3">{isMarathi ? "विद्यार्थी मुदत" : "Student Validity"}</th>
                    <th className="py-3 px-3">{isMarathi ? "किंमत" : "Price"}</th>
                    <th className="py-3 px-3">{isMarathi ? "विद्यार्थी" : "Students"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold">{isMarathi ? "कोणतेही कोर्सेस सापडले नाहीत." : "No courses found."}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((c) => {
                      const matchedCat = categories.find((cat) => cat.key === c.category || cat.id === c.category);

                      return (
                        <tr key={c.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                          {/* Course Thumbnail + Title + Hover Actions */}
                          <td className="py-3.5 px-4 min-w-[280px] max-w-md">
                            <div className="flex gap-3 items-start">
                              <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                                {c.imageSrc ? (
                                  <Image src={c.imageSrc} alt={c.title} fill className="object-cover" unoptimized />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Film className="w-5 h-5 opacity-40" />
                                  </div>
                                )}
                                <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[9px] px-1 py-0.2 rounded">
                                  {c.lessonsCount || 1} lessons
                                </span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800">
                                    {c.code || "MM"}
                                  </span>
                                  {(c.youtubeUrl || c.youtubePlaylistId) && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1">
                                      <YoutubeIcon className="w-2.5 h-2.5 text-red-600 fill-current" />
                                      Playlist
                                    </span>
                                  )}
                                  <span className="font-extrabold text-slate-900 dark:text-white truncate block">
                                    {isMarathi ? (c.titleMr || c.title) : c.title}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                  {c.description || "Comprehensive academy video course curriculum."}
                                </p>

                                {/* YouTube Studio Style Quick Action Icons on Hover */}
                                <div className="flex items-center gap-2 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCourseStudio(c)}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                    title={isMarathi ? "तपशील संपादित करा (Edit Details)" : "Edit Details"}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickSyncCourse(c)}
                                    className="p-1 rounded hover:bg-red-100 text-red-600 transition cursor-pointer"
                                    title={isMarathi ? "YouTube प्लेलिस्ट सिंक करा (Sync Playlist)" : "Sync with YouTube Playlist"}
                                  >
                                    <ListPlus className="w-3.5 h-3.5" />
                                  </button>
                                  <Link
                                    href={`/course/${c.id}`}
                                    target="_blank"
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                                    title={isMarathi ? "विद्यार्थी म्हणून प्रिव्ह्यू करा (Preview as Student)" : "Preview as Student"}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteModalItem({ id: c.id, title: c.title, type: "course" })}
                                    className="p-1 rounded hover:bg-red-100 text-red-600 transition cursor-pointer"
                                    title={isMarathi ? "हटवा (Delete)" : "Delete"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Dynamic Category Badge */}
                          <td className="py-3 px-3 shrink-0">
                            <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap">
                              {matchedCat?.label || c.category || "General"}
                            </span>
                          </td>

                          {/* Visibility */}
                          <td className="py-3 px-3">
                            {c.status === "live" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Public
                              </span>
                            ) : c.status === "unlisted" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Unlisted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Draft
                              </span>
                            )}
                          </td>

                          {/* Student Validity Duration */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {c.validityLabel || `${c.accessMonths || 3} Months`}
                            </div>
                            <div className="text-[10px] text-slate-400">from enrollment</div>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-3 font-bold whitespace-nowrap">
                            {c.isFree || c.pricePaise === 0 ? (
                              <span className="text-emerald-600">FREE</span>
                            ) : (
                              <span>₹{Math.round(c.pricePaise / 100)}</span>
                            )}
                          </td>

                          {/* Students Count */}
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-bold whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{c.totalStudents || 0}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 2: VIDEOS TABLE (YOUTUBE STUDIO DATA TABLE) */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "videos" && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{isMarathi ? "व्हिडिओ व्याख्यान" : "Video Lecture"}</th>
                    <th className="py-3 px-3">{isMarathi ? "संबंधित कोर्स" : "Course Batch"}</th>
                    <th className="py-3 px-3">{isMarathi ? "प्रकार" : "Access Type"}</th>
                    <th className="py-3 px-3">{isMarathi ? "कालावधी" : "Duration"}</th>
                    <th className="py-3 px-3">{isMarathi ? "व्ह्यूज" : "Views"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredVideos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Video className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold">{isMarathi ? "कोणतेही व्हिडिओ सापडले नाहीत." : "No videos found."}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVideos.map((v) => {
                      const assignedCourse = courses.find((c) => c.id === v.courseId);

                      return (
                        <tr key={v.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                          {/* Video Thumbnail + Title + Hover Actions */}
                          <td className="py-3.5 px-4 min-w-[260px] max-w-md">
                            <div className="flex gap-3 items-start">
                              <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                                {v.videoId ? (
                                  <Image
                                    src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`}
                                    alt={v.title || v.lessonTitle || "Video"}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Video className="w-4 h-4 opacity-40" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <Play className="w-4 h-4 text-white fill-current opacity-80" />
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <span className="font-extrabold text-slate-900 dark:text-white truncate block">
                                  {v.title || v.lessonTitle || "Untitled Video"}
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                  {v.description || "Video lecture lesson."}
                                </p>

                                {/* Quick Action Icons on Hover */}
                                <div className="flex items-center gap-2 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenVideoStudio(v)}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                    title="Edit Video"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <a
                                    href={`https://youtube.com/watch?v=${v.videoId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                                    title="Open YouTube Video"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteModalItem({ id: v.id, title: v.title || v.lessonTitle || "Video", type: "video" })}
                                    className="p-1 rounded hover:bg-red-100 text-red-600 transition cursor-pointer"
                                    title="Delete Video"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Target Course Batch */}
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block truncate max-w-xs">
                              {assignedCourse?.title || "Standalone Video"}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {assignedCourse?.code || "MM"}
                            </span>
                          </td>

                          {/* Access Type */}
                          <td className="py-3 px-3">
                            {v.isFree ? (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Free Demo
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Enrolled Only
                              </span>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                            {Math.round((v.durationSec || 900) / 60)} min
                          </td>

                          {/* Views */}
                          <td className="py-3 px-3 font-bold text-slate-600 dark:text-slate-400">
                            {v.views || 0}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 3: YOUTUBE PLAYLIST SYNC HUB (AUTO-INGESTION & BULK ENGINE) */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "sync" && (
          <div className="space-y-6">
            {/* Hero Header Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-bold tracking-wide">
                    <YoutubeIcon className="w-3.5 h-3.5 fill-current" />
                    <span>YouTube Studio Content Sync Hub</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    {isMarathi ? "YouTube प्लेलिस्ट व लेक्चर्स ऑटो-सिंक" : "YouTube Playlist & Bulk Lecture Ingestion"}
                  </h2>
                  <p className="text-xs text-white/90 leading-relaxed">
                    {isMarathi
                      ? "YouTube प्लेलिस्टची लिंक टाकून किंवा लिंक्स पेस्ट करून सर्व व्हिडिओंचे शीर्षक, थंबनेल आणि वेळ थेट कोर्सच्या अभ्यासक्रमात (Curriculum) एका क्लिकवर जोडा."
                      : "Directly import YouTube playlists or batch paste video links into course batches with automated titles, durations, HD thumbnails, and curriculum ordering."}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-black/20 backdrop-blur-xs rounded-xl px-4 py-2.5 text-center border border-white/10">
                    <div className="text-lg font-black">{courses.length}</div>
                    <div className="text-[10px] text-white/80 font-bold uppercase">{isMarathi ? "उपलब्ध कोर्सेस" : "Course Batches"}</div>
                  </div>
                  <div className="bg-black/20 backdrop-blur-xs rounded-xl px-4 py-2.5 text-center border border-white/10">
                    <div className="text-lg font-black">{videos.length}</div>
                    <div className="text-[10px] text-white/80 font-bold uppercase">{isMarathi ? "एकूण व्हिडिओ" : "Synced Videos"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingestion Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
              <button
                type="button"
                onClick={() => setSyncMode("playlist")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  syncMode === "playlist"
                    ? "bg-white dark:bg-[#1E293B] text-red-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <YoutubeIcon className="w-3.5 h-3.5 fill-current" />
                <span>{isMarathi ? "१. YouTube Playlist URL (1-Click Sync)" : "1. YouTube Playlist URL (1-Click Sync)"}</span>
              </button>

              <button
                type="button"
                onClick={() => setSyncMode("bulk")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  syncMode === "bulk"
                    ? "bg-white dark:bg-[#1E293B] text-blue-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>{isMarathi ? "२. स्मार्ट बल्क पेस्ट (Multiple Links)" : "2. Smart Bulk Paste (Multiple Links)"}</span>
              </button>
            </div>

            {/* Input Card */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              {syncMode === "playlist" ? (
                <form onSubmit={handleFetchSyncPlaylist} className="space-y-3">
                  <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {isMarathi ? "YouTube Playlist लिंक किंवा ID टाका:" : "Enter YouTube Playlist URL or ID:"}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500">
                        <YoutubeIcon className="w-4 h-4 fill-current" />
                      </div>
                      <input
                        type="text"
                        value={syncUrl}
                        onChange={(e) => setSyncUrl(e.target.value)}
                        placeholder="https://www.youtube.com/playlist?list=PL... किंवा PLw5nZ_hJ8h..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isFetchingSync}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isFetchingSync ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{isMarathi ? "फेच होत आहे..." : "Fetching..."}</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>{isMarathi ? "प्लेलिस्ट फेच करा" : "Fetch Playlist"}</span>
                        </>
                      )}
                    </button>
                  </div>
                  {syncFetchError && (
                    <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{syncFetchError}</span>
                    </p>
                  )}
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      {isMarathi ? "एकाच वेळी अनेक YouTube लिंक्स पेस्ट करा (प्रत्येक ओळीवर एक):" : "Paste multiple YouTube links (one per line):"}
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Format: Title | URL किंवा फक्त URL
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={syncBulkText}
                    onChange={(e) => setSyncBulkText(e.target.value)}
                    placeholder={`Introduction to Mind Mastery | https://www.youtube.com/watch?v=dQw4w9WgXcQ\nMemory Techniques Part 1 | https://youtu.be/dQw4w9WgXcQ\nVedic Maths Tricks | https://www.youtube.com/watch?v=dQw4w9WgXcQ`}
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseBulkText}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>{isMarathi ? "व्हिडिओ एक्सट्रॅक्ट करा" : "Extract Videos"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Target Course & Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Destination Course */}
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isMarathi ? "लक्ष्य कोर्स (Destination Course Batch)" : "Destination Course Batch"}</span>
                  </h3>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-blue-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncCreateNewCourse}
                      onChange={(e) => setSyncCreateNewCourse(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>{isMarathi ? "+ नवीन कोर्स बनवा" : "+ Create New Course"}</span>
                  </label>
                </div>

                {syncCreateNewCourse ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        {isMarathi ? "नवीन कोर्सचे नाव:" : "New Course Title:"}
                      </label>
                      <input
                        type="text"
                        value={syncNewCourseTitle}
                        onChange={(e) => setSyncNewCourseTitle(e.target.value)}
                        placeholder="उदा. वैदिक मॅथ्स मास्टरक्लास २०२६"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          {isMarathi ? "प्रवर्ग (Category):" : "Category:"}
                        </label>
                        <select
                          value={syncNewCourseCategory}
                          onChange={(e) => setSyncNewCourseCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none font-bold"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.key || cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          {isMarathi ? "किंमत (₹):" : "Price (₹):"}
                        </label>
                        <input
                          type="number"
                          value={syncNewCoursePrice}
                          onChange={(e) => setSyncNewCoursePrice(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isMarathi ? "कोणत्या कोर्समध्ये हे लेक्चर्स जोडायचे आहेत?" : "Select course to append lessons to:"}
                    </label>
                    <select
                      value={syncTargetCourseId}
                      onChange={(e) => setSyncTargetCourseId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.lessonsCount || 0} lessons)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Student Access & Preview Settings */}
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isMarathi ? "विद्यार्थी ॲक्सेस व प्रिव्ह्यू नियम" : "Access & Preview Settings"}</span>
                </h3>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncFirstIsFree}
                      onChange={(e) => setSyncFirstIsFree(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                        {isMarathi ? "पहिला व्हिडिओ मोफत प्रिव्ह्यू ठेवा (Free Demo)" : "First Video Free Demo Preview"}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {isMarathi
                          ? "विद्यार्थ्यांना कोर्स खरेदी करण्यापूर्वी १ ला व्हिडिओ पाहता येईल."
                          : "Enables prospective students to watch lesson 1 before purchase."}
                      </span>
                    </div>
                  </label>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isMarathi ? "विद्यार्थी ॲक्सेस मुदत (खरेदी केल्यापासून):" : "Student Access Validity (from purchase):"}
                    </label>
                    <select
                      value={syncValidityDays}
                      onChange={(e) => setSyncValidityDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value={15}>{isMarathi ? "१५ दिवस" : "15 Days"}</option>
                      <option value={30}>{isMarathi ? "१ महिना (३० दिवस)" : "1 Month (30 Days)"}</option>
                      <option value={90}>{isMarathi ? "३ महिने (९० दिवस)" : "3 Months (90 Days)"}</option>
                      <option value={180}>{isMarathi ? "६ महिने (१८० दिवस)" : "6 Months (180 Days)"}</option>
                      <option value={365}>{isMarathi ? "१ वर्ष (३६५ दिवस)" : "1 Year (365 Days)"}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Fetched Videos Checklist Preview */}
            {syncFetchedVideos.length > 0 && (
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-0">
                {/* Checklist Header */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleToggleSelectAllSync}
                      className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer"
                    >
                      {syncFetchedVideos.every((v) => v.selected) ? (
                        <CheckSquare className="w-4 h-4 text-red-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>
                        {isMarathi
                          ? `${syncFetchedVideos.filter((v) => v.selected).length}/${syncFetchedVideos.length} व्हिडिओ निवडले`
                          : `${syncFetchedVideos.filter((v) => v.selected).length}/${syncFetchedVideos.length} Videos Selected`}
                      </span>
                    </button>
                    {syncPlaylistMeta && (
                      <span className="text-[11px] text-slate-500 font-medium truncate max-w-sm">
                        • {syncPlaylistMeta.title} ({syncPlaylistMeta.author})
                      </span>
                    )}
                  </div>

                  {/* Big Execution Button */}
                  <button
                    type="button"
                    onClick={handleExecuteSync}
                    disabled={isExecutingSync || syncFetchedVideos.filter((v) => v.selected).length === 0}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isExecutingSync ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isMarathi ? "सिंक होत आहे..." : "Syncing Curriculum..."}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isMarathi
                            ? `✓ सिंक पूर्ण करा (${syncFetchedVideos.filter((v) => v.selected).length} लेक्चर्स जोडा)`
                            : `✓ Ingest & Sync ${syncFetchedVideos.filter((v) => v.selected).length} Lessons`}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Videos Table */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                  {syncFetchedVideos.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                        item.selected ? "bg-white dark:bg-[#1E293B]" : "opacity-50 bg-slate-50/50 dark:bg-slate-900/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleVideoSelect(idx)}
                          className="rounded text-red-600 focus:ring-red-500 w-4 h-4 shrink-0 cursor-pointer"
                        />

                        {/* Thumbnail */}
                        <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                          {item.thumbnailUrl ? (
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Video className="w-4 h-4" />
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono font-bold text-white">
                            {item.durationFormatted || "15:00"}
                          </span>
                        </div>

                        {/* Title & Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              #{idx + 1}
                            </span>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate block">
                              {item.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            ID: {item.videoId}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {idx === 0 && syncFirstIsFree ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Free Demo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Locked
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 4: DYNAMIC CATEGORIES IN-PLACE MANAGER */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "categories" && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isMarathi ? "डायनॅमिक प्रवर्ग व्यवस्थापन" : "Dynamic Category Architecture"}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isMarathi
                    ? "येथे तयार केलेले किंवा सुधारित केलेले प्रवर्ग थेट विद्यार्थी व ॲडमिन पोर्टलवर रिअल-टाइम अपडेट होतात."
                    : "Categories created or edited here synchronize dynamically across Admin, Sub-Admin, and Student portals."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isMarathi ? "+ नवीन प्रवर्ग" : "+ Add Category"}</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold">{isMarathi ? "कोणतेही प्रवर्ग उपलब्ध नाहीत." : "No categories configured yet."}</p>
                </div>
              ) : (
                categories.map((cat, index) => (
                  <div key={cat.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            moveCategory(cat.id, "up");
                            setCategories(getCategories());
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === categories.length - 1}
                          onClick={() => {
                            moveCategory(cat.id, "down");
                            setCategories(getCategories());
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {cat.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {cat.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {cat.description || "Active dynamic category"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-700 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModalItem({ id: cat.id, title: cat.label, type: "category" })}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-4">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                <span>{isMarathi ? "कचरापेटीत हलवायचे आहे का?" : "Move to Recycle Bin?"}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {isMarathi
                  ? `तुम्हाला खात्री आहे का की "${deleteModalItem.title}" हटवायचे आहे? ही वस्तू रीसायकल बिनमधून कधीही पूर्ववत (Undo) करता येईल.`
                  : `Are you sure you want to delete "${deleteModalItem.title}"? It will be moved to the Recycle Bin and can be restored anytime.`}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isMarathi ? "रद्द करा" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isMarathi ? "होय, हटवा" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Manager Modal */}
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onCategoriesChanged={() => loadData()}
        />

        {/* Recycle Bin Modal */}
        <RecycleBinModal
          isOpen={isRecycleBinOpen}
          onClose={() => setIsRecycleBinOpen(false)}
          onRestored={() => loadData()}
        />
      </div>
    </AdminShell>
  );
}
