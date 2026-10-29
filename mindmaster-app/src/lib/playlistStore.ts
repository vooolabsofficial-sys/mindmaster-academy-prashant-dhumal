import { Course } from "./types";
import { getStaffCourses, saveStaffCourse, logStaffAction, getPlatformSettings } from "./staffStore";

function getSupabase() {
  try {
    if (typeof window === "undefined") {
      const { createAdminClient } = require("./supabase/admin");
      return createAdminClient();
    } else {
      const { createClient } = require("./supabase/client");
      return createClient();
    }
  } catch {
    return null;
  }
}

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
  daysLeft?: number;
  description?: string;
  position?: number;
  partNumber?: number;
  totalParts?: number;
  seriesTitle?: string;
  likesCount?: number;
}

export function extractYouTubeVideoId(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const longMatch = trimmed.match(/(?:watch\?v=|embed\/|v\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  return trimmed;
}

const STORAGE_KEY_VIDEOS = "mma_videos";

// Production Clean Slate: 0 Fake Videos
export const INITIAL_VIDEOS: ExtendedVideoRow[] = [];

export function getStoredVideos(): ExtendedVideoRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIDEOS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
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

  // Sync to Supabase lessons table
  const supabase = getSupabase();
  if (supabase) {
    try {
      newVideos.forEach((v, idx) => {
        supabase
          .from("lessons")
          .upsert({
            course_id: v.courseId,
            title: v.lessonTitle,
            duration_sec: v.durationSec,
            is_free: v.isFree,
            video_type: v.videoType,
            video_url: `https://www.youtube.com/watch?v=${v.videoId}`,
            video_id: v.videoId,
            position: config.startPosition + idx,
            description: v.description || "",
            publish_at: v.publishAt,
            remove_at: v.removeAt,
          }, { onConflict: "course_id,position" })
          .then(() => {})
          .catch(() => {});
      });
    } catch {}
  }

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

export async function fetchDbVideos(): Promise<ExtendedVideoRow[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return getStoredVideos();

    const { data, error } = await supabase
      .from("lessons")
      .select("*, courses(id, title)")
      .order("position", { ascending: true });

    if (error) return getStoredVideos();
    if (!data || data.length === 0) {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify([]));
        window.dispatchEvent(new Event("mma_videos_changed"));
      }
      return [];
    }

    const mapped: ExtendedVideoRow[] = data.map((d: any) => ({
      id: d.id,
      lessonId: d.id,
      lessonTitle: d.title,
      courseId: d.course_id,
      courseTitle: d.courses?.title || "Course",
      videoType: d.video_type || "youtube",
      videoId: d.video_id || extractYouTubeVideoId(d.video_url || ""),
      publishAt: d.publish_at || d.created_at,
      removeAt: d.remove_at,
      validityDays: 30,
      isFree: Boolean(d.is_free),
      durationSec: d.duration_sec || 900,
      views: 0,
      avgWatchPercent: 0,
      status: "active",
      position: d.position,
      description: d.description,
      partNumber: d.part_number,
      totalParts: d.total_parts,
      seriesTitle: d.series_title,
      likesCount: d.likes_count || 0,
    }));

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(mapped));
      window.dispatchEvent(new Event("mma_videos_changed"));
    }

    return mapped;
  } catch {
    return getStoredVideos();
  }
}

export async function syncCourseLessonCount(courseId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { count } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId);

    await supabase
      .from("courses")
      .update({ lessons_count: count || 0 })
      .eq("id", courseId);
  } catch {}
}

export async function saveLessonToSupabase(video: ExtendedVideoRow): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(video.id);
    const payload: any = {
      course_id: video.courseId,
      title: video.lessonTitle,
      duration_sec: video.durationSec || 900,
      is_free: Boolean(video.isFree),
      video_type: video.videoType || "youtube",
      video_url: video.videoType === "youtube" ? `https://www.youtube.com/watch?v=${video.videoId}` : video.videoId,
      video_id: video.videoId,
      position: video.position || 1,
      description: video.description || "",
      part_number: video.partNumber || 1,
      series_title: video.seriesTitle || null,
      publish_at: video.publishAt || new Date().toISOString(),
      remove_at: video.removeAt || null,
    };
    if (isUuid) {
      payload.id = video.id;
    }

    await supabase
      .from("lessons")
      .upsert(payload, { onConflict: "course_id,position" });

    await syncCourseLessonCount(video.courseId);
  } catch (err) {
    console.warn("saveLessonToSupabase error:", err);
  }
}

export async function deleteLessonFromSupabase(lessonIdOrVideoId: string, courseId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonIdOrVideoId);
    let query = supabase.from("lessons").delete();
    if (isUuid) {
      query = query.or(`id.eq.${lessonIdOrVideoId},video_id.eq.${lessonIdOrVideoId}`);
    } else {
      query = query.eq("video_id", lessonIdOrVideoId);
    }
    await query;
    await syncCourseLessonCount(courseId);
  } catch (err) {
    console.warn("deleteLessonFromSupabase error:", err);
  }
}
