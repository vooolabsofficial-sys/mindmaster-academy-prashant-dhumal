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
  Lock, 
  FileText, 
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
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
        console.error("OTT Home Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadOttData();
  }, []);

  // Spotlight active course: First course or default flagship masterclass
  const spotlightCourse = courses[0] || null;

  return (
    <AppShell>
      <title>MindMaster Studio | OTT Learning Experience</title>
      <meta
        name="description"
        content="Stream certified cognitive memory and speed calculation masterclasses by World Record Holder Prashant Dhumal Sir."
      />

      <div className="flex flex-col gap-10 pb-20 select-none bg-[#0A0D14] text-[#F8FAFC]">
        {/* =========================================================
            1. FULL-BLEED CINEMATIC HERO SPOTLIGHT (Netflix / Disney+ Hotstar)
        ========================================================= */}
        <section className="relative w-full min-h-[500px] md:min-h-[580px] lg:min-h-[640px] flex items-end overflow-hidden border-b border-white/[0.06]">
          {/* Edge-to-Edge Visual Banner */}
          <div className="absolute inset-0 w-full h-full">
            <Image
              src="/assets/images/classroom_memory_drills.png"
              alt="MindMaster Studio Masterclass"
              fill
              priority
              className="object-cover object-top opacity-60 scale-100 md:scale-105 transition-transform duration-1000 ease-out"
            />
            {/* Multi-stop OTT Vignette Fades */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14] via-[#0A0D14]/85 to-transparent w-full md:w-3/4" />
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#0A0D14]/80 to-transparent pointer-events-none" />
          </div>

          {/* Hero Spotlight Metadata & CTAs */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-10 md:pb-16 flex flex-col items-start gap-4">
            {/* Metadata Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#0052FF] shadow-sm">
                <Sparkles className="w-3 h-3 text-[#0052FF]" />
                MINDMASTER ORIGINAL
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                COGNITIVE MEMORY
              </span>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                BILINGUAL (EN + मराठी)
              </span>
              <span className="text-[#94A3B8]">•</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.08] border border-white/10 text-white font-mono">
                4K ULTRA HD
              </span>
            </div>

            {/* Title */}
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#F8FAFC] tracking-tight leading-[1.08] max-w-3xl">
              {spotlightCourse ? spotlightCourse.title : "Speed Calculation & Mnemonic Retention"}
            </h1>

            {/* 2-Line Synopsis */}
            <p className="text-xs sm:text-sm md:text-base text-[#94A3B8] max-w-2xl leading-relaxed line-clamp-2">
              {spotlightCourse?.description ||
                "Master 16 Vedic sutras, lightning speed calculations, and photographic memory retention under World Record Holder Prashant Dhumal Sir."}
            </p>

            {/* Primary & Secondary Glass CTAs */}
            <div className="flex items-center gap-3.5 pt-3 flex-wrap">
              <Link
                href={
                  spotlightCourse
                    ? `/watch/les-${spotlightCourse.id}`
                    : freeLessons[0]
                    ? `/watch/${freeLessons[0].id}`
                    : "/courses"
                }
                className="px-6 md:px-8 py-3.5 rounded-full bg-gradient-to-r from-[#0956FF] to-[#002984] hover:brightness-110 text-white font-black text-xs md:text-sm tracking-wide shadow-[0_0_24px_rgba(9,86,255,0.45)] transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 group"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-3 h-3 fill-white ml-0.5" />
                </div>
                <span>Resume Episode 01</span>
              </Link>

              <Link
                href={spotlightCourse ? `/course/${spotlightCourse.id}` : "/courses"}
                className="px-6 py-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.15] backdrop-blur-md text-[#F8FAFC] font-bold text-xs md:text-sm transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Info className="w-4 h-4 text-[#94A3B8]" />
                <span>Course Episodes</span>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================
            2. SWIMLANE ROW 1: "CONTINUE WATCHING" (16:9 Video Cards)
        ========================================================= */}
        <section className="w-full max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-[#0052FF]" />
              <h2 className="text-base sm:text-lg font-bold text-[#F8FAFC] tracking-tight">
                Continue Watching
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollLane(continueScrollRef, "left")}
                aria-label="Scroll left"
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollLane(continueScrollRef, "right")}
                aria-label="Scroll right"
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:text-white transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="min-w-[280px] sm:min-w-[320px] aspect-video rounded-2xl ott-shimmer" />
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
                    className="group relative min-w-[280px] sm:min-w-[320px] aspect-video rounded-2xl bg-[#121722] border border-white/[0.08] overflow-hidden hover:border-white/20 transition-all duration-300 hover:scale-[1.02] shrink-0 flex flex-col justify-between"
                  >
                    <Image
                      src="/assets/images/classroom_memory_drills.png"
                      alt={item.title || "Lesson Thumbnail"}
                      fill
                      className="object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/40 to-transparent" />

                    {/* Top Episode Number Tag */}
                    <div className="relative z-10 p-3 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-black/60 backdrop-blur-md text-white border border-white/10">
                        EP {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0052FF]/80 backdrop-blur-md text-white">
                        {remainingMin}m left
                      </span>
                    </div>

                    {/* Hover Center Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Metadata & Progress Bar */}
                    <div className="relative z-10 p-3 pt-0">
                      <h3 className="text-xs sm:text-sm font-bold text-[#F8FAFC] truncate">
                        {item.title || "Lesson in Progress"}
                      </h3>
                      <span className="text-[10px] text-[#94A3B8] block truncate mt-0.5">
                        {item.courseTitle || "MindMaster Masterclass"}
                      </span>

                      {/* Progress Line */}
                      <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-[#0052FF] h-full rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Clean Cinema Fallback when no watch history exists */
            <div className="p-6 rounded-2xl bg-[#121722] border border-white/[0.08] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-blue-400">
                  <Play className="w-5 h-5 ml-0.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F8FAFC]">No lectures in progress</h4>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Start streaming any free lecture or enrolled masterclass below to resume instantly.
                  </p>
                </div>
              </div>
              <Link
                href="/courses"
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/10 transition whitespace-nowrap"
              >
                Browse Catalog
              </Link>
            </div>
          )}
        </section>

        {/* =========================================================
            3. SWIMLANE ROW 2: "MY ENROLLED MASTERCLASSES" (Poster Cards)
        ========================================================= */}
        <section className="w-full max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-blue-500" />
              <h2 className="text-base sm:text-lg font-bold text-[#F8FAFC] tracking-tight">
                My Enrolled Masterclasses
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollLane(enrolledScrollRef, "left")}
                aria-label="Scroll left"
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollLane(enrolledScrollRef, "right")}
                aria-label="Scroll right"
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:text-white transition cursor-pointer"
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
                  className="group relative min-w-[240px] sm:min-w-[280px] rounded-2xl bg-[#121722] border border-white/[0.08] overflow-hidden hover:border-white/20 transition-all duration-300 hover:scale-[1.03] shrink-0 flex flex-col justify-between ring-1 ring-white/[0.04]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={course.imageSrc || "/assets/images/vedic_maths_abacus_3d.png"}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121722] via-transparent to-transparent" />

                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                      Active Access
                    </span>
                  </div>

                  <div className="p-4 pt-1 flex flex-col justify-between flex-1 gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                        {course.code}
                      </span>
                      <h3 className="text-sm font-bold text-[#F8FAFC] mt-0.5 line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {isMarathi ? course.titleMr || course.title : course.title}
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-semibold text-[#94A3B8]">
                      <span>6 Months Access</span>
                      <span className="text-blue-400 font-bold flex items-center gap-1">
                        View Masterclass
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="w-full p-8 rounded-2xl bg-[#121722] border border-white/[0.08] text-center">
                <p className="text-sm text-[#94A3B8]">
                  No enrolled courses yet. Check the catalog below to activate your first certified masterclass.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================
            4. SWIMLANE ROW 3: "DIGITAL BOOKS & NOTES VAULT" (Documentary Style)
        ========================================================= */}
        <section className="w-full max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-amber-500" />
              <h2 className="text-base sm:text-lg font-bold text-[#F8FAFC] tracking-tight">
                Digital Books &amp; Study Vault
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/notes"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 mr-2"
              >
                Open Full Vault
              </Link>
              <button
                type="button"
                onClick={() => scrollLane(vaultScrollRef, "left")}
                aria-label="Scroll left"
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollLane(vaultScrollRef, "right")}
                aria-label="Scroll right"
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:text-white transition cursor-pointer"
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
                  className="group relative min-w-[220px] sm:min-w-[250px] rounded-2xl bg-[#121722] border border-white/[0.08] overflow-hidden hover:border-white/20 transition-all duration-300 shrink-0 flex flex-col justify-between"
                >
                  <div className="p-4 flex flex-col justify-between h-full gap-4">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-400">
                        <FileText className="w-5 h-5 stroke-[1.8]" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Offline Ready
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-[#94A3B8] uppercase">
                        {book.code || "PDF VAULT"}
                      </span>
                      <h3 className="text-sm font-bold text-[#F8FAFC] mt-0.5 line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                        {book.description || "Official printable study guide and formula charts by Prashant Sir."}
                      </p>
                    </div>

                    <Link
                      href="/notes"
                      className="w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/10 transition flex items-center justify-center gap-1.5"
                    >
                      <span>Read Document</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full p-6 rounded-2xl bg-[#121722] border border-white/[0.08] text-center">
                <p className="text-xs text-[#94A3B8]">
                  Digital books and notes repository syncing with your student profile.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================
            5. SWIMLANE ROW 4: "EXPLORE MORE COURSES" (Unpurchased Masterclasses)
        ========================================================= */}
        <section className="w-full max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-indigo-500" />
              <h2 className="text-base sm:text-lg font-bold text-[#F8FAFC] tracking-tight">
                Explore More Masterclasses
              </h2>
            </div>

            <Link
              href="/courses"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
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
                className="group p-4 rounded-2xl bg-[#121722] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between gap-3 hover:translate-y-[-2px]"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/40">
                      MASTERCLASS
                    </span>
                    <span className="font-extrabold text-white">
                      ₹{Math.round(c.pricePaise / 100)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-blue-400 transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>HD Video &amp; Notes</span>
                  <span className="text-white font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Unlock
                    <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
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
