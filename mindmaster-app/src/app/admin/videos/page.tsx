"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { LessonWatchStat, StaffUser, Course } from "@/lib/types";
import {
  getCurrentStaff,
  getLessonWatchStats,
  getStaffCourses,
  logStaffAction,
} from "@/lib/staffStore";
import {
  ExtendedVideoRow,
  getStoredVideos,
  saveStoredVideos,
  extractYouTubeVideoId,
  fetchDbVideos,
  saveLessonToSupabase,
  deleteLessonFromSupabase,
} from "@/lib/playlistStore";

export default function VideoManagerPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<ExtendedVideoRow[]>([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expiring_soon" | "expired">("all");

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ExtendedVideoRow | null>(null);

  // Drawer Form State
  const [videoType, setVideoType] = useState<"youtube" | "custom">("youtube");
  const [videoLink, setVideoLink] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [validityMode, setValidityMode] = useState<"days" | "date">("days");
  const [validityDays, setValidityDays] = useState(30);
  const [specificRemoveAt, setSpecificRemoveAt] = useState("");
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonPosition, setLessonPosition] = useState(1);
  const [partNumber, setPartNumber] = useState(1);
  const [seriesTitle, setSeriesTitle] = useState("");

  // Admin-Only Delete Modal State
  const [deleteModalVideo, setDeleteModalVideo] = useState<ExtendedVideoRow | null>(null);

  useEffect(() => {
    setStaff(getCurrentStaff());
    const cList = getStaffCourses();
    setCourses(cList);
    if (cList.length > 0) {
      setSelectedCourseId(cList[0].id);
    }

    const loadVideos = () => {
      fetchDbVideos().then((vList) => {
        if (vList) setVideos(vList);
      });
    };
    loadVideos();
    window.addEventListener("mma_videos_changed", loadVideos);
    return () => window.removeEventListener("mma_videos_changed", loadVideos);
  }, []);

  const isMainAdmin = staff.role === "main_admin";

  // Calculate days left helper
  const getDaysLeft = (removeAt: string | null) => {
    if (!removeAt) return null;
    const diff = new Date(removeAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Open Drawer for New Video
  const handleOpenAdd = () => {
    setEditingVideo(null);
    setVideoType("youtube");
    setVideoLink("");
    setLessonTitle("");
    setPublishAt(new Date().toISOString().slice(0, 16));
    setValidityMode("days");
    setValidityDays(30);
    setSpecificRemoveAt("");
    setIsFreePreview(false);
    setDurationMinutes(15);
    setLessonDescription("");
    setLessonPosition(videos.length + 1);
    setPartNumber(1);
    setSeriesTitle("");
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleOpenEdit = (video: ExtendedVideoRow) => {
    setEditingVideo(video);
    setVideoType(video.videoType);
    setVideoLink(video.videoId);
    setLessonTitle(video.lessonTitle);
    setSelectedCourseId(video.courseId);
    setPublishAt(video.publishAt ? new Date(video.publishAt).toISOString().slice(0, 16) : "");
    if (video.removeAt) {
      setValidityMode("date");
      setSpecificRemoveAt(new Date(video.removeAt).toISOString().slice(0, 16));
    } else {
      setValidityMode("days");
      setValidityDays(video.validityDays || 30);
    }
    setIsFreePreview(video.isFree);
    setDurationMinutes(Math.round(video.durationSec / 60) || 15);
    setLessonDescription(video.description || "");
    setLessonPosition(video.position || 1);
    setPartNumber(video.partNumber || 1);
    setSeriesTitle(video.seriesTitle || "");
    setIsDrawerOpen(true);
  };

  // Save Video
  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !videoLink.trim() || !selectedCourseId) {
      alert("Please provide video title, link/ID, and target course.");
      return;
    }

    let computedRemoveAt: string | null = null;
    if (validityMode === "days") {
      const pub = publishAt ? new Date(publishAt).getTime() : Date.now();
      computedRemoveAt = new Date(pub + validityDays * 24 * 60 * 60 * 1000).toISOString();
    } else if (specificRemoveAt) {
      computedRemoveAt = new Date(specificRemoveAt).toISOString();
    }

    let status: ExtendedVideoRow["status"] = "active";
    if (computedRemoveAt) {
      const days = Math.ceil((new Date(computedRemoveAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days <= 0) status = "expired";
      else if (days <= 7) status = "expiring_soon";
    }

    const courseObj = courses.find((c) => c.id === selectedCourseId);
    const cleanVideoId =
      videoType === "youtube"
        ? extractYouTubeVideoId(videoLink) || videoLink.trim()
        : videoLink.trim();

    const newVideo: ExtendedVideoRow = {
      id: editingVideo ? editingVideo.id : `vid-${Date.now()}`,
      lessonId: editingVideo ? editingVideo.lessonId : `les-${Date.now()}`,
      lessonTitle: lessonTitle.trim(),
      courseId: selectedCourseId,
      courseTitle: courseObj ? courseObj.title : "MindMaster Curriculum",
      videoType,
      videoId: cleanVideoId,
      publishAt: publishAt ? new Date(publishAt).toISOString() : new Date().toISOString(),
      removeAt: computedRemoveAt,
      validityDays,
      isFree: isFreePreview,
      durationSec: durationMinutes * 60,
      views: editingVideo ? editingVideo.views : 0,
      avgWatchPercent: editingVideo ? editingVideo.avgWatchPercent : 0,
      status,
      description: lessonDescription.trim() || undefined,
      position: lessonPosition,
      partNumber,
      seriesTitle: seriesTitle.trim() || undefined,
      likesCount: editingVideo ? editingVideo.likesCount : 0,
    };

    const currentVideos = getStoredVideos();
    const updated = editingVideo
      ? currentVideos.map((v) => (v.id === editingVideo.id ? newVideo : v))
      : [newVideo, ...currentVideos];

    setVideos(updated);
    saveStoredVideos(updated);
    saveLessonToSupabase(newVideo);

    logStaffAction(
      editingVideo ? "VIDEO_UPDATE" : "VIDEO_CREATE",
      "video",
      newVideo.id,
      newVideo.lessonTitle,
      `${editingVideo ? "Updated" : "Added"} video lecture (${videoType}): ${newVideo.lessonTitle}, Free: ${isFreePreview}`
    );

    setIsDrawerOpen(false);
  };

  // Confirm Delete (Admin-Only)
  const handleConfirmDelete = () => {
    if (!deleteModalVideo) return;
    const currentVideos = getStoredVideos();
    const updated = currentVideos.filter((v) => v.id !== deleteModalVideo.id);
    setVideos(updated);
    saveStoredVideos(updated);
    deleteLessonFromSupabase(deleteModalVideo.id || deleteModalVideo.lessonId || deleteModalVideo.videoId, deleteModalVideo.courseId);

    logStaffAction(
      "VIDEO_DELETE",
      "video",
      deleteModalVideo.id,
      deleteModalVideo.lessonTitle,
      `Main admin permanently removed video lecture ${deleteModalVideo.lessonTitle}`
    );

    setDeleteModalVideo(null);
  };

  // Filter Logic
  const filteredVideos = videos.filter((v) => {
    const matchesQuery =
      v.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.videoId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === "all" || v.courseId === courseFilter;
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesQuery && matchesCourse && matchesStatus;
  });

  return (
    <PermissionGuard permission="videos.manage">
      <AdminShell>
        <div className="space-y-6 font-sans">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
                  Video Lecture Manager
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF3FE] text-[#0B57D0]">
                  videos.manage
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Link YouTube & Custom HLS streams, configure countdown removals, and inspect student watch progress.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={staff.role === "sub_admin" ? "/sub/playlist" : "/admin/playlist"}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#F5F7FF] hover:bg-[#EBF3FE] text-[#0B57D0] border border-[#DDE3EA] text-xs font-bold rounded-full transition-all"
              >
                <span>📥</span> Import Playlist
              </Link>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-full shadow-md transition-all"
              >
                <span>🎬</span> Add Video Lecture
              </button>
            </div>
          </div>

          {/* Filters Bar: Search, Course Selector, Status Chips */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search video lectures by title or YouTube ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl focus:outline-none focus:border-[#0B57D0] text-[#0E1B3D]"
                />
              </div>

              {/* Course Selector */}
              <div>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full text-xs px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl font-bold text-[#0E1B3D] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Associated Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}: {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Chips */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                Status:
              </span>
              {(["all", "active", "expiring_soon", "expired"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                    statusFilter === st
                      ? "bg-[#0B57D0] text-white shadow-sm"
                      : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EEF4FF] hover:text-[#0B57D0]"
                  }`}
                >
                  {st === "all" ? "All Videos" : st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Videos Table */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] shadow-sm overflow-hidden">
            <div className="p-4 bg-[#FAFBFD] border-b border-[#E4E8F8] flex items-center justify-between text-xs">
              <span className="font-bold text-[#0E1B3D]">
                Showing {filteredVideos.length} Video Lectures
              </span>
              <span className="text-[11px] text-[#8A94A6]">
                Automated cron marks expired lectures daily at 00:00 UTC
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F5F7FF] text-[#5A6478] uppercase text-[10px] tracking-wider border-b border-[#E4E8F8]">
                    <th className="py-3 px-4 rounded-l-xl">Lesson Details</th>
                    <th className="py-3 px-4">Publish Date</th>
                    <th className="py-3 px-4">Peach Remove Countdown</th>
                    <th className="py-3 px-4">Type</th>
                    {/* Admin-only watch stats column per design */}
                    {isMainAdmin && (
                      <th className="py-3 px-4">
                        <span className="text-purple-700 font-extrabold flex items-center gap-1">
                          👑 Watch Stats (Admin)
                        </span>
                      </th>
                    )}
                    <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E8F8]">
                  {filteredVideos.map((video) => {
                    const daysLeft = getDaysLeft(video.removeAt);

                    return (
                      <tr key={video.id} className="hover:bg-[#FAFBFD] transition-colors">
                        {/* Lesson Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {video.videoType === "youtube" ? "🔴" : "🟣"}
                            </span>
                            <div>
                              <p className="font-bold text-[#0E1B3D] text-xs">
                                {video.lessonTitle}
                              </p>
                              <p className="text-[11px] text-[#5A6478]">
                                {video.courseTitle} • {Math.round(video.durationSec / 60)} mins
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Publish Date */}
                        <td className="py-3.5 px-4 text-[#5A6478] font-medium">
                          {video.publishAt ? video.publishAt.slice(0, 10) : "Immediate"}
                        </td>

                        {/* Peach Remove Countdown Chip per design */}
                        <td className="py-3.5 px-4">
                          {video.status === "expired" || (daysLeft !== null && daysLeft <= 0) ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                              <span>⛔</span> Expired
                            </span>
                          ) : daysLeft !== null ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA] shadow-sm">
                              <span>⏳</span> {daysLeft} days left
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#8A94A6]">
                              No Expiry Set
                            </span>
                          )}
                        </td>

                        {/* Free / Paid Chip */}
                        <td className="py-3.5 px-4">
                          {video.isFree ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Free Preview
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              Enrolled Only
                            </span>
                          )}
                        </td>

                        {/* Admin-Only Watch Stats Column */}
                        {isMainAdmin && (
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 font-semibold text-[#0E1B3D]">
                                <span>{video.views} Views</span>
                                <span className="text-[#8A94A6]">•</span>
                                <span className="text-[#0B57D0]">{video.avgWatchPercent}% Avg</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-20 bg-[#E4E8F8] h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#0B57D0] h-full rounded-full"
                                    style={{ width: `${video.avgWatchPercent}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                                  <span>👍</span>
                                  <span>{video.likesCount !== undefined ? video.likesCount : Math.floor((video.views || 8) * 0.42)}</span>
                                </span>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(video)}
                            className="px-3 py-1.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] font-bold rounded-lg border border-[#E4E8F8] transition-colors"
                          >
                            Edit
                          </button>

                          {isMainAdmin && (
                            <button
                              onClick={() => setDeleteModalVideo(video)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg border border-red-200 transition-colors"
                              title="Delete Video (Admin Only)"
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
          </div>

          {/* ========================================================= */}
          {/* SLIDE-OVER DRAWER FORM FOR VIDEO LECTURE */}
          {/* ========================================================= */}
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden">
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
                        {editingVideo ? "Edit Video Lecture" : "Upload / Link Video Lecture"}
                      </h2>
                      <p className="text-xs text-[#5A6478] mt-0.5">
                        Configure YouTube or HLS stream, preview mode, and peach countdown removal.
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
                  <form onSubmit={handleSaveVideo} className="p-6 space-y-5 text-xs">
                    {/* YouTube / Stream Segmented Control */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1.5">
                        Stream Source (Segmented Control)
                      </label>
                      <div className="grid grid-cols-2 p-1 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setVideoType("youtube")}
                          className={`py-2 rounded-xl font-bold transition-all ${
                            videoType === "youtube"
                              ? "bg-white text-red-600 shadow-sm border border-[#E4E8F8]"
                              : "text-[#5A6478]"
                          }`}
                        >
                          🔴 YouTube Video ID
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoType("custom")}
                          className={`py-2 rounded-xl font-bold transition-all ${
                            videoType === "custom"
                              ? "bg-white text-[#0B57D0] shadow-sm border border-[#E4E8F8]"
                              : "text-[#5A6478]"
                          }`}
                        >
                          🟣 Custom HLS Stream
                        </button>
                      </div>
                    </div>

                    {/* Video Link / ID Input with Live YouTube Extraction */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-[#0E1B3D]">
                          {videoType === "youtube" ? "YouTube Video Link or ID (Unlisted)" : "Custom Stream URL"}
                        </label>
                        {videoType === "youtube" && (
                          <span className="text-[10px] text-blue-600 font-bold">Auto-Extracts ID</span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        value={videoLink}
                        onChange={(e) => setVideoLink(e.target.value)}
                        placeholder={videoType === "youtube" ? "e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ" : "https://stream.mindmasteracademy.in/hls/lesson.m3u8"}
                        className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none"
                      />

                      {/* YouTube Detection Badge & Preview */}
                      {videoType === "youtube" && videoLink.trim() && (
                        <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                          {(() => {
                            const detectedId = extractYouTubeVideoId(videoLink);
                            if (detectedId) {
                              return (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`https://img.youtube.com/vi/${detectedId}/mqdefault.jpg`}
                                    alt="YouTube Preview"
                                    className="w-16 h-10 rounded-lg object-cover border border-slate-300 shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                  <div className="text-[11px]">
                                    <div className="text-emerald-700 font-extrabold flex items-center gap-1">
                                      <span>✅</span> Valid YouTube Video ID Detected
                                    </div>
                                    <code className="text-slate-600 font-mono text-[10px]">{detectedId}</code>
                                  </div>
                                </>
                              );
                            }
                            return (
                              <div className="text-[11px] text-amber-700 font-medium">
                                ⚠️ Please enter a valid YouTube link or 11-character video ID (e.g. youtube.com/watch?v=...)
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Lesson Title & Order */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-3">
                        <label className="block font-bold text-[#0E1B3D] mb-1">
                          Lesson Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                          placeholder="e.g. 16 Vedic Sutras: Speed Math Foundation"
                          className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="block font-bold text-[#0E1B3D] mb-1">
                          Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={lessonPosition}
                          onChange={(e) => setLessonPosition(Number(e.target.value))}
                          placeholder="1"
                          className="w-full px-3 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-bold text-center text-[#0E1B3D] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Multi-Part Series / Episode Chaining */}
                    <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-[#0E1B3D] text-xs flex items-center gap-1.5">
                          <span>🎬</span>
                          <span>Multi-Part Series</span>
                        </label>
                        <span className="text-[10px] text-indigo-600 font-bold">Optional</span>
                      </div>
                      <p className="text-[11px] text-[#5A6478]">
                        If this video is part of a series (e.g. Part 1, Part 2), specify the series title and part number.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={seriesTitle}
                            onChange={(e) => setSeriesTitle(e.target.value)}
                            placeholder="e.g. 500 Year Calendar Masterclass"
                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs text-[#0E1B3D] focus:outline-none"
                          />
                        </div>
                        <div className="col-span-1">
                          <select
                            value={partNumber}
                            onChange={(e) => setPartNumber(Number(e.target.value))}
                            className="w-full px-2 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-[#0E1B3D] focus:outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <option key={num} value={num}>
                                Part {num}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Lesson Description */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">
                        Lesson Description
                      </label>
                      <textarea
                        value={lessonDescription}
                        onChange={(e) => setLessonDescription(e.target.value)}
                        placeholder="What students will learn in this video lesson..."
                        rows={2}
                        className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none resize-none"
                      />
                    </div>

                    {/* Associated Course */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">
                        Associated Course
                      </label>
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl font-bold text-[#0E1B3D] text-xs focus:outline-none"
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code}: {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Duration & Free Preview Toggle */}
                    <div className="grid grid-cols-2 gap-3 p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl">
                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1">Duration (Mins)</label>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1">Free Preview Toggle</label>
                        <button
                          type="button"
                          onClick={() => setIsFreePreview(!isFreePreview)}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                            isFreePreview
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-white text-[#5A6478] border border-[#E4E8F8]"
                          }`}
                        >
                          {isFreePreview ? "🟢 Free for all" : "🔒 Enrolled only"}
                        </button>
                      </div>
                    </div>

                    {/* Validity Days or Specific Remove Date */}
                    <div className="p-4 bg-orange-50/50 border border-orange-200/60 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-[#0E1B3D]">
                          Peach Remove Countdown Policy
                        </label>
                        <span className="text-[10px] text-orange-700 font-bold uppercase">
                          Auto-Removal
                        </span>
                      </div>

                      <div className="grid grid-cols-2 p-1 bg-white border border-orange-200 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setValidityMode("days")}
                          className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                            validityMode === "days"
                              ? "bg-orange-500 text-white shadow-sm"
                              : "text-[#5A6478]"
                          }`}
                        >
                          Validity Days (30d)
                        </button>
                        <button
                          type="button"
                          onClick={() => setValidityMode("date")}
                          className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                            validityMode === "date"
                              ? "bg-orange-500 text-white shadow-sm"
                              : "text-[#5A6478]"
                          }`}
                        >
                          Specific Remove Date
                        </button>
                      </div>

                      {validityMode === "days" ? (
                        <div>
                          <label className="block font-semibold text-[#5A6478] mb-1">
                            Days video remains live after publish
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={365}
                              value={validityDays}
                              onChange={(e) => setValidityDays(Number(e.target.value))}
                              className="w-24 px-3 py-2 bg-white border border-orange-200 rounded-xl font-bold text-xs focus:outline-none"
                            />
                            <span className="text-[#5A6478] font-bold">Days live</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block font-semibold text-[#5A6478] mb-1">
                            Specific remove_at Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={specificRemoveAt}
                            onChange={(e) => setSpecificRemoveAt(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Publish At */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">
                        publish_at (Scheduled Start)
                      </label>
                      <input
                        type="datetime-local"
                        value={publishAt}
                        onChange={(e) => setPublishAt(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    {/* Drawer Footer Actions */}
                    <div className="pt-4 border-t border-[#E4E8F8] flex items-center justify-end gap-2">
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
                        Save Video Lecture
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ADMIN-ONLY CONFIRM DELETE MODAL */}
          {/* ========================================================= */}
          {deleteModalVideo && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl mx-auto mb-3">
                  ⚠️
                </div>
                <h3 className="text-lg font-bold text-[#0E1B3D] text-center">
                  Delete Video Lecture?
                </h3>
                <p className="text-xs text-[#5A6478] text-center mt-2 leading-relaxed">
                  Are you sure you want to permanently delete <strong>"{deleteModalVideo.lessonTitle}"</strong>?
                  This action is strictly restricted to the <strong>Main Admin</strong> and is recorded in the audit trail.
                </p>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setDeleteModalVideo(null)}
                    className="px-4 py-2 rounded-xl border border-[#E4E8F8] text-[#5A6478] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
                  >
                    Confirm & Delete
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
