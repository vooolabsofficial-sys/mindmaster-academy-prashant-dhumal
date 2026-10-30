"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { Course, StaffUser } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffCourses,
  saveStaffCourse,
  getPlatformSettings,
  PlatformSettings,
} from "@/lib/staffStore";
import {
  PlaylistItem,
  parseBulkYouTubeLinks,
  importPlaylistLessons,
} from "@/lib/playlistStore";

export default function PlaylistImportPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [courses, setCourses] = useState<Course[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(getPlatformSettings());

  // Mode: "api" (Fetch Playlist via YouTube Data API) or "bulk" (Manual Bulk Paste)
  const [activeMode, setActiveMode] = useState<"api" | "bulk">("api");

  // API Fetch State
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Bulk Paste State
  const [bulkText, setBulkText] = useState("");

  // Parsed / Fetched Items
  const [items, setItems] = useState<PlaylistItem[]>([]);

  // Target Course & Import Options
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [startPosition, setStartPosition] = useState(1);
  const [firstIsFree, setFirstIsFree] = useState(true);
  const [validityDays, setValidityDays] = useState(30);

  // Inline Course Creation Modal
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCoursePriceRupees, setNewCoursePriceRupees] = useState(999);
  const [newCourseCategory, setNewCourseCategory] = useState<Course["category"]>("memory");

  // Import Status Feedback
  const [importSuccess, setImportSuccess] = useState<{
    count: number;
    courseTitle: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    setStaff(getCurrentStaff());
    const cList = getStaffCourses();
    setCourses(cList);
    if (cList.length > 0) {
      setSelectedCourseId(cList[0].id);
    }
    const s = getPlatformSettings();
    setSettings(s);
    if (s.default_video_live_days) {
      setValidityDays(s.default_video_live_days);
    }
    // If no API key configured, default to bulk mode
    if (!s.youtube_api_key) {
      setActiveMode("bulk");
    }
  }, []);

  const hasApiKey = Boolean(settings.youtube_api_key && settings.youtube_api_key.trim().length > 5);

  // Fetch playlist via /api/youtube/playlist server action
  const handleFetchPlaylist = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!playlistUrl.trim()) {
      setFetchError("Please enter a YouTube playlist URL or ID.");
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setImportSuccess(null);

    try {
      const res = await fetch("/api/youtube/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistUrl: playlistUrl.trim(),
          apiKey: settings.youtube_api_key,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch playlist.");
      }

      const fetchedItems: PlaylistItem[] = (data.items || []).map((item: any, idx: number) => ({
        id: `pl-item-${Date.now()}-${idx}-${item.videoId}`,
        videoId: item.videoId,
        title: item.title,
        description: item.description || "",
        durationSec: item.durationSec || 900,
        durationFormatted: item.durationFormatted || "15:00",
        thumbnailUrl: item.thumbnailUrl,
        selected: true,
      }));

      setItems(fetchedItems);
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch playlist.");
    } finally {
      setIsFetching(false);
    }
  };

  // Parse bulk paste text
  const handleParseBulkText = (e: React.FormEvent) => {
    e.preventDefault();
    setFetchError(null);
    setImportSuccess(null);

    if (!bulkText.trim()) {
      setFetchError("Please paste at least one YouTube link or video ID.");
      return;
    }

    const parsed = parseBulkYouTubeLinks(bulkText);
    if (parsed.length === 0) {
      setFetchError("No valid YouTube video links or IDs found. Check format and try again.");
      return;
    }

    setItems(parsed);
  };

  // Selection toggles
  const handleToggleSelectAll = (select: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleUpdateItemTitle = (id: string, newTitle: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
  };

  // Inline Course Creation Handler
  const handleCreateNewCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const nextCodeNum = courses.length + 1;
    const generatedCode = `MM-${nextCodeNum.toString().padStart(2, "0")}`;
    const newCourseId = `c-${Date.now()}`;

    const newCourse: Course = {
      id: newCourseId,
      code: generatedCode,
      title: newCourseTitle.trim(),
      titleMr: newCourseTitle.trim(),
      subtitle: "Comprehensive curriculum course",
      description: `Course created inline via Playlist Builder for batch lesson imports.`,
      headerTint: "mint",
      pricePaise: newCoursePriceRupees * 100,
      originalPricePaise: newCoursePriceRupees * 200,
      isFree: newCoursePriceRupees === 0,
      accessMonths: settings.default_access_months || 3,
      status: "live",
      badgeText: "New Batch",
      badgeType: "new",
      imageSrc: "/assets/images/vedic_maths_abacus_3d.png",
      instructorName: "Prashant Dhumal Sir",
      instructorTitle: "Founder, MindMaster Academy",
      totalStudents: 0,
      rating: 5.0,
      ratingCount: 1,
      lessonsCount: 0,
      totalDurationHours: 0,
      category: newCourseCategory,
      features: [
        "Full Video Course Access",
        "Self-Practice Quizzes",
        "Official Certificate of Completion",
      ],
    };

    saveStaffCourse(newCourse);
    const updatedCourses = getStaffCourses();
    setCourses(updatedCourses);
    setSelectedCourseId(newCourseId);
    setShowNewCourseModal(false);
    setNewCourseTitle("");
  };

  // Perform Final Import
  const handleExecuteImport = () => {
    setImportError(null);
    const selectedCount = items.filter((i) => i.selected).length;
    if (selectedCount === 0) {
      setImportError("Please select at least one lesson to import.");
      return;
    }

    try {
      const res = importPlaylistLessons(items, {
        courseId: selectedCourseId,
        startPosition,
        firstIsFree,
        validityDays,
      });

      setImportSuccess(res);
      // Deselect all or clear
      setItems([]);
    } catch (err: any) {
      setImportError(err.message || "Failed to import playlist lessons.");
    }
  };

  const selectedCount = items.filter((i) => i.selected).length;

  return (
    <PermissionGuard permission="videos.manage">
      <AdminShell>
        <div className="space-y-6 max-w-6xl mx-auto font-sans pb-16">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#0E1B3D] font-heading">
                  Course & Playlist Builder
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF3FE] text-[#0B57D0]">
                  videos.manage
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Import complete YouTube playlists or bulk video links as ordered curriculum lessons in seconds.
              </p>
            </div>

            <Link
              href={staff.role === "sub_admin" ? "/sub/videos" : "/admin/videos"}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5F7FF] hover:bg-[#EBF3FE] text-[#0B57D0] border border-[#DDE3EA] text-xs font-bold rounded-full transition-all self-start md:self-auto"
            >
              ← Back to Video Manager
            </Link>
          </div>

          {/* API Key Missing Notice */}
          {!hasApiKey && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    YouTube Data API Key Not Configured
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Automated playlist fetching requires a YouTube API key in Platform Settings. Currently running in <strong>Manual Bulk Paste Mode</strong>.
                  </p>
                </div>
              </div>
              {staff.role === "main_admin" && (
                <Link
                  href="/admin/settings"
                  className="px-3.5 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold rounded-xl transition whitespace-nowrap self-start sm:self-auto"
                >
                  Configure in Settings →
                </Link>
              )}
            </div>
          )}

          {/* Success Banner */}
          {importSuccess && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">
                    Import Successful!
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Successfully imported <strong>{importSuccess.count}</strong> lessons into{" "}
                    <strong>{importSuccess.courseTitle}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={staff.role === "sub_admin" ? "/sub/videos" : "/admin/videos"}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full transition shadow-sm"
                >
                  View in Video Manager →
                </Link>
                <button
                  onClick={() => setImportSuccess(null)}
                  className="px-3 py-2 text-xs font-semibold text-emerald-800 hover:text-emerald-900"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex border-b border-[#E4E8F8] gap-4">
            {hasApiKey && (
              <button
                type="button"
                onClick={() => {
                  setActiveMode("api");
                  setFetchError(null);
                }}
                className={`pb-3 px-1 text-sm font-bold transition-all relative ${
                  activeMode === "api"
                    ? "text-[#0B57D0] border-b-2 border-[#0B57D0]"
                    : "text-[#5A6478] hover:text-[#0E1B3D]"
                }`}
              >
                Fetch YouTube Playlist (API)
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveMode("bulk");
                setFetchError(null);
              }}
              className={`pb-3 px-1 text-sm font-bold transition-all relative ${
                activeMode === "bulk"
                  ? "text-[#0B57D0] border-b-2 border-[#0B57D0]"
                  : "text-[#5A6478] hover:text-[#0E1B3D]"
              }`}
            >
              Manual Bulk Paste (Links / IDs)
            </button>
          </div>

          {/* Input Card: Fetch Mode */}
          {activeMode === "api" && hasApiKey && (
            <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-[#0E1B3D]">
                  YouTube Playlist URL or Playlist ID
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setPlaylistUrl(
                      "https://www.youtube.com/playlist?list=PLRqwX-V7Uu6ZiZxtDDRCi6uhfTH4FilpH"
                    )
                  }
                  className="text-[11px] font-semibold text-[#0B57D0] hover:underline"
                >
                  Insert Sample Playlist URL
                </button>
              </div>

              <form onSubmit={handleFetchPlaylist} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/playlist?list=PL..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl text-xs font-mono text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                />
                <button
                  type="submit"
                  disabled={isFetching}
                  className="px-6 py-3 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 min-w-[150px] disabled:opacity-50"
                >
                  {isFetching ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span> Fetch Playlist
                    </>
                  )}
                </button>
              </form>

              {fetchError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                  {fetchError}
                </p>
              )}
            </div>
          )}

          {/* Input Card: Bulk Paste Mode */}
          {activeMode === "bulk" && (
            <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-[#0E1B3D]">
                    Bulk Paste YouTube Links (One link per line)
                  </label>
                  <p className="text-[11px] text-[#5A6478]">
                    Optional format: <code className="bg-[#F5F7FF] px-1 py-0.5 rounded">Lesson Title | https://...</code> or simple links.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setBulkText(
                      `Vedic Multiplication Sutras | https://www.youtube.com/watch?v=dQw4w9WgXcQ\nFast Square Roots Formula | https://www.youtube.com/watch?v=e-ORhEE9VVg\nSuperfast Calendar 2026 | https://www.youtube.com/watch?v=fJ9rUzIMcZQ`
                    )
                  }
                  className="text-[11px] font-semibold text-[#0B57D0] hover:underline whitespace-nowrap"
                >
                  Insert 3 Sample Lessons
                </button>
              </div>

              <form onSubmit={handleParseBulkText} className="space-y-3">
                <textarea
                  rows={5}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ&#10;Lesson 2 | https://youtu.be/e-ORhEE9VVg&#10;https://www.youtube.com/watch?v=fJ9rUzIMcZQ"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl text-xs font-mono text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>📋</span> Parse Links & Preview ({bulkText.split("\n").filter((l) => l.trim()).length} lines)
                </button>
              </form>

              {fetchError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                  {fetchError}
                </p>
              )}
            </div>
          )}

          {/* Preview & Import Section (Shown once items are parsed/fetched) */}
          {items.length > 0 && (
            <div className="space-y-6">
              {/* Preview Header & Selection Controls */}
              <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#EBF3FE] text-[#0B57D0] flex items-center justify-center font-bold text-sm">
                    {selectedCount}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0E1B3D]">
                      Playlist Preview ({items.length} items found)
                    </h3>
                    <p className="text-xs text-[#5A6478]">
                      {selectedCount} selected for import. Edit titles inline if desired.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(true)}
                    className="px-3 py-1.5 bg-[#F5F7FF] hover:bg-[#E4E8F8] text-[#0E1B3D] text-xs font-semibold rounded-xl transition"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(false)}
                    className="px-3 py-1.5 bg-[#F5F7FF] hover:bg-[#E4E8F8] text-[#0E1B3D] text-xs font-semibold rounded-xl transition"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-3xl border border-[#E4E8F8] shadow-sm overflow-hidden divide-y divide-[#E4E8F8]">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition ${
                      item.selected ? "bg-white" : "bg-[#F9FAFD] opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItem(item.id)}
                        className="w-4 h-4 text-[#0B57D0] rounded border-gray-300 focus:ring-[#0B57D0]"
                      />
                      <span className="text-xs font-mono font-bold text-[#8A94A6] w-6">
                        #{(startPosition + idx).toString().padStart(2, "0")}
                      </span>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-24 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative">
                      <Image
                        src={item.thumbnailUrl || "https://placehold.co/120x80/0E1B3D/FFFFFF?text=Video"}
                        alt={item.title}
                        width={96}
                        height={64}
                        sizes="96px"
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>

                    {/* Title Input & Metadata */}
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateItemTitle(item.id, e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#F5F7FF] hover:bg-white focus:bg-white border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                      />
                      <div className="flex items-center gap-3 text-[11px] text-[#5A6478]">
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                          {item.videoId}
                        </span>
                        <span>⏱️ {item.durationFormatted}</span>
                        {idx === 0 && firstIsFree && item.selected && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                            Free Preview
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={`https://www.youtube.com/watch?v=${item.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0B57D0] hover:underline self-end sm:self-center whitespace-nowrap"
                    >
                      Watch ↗
                    </a>
                  </div>
                ))}
              </div>

              {/* Import Configuration Panel */}
              <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-6">
                <h3 className="text-base font-bold text-[#0E1B3D] font-heading pb-3 border-b border-[#E4E8F8]">
                  Import Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Target Course */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#0E1B3D]">Target Course</label>
                      <button
                        type="button"
                        onClick={() => setShowNewCourseModal(true)}
                        className="text-[#0B57D0] font-bold hover:underline"
                      >
                        + Create New Course Inline
                      </button>
                    </div>

                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl text-xs font-bold text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.title} ({c.lessonsCount || 0} lessons existing)
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-[#8A94A6]">
                      Lessons will be appended to this course catalog.
                    </p>
                  </div>

                  {/* Start Position Stepper */}
                  <div className="space-y-2">
                    <label className="font-bold text-[#0E1B3D]">Starting Lesson Position</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={startPosition}
                        onChange={(e) => setStartPosition(Math.max(1, Number(e.target.value)))}
                        className="w-24 px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl text-xs font-bold text-[#0E1B3D] focus:outline-none"
                      />
                      <span className="text-[#5A6478]">
                        Sequenced as #{startPosition} .. #{startPosition + selectedCount - 1}
                      </span>
                    </div>
                  </div>

                  {/* Free Preview Toggle */}
                  <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#0E1B3D]">First Lesson Free Preview</h4>
                      <p className="text-[11px] text-[#5A6478]">
                        Sets Lesson #{startPosition} as Free Demo; subsequent lessons require enrollment.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={firstIsFree}
                      onChange={(e) => setFirstIsFree(e.target.checked)}
                      className="w-5 h-5 text-[#0B57D0] rounded focus:ring-[#0B57D0]"
                    />
                  </div>

                  {/* Validity Days */}
                  <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#0E1B3D]">Video Live Validity</h4>
                      <p className="text-[11px] text-[#5A6478]">
                        Days lessons remain active before auto-removal window.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={validityDays}
                        onChange={(e) => setValidityDays(Number(e.target.value))}
                        className="w-16 px-3 py-1.5 bg-white border border-[#E4E8F8] rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none"
                      />
                      <span className="font-semibold text-[#5A6478]">Days</span>
                    </div>
                  </div>
                </div>

                {importError && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                    {importError}
                  </p>
                )}

                {/* Primary Action Button */}
                <div className="pt-4 border-t border-[#E4E8F8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-[#5A6478]">
                    Ready to import <strong className="text-[#0E1B3D]">{selectedCount}</strong> video lessons into{" "}
                    <strong className="text-[#0E1B3D]">
                      {courses.find((c) => c.id === selectedCourseId)?.title}
                    </strong>
                    .
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={selectedCount === 0}
                    className="px-8 py-3.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-full shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>🚀</span> Import {selectedCount} Lessons to Course
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inline Course Creation Modal */}
          {showNewCourseModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E4E8F8] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E8F8]">
                  <h3 className="font-bold text-[#0E1B3D] text-base font-heading">
                    Create New Course Inline
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNewCourseModal(false)}
                    className="text-[#5A6478] hover:text-[#0E1B3D]"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateNewCourse} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#0E1B3D] mb-1">Course Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Memory Mastery Advanced Workshop"
                      value={newCourseTitle}
                      onChange={(e) => setNewCourseTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">Price (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={newCoursePriceRupees}
                        onChange={(e) => setNewCoursePriceRupees(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">Category</label>
                      <select
                        value={newCourseCategory}
                        onChange={(e) => setNewCourseCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none"
                      >
                        <option value="memory">Memory</option>
                        <option value="vedic">Vedic Maths</option>
                        <option value="trainer">Teacher &amp; Trainer</option>
                        <option value="calendar">Calendar</option>
                        <option value="free">Free</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E4E8F8] flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewCourseModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#0E1B3D] font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold rounded-xl shadow"
                    >
                      Create & Select Course
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
