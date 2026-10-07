"use client";

import { use, useState, useEffect, useRef, Suspense } from "react";
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
  FileText, 
  BookOpen, 
  Save, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  Unlock, 
  AlertCircle, 
  ExternalLink,
  Plus
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { MOCK_LESSONS, MOCK_COURSES, MOCK_NOTES, COURSE_ID_MAP } from "@/lib/mockData";
import { Note, calculateAllowedWords } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { savePlaybackOffline } from "@/lib/offlineStorage";

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

  const lesson =
    MOCK_LESSONS.find((l) => l.id === resolvedParams.lessonId) || MOCK_LESSONS[0];
  const course =
    MOCK_COURSES.find((c) => c.id === lesson.courseId) || MOCK_COURSES[0];
  const allCourseLessons = MOCK_LESSONS.filter((l) => l.courseId === course.id);

  // Access Gating State
  const [hasAccess, setHasAccess] = useState<boolean>(lesson.isFree);
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);

  // Player state
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(lesson.durationSec || 1200);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [resumeNotification, setResumeNotification] = useState<string | null>(null);

  // Anti-Piracy Watermark & Double Tap State
  const [studentWatermark, setStudentWatermark] = useState("MindMaster • Verified Student");
  const [watermarkPos, setWatermarkPos] = useState({ top: "18%", left: "15%" });
  const [doubleTapRipple, setDoubleTapRipple] = useState<{ side: "left" | "right"; text: string } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Word Limit based on video duration
  const maxWordsAllowed = calculateAllowedWords(duration || lesson.durationSec);

  // In-Lecture Note Taking State
  const [noteTitle, setNoteTitle] = useState("");
  const [userNote, setUserNote] = useState("");
  const [capturedTimestamp, setCapturedTimestamp] = useState<number | null>(null);
  const [noteSaved, setNoteSaved] = useState(false);
  const [wordWarning, setWordWarning] = useState<string | null>(null);
  const [lessonNotes, setLessonNotes] = useState<Note[]>([]);

  // Compute live word count
  const currentWords = userNote.trim() ? userNote.trim().split(/\s+/).length : 0;
  const wordPercent = Math.min(100, Math.round((currentWords / maxWordsAllowed) * 100));

  // Format seconds to mm:ss safely (prevents NaN:NaN)
  const formatTime = (secs?: number | null) => {
    if (!secs || isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Load existing notes for this lesson from localStorage + MOCK_NOTES
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mindmaster_user_notes");
      let allNotes: Note[] = MOCK_NOTES;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          allNotes = parsed;
        }
      }
      const matching = allNotes.filter(
        (n) => n.lessonId === lesson.id || (n.courseId === course.id && !n.lessonId)
      );
      setLessonNotes(matching);
    } catch (e) {
      setLessonNotes(MOCK_NOTES.filter((n) => n.lessonId === lesson.id));
    }
  }, [lesson.id, course.id]);

  // 1. GATE ACCESS CHECK: allow if lesson.is_free OR active purchase exists
  useEffect(() => {
    async function checkAccess() {
      if (lesson.isFree) {
        setHasAccess(true);
        setIsCheckingAccess(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const dbCourseUuid = COURSE_ID_MAP[course.id] || course.id;
          const { data: purchase } = await supabase
            .from("purchases")
            .select("id, expires_at, status")
            .eq("user_id", user.id)
            .in("course_id", [course.id, dbCourseUuid])
            .eq("status", "success")
            .gt("expires_at", new Date().toISOString())
            .maybeSingle();

          if (purchase) {
            setHasAccess(true);
            setIsCheckingAccess(false);
            return;
          }
        }

        const localPurchases = localStorage.getItem("mindmaster_active_purchases");
        if (localPurchases) {
          const parsed = JSON.parse(localPurchases);
          const dbCourseUuid = COURSE_ID_MAP[course.id];
          const hasLocalAccess =
            (parsed[course.id] && new Date(parsed[course.id]) > new Date()) ||
            (parsed[course.code] && new Date(parsed[course.code]) > new Date()) ||
            (dbCourseUuid && parsed[dbCourseUuid] && new Date(parsed[dbCourseUuid]) > new Date());

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
  }, [lesson.id, course.id, lesson.isFree]);

  // 2. YOUTUBE PLAYER INITIALIZATION & RESUME PLAYBACK
  useEffect(() => {
    if (!hasAccess) return;

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
              setIsPlaying(event.data === 1);
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
  }, [lesson.id, hasAccess, queryTimeParam, lesson.durationSec, lesson.videoId]);

  // 3. SAVE PROGRESS EVERY 5 SECONDS
  useEffect(() => {
    if (!hasAccess) return;

    const interval = setInterval(async () => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const t = Math.floor(playerRef.current.getCurrentTime());
          setCurrentTime(t);

          if (t > 0) {
            localStorage.setItem(`mindmaster_progress_${lesson.id}`, t.toString());
            savePlaybackOffline(lesson.id, t).catch(() => {});

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("progress").upsert({
                user_id: user.id,
                lesson_id: lesson.id,
                position_sec: t,
                completed: t >= duration - 15,
                updated_at: new Date().toISOString(),
              });
            }
          }
        } catch (e) {}
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [hasAccess, lesson.id, duration]);

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
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const seekBy = (offset: number) => {
    if (!playerRef.current) return;
    const target = Math.max(0, Math.min(duration, currentTime + offset));
    playerRef.current.seekTo(target, true);
    setCurrentTime(target);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (playerRef.current) {
      playerRef.current.seekTo(val, true);
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

  // Jump player directly to timestamp
  const jumpToTimestamp = (sec: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(sec, true);
      setCurrentTime(sec);
      window.scrollTo({ top: 180, behavior: "smooth" });
    }
  };

  // Capture current video timestamp into note
  const handleCaptureTimestamp = () => {
    const cur = currentTime;
    setCapturedTimestamp(cur);
    if (!noteTitle) {
      setNoteTitle(`${lesson.title} @ ${formatTime(cur)}`);
    }
  };

  // Enforced word limit input handler (prevents system hang)
  const handleNoteTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let text = e.target.value;
    const words = text.trim() ? text.trim().split(/\s+/) : [];

    if (words.length > maxWordsAllowed) {
      // Safely clamp words to maximum allowed
      text = words.slice(0, maxWordsAllowed).join(" ");
      setWordWarning(`Word limit reached! Max ${maxWordsAllowed} words allowed for this ${Math.ceil(duration/60)}-minute lecture.`);
      setTimeout(() => setWordWarning(null), 3000);
    } else {
      setWordWarning(null);
    }

    setUserNote(text);
  };

  // Save Note: instantly syncs to shared notes store & /notes dashboard
  const handleSaveNote = async () => {
    if (!userNote.trim()) return;

    const words = userNote.trim().split(/\s+/);
    const finalTimestamp = capturedTimestamp !== null ? capturedTimestamp : currentTime;
    const titleToUse = noteTitle.trim() || `${lesson.title} @ ${formatTime(finalTimestamp)}`;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      userId: "user-1",
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      wordCount: words.length,
      maxWordsAllowed,
      timestampSec: finalTimestamp,
      title: titleToUse,
      body: userNote.trim(),
      updatedAt: "Just now",
    };

    // 1. Update lesson notes state
    setLessonNotes((prev) => [newNote, ...prev]);

    // 2. Update shared localStorage ("mindmaster_user_notes") so /notes sees it immediately
    try {
      const stored = localStorage.getItem("mindmaster_user_notes");
      let allNotes: Note[] = MOCK_NOTES;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) allNotes = parsed;
      }
      const updated = [newNote, ...allNotes];
      localStorage.setItem("mindmaster_user_notes", JSON.stringify(updated));
    } catch (e) {}

    // 3. Persist to Supabase if logged in
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("notes").insert({
          user_id: user.id,
          course_id: course.id,
          title: newNote.title,
          body: newNote.body,
        });
      }
    } catch (err) {}

    // Feedback & Reset input
    setNoteSaved(true);
    setUserNote("");
    setNoteTitle("");
    setCapturedTimestamp(null);
    setTimeout(() => setNoteSaved(false), 3000);
  };

  const progressPercent = Math.min(100, Math.round((currentTime / (duration || 1)) * 100));

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto select-none">
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
        /* ================= CUSTOM YOUTUBE PLAYER ================= */
        <div
          ref={containerRef}
          className="relative bg-black rounded-3xl overflow-hidden shadow-2xl aspect-video w-full flex flex-col justify-end group border border-slate-200"
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
          <div className="relative z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 flex flex-col gap-2 pt-8">
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
      )}

      {/* Bottom 2-Column: Lesson Overview + Live Synchronized Note Dock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Lesson Details & Interactive Live Notes Dock */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Lesson Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
              Lesson {lesson.position} • {course.title}
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
              {lesson.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-600 mt-2 leading-relaxed">
              {lesson.description ||
                "Practical memory and Vedic maths demonstration with Prashant Dhumal Sir. Take concise notes below while watching."}
            </p>
          </div>

          {/* ================= LIVE NOTE-TAKING DOCK ================= */}
          <div className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-xs flex flex-col gap-4">
            {/* Dock Top Bar with Live Word Limit Rule Display */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-sm text-slate-900">
                  Lecture Study Notes
                </span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                  Max {maxWordsAllowed} words (for {Math.ceil(duration/60)} min video)
                </span>
              </div>

              {/* Dynamic Live Word Counter */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                    wordPercent >= 90
                      ? "bg-red-50 text-red-700 border-red-200"
                      : wordPercent >= 70
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  {currentWords} / {maxWordsAllowed} words
                </span>
              </div>
            </div>

            {/* Word limit warning alert */}
            {wordWarning && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{wordWarning}</span>
              </div>
            )}

            {/* Note Title & Capture Timestamp Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder={`Note Topic (e.g. Formula derivation @ ${formatTime(currentTime)})...`}
                  className="w-full p-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={handleCaptureTimestamp}
                className="touch-target-44 min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95 touch-manipulation"
                title="Tag current video timestamp"
              >
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {capturedTimestamp !== null
                    ? `Tagged @ ${formatTime(capturedTimestamp)}`
                    : `Capture Time (${formatTime(currentTime)})`}
                </span>
              </button>
            </div>

            {/* Note Content Textarea with Enforced Word Limit */}
            <div>
              <textarea
                value={userNote}
                onChange={handleNoteTextChange}
                placeholder="Type key formulas, rules, or insights taught by Sir. Text is capped to prevent browser lag..."
                rows={4}
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 leading-relaxed shadow-2xs"
              />
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-600 font-medium">
                {noteSaved ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    नोंद सेव्ह झाली (Synced to /notes workspace)!
                  </span>
                ) : (
                  <span>Auto-syncs directly to your My Notes section</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/notes"
                  className="touch-target-44 min-h-[44px] text-xs font-bold text-blue-600 hover:underline px-3 flex items-center"
                >
                  View All Notes →
                </Link>

                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={!userNote.trim()}
                  className="touch-target-44 min-h-[44px] px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm shadow-blue-500/25 cursor-pointer active:scale-95 touch-manipulation"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Note</span>
                </button>
              </div>
            </div>

            {/* Previously Saved Notes for this Lecture */}
            {lessonNotes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700">
                    Saved Notes for this Lecture ({lessonNotes.length})
                  </span>
                  <span className="text-[10px] text-slate-600 font-semibold">
                    Click timestamp to jump video
                  </span>
                </div>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {lessonNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs text-slate-900 truncate">
                          {n.title}
                        </span>

                        {n.timestampSec !== undefined && (
                          <button
                            type="button"
                            onClick={() => jumpToTimestamp(n.timestampSec!)}
                            className="touch-target-44 min-h-[36px] px-3 py-1 rounded-full text-xs font-bold text-blue-700 bg-blue-100/80 hover:bg-blue-200 border border-blue-300 inline-flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-95 touch-manipulation shrink-0"
                            title="Jump video to this timestamp"
                          >
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>Jump to {formatTime(n.timestampSec)}</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                        <span>{n.wordCount || n.body.split(/\s+/).length} words</span>
                        <span>{n.updatedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
