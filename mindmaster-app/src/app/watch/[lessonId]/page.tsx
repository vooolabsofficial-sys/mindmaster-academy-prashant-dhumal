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
  ChevronLeft,
  Clock, 
  Unlock, 
  ExternalLink,
  ThumbsUp,
  Headphones,
  FileText,
  Award,
  Sparkles,
  Share2,
  Check
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { COURSE_ID_MAP } from "@/lib/mockData";
import { Lesson } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { savePlaybackOffline, queueWatchHeartbeatOffline, syncQueuedWatchHeartbeats } from "@/lib/offlineStorage";
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
          description: v.description,
          partNumber: v.partNumber,
          totalParts: v.totalParts,
          seriesTitle: v.seriesTitle,
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

  // Watched state tracking for episodes list
  const [watchedLessonIds, setWatchedLessonIds] = useState<Set<string>>(new Set());

  // Cached Auth & Throttling Refs
  const cachedUserRef = useRef<{ id: string; phone: string } | null>(null);
  const lastRemoteSaveSecRef = useRef<number>(-1);
  const lastRemoteSaveTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Load watched status from localStorage / IndexedDB
  useEffect(() => {
    if (typeof window === "undefined") return;
    const watched = new Set<string>();
    allCourseLessons.forEach((l) => {
      if (
        localStorage.getItem(`mma_completed_${l.id}`) === "true" ||
        localStorage.getItem(`mindmaster_completed_${l.id}`) === "true"
      ) {
        watched.add(l.id);
      }
    });
    setWatchedLessonIds(watched);
  }, [allCourseLessons.length]);

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

  // Format seconds to mm:ss safely
  const formatTime = (secs?: number | null) => {
    if (!secs || isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Check access for locked vs free lesson
  useEffect(() => {
    if (!lesson) {
      setIsCheckingAccess(false);
      return;
    }

    if (lesson.isFree) {
      setHasAccess(true);
      setIsCheckingAccess(false);
      return;
    }

    async function checkAccess() {
      try {
        const targetCourseIds = [course?.id, course?.code, lesson?.courseId].filter(
          Boolean
        ) as string[];

        let phone = cachedUserRef.current?.phone;
        if (!phone) {
          const rawProfile = localStorage.getItem("mindmaster_user_profile");
          if (rawProfile) {
            const p = JSON.parse(rawProfile);
            phone = p.mobile_number || p.phone;
          }
        }

        if (phone) {
          for (const cId of targetCourseIds) {
            const accessResult = await verifyStudentCourseAccess({ courseId: cId, userPhone: phone });
            if (accessResult.hasAccess) {
              setHasAccess(true);
              setIsCheckingAccess(false);
              return;
            }
          }
        }

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

  // Flushes progress to server
  const flushProgress = useCallback(
    async (currentTimeSec: number, completed = false) => {
      if (!lesson) return;
      const studentId = cachedUserRef.current?.id;
      if (!studentId) return;

      lastRemoteSaveSecRef.current = currentTimeSec;
      lastRemoteSaveTimeRef.current = Date.now();

      const payload = {
        lesson_id: lesson.id,
        position_sec: currentTimeSec,
        completed,
        user_id: studentId,
      };

      const offlinePayload = {
        lessonId: lesson.id,
        positionSec: currentTimeSec,
        completed,
        userId: studentId,
      };

      try {
        if (!navigator.onLine) {
          await queueWatchHeartbeatOffline(offlinePayload);
          return;
        }

        const res = await fetch("/api/watch-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          await queueWatchHeartbeatOffline(offlinePayload);
        }
      } catch {
        await queueWatchHeartbeatOffline(offlinePayload);
      }
    },
    [lesson?.id]
  );

  // Ordered playlists: determine previous and next lessons
  const currentIndex = allCourseLessons.findIndex((l) => l.id === lesson?.id);
  const prevLesson = currentIndex > 0 ? allCourseLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allCourseLessons.length - 1
      ? allCourseLessons[currentIndex + 1]
      : null;

  // YouTube player init
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

              if (ended) {
                const dur = duration || lesson.durationSec || 1;
                flushProgress(dur, true);
                // Mark watched
                const nextWatched = new Set(watchedLessonIds);
                nextWatched.add(lesson.id);
                setWatchedLessonIds(nextWatched);
                localStorage.setItem(`mma_completed_${lesson.id}`, "true");
                localStorage.setItem(`mindmaster_completed_${lesson.id}`, "true");
                
                // Auto-advance to next episode
                if (nextLesson) {
                  router.push(`/watch/${nextLesson.id}`);
                }
              } else if (!playing && playerRef.current?.getCurrentTime) {
                const t = Math.floor(playerRef.current.getCurrentTime());
                flushProgress(t);
              }
            },
          },
        });
      } else {
        window.onYouTubeIframeAPIReady = () => initPlayer();
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [hasAccess, lesson?.videoId, lesson?.id, queryTimeParam, flushProgress, nextLesson, router]);

  // Throttled interval ticker (every 1s)
  useEffect(() => {
    if (!hasAccess || !lesson) return;

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && lesson) {
        try {
          const t = Math.floor(playerRef.current.getCurrentTime());
          setCurrentTime(t);

          if (isPlayingRef.current && t > 0) {
            const now = Date.now();
            const timeSinceLastRemote = now - lastRemoteSaveTimeRef.current;
            const diffSec = Math.abs(t - lastRemoteSaveSecRef.current);
            const totalDur = duration || lesson.durationSec || 1;
            const isCompleted = t >= totalDur - 15;

            if (diffSec >= 5) {
              localStorage.setItem(`mindmaster_progress_${lesson.id}`, t.toString());
              savePlaybackOffline(lesson.id, t, isCompleted).catch(() => {});
            }

            if (timeSinceLastRemote >= 180000 || (isCompleted && !lastRemoteSaveSecRef.current)) {
              flushProgress(t, isCompleted);
            }
          }
        } catch (e) {}
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasAccess, lesson?.id, duration, lesson?.durationSec, flushProgress]);

  // Flush playback on unload
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

  // Dynamic Floating Watermark
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
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      if (isLeft) {
        seekBy(-10);
        setDoubleTapRipple({ side: "left", text: "-10s" });
      } else {
        seekBy(10);
        setDoubleTapRipple({ side: "right", text: "+10s" });
      }
      setTimeout(() => setDoubleTapRipple(null), 850);
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x: e.clientX };
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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleAudioOnlyMode = () => {
    const nextState = !isAudioOnlyMode;
    setIsAudioOnlyMode(nextState);
    if (playerRef.current) {
      try {
        if (nextState) {
          if (typeof playerRef.current.setPlaybackQuality === "function") {
            playerRef.current.setPlaybackQuality("small");
          }
        } else {
          if (typeof playerRef.current.setPlaybackQuality === "function") {
            playerRef.current.setPlaybackQuality("default");
          }
        }
      } catch {}
    }
  };

  // Toggle Mark Watched for current lesson
  const isCurrentWatched = watchedLessonIds.has(lesson?.id || "");
  const toggleMarkWatched = async () => {
    if (!lesson) return;
    const nextSet = new Set(watchedLessonIds);
    const willBeWatched = !nextSet.has(lesson.id);
    if (willBeWatched) {
      nextSet.add(lesson.id);
      localStorage.setItem(`mma_completed_${lesson.id}`, "true");
      localStorage.setItem(`mindmaster_completed_${lesson.id}`, "true");
      await savePlaybackOffline(lesson.id, duration || lesson.durationSec || 600, true);
      flushProgress(duration || lesson.durationSec || 600, true);
    } else {
      nextSet.delete(lesson.id);
      localStorage.removeItem(`mma_completed_${lesson.id}`);
      localStorage.removeItem(`mindmaster_completed_${lesson.id}`);
      await savePlaybackOffline(lesson.id, currentTime, false);
    }
    setWatchedLessonIds(nextSet);
  };

  if (!lesson || !course) {
    return (
      <AppShell>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center text-[#F8FAFC]">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 text-[#0052FF]">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] mb-2">Episode Coming Soon</h2>
          <p className="text-[#94A3B8] text-sm max-w-md mb-6 leading-relaxed">
            This episode is being prepared for high-definition streaming. Check other available masterclasses or return home.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/courses"
              className="px-6 py-2.5 rounded-xl bg-[#0052FF] hover:bg-[#0956FF] text-white font-bold text-sm transition shadow-lg shadow-blue-900/30"
            >
              Explore Masterclasses
            </Link>
            <Link
              href="/home"
              className="px-6 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-[#F8FAFC] font-medium text-sm transition"
            >
              Home
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const progressPercent = Math.min(100, Math.round((currentTime / (duration || 1)) * 100));

  return (
    <div className="min-h-screen bg-[#06080D] text-[#F8FAFC] pb-24 selection:bg-blue-600/30">
      <title>{`${lesson.title} | MindMaster Theater`}</title>
      <meta
        name="description"
        content={`Watch ${lesson.title} - ${course.title} with international trainer Prashant Dhumal Sir.`}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-3 flex flex-col gap-5">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between text-xs">
          <Link
            href={`/course/${course.id}`}
            className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-[#F8FAFC] transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="truncate max-w-[200px] sm:max-w-md">Back to {course.title}</span>
          </Link>

          <div className="flex items-center gap-2">
            {lesson.isFree ? (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Free Preview
              </span>
            ) : hasAccess ? (
              <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Full Access Active
              </span>
            ) : null}
          </div>
        </div>

        {/* Video Player OR Locked Screen */}
        {!hasAccess ? (
          /* ================= OTT LOCKED STATE SCREEN ================= */
          <div className="bg-[#121722] rounded-3xl p-8 md:p-12 border border-white/[0.08] shadow-2xl flex flex-col items-center text-center max-w-2xl mx-auto my-8">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
              <Lock className="w-10 h-10" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full mb-3">
              Episode Locked
            </span>

            <h2 className="text-xl md:text-2xl font-bold text-[#F8FAFC]">
              {lesson.title}
            </h2>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-2 max-w-md leading-relaxed">
              To stream this masterclass episode and unlock the complete syllabus, notes vault, and verified certificate, enroll in this masterclass.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-[#0A0D14] border border-white/[0.06] w-full flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">
                  {course.code} • {course.accessMonths || 3} Months Access
                </span>
                <span className="text-base font-bold text-[#F8FAFC]">
                  {course.title}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-[#0052FF]">
                  ₹{Math.round(course.pricePaise / 100)}
                </span>
              </div>
            </div>

            <Link
              href={`/checkout?courseId=${course.id}`}
              className="mt-6 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#0956FF] to-[#002984] hover:from-blue-600 hover:to-blue-800 text-white text-xs md:text-sm font-bold shadow-xl shadow-blue-900/40 transition inline-flex items-center gap-2 active:scale-95"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Masterclass Now</span>
            </Link>
          </div>
        ) : (
          /* ================= THEATER VIDEO PLAYER ================= */
          <div className="flex flex-col gap-3">
            <PiracyShield contentType="video" className="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08] bg-black">
              <div
                ref={containerRef}
                className="relative bg-black aspect-video w-full flex flex-col justify-end group select-none overflow-hidden"
              >
                {/* Resume Notification */}
                {resumeNotification && (
                  <div className="absolute top-4 left-4 z-30 bg-[#0052FF]/90 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1.5 animate-in fade-in duration-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{resumeNotification}</span>
                  </div>
                )}

                {/* Subtle Dynamic Floating Watermark */}
                <div 
                  style={{ top: watermarkPos.top, left: watermarkPos.left }}
                  className="absolute z-20 pointer-events-none transition-all duration-1000 ease-in-out opacity-25 select-none text-xs font-mono text-white/90 bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/10 shadow-sm"
                >
                  {studentWatermark}
                </div>

                {/* Double Tap Feedback */}
                {doubleTapRipple && (
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none text-white text-sm font-bold px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md shadow-2xl animate-pulse flex items-center gap-1.5 ${
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

                {/* Transparent Pointer-Blocking Shield Overlays */}
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

                {/* Low-Data / Audio-Only Mode Overlay */}
                {isAudioOnlyMode && (
                  <div className="absolute inset-0 z-25 bg-[#0A0D14]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#0052FF] flex items-center justify-center mb-3 animate-pulse">
                      <Headphones className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Low Data Mode Active (240p)
                    </span>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white max-w-md truncate px-4">
                      {lesson.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-sm">
                      Audio Revision Stream • Visual frame paused to save bandwidth
                    </p>
                  </div>
                )}

                {/* Touch to Play/Pause Center Overlay */}
                <div
                  onClick={handlePlayerTouch}
                  className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center bg-black/10 hover:bg-black/20 transition"
                >
                  {!isPlaying && (
                    <div className="w-16 h-16 rounded-full bg-[#0052FF] text-white flex items-center justify-center shadow-2xl backdrop-blur-md transform hover:scale-105 active:scale-95 transition">
                      <Play className="w-7 h-7 ml-1 fill-white" />
                    </div>
                  )}
                </div>

                {/* Custom Overlay Control Bar */}
                <div className="relative z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 flex flex-col gap-2 pt-8">
                  {/* OTT Royal Blue Progress Bar */}
                  <div className="relative flex items-center w-full group/bar">
                    <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-visible pointer-events-none">
                      <div
                        className="bg-[#0052FF] h-full rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#0052FF] border-2 border-white shadow-md transition-all scale-100 group-hover/bar:scale-125"
                        style={{ left: `calc(${progressPercent}% - 7px)` }}
                      />
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSliderChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Seek video slider"
                    />
                  </div>

                  {/* Playback Actions Row */}
                  <div className="flex items-center justify-between text-white text-xs font-semibold pt-1">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        onClick={togglePlay}
                        aria-label={isPlaying ? "Pause video" : "Play video"}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer active:scale-90"
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
                        className="w-9 h-9 flex items-center justify-center hover:text-blue-400 active:scale-90 transition cursor-pointer"
                        title="10s Back (Or double-tap left)"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => seekBy(10)}
                        aria-label="Seek forward 10 seconds"
                        className="w-9 h-9 flex items-center justify-center hover:text-blue-400 active:scale-90 transition cursor-pointer"
                        title="10s Forward (Or double-tap right)"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                        className="w-9 h-9 flex items-center justify-center hover:text-blue-400 active:scale-90 transition cursor-pointer"
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-red-400" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>

                      <span className="text-[11px] font-mono text-[#94A3B8] ml-1">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Speed Chips */}
                      <div className="hidden sm:flex items-center gap-1 bg-white/[0.08] rounded-xl p-0.5 border border-white/[0.06]">
                        {[1, 1.25, 1.5, 2].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSpeedDirect(s)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              playbackRate === s
                                ? "bg-[#0052FF] text-white"
                                : "text-white/70 hover:bg-white/10"
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={toggleFullscreen}
                        aria-label="Toggle fullscreen"
                        className="w-9 h-9 flex items-center justify-center hover:text-blue-400 active:scale-90 transition cursor-pointer"
                      >
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </PiracyShield>

            {/* Sticky Action Bar */}
            <div className="sticky top-2 z-30 bg-[#121722]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3">
              {/* Left: Previous & Watched */}
              <div className="flex items-center gap-2">
                {prevLesson ? (
                  <Link
                    href={`/watch/${prevLesson.id}`}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#F8FAFC] text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous Episode</span>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[#94A3B8]/40 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous Episode</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleMarkWatched}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer active:scale-95 border ${
                    isCurrentWatched
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-[#F8FAFC]"
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${isCurrentWatched ? "text-emerald-400" : "text-[#94A3B8]"}`} />
                  <span>{isCurrentWatched ? "Watched" : "Mark Watched"}</span>
                </button>
              </div>

              {/* Right: Audio Mode, Notes & Next Episode */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAudioOnlyMode}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 border ${
                    isAudioOnlyMode
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                  title="Toggle Low-Data Audio Mode"
                >
                  <Headphones className="w-4 h-4" />
                  <span className="hidden sm:inline">{isAudioOnlyMode ? "Audio Mode On" : "Audio Mode"}</span>
                </button>

                <Link
                  href="/notes"
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <FileText className="w-4 h-4 text-[#0052FF]" />
                  <span className="hidden md:inline">Open Episode PDF Notes</span>
                  <span className="md:hidden">Notes</span>
                </Link>

                {nextLesson ? (
                  <Link
                    href={`/watch/${nextLesson.id}`}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0956FF] to-[#002984] hover:from-blue-600 hover:to-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-blue-900/40 active:scale-95"
                  >
                    <span>Next Episode</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/certificate"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-900/40 active:scale-95"
                  >
                    <Award className="w-4 h-4" />
                    <span>Claim Certificate</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Cinema Layout: Episode Synopsis (Left) & Hotstar Episodes List (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
          {/* Left Column: Episode Details (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="bg-[#121722] rounded-2xl p-6 border border-white/[0.08] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#0052FF]">
                      Episode {lesson.position || currentIndex + 1} • {course.title}
                    </span>
                    {lesson.seriesTitle && (
                      <span className="text-[10px] font-semibold text-[#94A3B8] bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.06]">
                        {lesson.seriesTitle}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-[#F8FAFC]">
                    {lesson.title}
                  </h1>
                </div>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border active:scale-95 cursor-pointer shrink-0 self-start sm:self-center ${
                    isLiked
                      ? "bg-[#0052FF] text-white border-blue-500 shadow-md shadow-blue-900/30"
                      : "bg-white/[0.04] text-[#94A3B8] border-white/[0.08] hover:bg-white/[0.08] hover:text-[#F8FAFC]"
                  }`}
                  title="Like this lecture"
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-white" : ""}`} />
                  <span>{isLiked ? "Liked" : "Like"}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isLiked ? "bg-white/20 text-white" : "bg-white/10 text-white"
                    }`}
                  >
                    {likesCount}
                  </span>
                </button>
              </div>

              <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed">
                {lesson.description ||
                  "Practical memory techniques and Vedic maths demonstration with international trainer Prashant Dhumal Sir."}
              </p>

              {/* Quick Specs / Tags */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/[0.06] text-xs text-[#94A3B8]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Duration: {formatTime(lesson.durationSec || duration)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Official MindMaster Curriculum</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Disney+ Hotstar Style Episodes List (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="bg-[#121722] rounded-2xl p-4 border border-white/[0.08] flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="font-bold text-sm text-[#F8FAFC]">
                  Course Episodes
                </h3>
                <span className="text-xs text-[#0052FF] font-semibold">
                  {allCourseLessons.length} Episodes
                </span>
              </div>

              {/* Episode Rail */}
              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
                {allCourseLessons.map((l, idx) => {
                  const isCurrent = l.id === lesson.id;
                  const isWatched = watchedLessonIds.has(l.id);
                  const isAccessible = l.isFree || hasAccess;
                  const epNum = (idx + 1).toString().padStart(2, "0");
                  const thumbUrl = l.videoId
                    ? `https://img.youtube.com/vi/${l.videoId}/mqdefault.jpg`
                    : null;

                  return (
                    <Link
                      key={l.id}
                      href={`/watch/${l.id}`}
                      className={`group p-2.5 rounded-xl border transition-all flex items-center gap-3 text-xs ${
                        isCurrent
                          ? "bg-blue-600/10 border-blue-500/50 text-[#F8FAFC]"
                          : "bg-white/[0.02] border-white/[0.06] text-[#94A3B8] hover:bg-white/[0.05] hover:border-white/[0.12] hover:text-[#F8FAFC]"
                      }`}
                    >
                      {/* 16:9 Mini Thumbnail */}
                      <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={l.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#0A0D14]">
                            <Play className="w-4 h-4 text-white/50" />
                          </div>
                        )}

                        {/* Playing / Watched Indicator Badge */}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>

                        {/* Top-left Episode Number */}
                        <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/70 text-[9px] font-mono text-white/80">
                          {epNum}
                        </div>
                      </div>

                      {/* Episode Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#0052FF]">
                            EP {epNum}
                          </span>
                          {l.isFree && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              FREE
                            </span>
                          )}
                        </div>
                        <h4 className={`font-semibold text-xs line-clamp-1 mt-0.5 ${isCurrent ? "text-blue-400" : "text-[#F8FAFC]"}`}>
                          {l.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#94A3B8]">
                          <span>{formatTime(l.durationSec || 600)}</span>
                          {isWatched && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Watched
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Status Indicator */}
                      <div className="shrink-0">
                        {isCurrent ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0052FF] animate-pulse" />
                        ) : isWatched ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isAccessible ? (
                          <Play className="w-3.5 h-3.5 text-[#94A3B8]/60 group-hover:text-white" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-[#94A3B8]/40" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
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
            <div className="w-8 h-8 border-3 border-[#0052FF] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <WatchLessonContent resolvedParams={resolvedParams} />
      </Suspense>
    </AppShell>
  );
}
