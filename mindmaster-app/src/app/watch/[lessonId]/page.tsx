"use client";

import { use, useState, useEffect, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Lock, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  Unlock, 
  ExternalLink,
  ThumbsUp,
  Headphones,
  FileText
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { COURSE_ID_MAP } from "@/lib/mockData";
import { Lesson } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { savePlaybackOffline } from "@/lib/offlineStorage";
import { getStoredVideos } from "@/lib/playlistStore";
import { getStaffCourses } from "@/lib/staffStore";
import { normalizePhone } from "@/lib/phoneUtils";
import { verifyStudentCourseAccess } from "@/app/actions/studentAccess";
import PiracyShield from "@/components/common/PiracyShield";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

function WatchLessonContent({
  resolvedParams,
}: {
  resolvedParams: { lessonId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTimeParam = searchParams.get("t");

  const storedVideos = typeof window !== "undefined" ? getStoredVideos() : [];
  const dynamicMatch = storedVideos.find(
    (v) =>
      v.lessonId === resolvedParams.lessonId ||
      v.id === resolvedParams.lessonId ||
      v.videoId === resolvedParams.lessonId
  );
  const staffCourses = typeof window !== "undefined" ? getStaffCourses() : [];

  const lesson: Lesson | null = dynamicMatch
    ? {
        id: dynamicMatch.lessonId || dynamicMatch.id,
        courseId: dynamicMatch.courseId,
        title: dynamicMatch.lessonTitle,
        durationSec: dynamicMatch.durationSec,
        isFree: dynamicMatch.isFree,
        videoType: dynamicMatch.videoType,
        videoId: dynamicMatch.videoId,
        position: dynamicMatch.position || 1,
        description: dynamicMatch.description,
        partNumber: dynamicMatch.partNumber,
        totalParts: dynamicMatch.totalParts,
        seriesTitle: dynamicMatch.seriesTitle,
        likesCount: dynamicMatch.likesCount,
      }
    : null;

  const course = lesson
    ? staffCourses.find((c) => c.id === lesson.courseId || c.code === lesson.courseId) || null
    : null;

  const allCourseLessons: Lesson[] = dynamicMatch && course
    ? storedVideos
        .filter((v) => v.courseId === course.id)
        .map((v) => ({
          id: v.lessonId || v.id,
          courseId: v.courseId,
          title: v.lessonTitle,
          durationSec: v.durationSec,
          isFree: v.isFree,
          videoType: v.videoType,
          videoId: v.videoId,
          position: v.position || 1,
        }))
    : [];

  // Access Gating State
  const [hasAccess, setHasAccess] = useState<boolean>(lesson?.isFree ?? false);
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);

  // Player state
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(lesson?.durationSec || 1200);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [resumeNotification, setResumeNotification] = useState<string | null>(null);

  // Low-Data Audio-Only Mode
  const [isAudioOnlyMode, setIsAudioOnlyMode] = useState<boolean>(false);

  // Anti-Piracy Watermark & Double Tap State
  const [studentWatermark, setStudentWatermark] = useState("MindMaster • Verified Student");
  const [watermarkPos, setWatermarkPos] = useState({ top: "18%", left: "15%" });
  const [doubleTapRipple, setDoubleTapRipple] = useState<{ side: "left" | "right"; text: string } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);


  // Cached Auth & Throttling Refs
  const cachedUserRef = useRef<{ id: string; phone: string } | null>(null);
  const lastRemoteSaveSecRef = useRef<number>(-1);
  const lastRemoteSaveTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Anti-piracy blackout & media pause listener
  useEffect(() => {
    const handlePauseEvent = () => {
      try {
        if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo();
        }
        setIsPlaying(false);
      } catch {}
    };
    window.addEventListener("mma_pause_media", handlePauseEvent);
    return () => window.removeEventListener("mma_pause_media", handlePauseEvent);
  }, []);

  // Fetch student profile/auth once on mount and cache it
  useEffect(() => {
    async function loadAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        let phone = user?.phone || (user?.user_metadata?.phone as string) || "";
        let uid = user?.id || "";

        try {
          const raw = localStorage.getItem("mindmaster_user_profile");
          if (raw) {
            const p = JSON.parse(raw);
            if (!uid && p.id) uid = p.id;
            if (!phone && (p.mobile_number || p.phone)) phone = p.mobile_number || p.phone;
          }
        } catch {}

        cachedUserRef.current = { id: uid, phone };
      } catch {}
    }
    loadAuth();
  }, []);

  // Student Like State
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(0);

  // Load Like status for this lesson from localStorage + live Supabase video_likes
  useEffect(() => {
    if (!lesson) return;
    let isMounted = true;
    try {
      const storedLikes = JSON.parse(localStorage.getItem("mindmaster_liked_videos") || "[]");
      const userHasLiked = Array.isArray(storedLikes) && storedLikes.includes(lesson.id);
      setIsLiked(userHasLiked);

      const baseLikes =
        lesson.likesCount !== undefined
          ? lesson.likesCount
          : Math.floor((lesson.durationSec || 600) / 25) + 8;
      setLikesCount(baseLikes + (userHasLiked ? 1 : 0));

      async function syncLiveLikes() {
        if (!lesson) return;
        try {
          const supabase = createClient();
          const { count, error } = await supabase
            .from("video_likes")
            .select("*", { count: "exact", head: true })
            .eq("lesson_id", lesson.id);

          if (!error && typeof count === "number" && count > 0 && isMounted) {
            setLikesCount(count);
          }

          let phone = cachedUserRef.current?.phone;
          if (!phone) {
            const rawProfile = localStorage.getItem("mindmaster_user_profile");
            if (rawProfile) {
              const p = JSON.parse(rawProfile);
              phone = p.mobile_number || p.phone;
            }
          }
          const cleanPhone = normalizePhone(phone);

          if (cleanPhone) {
            const { data: userLike } = await supabase
              .from("video_likes")
              .select("id")
              .eq("lesson_id", lesson.id)
              .eq("user_phone", cleanPhone)
              .maybeSingle();

            if (userLike && isMounted) {
              setIsLiked(true);
              const curStored = JSON.parse(localStorage.getItem("mindmaster_liked_videos") || "[]");
              if (Array.isArray(curStored) && !curStored.includes(lesson.id)) {
                localStorage.setItem("mindmaster_liked_videos", JSON.stringify([...curStored, lesson.id]));
              }
            }
          }
        } catch {}
      }

      syncLiveLikes();
    } catch {
      setLikesCount(12);
    }

    return () => {
      isMounted = false;
    };
  }, [lesson?.id, lesson?.likesCount, lesson?.durationSec]);

  // Toggle Like handler (optimistic UI + Supabase video_likes sync)
  const handleToggleLike = async () => {
    if (!lesson) return;
    try {
      const storedLikes: string[] = JSON.parse(localStorage.getItem("mindmaster_liked_videos") || "[]");
      const nextLiked = !isLiked;
      setIsLiked(nextLiked);
      setLikesCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

      let updatedLikes: string[];
      if (nextLiked) {
        updatedLikes = Array.from(new Set([...(Array.isArray(storedLikes) ? storedLikes : []), lesson.id]));
      } else {
        updatedLikes = Array.isArray(storedLikes) ? storedLikes.filter((id) => id !== lesson.id) : [];
      }
      localStorage.setItem("mindmaster_liked_videos", JSON.stringify(updatedLikes));

      let phone = cachedUserRef.current?.phone;
      if (!phone) {
        const rawProfile = localStorage.getItem("mindmaster_user_profile");
        if (rawProfile) {
          const p = JSON.parse(rawProfile);
          phone = p.mobile_number || p.phone;
        }
      }
      const cleanPhone = normalizePhone(phone);

      if (cleanPhone) {
        const supabase = createClient();
        if (nextLiked) {
          await supabase.from("video_likes").upsert(
            {
              lesson_id: lesson.id,
              course_id: course?.id || lesson.courseId,
              user_phone: cleanPhone,
              created_at: new Date().toISOString(),
            },
            { onConflict: "lesson_id,user_phone" }
          );
        } else {
          await supabase
            .from("video_likes")
            .delete()
            .eq("lesson_id", lesson.id)
            .eq("user_phone", cleanPhone);
        }
      }
    } catch {}
  };

  // Format seconds to mm:ss safely (prevents NaN:NaN)
  const formatTime = (secs?: number | null) => {
    if (!secs || isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 1. GATE ACCESS CHECK: allow if lesson.is_free OR active purchase/grant exists
  useEffect(() => {
    if (!lesson || !course) {
      setIsCheckingAccess(false);
      return;
    }

    async function checkAccess() {
      if (!lesson || !course) return;
      if (lesson.isFree) {
        setHasAccess(true);
        setIsCheckingAccess(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let userId = user?.id || "";
        let userPhone = user?.phone || (user?.user_metadata?.phone as string) || "";

        try {
          const rawProfile = localStorage.getItem("mindmaster_user_profile");
          if (rawProfile) {
            const p = JSON.parse(rawProfile);
            if (!userId && p.id) userId = p.id;
            if (!userPhone && (p.mobile_number || p.phone)) {
              userPhone = p.mobile_number || p.phone;
            }
          }
        } catch {}

        const cleanPhone = normalizePhone(userPhone);
        const dbCourseUuid = COURSE_ID_MAP[course.id] || course.id;
        const targetCourseIds = Array.from(new Set([course.id, course.code, dbCourseUuid].filter(Boolean)));

        // 1. Verify access via server action using Service Role (admin.ts)
        const serverAccess = await verifyStudentCourseAccess({
          courseId: course.id,
          userPhone: cleanPhone,
          userId,
        });

        if (serverAccess.hasAccess) {
          setHasAccess(true);
          setIsCheckingAccess(false);
          return;
        }

        // 2. Fallback check local active purchases cache
        const localPurchases = localStorage.getItem("mindmaster_active_purchases");
        if (localPurchases) {
          const parsed = JSON.parse(localPurchases);
          const hasLocalAccess = targetCourseIds.some(
            (cId) => parsed[cId] && new Date(parsed[cId]) > new Date()
          );

          if (hasLocalAccess) {
            setHasAccess(true);
            setIsCheckingAccess(false);
            return;
          }
        }

        setHasAccess(false);
      } catch (err) {
        setHasAccess(false);
      } finally {
        setIsCheckingAccess(false);
      }
    }

    checkAccess();
  }, [lesson?.id, course?.id, course?.code, lesson?.isFree]);

  // 2. YOUTUBE PLAYER INITIALIZATION & RESUME PLAYBACK
  useEffect(() => {
    if (!hasAccess || !lesson) return;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = async () => {
      let initialSeek = 0;
      if (queryTimeParam) {
        initialSeek = parseInt(queryTimeParam, 10) || 0;
      } else {
        const local = localStorage.getItem(`mindmaster_progress_${lesson.id}`);
        if (local) initialSeek = parseInt(local, 10) || 0;

        // Auto-resume from remote cloud progress if available
        try {
          const studentId = cachedUserRef.current?.id;
          if (studentId) {
            const res = await fetch(`/api/watch-stats?lesson_id=${lesson.id}&user_id=${studentId}`);
            if (res.ok) {
              const data = await res.json();
              const cloudPos = data?.progress?.position_sec;
              if (typeof cloudPos === "number" && cloudPos > initialSeek) {
                initialSeek = cloudPos;
              }
            }
          }
        } catch {}
      }

      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player("custom-yt-player", {
          videoId: lesson.videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              const dur = event.target.getDuration() || lesson.durationSec;
              setDuration(dur);

              if (initialSeek > 3 && initialSeek < dur - 10) {
                event.target.seekTo(initialSeek, true);
                setCurrentTime(initialSeek);
                setResumeNotification(`Resumed playback at ${formatTime(initialSeek)}`);
                setTimeout(() => setResumeNotification(null), 4000);
              }
            },
            onStateChange: (event: any) => {
              const playing = event.data === 1;
              setIsPlaying(playing);
              const ended = event.data === 0;

              // Flush progress immediately when video pauses or ends with completed = true
              if (ended) {
                const dur = duration || lesson.durationSec || 1;
                flushProgress(dur, true);
              } else if (!playing && playerRef.current?.getCurrentTime) {
                const t = Math.floor(playerRef.current.getCurrentTime());
                flushProgress(t);
              }
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [lesson?.id, hasAccess, queryTimeParam, lesson?.durationSec, lesson?.videoId]);

  // 3. FLUSH & THROTTLED PROGRESS SAVING (0 network spam when paused)
  const flushProgress = useCallback(
    async (timeToSave?: number, isCompletedOverride?: boolean) => {
      if (!hasAccess || !lesson || !course) return;
      const t =
        typeof timeToSave === "number"
          ? timeToSave
          : playerRef.current?.getCurrentTime
          ? Math.floor(playerRef.current.getCurrentTime())
          : currentTime;
      if (t < 0) return;

      const totalDur = duration || lesson.durationSec || 1;
      const isCompleted =
        isCompletedOverride !== undefined ? isCompletedOverride : t >= totalDur - 15;

      // 1. Instant local and offline IndexedDB persistence
      try {
        localStorage.setItem(`mindmaster_progress_${lesson.id}`, t.toString());
        savePlaybackOffline(lesson.id, t, isCompleted).catch(() => {});

        const histRaw = localStorage.getItem("mindmaster_watch_history");
        const histArr = histRaw ? JSON.parse(histRaw) : [];
        const histItem = {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          courseId: course.id,
          courseTitle: course.title,
          positionSec: t,
          durationSec: totalDur,
          completed: isCompleted,
          updatedAt: new Date().toISOString(),
        };
        const filtered = Array.isArray(histArr)
          ? histArr.filter((h: any) => h.lessonId !== lesson.id)
          : [];
        localStorage.setItem(
          "mindmaster_watch_history",
          JSON.stringify([histItem, ...filtered].slice(0, 30))
        );
      } catch {}

      // 2. Remote database save (throttled)
      const now = Date.now();
      lastRemoteSaveSecRef.current = t;
      lastRemoteSaveTimeRef.current = now;

      const studentId = cachedUserRef.current?.id;
      if (studentId) {
        try {
          const supabase = createClient();
          await supabase.from("progress").upsert(
            {
              user_id: studentId,
              lesson_id: lesson.id,
              position_sec: t,
              completed: isCompleted,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,lesson_id" }
          );
        } catch {
          // Fallback to /api/watch-stats POST
          try {
            fetch("/api/watch-stats", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lesson_id: lesson.id,
                position_sec: t,
                completed: isCompleted,
                user_id: studentId,
              }),
            }).catch(() => {});
          } catch {}
        }
      }
    },
    [hasAccess, lesson?.id, lesson?.durationSec, duration, course?.id, course?.title, currentTime]
  );

  // Throttled interval ticker (every 1s, remote network call max once per 15s while playing)
  useEffect(() => {
    if (!hasAccess || !lesson) return;

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && lesson) {
        try {
          const t = Math.floor(playerRef.current.getCurrentTime());
          setCurrentTime(t);

          // ONLY trigger remote save if video is actively playing!
          // Debounce/throttle remote network calls to at most once every 15 seconds,
          // or immediately if lesson completion threshold reached.
          if (isPlayingRef.current && t > 0) {
            const now = Date.now();
            const timeSinceLastRemote = now - lastRemoteSaveTimeRef.current;
            const diffSec = Math.abs(t - lastRemoteSaveSecRef.current);
            const totalDur = duration || lesson.durationSec || 1;
            const isCompleted = t >= totalDur - 15;

            // Local cache update every 5 seconds
            if (diffSec >= 5) {
              localStorage.setItem(`mindmaster_progress_${lesson.id}`, t.toString());
              savePlaybackOffline(lesson.id, t, isCompleted).catch(() => {});
            }

            // Remote save throttled to 15s (or upon reaching 100% completion)
            if (timeSinceLastRemote >= 15000 || (isCompleted && !lastRemoteSaveSecRef.current)) {
              flushProgress(t, isCompleted);
            }
          }
        } catch (e) {}
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasAccess, lesson?.id, duration, lesson?.durationSec, flushProgress]);

  // Flush playback on page exit / unmount so no progress is lost
  useEffect(() => {
    if (!lesson) return;

    const handleUnload = () => {
      if (playerRef.current?.getCurrentTime && lesson) {
        const t = Math.floor(playerRef.current.getCurrentTime());
        const studentId = cachedUserRef.current?.id;
        if (studentId && t > 0) {
          const totalDur = duration || lesson.durationSec || 1;
          const payload = JSON.stringify({
            lesson_id: lesson.id,
            position_sec: t,
            completed: t >= totalDur - 15,
            user_id: studentId,
          });
          if (navigator.sendBeacon) {
            navigator.sendBeacon("/api/watch-stats", payload);
          } else {
            fetch("/api/watch-stats", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: payload,
              keepalive: true,
            }).catch(() => {});
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      handleUnload();
    };
  }, [lesson?.id, duration, lesson?.durationSec]);

  // Dynamic Floating Watermark & Double Tap logic
  useEffect(() => {
    try {
      const phone = localStorage.getItem("mindmaster_verified_phone") || "+91 98221 00001";
      const profile = JSON.parse(localStorage.getItem("mindmaster_user_profile") || "{}");
      const name = profile.full_name || "Verified Student";
      setStudentWatermark(`MindMaster • ${name} (${phone})`);
    } catch {}

    const interval = setInterval(() => {
      const topPositions = ["12%", "24%", "58%", "72%", "38%"];
      const leftPositions = ["10%", "30%", "52%", "68%", "20%"];
      const rTop = topPositions[Math.floor(Math.random() * topPositions.length)];
      const rLeft = leftPositions[Math.floor(Math.random() * leftPositions.length)];
      setWatermarkPos({ top: rTop, left: rLeft });
    }, 14000);

    return () => clearInterval(interval);
  }, []);

  const handlePlayerTouch = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = e.clientX - rect.left;
    const isLeft = relativeX < rect.width / 2;

    if (now - lastTapRef.current.time < 350) {
      // Double tap detected! Cancel pending single-tap play/pause toggle
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      if (isLeft) {
        seekBy(-10);
        setDoubleTapRipple({ side: "left", text: "⏪ -10s" });
      } else {
        seekBy(10);
        setDoubleTapRipple({ side: "right", text: "⏩ +10s" });
      }
      setTimeout(() => setDoubleTapRipple(null), 850);
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x: e.clientX };
      // Debounce single tap so double-tap doesn't cause video to pause/unpause first
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => {
        togglePlay();
        singleTapTimerRef.current = null;
      }, 280);
    }
  };

  const setSpeedDirect = (speed: number) => {
    setPlaybackRate(speed);
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(speed);
    }
  };

  // Player controls
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      if (playerRef.current.getCurrentTime) {
        flushProgress(Math.floor(playerRef.current.getCurrentTime()));
      }
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const seekBy = (offset: number) => {
    if (!playerRef.current || !lesson) return;
    const target = Math.max(0, Math.min(duration, currentTime + offset));
    playerRef.current.seekTo(target, true);
    setCurrentTime(target);
    localStorage.setItem(`mindmaster_progress_${lesson.id}`, target.toString());
    savePlaybackOffline(lesson.id, target).catch(() => {});
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (playerRef.current && lesson) {
      playerRef.current.seekTo(val, true);
      localStorage.setItem(`mindmaster_progress_${lesson.id}`, Math.floor(val).toString());
      savePlaybackOffline(lesson.id, Math.floor(val)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const changeSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(nextSpeed);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Low-Data Audio-Only Mode Toggle ("🎧 फक्त ऑडिओ मोड - डेटा वाचवा")
  const toggleAudioOnlyMode = () => {
    const nextState = !isAudioOnlyMode;
    setIsAudioOnlyMode(nextState);
    if (playerRef.current) {
      try {
        if (nextState) {
          if (typeof playerRef.current.setPlaybackQuality === "function") {
            playerRef.current.setPlaybackQuality("small");
          }
          if (typeof playerRef.current.setPlaybackQualityRange === "function") {
            playerRef.current.setPlaybackQualityRange("small", "small");
          }
        } else {
          if (typeof playerRef.current.setPlaybackQuality === "function") {
            playerRef.current.setPlaybackQuality("default");
          }
        }
      } catch {}
    }
  };



  // Jump player directly to timestamp

  if (!lesson || !course) {
    return (
      <AppShell>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Lesson Not Found</h2>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            The requested lecture or lesson could not be found. Please check our available courses.
          </p>
          <Link
            href="/courses"
            className="px-6 py-2.5 rounded-xl bg-[#0052FF] hover:bg-[#0047E0] text-white font-semibold text-sm transition shadow-lg shadow-blue-500/25"
          >
            Browse Courses
          </Link>
        </div>
      </AppShell>
    );
  }

  const progressPercent = Math.min(100, Math.round((currentTime / (duration || 1)) * 100));

  // Determine Next Lesson in Multi-Part Series or Course
  const currentPartNumber = lesson.partNumber || 1;
  const currentSeriesTitle = lesson.seriesTitle;
  const nextLesson = allCourseLessons.find((l) => {
    if (l.id === lesson.id) return false;
    if (currentSeriesTitle && l.seriesTitle && l.seriesTitle.toLowerCase() === currentSeriesTitle.toLowerCase()) {
      return (l.partNumber || 1) === currentPartNumber + 1;
    }
    return (l.position || 1) === (lesson.position || 1) + 1;
  });

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-2 pb-24 select-none">
      <title>{`${lesson.title} | MindMaster Academy`}</title>
      <meta
        name="description"
        content={`Watch ${lesson.title} - ${course.title} with international trainer Prashant Dhumal Sir.`}
      />

      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/course/${course.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {course.title}</span>
        </Link>

        <div className="flex items-center gap-2">
          {lesson.isFree ? (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
              ✓ Free Preview
            </span>
          ) : hasAccess ? (
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
              ✓ Full Access Active
            </span>
          ) : null}
        </div>
      </div>

      {/* Video Player Box OR Locked State Gating */}
      {!hasAccess ? (
        /* ================= LOCKED STATE SCREEN ================= */
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-xs flex flex-col items-center text-center max-w-2xl mx-auto my-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-5 shadow-2xs">
            <Lock className="w-10 h-10" />
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full mb-3">
            Lesson Locked
          </span>

          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
            {lesson.title}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 mt-2 max-w-md leading-relaxed">
            To watch this premium video and unlock the full syllabus, practice worksheets, and official e-certificate, please enroll in this course.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 w-full flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {course.code} • {course.accessMonths} Months Access
              </span>
              <span className="text-base font-extrabold text-slate-900">
                {course.title}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-blue-600">
                ₹{Math.round(course.pricePaise / 100)}
              </span>
            </div>
          </div>

          {/* Direct Unlock Button to Checkout */}
          <Link
            href={`/checkout?courseId=${course.id}`}
            className="mt-6 px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-extrabold shadow-lg shadow-blue-500/25 transition inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Course Now</span>
          </Link>
        </div>
      ) : (
        <>
          {/* ================= CUSTOM YOUTUBE PLAYER WITH PIRACY SHIELD ================= */}
          <PiracyShield contentType="video" className="w-full rounded-3xl overflow-hidden shadow-2xl">
            <div
              ref={containerRef}
            className="relative bg-black rounded-3xl overflow-hidden aspect-video w-full flex flex-col justify-end group border border-slate-200"
          >
          {/* Resume Notification Popup */}
          {resumeNotification && (
            <div className="absolute top-4 left-4 z-30 bg-blue-600/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md animate-fade-in flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{resumeNotification}</span>
            </div>
          )}

          {/* Anti-piracy Dynamic Floating Watermark (Moves periodically) */}
          <div 
            style={{ top: watermarkPos.top, left: watermarkPos.left }}
            className="absolute z-20 pointer-events-none transition-all duration-1000 ease-in-out opacity-40 select-none text-[10px] font-mono text-white/95 bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/10 shadow-sm"
          >
            {studentWatermark}
          </div>

          {/* Double Tap Ripple Feedback Overlay */}
          {doubleTapRipple && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none text-white text-sm font-black px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-sm shadow-xl animate-pulse flex items-center gap-1.5 ${
                doubleTapRipple.side === "left" ? "left-8" : "right-8"
              }`}
            >
              <span>{doubleTapRipple.text}</span>
            </div>
          )}

          {/* Hidden/Shielded YouTube IFrame */}
          <div className="absolute inset-0 w-full h-full pointer-events-none scale-105">
            <div id="custom-yt-player" className="w-full h-full" />
          </div>

          {/* Transparent Pointer-Blocking Shield Overlays (Blocks clicking YouTube title bar & bottom-right YouTube logo) */}
          <div
            className="absolute top-0 left-0 right-0 h-16 pointer-events-auto z-20 bg-transparent select-none cursor-default"
            onClick={(e) => { e.stopPropagation(); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-0 w-44 h-16 pointer-events-auto z-20 bg-transparent select-none cursor-default"
            onClick={(e) => { e.stopPropagation(); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            aria-hidden="true"
          />

          {/* Low-Data / Audio-Only Mode Visual Cover Card */}
          {isAudioOnlyMode && (
            <div className="absolute inset-0 z-25 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-3 animate-pulse shadow-xl">
                <Headphones className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-3 py-1 rounded-full mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Low Data Mode Active (240p)
              </span>
              <h3 className="text-base sm:text-lg md:text-xl font-black text-white max-w-md truncate px-4">
                {lesson.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-sm font-semibold">
                🎧 Audio Revision Mode Active (Data Saver)
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Visual stream paused for high-speed mobile data saving
              </p>
            </div>
          )}

          {/* Click / Double-Tap to Play/Pause Center Overlay */}
          <div
            onClick={handlePlayerTouch}
            className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center bg-black/10 hover:bg-black/20 transition"
          >
            {!isPlaying && (
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl backdrop-blur-md transform hover:scale-110 active:scale-95 transition">
                <Play className="w-7 h-7 ml-1 fill-white" />
              </div>
            )}
          </div>

          {/* Custom Overlay Control Bar */}
          <div className="relative z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 flex flex-col gap-2 pt-8">
            {/* Blue Progress Bar with Interactive Drag Dot */}
            <div className="relative flex items-center w-full group/bar">
              <div className="relative w-full h-2 bg-white/25 rounded-full overflow-visible pointer-events-none">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md transition-all scale-100 group-hover/bar:scale-125"
                  style={{ left: `calc(${progressPercent}% - 8px)` }}
                />
              </div>

              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSliderChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Bottom Control Actions */}
            <div className="flex items-center justify-between text-white text-xs font-semibold pt-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                  className="touch-target-44 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer active:scale-90"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => seekBy(-10)}
                  aria-label="Seek back 10 seconds"
                  className="touch-target-44 w-10 h-10 flex items-center justify-center hover:text-blue-400 active:scale-90 transition cursor-pointer"
                  title="10s Back (Or double-tap left)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => seekBy(10)}
                  aria-label="Seek forward 10 seconds"
                  className="touch-target-44 w-10 h-10 flex items-center justify-center hover:text-blue-400 active:scale-90 transition cursor-pointer"
                  title="10s Forward (Or double-tap right)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                  className="touch-target-44 w-10 h-10 flex items-center justify-center hover:text-blue-400 active:scale-90 transition cursor-pointer"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <span className="text-[11px] font-mono text-white/85 ml-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Desktop / Tablet Direct Speed Chips */}
                <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-0.5 border border-white/10">
                  {[1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeedDirect(s)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                        playbackRate === s
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-white/80 hover:bg-white/15"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                {/* Mobile Speed Toggle */}
                <button
                  onClick={changeSpeed}
                  aria-label={`Playback speed: ${playbackRate}x`}
                  className="sm:hidden touch-target-44 min-h-[44px] px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  {playbackRate}x
                </button>

                <button
                  onClick={toggleFullscreen}
                  aria-label="Toggle fullscreen"
                  className="touch-target-44 w-10 h-10 flex items-center justify-center hover:text-blue-400 active:scale-90 transition cursor-pointer"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </PiracyShield>

      {/* Rural-Friendly Playback Controls & Low-Data Audio Mode Quick Strip */}
      <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Seek Buttons: ⏪ -10s and +10s ⏩ */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => seekBy(-10)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-black transition cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-2xs"
            title="Seek back 10 seconds"
            aria-label="Seek back 10 seconds"
          >
            <span>⏪ -10s</span>
          </button>

          <button
            type="button"
            onClick={() => seekBy(10)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-black transition cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-2xs"
            title="Seek forward 10 seconds"
            aria-label="Seek forward 10 seconds"
          >
            <span>+10s ⏩</span>
          </button>
        </div>

        {/* Playback Speed Selector: 1x, 1.25x, 1.5x, 2x */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 px-1.5 hidden sm:inline">Speed:</span>
          {[1, 1.25, 1.5, 2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeedDirect(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                playbackRate === s
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-white hover:text-slate-900"
              }`}
              aria-label={`Set playback speed to ${s}x`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Low-Data / Audio-Only Mode Toggle */}
        <button
          type="button"
          onClick={toggleAudioOnlyMode}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 border shadow-xs active:scale-95 ${
            isAudioOnlyMode
              ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20"
              : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
          }`}
          title="Low-Data Audio Revision Mode"
          aria-label="Low-Data Audio Revision Mode"
        >
          <Headphones className="w-4 h-4 text-emerald-600" />
          <span>
            {isAudioOnlyMode
              ? "🎧 Audio Mode Active (Data Saver)"
              : "🎧 Audio-Only Mode (Save Data)"}
          </span>
        </button>
      </div>
    </>
  )}

      {/* Bottom 2-Column: Lesson Overview + Live Synchronized Note Dock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Lesson Details & Interactive Live Notes Dock */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Lesson Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                  Lesson {lesson.position} • {course.title}
                </span>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
                  {lesson.title}
                </h1>
              </div>

              {/* Student Like (👍) Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all border shadow-xs active:scale-95 cursor-pointer shrink-0 self-start sm:self-center ${
                  isLiked
                    ? "bg-blue-600 text-white border-blue-600 shadow-blue-500/20"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
                title="Like this lecture"
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-white" : ""}`} />
                <span>{isLiked ? "Liked" : "Like"}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isLiked ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  {likesCount}
                </span>
              </button>
            </div>

            {/* Multi-Part Series Chaining Banner */}
            {(currentSeriesTitle || lesson.partNumber || (nextLesson && allCourseLessons.length > 1)) && (
              <div className="p-4 rounded-2xl bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                    #{lesson.partNumber || lesson.position || 1}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider block">
                      {currentSeriesTitle ? `Series: ${currentSeriesTitle}` : `Video Series`}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Part {lesson.partNumber || lesson.position || 1}
                      {lesson.totalParts ? ` / ${lesson.totalParts}` : ""}
                    </span>
                  </div>
                </div>

                {nextLesson && (
                  <Link
                    href={`/watch/${nextLesson.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition active:scale-95"
                  >
                    <span>Next Part ({nextLesson.partNumber ? `Part ${nextLesson.partNumber}` : nextLesson.title.slice(0, 18)}) ▶️</span>
                  </Link>
                )}
              </div>
            )}

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              {lesson.description ||
                "Practical memory and Vedic maths demonstration with international trainer Prashant Dhumal Sir."}
            </p>
          </div>
        </div>

        {/* Right Column (1 col): Up-Next Lesson Playlist */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center justify-between">
              <span>Up-Next Playlist</span>
              <span className="text-xs text-blue-600 font-bold">
                {allCourseLessons.length} Lessons
              </span>
            </h3>

            <div className="flex flex-col gap-2">
              {allCourseLessons.map((l) => {
                const isCurrent = l.id === lesson.id;
                const isAccessible = l.isFree || hasAccess;

                return (
                  <Link
                    key={l.id}
                    href={`/watch/${l.id}`}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 text-xs ${
                      isCurrent
                        ? "bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isCurrent ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 animate-ping" />
                      ) : isAccessible ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}

                      <span className="truncate">{l.title}</span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {l.isFree && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          FREE
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WatchLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <WatchLessonContent resolvedParams={resolvedParams} />
      </Suspense>
    </AppShell>
  );
}
