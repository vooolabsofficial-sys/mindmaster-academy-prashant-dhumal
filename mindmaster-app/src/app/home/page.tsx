"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Play, 
  Info, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  BookOpen, 
  ArrowRight,
  Award
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { fetchDbCourses, fetchDbBooks, StaffCourse } from "@/lib/staffStore";
import { createClient } from "@/lib/supabase/client";
import { Book } from "@/lib/types";
import { useLanguage } from "@/lib/LanguageContext";

export default function StudentHomePage() {
  const { currentLanguage } = useLanguage();
  const isMarathi = currentLanguage === "mr";

  const [studentName, setStudentName] = useState<string>("Student");
  const [courses, setCourses] = useState<StaffCourse[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [freeLessons, setFreeLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Swimlane scroll refs
  const continueScrollRef = useRef<HTMLDivElement>(null);
  const enrolledScrollRef = useRef<HTMLDivElement>(null);
  const vaultScrollRef = useRef<HTMLDivElement>(null);
  const exploreScrollRef = useRef<HTMLDivElement>(null);

  const scrollLane = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (!ref.current) return;
    const offset = direction === "left" ? -420 : 420;
    ref.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  useEffect(() => {
    // 1. Load Student Profile
    try {
      const raw = localStorage.getItem("mindmaster_user_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.full_name) setStudentName(p.full_name.split(" ")[0]);
      }
    } catch {}

    // 2. Load Watch History
    try {
      const hist = localStorage.getItem("mindmaster_watch_history");
      if (hist) {
        const parsed = JSON.parse(hist);
        if (Array.isArray(parsed)) setWatchHistory(parsed);
      }
    } catch {}

    // 3. Load Courses, Books, & Free Lessons
    async function loadOttData() {
      setIsLoading(true);
      try {
        const [liveCourses, liveBooks] = await Promise.all([
          fetchDbCourses(),
          fetchDbBooks(),
        ]);

        if (liveCourses) {
          setCourses(liveCourses.filter((c) => c.status !== "draft"));
        }
        if (liveBooks) {
          setBooks(liveBooks.filter((b) => b.status !== "draft"));
        }

        const supabase = createClient();
        const { data: freeL } = await supabase
          .from("lessons")
          .select("id, title, duration_sec, position, course_id, courses(title, image_url)")
          .eq("is_free", true)
          .order("position", { ascending: true })
          .limit(8);

        if (freeL && freeL.length > 0) {
          setFreeLessons(freeL);
        }
      } catch (err) {
        console.error("Home Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadOttData();
  }, []);

  // Spotlight active course
  const spotlightCourse = courses[0] || null;

  return (
    <AppShell>
      <title>Student Portal | MindMaster Academy</title>
      <meta
        name="description"
        content="Certified cognitive memory and speed calculation masterclasses by World Record Holder Prashant Dhumal Sir."
      />

      <div className="flex flex-col gap-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4 pb-20 select-none text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-200">
        {/* =========================================================
            1. AIRY DAYLIGHT & MATTE SLATE HERO BANNER
        ========================================================= */}
        <section className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-white dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 border border-blue-100/90 dark:border-slate-700 shadow-xs dark:shadow-md p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 transition-colors duration-200">
          <div className="flex-1 flex flex-col items-start gap-4 z-10 max-w-2xl">
            {/* Metadata Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
                MINDMASTER ORIGINAL
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                VEDIC MATHS &amp; MEMORY
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                BILINGUAL (EN + मराठी)
              </span>
            </div>

            {/* Title */}
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              {spotlightCourse ? spotlightCourse.title : "Speed Calculation & Mnemonic Retention"}
            </h1>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {spotlightCourse?.description ||
                "Master 16 Vedic sutras, lightning speed calculations, and photographic memory retention under World Record Holder Prashant Dhumal Sir."}
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex items-center gap-3.5 pt-2 flex-wrap">
              <Link
                href={
                  spotlightCourse
                    ? `/watch/les-${spotlightCourse.id}`
                    : freeLessons[0]
                    ? `/watch/${freeLessons[0].id}`
                    : "/courses"
                }
                className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white ml-0.5" />
                <span>Resume Episode 01</span>
              </Link>

              <Link
                href={spotlightCourse ? `/course/${spotlightCourse.id}` : "/courses"}
                className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Course Episodes</span>
              </Link>
            </div>
          </div>

          {/* Right Visual Element */}
          <div className="relative w-60 h-60 sm:w-72 sm:h-72 lg:w-80 lg:h-80 shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/40 via-indigo-200/20 to-transparent dark:from-blue-600/10 dark:via-indigo-600/5 dark:to-transparent rounded-full blur-2xl" />
            <div className="relative w-full h-full rounded-2xl overflow-hidden p-2">
              <Image
                src="/assets/images/vedic_maths_abacus_3d.png"
                alt="Prashant Dhumal MindMaster Academy"
                fill
                priority
                className="object-contain drop-shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            2. SWIMLANE ROW 1: "CONTINUE LEARNING" (Apple TV / Coursera Style)
        ========================================================= */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-[#2563EB] dark:bg-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Continue Learning
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollLane(continueScrollRef, "left")}
                aria-label="Scroll left"
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollLane(continueScrollRef, "right")}
                aria-label="Scroll right"
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="min-w-[280px] sm:min-w-[320px] aspect-video rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : watchHistory.length > 0 ? (
            <div
              ref={continueScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth touch-manipulation"
            >
              {watchHistory.map((item, idx) => {
                const percent = Math.min(
                  100,
                  Math.round(((item.positionSec || 0) / (item.durationSec || 600)) * 100)
                );
                const remainingMin = Math.max(
                  1,
                  Math.round(((item.durationSec || 600) - (item.positionSec || 0)) / 60)
                );

                return (
                  <Link
                    key={item.lessonId || idx}
                    href={`/watch/${item.lessonId}?t=${Math.floor(item.positionSec || 0)}`}
                    className="group relative min-w-[280px] sm:min-w-[320px] aspect-video rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/60 overflow-hidden hover:border-blue-400 dark:hover:border-slate-600 shadow-xs hover:shadow-md transition-all shrink-0 flex flex-col justify-between"
                  >
                    <Image
                      src="/assets/images/classroom_memory_drills.png"
                      alt={item.title || "Lesson Thumbnail"}
                      fill
                      className="object-cover opacity-80 dark:opacity-60 group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

                    {/* Top Episode Number Tag */}
                    <div className="relative z-10 p-3 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-black/60 backdrop-blur-md text-white border border-white/10">
                        EP {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2563EB] text-white">
                        {remainingMin}m left
                      </span>
                    </div>

                    {/* Hover Center Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-11 h-11 rounded-full bg-white/90 text-[#2563EB] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-[#2563EB] ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Metadata & Progress Bar */}
                    <div className="relative z-10 p-3 pt-0">
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                        {item.title || "Lesson in Progress"}
                      </h3>
                      <span className="text-[10px] text-slate-200 block truncate mt-0.5">
                        {item.courseTitle || "MindMaster Masterclass"}
                      </span>

                      {/* Progress Line */}
                      <div className="w-full bg-white/20 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-[#2563EB] dark:bg-blue-400 h-full rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 flex items-center justify-center">
                  <Play className="w-5 h-5 ml-0.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">No lectures in progress</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Start streaming any free lecture or enrolled masterclass below to resume instantly.
                  </p>
                </div>
              </div>
              <Link
                href="/courses"
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition whitespace-nowrap"
              >
                Browse Catalog
              </Link>
            </div>
          )}
        </section>

        {/* =========================================================
            3. SWIMLANE ROW 2: "MY ENROLLED MASTERCLASSES"
        ========================================================= */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-[#2563EB] dark:bg-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                My Enrolled Masterclasses
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollLane(enrolledScrollRef, "left")}
                aria-label="Scroll left"
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollLane(enrolledScrollRef, "right")}
                aria-label="Scroll right"
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={enrolledScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth touch-manipulation"
          >
            {courses.length > 0 ? (
              courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/course/${course.id}`}
                  className="group relative min-w-[260px] sm:min-w-[280px] rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/60 overflow-hidden hover:border-blue-400 dark:hover:border-slate-600 shadow-xs hover:shadow-md transition-all shrink-0 flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={course.imageSrc || "/assets/images/vedic_maths_abacus_3d.png"}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                      Active Access
                    </span>
                  </div>

                  <div className="p-4 pt-3 flex flex-col justify-between flex-1 gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {course.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {isMarathi ? course.titleMr || course.title : course.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{course.accessMonths || 6} Months Access</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                        View Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="w-full p-8 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/60 text-center shadow-xs">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No enrolled courses yet. Check the catalog below to activate your first certified masterclass.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================
            4. SWIMLANE ROW 3: "STUDY VAULT & DIGITAL BOOKS"
        ========================================================= */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-amber-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Digital Books &amp; Study Vault
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/notes"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mr-2"
              >
                Open Full Vault
              </Link>
              <button
                type="button"
                onClick={() => scrollLane(vaultScrollRef, "left")}
                aria-label="Scroll left"
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollLane(vaultScrollRef, "right")}
                aria-label="Scroll right"
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={vaultScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth touch-manipulation"
          >
            {books.length > 0 ? (
              books.map((book) => (
                <div
                  key={book.id}
                  className="group relative min-w-[220px] sm:min-w-[250px] rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/60 p-4 shadow-xs hover:shadow-md transition-all shrink-0 flex flex-col justify-between"
                >
                  <div className="flex flex-col justify-between h-full gap-4">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <FileText className="w-5 h-5 stroke-[1.8]" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Offline Ready
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {book.code || "PDF VAULT"}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {book.description || "Official printable study guide and formula charts by Prashant Sir."}
                      </p>
                    </div>

                    <Link
                      href="/notes"
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                      <span>Read Document</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/60 text-center shadow-xs">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Digital books and notes repository syncing with your student profile.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================
            5. SWIMLANE ROW 4: "EXPLORE MORE MASTERCLASSES"
        ========================================================= */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-blue-600 dark:bg-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Explore More Masterclasses
              </h2>
            </div>

            <Link
              href="/courses"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All Courses
            </Link>
          </div>

          <div
            ref={exploreScrollRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {courses.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/course/${c.id}`}
                className="group p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-slate-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                      MASTERCLASS
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      ₹{Math.round(c.pricePaise / 100)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>HD Video &amp; Notes</span>
                  <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Unlock
                    <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
