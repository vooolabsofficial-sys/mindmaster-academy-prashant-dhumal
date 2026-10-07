import { Course } from "./types";
import { getStaffCourses, saveStaffCourse, logStaffAction, getPlatformSettings } from "./staffStore";

export interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  durationSec: number;
  durationFormatted: string;
  thumbnailUrl: string;
  selected: boolean;
}

export interface PlaylistImportConfig {
  courseId: string;
  startPosition: number;
  firstIsFree: boolean;
  validityDays: number;
}

export interface ExtendedVideoRow {
  id: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  videoType: "youtube" | "custom";
  videoId: string;
  publishAt: string;
  removeAt: string | null;
  validityDays: number;
  isFree: boolean;
  durationSec: number;
  views: number;
  avgWatchPercent: number;
  status: "active" | "expiring_soon" | "expired";
}

const STORAGE_KEY_VIDEOS = "mma_videos";

// Seed data matching initial video catalog
export const INITIAL_VIDEOS: ExtendedVideoRow[] = [
  {
    id: "vid-1",
    lessonId: "les-01",
    lessonTitle: "16 Vedic Sutras & Vertical Crosswise Multiplication",
    courseId: "c-mm-01",
    courseTitle: "Vedic Maths Speed Foundation",
    videoType: "youtube",
    videoId: "dQw4w9WgXcQ",
    publishAt: "2026-09-01T09:00:00Z",
    removeAt: "2026-10-01T09:00:00Z",
    validityDays: 30,
    isFree: true,
    durationSec: 840,
    views: 342,
    avgWatchPercent: 88,
    status: "active",
  },
  {
    id: "vid-2",
    lessonId: "les-02",
    lessonTitle: "Base Multiplication: Fast Square Roots in 5 Seconds",
    courseId: "c-mm-01",
    courseTitle: "Vedic Maths Speed Foundation",
    videoType: "youtube",
    videoId: "e-ORhEE9VVg",
    publishAt: "2026-08-15T10:00:00Z",
    removeAt: "2026-09-14T10:00:00Z",
    validityDays: 30,
    isFree: false,
    durationSec: 920,
    views: 215,
    avgWatchPercent: 79,
    status: "expiring_soon",
  },
  {
    id: "vid-3",
    lessonId: "les-03",
    lessonTitle: "Police Bharti Special: Maharashtra District Pegs",
    courseId: "c-mm-03",
    courseTitle: "Police Bharti Special GK & Fast Recall",
    videoType: "custom",
    videoId: "https://stream.mindmasteracademy.in/hls/police-01.m3u8",
    publishAt: "2026-09-05T08:00:00Z",
    removeAt: "2026-10-05T08:00:00Z",
    validityDays: 30,
    isFree: true,
    durationSec: 1200,
    views: 512,
    avgWatchPercent: 92,
    status: "active",
  },
  {
    id: "vid-4",
    lessonId: "les-04",
    lessonTitle: "Superfast Calendar Technique: Any Century Day Formula",
    courseId: "c-mm-04",
    courseTitle: "Superfast Calendar Technique 2026",
    videoType: "youtube",
    videoId: "fJ9rUzIMcZQ",
    publishAt: "2026-08-01T00:00:00Z",
    removeAt: "2026-08-31T00:00:00Z",
    validityDays: 30,
    isFree: false,
    durationSec: 650,
    views: 189,
    avgWatchPercent: 64,
    status: "expired",
  },
];

export function getStoredVideos(): ExtendedVideoRow[] {
  if (typeof window === "undefined") return INITIAL_VIDEOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIDEOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(INITIAL_VIDEOS));
      return INITIAL_VIDEOS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_VIDEOS;
  }
}

export function saveStoredVideos(videos: ExtendedVideoRow[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(videos));
    window.dispatchEvent(new Event("mma_videos_changed"));
  } catch (e) {
    console.error("Failed to save videos", e);
  }
}

// Extract playlist ID from URL
export function extractPlaylistId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes("/")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const listParam = parsed.searchParams.get("list");
    if (listParam) return listParam;
  } catch (e) {
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }
  return null;
}

export const getPlaylistIdFromUrl = extractPlaylistId;

// Extract YouTube Video ID from any URL or string
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pure 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // https://youtu.be/<id>
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // https://www.youtube.com/watch?v=<id>
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // https://www.youtube.com/embed/<id>
  const embedMatch = trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // https://www.youtube.com/shorts/<id>
  const shortsMatch = trimmed.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  return null;
}

// Parse multiline bulk text into PlaylistItem array
export function parseBulkYouTubeLinks(text: string): PlaylistItem[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: PlaylistItem[] = [];

  lines.forEach((line, index) => {
    // Check if line contains custom title like "Introduction | https://..."
    let customTitle = "";
    let urlPart = line;

    if (line.includes("|")) {
      const parts = line.split("|");
      customTitle = parts[0].trim();
      urlPart = parts[1].trim();
    } else if (line.includes(" - ")) {
      const parts = line.split(" - ");
      customTitle = parts[0].trim();
      urlPart = parts[1].trim();
    }

    const videoId = extractYouTubeVideoId(urlPart) || extractYouTubeVideoId(line);
    if (videoId) {
      const lessonNum = index + 1;
      const title = customTitle || `Lesson ${lessonNum}`;
      results.push({
        id: `bulk-${Date.now()}-${lessonNum}-${videoId}`,
        videoId,
        title,
        description: `Imported lesson ${lessonNum}`,
        durationSec: 900,
        durationFormatted: "15:00",
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        selected: true,
      });
    }
  });

  return results;
}

// Import selected items into video store and update the target course
export function importPlaylistLessons(
  items: PlaylistItem[],
  config: PlaylistImportConfig
): { count: number; courseTitle: string } {
  const selectedItems = items.filter((i) => i.selected);
  if (selectedItems.length === 0) {
    throw new Error("No lessons selected for import.");
  }

  const courses = getStaffCourses();
  const course = courses.find((c) => c.id === config.courseId);
  if (!course) {
    throw new Error("Target course not found.");
  }

  const existingVideos = getStoredVideos();
  const settings = getPlatformSettings();
  const liveDays = config.validityDays || settings.default_video_live_days || 30;

  const now = new Date();
  const removeDate = new Date(now.getTime() + liveDays * 24 * 60 * 60 * 1000);

  let additionalDurationSec = 0;

  const newVideos: ExtendedVideoRow[] = selectedItems.map((item, idx) => {
    const isFirst = idx === 0;
    const isFree = config.firstIsFree && isFirst;
    const pos = config.startPosition + idx;
    additionalDurationSec += item.durationSec || 900;

    return {
      id: `vid-pl-${Date.now()}-${idx}-${item.videoId}`,
      lessonId: `les-pl-${pos}-${item.videoId}`,
      lessonTitle: item.title,
      courseId: course.id,
      courseTitle: course.title,
      videoType: "youtube",
      videoId: item.videoId,
      publishAt: now.toISOString(),
      removeAt: removeDate.toISOString(),
      validityDays: liveDays,
      isFree,
      durationSec: item.durationSec || 900,
      views: 0,
      avgWatchPercent: 0,
      status: "active",
    };
  });

  // Save new video rows to store
  saveStoredVideos([...newVideos, ...existingVideos]);

  // Update course lesson counts
  const updatedCourse: Course = {
    ...course,
    lessonsCount: (course.lessonsCount || 0) + newVideos.length,
    totalDurationHours: Number(
      ((course.totalDurationHours || 0) + additionalDurationSec / 3600).toFixed(1)
    ),
  };
  saveStaffCourse(updatedCourse);

  // Log Staff Audit Action
  logStaffAction(
    "PLAYLIST_IMPORT",
    "video",
    course.id,
    course.title,
    `Imported ${newVideos.length} YouTube lessons (Positions ${config.startPosition}..${
      config.startPosition + newVideos.length - 1
    }, 1st Free: ${config.firstIsFree}, Validity: ${liveDays}d)`
  );

  return {
    count: newVideos.length,
    courseTitle: course.title,
  };
}
