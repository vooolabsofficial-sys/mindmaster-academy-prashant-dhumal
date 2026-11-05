"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import SubmitButton from "@/components/ui/SubmitButton";
import { StaffUser, Course } from "@/lib/types";
import {
  getCurrentStaff,
  fetchDbCourses,
  logStaffAction,
  getStaffCourses,
} from "@/lib/staffStore";
import {
  ExtendedVideoRow,
  extractYouTubeVideoId,
  fetchDbVideos,
  saveLessonToSupabase,
  deleteLessonFromSupabase,
  syncCourseLessonCount,
  getStoredVideos,
} from "@/lib/playlistStore";
import {
  ArrowLeft,
  Play,
  Plus,
  Search,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  Layers,
  Sparkles,
  Loader2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import RecycleBinModal from "@/components/admin/RecycleBinModal";
import {
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

export default function VideoManagerPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<ExtendedVideoRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "free">("all");

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ExtendedVideoRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Simplified Form State (No HLS, No Part Number, No Series Title)
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonPosition, setLessonPosition] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [lessonDescription, setLessonDescription] = useState("");

  // YouTube Auto-Fetch Title State
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [fetchTitleSuccess, setFetchTitleSuccess] = useState<string | null>(null);
  const [fetchTitleError, setFetchTitleError] = useState<string | null>(null);

  // Admin-Only Delete Modal State
  const [deleteModalVideo, setDeleteModalVideo] = useState<ExtendedVideoRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Recycle Bin State
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [recycleCount, setRecycleCount] = useState(0);
  const [undoToast, setUndoToast] = useState<{ id: string; title: string } | null>(null);

  // 100% Live Supabase Sync on mount & reload
  const reloadFromSupabase = async () => {
    setIsLoading(true);
    setStaff(getCurrentStaff());
    try {
      const [cList, vList] = await Promise.all([
        fetchDbCourses(),
        fetchDbVideos(),
      ]);
      setCourses(cList);
      if (cList.length > 0 && !selectedCourseId) {
        setSelectedCourseId(cList[0].id);
      }
      setVideos(vList);
    } catch (err) {
      console.warn("Failed to load live data, falling back to local cache:", err);
      const cList = getStaffCourses();
      setCourses(cList);
      setVideos(getStoredVideos());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setRecycleCount(getRecycleBinItems().length);
    reloadFromSupabase();
    const handleSync = () => reloadFromSupabase();
    const handleBinChange = () => setRecycleCount(getRecycleBinItems().length);

    window.addEventListener("mma_videos_changed", handleSync);
    window.addEventListener("mma_courses_changed", handleSync);
    window.addEventListener("mma_recycle_bin_changed", handleBinChange);
    return () => {
      window.removeEventListener("mma_videos_changed", handleSync);
      window.removeEventListener("mma_courses_changed", handleSync);
      window.removeEventListener("mma_recycle_bin_changed", handleBinChange);
    };
  }, []);

  const isMainAdmin = staff.role === "main_admin";

  // Open Drawer for New Video
  const handleOpenAdd = () => {
    setEditingVideo(null);
    setVideoLink("");
    setLessonTitle("");
    if (courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
    const filteredByCourse = videos.filter((v) => v.courseId === (selectedCourseId || courses[0]?.id));
    setLessonPosition(filteredByCourse.length + 1);
    setDurationMinutes(15);
    setIsFreePreview(false);
    setLessonDescription("");
    setFetchTitleError(null);
    setFetchTitleSuccess(null);
    setIsDrawerOpen(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Open Drawer for Edit
  const handleOpenEdit = (video: ExtendedVideoRow) => {
    setEditingVideo(video);
    setVideoLink(video.videoId);
    setLessonTitle(video.lessonTitle);
    setSelectedCourseId(video.courseId);
    setLessonPosition(video.position || 1);
    setDurationMinutes(Math.round((video.durationSec || 900) / 60));
    setIsFreePreview(Boolean(video.isFree));
    setLessonDescription(video.description || "");
    setFetchTitleError(null);
    setFetchTitleSuccess(null);
    setIsDrawerOpen(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Auto-Fetch Title & Details from YouTube URL
  const handleFetchYouTubeTitle = async () => {
    if (!videoLink.trim()) {
      setFetchTitleError("कृपया प्रथम YouTube व्हिडिओची लिंक किंवा ID प्रविष्ट करा.");
      return;
    }

    setIsFetchingTitle(true);
    setFetchTitleError(null);
    setFetchTitleSuccess(null);

    try {
      const res = await fetch("/api/youtube/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoLink.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "YouTube व्हिडिओ माहिती मिळवता आली नाही.");
      }

      if (data.title) {
        setLessonTitle(data.title);
      }

      if (data.videoId) {
        setVideoLink(data.videoId);
      }

      if (data.description && !lessonDescription) {
        setLessonDescription(data.description);
      }

      if (data.items && data.items[0]?.durationSec) {
        setDurationMinutes(Math.max(1, Math.round(data.items[0].durationSec / 60)));
      }

      setFetchTitleSuccess(`🎉 "${data.title}" नाव व कालावधी आपोआप भरले गेले!`);
    } catch (err: any) {
      setFetchTitleError(err.message || "YouTube URL तपासा किंवा इंटरनेट कनेक्शन तपासा.");
    } finally {
      setIsFetchingTitle(false);
    }
  };

  // Save Video (100% Live Supabase Sync)
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !videoLink.trim() || !selectedCourseId) {
      toast.error("कृपया व्हिडिओचे नाव, YouTube लिंक, आणि अभ्यासक्रम (Course) निवडा.");
      return;
    }

    setIsSaving(true);
    const cleanVideoId = extractYouTubeVideoId(videoLink) || videoLink.trim();
    const courseObj = courses.find((c) => c.id === selectedCourseId || c.code === selectedCourseId);

    const newVideo: ExtendedVideoRow = {
      id: editingVideo ? editingVideo.id : `vid-${Date.now()}`,
      lessonId: editingVideo ? editingVideo.lessonId : `les-${Date.now()}`,
      lessonTitle: lessonTitle.trim(),
      courseId: selectedCourseId,
      courseTitle: courseObj ? (courseObj.titleMr || courseObj.title) : "MindMaster Curriculum",
      videoType: "youtube",
      videoId: cleanVideoId,
      position: lessonPosition,
      isFree: isFreePreview,
      durationSec: durationMinutes * 60,
      description: lessonDescription.trim() || undefined,
      status: "active",
      publishAt: new Date().toISOString(),
      removeAt: null,
      validityDays: 30,
      views: editingVideo ? editingVideo.views : 0,
      avgWatchPercent: editingVideo ? editingVideo.avgWatchPercent : 0,
      likesCount: editingVideo ? editingVideo.likesCount : 0,
    };

    try {
      await saveLessonToSupabase(newVideo);
      await syncCourseLessonCount(selectedCourseId);

      logStaffAction(
        editingVideo ? "VIDEO_UPDATE" : "VIDEO_CREATE",
        "video",
        newVideo.id,
        newVideo.lessonTitle,
        `${editingVideo ? "Updated" : "Added"} video lecture: ${newVideo.lessonTitle} in ${newVideo.courseTitle}`
      );

      setIsDrawerOpen(false);
      await reloadFromSupabase();
    } catch (err: any) {
      console.error("Save video error:", err);
      toast.error(`व्हिडिओ सेव्ह करताना त्रुटी आली: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Delete (Soft-Delete to Recycle Bin with Live Supabase sync)
  const handleConfirmDelete = async () => {
    if (!deleteModalVideo) return;
    if (staff.role !== "main_admin") {
      toast.error("Unauthorized: Video deletion is strictly reserved for Main Admin.");
      setDeleteModalVideo(null);
      return;
    }
    setIsDeleting(true);
    try {
      const videoToDelete = deleteModalVideo;
      const vidId = videoToDelete.id || videoToDelete.lessonId || videoToDelete.videoId;

      // 1. Move to Recycle Bin
      const binItem = addToRecycleBin({
        itemType: "video",
        itemId: vidId,
        title: videoToDelete.lessonTitle,
        subtitle: `${videoToDelete.courseTitle || "कोर्स"} • ${videoToDelete.durationSec ? Math.round(videoToDelete.durationSec / 60) + " min" : ""}`,
        data: videoToDelete,
      });

      // 2. Remove lesson from Supabase and sync course count
      await deleteLessonFromSupabase(vidId, videoToDelete.courseId);
      await syncCourseLessonCount(videoToDelete.courseId);

      logStaffAction(
        "VIDEO_DELETE",
        "video",
        vidId,
        videoToDelete.lessonTitle,
        `Main admin moved video lecture ${videoToDelete.lessonTitle} to Recycle Bin`
      );

      setDeleteModalVideo(null);
      await reloadFromSupabase();

      // 3. Show 1-Click Undo Toast
      setUndoToast({
        id: binItem.id,
        title: videoToDelete.lessonTitle,
      });
      setTimeout(() => {
        setUndoToast((prev) => (prev?.id === binItem.id ? null : prev));
      }, 8000);
    } catch (err: any) {
      toast.error(`व्हिडिओ हटवताना त्रुटी आली: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // 1-Click Undo Video Deletion
  const handleUndoVideoDelete = async () => {
    if (!undoToast) return;
    const res = await restoreFromRecycleBin(undoToast.id);
    if (res.success) {
      setUndoToast(null);
      await reloadFromSupabase();
    }
  };

  // Filter Logic (Excludes videos currently in the Recycle Bin)
  const recycleVideoIds = new Set(
    getRecycleBinItems()
      .filter((i) => i.itemType === "video")
      .map((i) => i.itemId)
  );

  const filteredVideos = videos.filter((v) => {
    if (
      recycleVideoIds.has(v.id) ||
      recycleVideoIds.has(v.lessonId || "") ||
      recycleVideoIds.has(v.videoId)
    ) {
      return false;
    }

    const matchesQuery =
      v.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.videoId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === "all" || v.courseId === courseFilter;
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "free"
        ? Boolean(v.isFree)
        : !v.isFree;
    return matchesQuery && matchesCourse && matchesStatus;
  });

  return (
    <PermissionGuard permission="videos.manage">
      <AdminShell>
        <div className="space-y-6 font-sans">
          {isDrawerOpen ? (
            /* ========================================================= */
            /* IN-PAGE DEDICATED VIDEO STUDIO WORKSPACE */
            /* ========================================================= */
            <div className="space-y-6 animate-fadeIn">
              {/* Studio Header Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-[#E4E8F8] dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => !isSaving && setIsDrawerOpen(false)}
                    className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl transition shadow-xs cursor-pointer"
                    title="यादीकडे परत जा"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🎬</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-mono text-xs font-black">
                        {editingVideo ? (editingVideo.videoId || "EDIT_VIDEO") : "NEW_LESSON"}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">• {editingVideo ? "व्हिडिओ संपादन मोड" : "नवीन व्हिडिओ निर्मिती"}</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#0E1B3D] dark:text-white font-heading">
                      {editingVideo ? "व्हिडिओ संपादन स्टुडिओ (Edit Video Studio)" : "नवीन व्हिडिओ निर्मिती स्टुडिओ (Add Video Studio)"}
                    </h1>
                    <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-0.5">
                      YouTube लिंक टाका, नाव मिळवा आणि थेट डेटाबेसवर व्हिडिओ सेव्ह करा.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    रद्द करा (Cancel)
                  </button>
                  <SubmitButton
                    type="button"
                    onClick={() => {
                      const form = document.getElementById("video-studio-form") as HTMLFormElement;
                      if (form) form.requestSubmit();
                    }}
                    loading={isSaving}
                    loadingText="व्हिडिओ सेव्ह करत आहे..."
                    className="px-6 py-2.5 rounded-xl text-xs font-black shadow-md cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>व्हिडिओ सेव्ह करा (Save Video)</span>
                    </span>
                  </SubmitButton>
                </div>
              </div>

              {/* Form Body - 2 Column Responsive Workspace */}
              <form onSubmit={handleSaveVideo} id="video-studio-form" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column (7 cols): Course, YouTube URL & Auto-fetch, Lesson Title */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm space-y-5">
                      <h3 className="font-bold text-sm text-[#0E1B3D] dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <span>🎯</span>
                        <span>कोर्स व YouTube लिंक (Course & YouTube Link)</span>
                      </h3>

                      {/* 1. Target Course Selector */}
                      <div>
                        <label className="block font-bold text-[#0E1B3D] dark:text-slate-200 mb-1.5 text-xs">
                          अभ्यासक्रम निवडा (Target Course) *
                        </label>
                        <select
                          required
                          value={selectedCourseId}
                          onChange={(e) => setSelectedCourseId(e.target.value)}
                          className="w-full px-4 py-3 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-2xl text-xs font-bold text-[#0E1B3D] dark:text-white focus:outline-none focus:border-[#0B57D0]"
                        >
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code} - {c.titleMr || c.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. YouTube Link & Auto-Fetch Button */}
                      <div className="p-5 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl space-y-3">
                        <label className="block font-bold text-[#0E1B3D] dark:text-slate-200 flex items-center gap-2 text-xs">
                          <YoutubeIcon className="w-5 h-5 text-red-600" />
                          <span>YouTube Video URL किंवा Video ID *</span>
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                          <input
                            type="text"
                            required
                            value={videoLink}
                            onChange={(e) => {
                              setVideoLink(e.target.value);
                              setFetchTitleError(null);
                            }}
                            placeholder="उदा. https://youtu.be/dQw4w9WgXcQ किंवा dQw4w9WgXcQ"
                            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none focus:border-red-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleFetchYouTubeTitle}
                            disabled={isFetchingTitle || !videoLink.trim()}
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            {isFetchingTitle ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            <span>नाव मिळवा (Fetch)</span>
                          </button>
                        </div>

                        {fetchTitleError && (
                          <div className="text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-1.5 p-2 bg-red-100 dark:bg-red-900/40 rounded-xl">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{fetchTitleError}</span>
                          </div>
                        )}

                        {fetchTitleSuccess && (
                          <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5 p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>{fetchTitleSuccess}</span>
                          </div>
                        )}

                        {extractYouTubeVideoId(videoLink) && (
                          <div className="pt-2 flex items-center gap-3">
                            <div className="relative w-28 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 bg-slate-900">
                              <Image
                                src={`https://img.youtube.com/vi/${extractYouTubeVideoId(videoLink)}/mqdefault.jpg`}
                                alt="Video preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300">
                              <p className="font-bold text-[#0E1B3D] dark:text-white">YouTube Preview सापडला</p>
                              <p className="font-mono text-slate-400">ID: {extractYouTubeVideoId(videoLink)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Lesson Title */}
                      <div>
                        <label className="block font-bold text-[#0E1B3D] dark:text-slate-200 mb-1.5 text-xs">
                          लेक्चरचे नाव (Lesson Title) *
                        </label>
                        <input
                          type="text"
                          required
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                          placeholder="उदा. ०१. ५०० वर्षांचे कॅलेंडर तंत्र डेमो व सराव"
                          className="w-full px-4 py-3 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-2xl text-xs font-bold text-[#0E1B3D] dark:text-white focus:outline-none focus:border-[#0B57D0]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column (5 cols): Order, Duration, Preview Switch, Notes */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm space-y-5">
                      <h3 className="font-bold text-sm text-[#0E1B3D] dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <span>⚙️</span>
                        <span>लेक्चर सेटिंग्ज (Lesson Settings)</span>
                      </h3>

                      {/* 4. Position & Duration */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-[#0E1B3D] dark:text-slate-200 mb-1 text-xs">
                            अनुक्रमांक (Position / Order) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={lessonPosition}
                            onChange={(e) => setLessonPosition(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-xl text-xs font-bold text-[#0E1B3D] dark:text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-[#0E1B3D] dark:text-slate-200 mb-1 text-xs">
                            कालावधी (Minutes) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-xl text-xs font-bold text-[#0E1B3D] dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 5. Free Preview Toggle */}
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-emerald-950 dark:text-emerald-300 block text-xs">
                            मोफत डेमो लेक्चर (Free Demo Preview)
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            हा व्हिडिओ विनाखरेदी विद्यार्थ्यांना पाहता येईल का?
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsFreePreview(!isFreePreview)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            isFreePreview ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isFreePreview ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      {/* 6. Optional Description */}
                      <div>
                        <label className="block font-bold text-[#0E1B3D] dark:text-slate-200 mb-1 text-xs">
                          लेक्चर नोट्स किंवा वर्णन (Description / Notes)
                        </label>
                        <textarea
                          value={lessonDescription}
                          onChange={(e) => setLessonDescription(e.target.value)}
                          placeholder="या लेक्चरबद्दल महत्त्वाची माहिती किंवा नोट्स..."
                          rows={4}
                          className="w-full px-4 py-2.5 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 text-[#0E1B3D] dark:text-white rounded-xl text-xs focus:outline-none resize-y"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Sticky Action Bar */}
                <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    ← व्हिडिओ यादीकडे परत जा (Back to List)
                  </button>

                  <SubmitButton
                    type="submit"
                    loading={isSaving}
                    loadingText="व्हिडिओ सेव्ह करत आहे..."
                    className="px-7 py-3 rounded-xl text-xs font-black shadow-md cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>व्हिडिओ सेव्ह करा (Save Video)</span>
                    </span>
                  </SubmitButton>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                  व्हिडिओ लेक्चर्स (Video Lectures Hub)
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold">• {videos.length} लेक्चर्स सेव्ह आहेत</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#0E1B3D] dark:text-white font-heading">
                Video Lectures Manager
              </h2>
              <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-1">
                YouTube लिंकवरून लेक्चर्स जोडा, मोफत डेमो प्रिव्ह्यू सेट करा आणि थेट डेटाबेसवर मॅनेज करा.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsRecycleBinOpen(true)}
                className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all border shadow-xs shrink-0 cursor-pointer ${
                  recycleCount > 0
                    ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100"
                    : "bg-white dark:bg-slate-800 border-[#CCD7E6] dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>कचरापेटी (Recycle Bin)</span>
                {recycleCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white leading-none">
                    {recycleCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-2xl shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>नवीन व्हिडिओ जोडा (+ Add Video)</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="व्हिडिओचे नाव किंवा YouTube ID शोधा..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-2xl focus:outline-none focus:border-[#0B57D0] text-[#0E1B3D] dark:text-white"
                />
              </div>

              <div>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full text-xs px-4 py-3 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-2xl focus:outline-none focus:border-[#0B57D0] text-[#0E1B3D] dark:text-white font-bold"
                >
                  <option value="all">सर्व कोर्सेस (All Courses)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.titleMr || c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-[#8A94A6] dark:text-slate-400 uppercase tracking-wider mr-1">
                प्रकार (Type):
              </span>
              {(["all", "free", "active"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-[#0B57D0] text-white shadow-sm"
                      : "bg-[#F5F7FF] dark:bg-slate-800 text-[#5A6478] dark:text-slate-300 hover:bg-[#EEF4FF] dark:hover:bg-slate-700 hover:text-[#0B57D0] dark:hover:text-blue-400"
                  }`}
                >
                  {st === "all" ? "सर्व (All)" : st === "free" ? "मोफत डेमो (Free Preview)" : "Paid Only"}
                </button>
              ))}
            </div>
          </div>

          {/* Videos Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 bg-[#FAFBFD] dark:bg-slate-800/80 border-b border-[#E4E8F8] dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-[#0E1B3D] dark:text-white">
                एकूण {filteredVideos.length} व्हिडिओ सापडले
              </span>
              <span className="text-[11px] text-[#8A94A6] dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Supabase `lessons` Sync
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                डेटाबेसमधून लेक्चर्स लोड होत आहेत...
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-3xl mb-4 shadow-inner">
                  🎬
                </div>
                <h4 className="font-extrabold text-base text-[#0E1B3D] dark:text-white">
                  कोणताही व्हिडिओ सापडला नाही
                </h4>
                <p className="text-xs text-[#5A6478] dark:text-slate-400 max-w-md mt-1 mb-5 leading-relaxed">
                  वरील <strong>&quot;+ Add Video&quot;</strong> बटणावर क्लिक करा आणि YouTube व्हिडिओ जोडा.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="px-6 py-2.5 bg-[#0B57D0] text-white text-xs font-bold rounded-full shadow hover:bg-blue-700 transition cursor-pointer"
                >
                  + पहिला व्हिडिओ जोडा
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAFBFD] dark:bg-slate-800/80 border-b border-[#E4E8F8] dark:border-slate-800 text-[#8A94A6] dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4"># / Video</th>
                      <th className="py-3.5 px-4">Course</th>
                      <th className="py-3.5 px-4">कालावधी (Duration)</th>
                      <th className="py-3.5 px-4">मोफत प्रिव्ह्यू?</th>
                      {isMainAdmin && (
                        <th className="py-3.5 px-4">👑 Watch Stats (Admin)</th>
                      )}
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E8F8] dark:divide-slate-800">
                    {filteredVideos.map((video) => {
                      const detectedId = extractYouTubeVideoId(video.videoId) || video.videoId;
                      return (
                        <tr key={video.id} className="hover:bg-[#FAFBFD] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-16 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
                                <Image
                                  src={`https://img.youtube.com/vi/${detectedId}/mqdefault.jpg`}
                                  alt="Thumb"
                                  width={64}
                                  height={40}
                                  sizes="64px"
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-extrabold text-[#0E1B3D] dark:text-white truncate max-w-xs sm:max-w-md">
                                  {video.lessonTitle}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                                  <span className="font-bold text-blue-600">#{video.position || 1}</span>
                                  <span>•</span>
                                  <span className="truncate">{detectedId}</span>
                                  {video.daysLeft !== undefined && (
                                    <span className="text-amber-600 font-bold ml-1">
                                      ({video.daysLeft} daysLeft)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-[#0B57D0] dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-[11px]">
                              {video.courseTitle || "Course"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-bold">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {Math.round((video.durationSec || 900) / 60)} मिनिटे
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {video.isFree ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✓ Free Demo
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Paid Only
                              </span>
                            )}
                          </td>

                          {isMainAdmin && (
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                              <div>👁️ {video.views || 0} views</div>
                              <div>⏱️ {video.avgWatchPercent || 0}% avg</div>
                            </td>
                          )}

                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEdit(video)}
                              className="px-3 py-1.5 bg-[#F5F7FF] dark:bg-slate-800 hover:bg-[#EEF4FF] dark:hover:bg-slate-700 text-[#0B57D0] dark:text-blue-400 font-bold rounded-xl border border-[#E4E8F8] dark:border-slate-700 transition-colors"
                            >
                              Edit
                            </button>

                            {isMainAdmin && (
                              <button
                                onClick={() => setDeleteModalVideo(video)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border border-red-200 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </>
      )}


          {/* Move to Recycle Bin Confirmation Modal */}
          {deleteModalVideo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-amber-200 dark:border-amber-900/50 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-[#0E1B3D] dark:text-white">
                    Delete Video (Admin Only) • रीसायकल बिनमध्ये हलवायचा आहे का?
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    <strong>{deleteModalVideo.lessonTitle}</strong> हा व्हिडिओ कोर्समधून तात्पुरता काढला जाईल आणि रीसायकल बिनमध्ये हलवला जाईल. तुम्ही तो कधीही <strong>पूर्ववत (Undo / Restore)</strong> करू शकता.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    disabled={isDeleting}
                    onClick={() => setDeleteModalVideo(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
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
                onClick={handleUndoVideoDelete}
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
