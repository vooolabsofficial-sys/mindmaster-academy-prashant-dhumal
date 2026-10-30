"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Play, 
  Clock, 
  Flame, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles,
  BookOpen,
  Lightbulb,
  FileText,
  Lock,
  Zap,
  Award,
  GraduationCap,
  PlayCircle
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { getStaffCourses, StaffCourse, fetchDbCourses } from "@/lib/staffStore";
import { createClient } from "@/lib/supabase/client";
import { ACADEMY_CATEGORIES, AcademyCategory, matchesAcademyCategory } from "@/lib/academyCategories";
import { useLanguage } from "@/lib/LanguageContext";

export default function StudentHomePage() {
  const { currentLanguage } = useLanguage();
  const isMarathi = currentLanguage === "mr";
  const [studentName, setStudentName] = useState<string>("Student");
  const [courses, setCourses] = useState<StaffCourse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AcademyCategory>("All Categories");
  const [freeLessons, setFreeLessons] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [activeStreakDays, setActiveStreakDays] = useState<number>(1);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mindmaster_user_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.full_name) {
          setStudentName(p.full_name.split(" ")[0]);
        }
      }
    } catch {}

    const loadCourses = () => {
      try {
        const all = getStaffCourses().filter((c) => c.status !== "draft");
        setCourses(all);
      } catch {
        setCourses([]);
      }
    };

    loadCourses();

    async function loadData() {
      try {
        const live = await fetchDbCourses();
        if (live && live.length > 0) {
          setCourses(live.filter((c) => c.status !== "draft"));
        } else if (live && live.length === 0) {
          setCourses([]);
        }

        const supabase = createClient();
        const { data: freeL } = await supabase
          .from("lessons")
          .select("id, title, duration_sec, position, course_id, courses(title)")
          .eq("is_free", true)
          .order("position", { ascending: true })
          .limit(3);
        if (freeL && freeL.length > 0) {
          setFreeLessons(freeL);
        } else {
          setFreeLessons([]);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prog } = await supabase
            .from("progress")
            .select("is_completed")
            .eq("user_id", user.id);
          if (prog) {
            const completed = prog.filter((p: any) => p.is_completed).length;
            setCompletedCount(completed);
            setActiveStreakDays(prog.length > 0 ? Math.min(prog.length, 7) : 1);
          }
        }
      } catch (e) {}
    }
    loadData();

    window.addEventListener("mma_courses_changed", loadCourses);
    window.addEventListener("storage", loadCourses);
    return () => {
      window.removeEventListener("mma_courses_changed", loadCourses);
      window.removeEventListener("storage", loadCourses);
    };
  }, []);

  return (
    <AppShell>
      <title>Student Portal | MindMaster Academy</title>
      <meta name="description" content="MindMaster Academy Student Portal - Track ongoing lectures, free videos, and memory practice." />
      <div className="flex flex-col gap-8 select-none">

        {/* 1. Welcome Top Banner with Light Gradient & Metrics */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white rounded-3xl p-6 md:p-8 border border-blue-100/70 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-blue-200/60 text-xs font-semibold text-blue-700 shadow-2xs mb-3">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Spring 2026 Study Hub • Active Session</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {studentName}
              </h1>
              <p className="text-xs md:text-sm text-slate-600 mt-1.5 font-normal max-w-xl leading-relaxed">
                Continue your daily cognitive memory drills and speed calculations where you left off.
              </p>

              {/* Quick Action Navigation */}
              <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/books"
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs rounded-xl shadow-2xs inline-flex items-center gap-1.5 transition hover:border-blue-400 cursor-pointer active:scale-95"
                >
                  <span>📚 Digital Books</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/courses"
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-xs rounded-xl shadow-2xs inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <span>🎓 All Courses</span>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Bar (3 Light Chips) */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Daily Streak */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 leading-tight">
                    Daily Streak
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 leading-tight mt-0.5">
                    {activeStreakDays} {activeStreakDays === 1 ? "Day" : "Days"} Active
                  </div>
                </div>
              </div>

              {/* Mastered Lessons */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 leading-tight">
                    Progress
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 leading-tight mt-0.5">
                    {completedCount} Mastered
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 leading-tight">
                    Status
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 leading-tight mt-0.5">
                    Verified Student
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CONTINUE WATCHING CARD (Only when courses exist) */}
        {courses.length > 0 && (
          <section className="bg-white rounded-3xl p-5 md:p-7 border border-slate-200 shadow-xs hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Video Thumbnail with Real Classroom Image & Play Button */}
              <div className="relative w-full md:w-80 h-48 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-slate-200 group">
                <Image
                  src="/assets/images/classroom_memory_drills.png"
                  alt="Memory Technique Drill"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/30" />

                {/* Top Tags */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                  <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    Memory Mastery
                  </span>
                  <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    18:45 min
                  </span>
                </div>

                {/* Centered Play Button */}
                <Link
                  href="/watch/les-mm01-01"
                  className="absolute inset-0 z-10 flex items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95">
                    <Play className="w-5 h-5 fill-blue-600 ml-0.5" />
                  </div>
                </Link>

                {/* Bottom progress line */}
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-slate-200/50 h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-r-full" style={{ width: "45%" }} />
                </div>
              </div>

              {/* Right: Info & Resume Button */}
              <div className="flex-1 flex flex-col justify-between w-full">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      In Progress
                    </span>
                    <span className="text-xs text-slate-500 font-medium">• Last watched today</span>
                  </div>

                  <h2 className="text-lg md:text-xl font-extrabold text-slate-900">
                    Memory Technique • Lesson 4
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed font-normal">
                    Loci Method & Visual Peg System for Quick Recall in Board Examinations.
                  </p>

                  {/* Progress bar & count */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold text-slate-900 mb-1.5">
                      <span>Progress: 45%</span>
                      <span className="text-slate-500 font-medium">5 of 12 lessons completed</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: "45%" }} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <Link
                    href="/watch/les-mm01-01"
                    className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-500/25 inline-flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Resume Lesson</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. FREE VIDEOS ROW (Only when real free lessons exist in Supabase) */}
        {freeLessons.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-extrabold text-slate-900">Free Practice Videos</h2>
                <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  No fee required
                </span>
              </div>

              <Link
                href="/courses"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Browse All Courses</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {freeLessons.map((les, idx) => (
                <div key={les.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col group">
                  <div className="relative h-38 bg-slate-900 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center text-white z-10">
                      <span className="bg-white/90 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                        Free Preview
                      </span>
                      <span className="text-[10px] font-mono bg-slate-900/80 px-1.5 py-0.5 rounded text-slate-300">
                        {Math.round((les.duration_sec || 600) / 60)} min
                      </span>
                    </div>

                    <Link
                      href={`/watch/${les.id}`}
                      className="relative z-10 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </Link>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {les.courses?.title || `LESSON ${String(idx + 1).padStart(2, "0")}`}
                      </span>
                      <h3 className="font-extrabold text-xs md:text-sm text-slate-900 mt-0.5 line-clamp-2 leading-snug">
                        {les.title}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>MindMaster Academy</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Free Lesson
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. COURSES FOR YOU GRID (Pure Light Theme) */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Recommended Courses</h2>
              <p className="text-xs text-slate-600">Selected based on your learning milestones</p>
            </div>

            <Link
              href="/courses"
              className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-300 self-start sm:self-auto transition shadow-2xs"
            >
              Browse Full Catalog
            </Link>
          </div>

          {/* Category Tabs: 6 Core Academy Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ACADEMY_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[32px] px-3.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all border cursor-pointer active:scale-95 ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {courses.length === 0 ? (
            <div className="bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/90 rounded-3xl p-8 md:p-12 border border-blue-200/80 shadow-sm text-center flex flex-col items-center justify-center max-w-2xl mx-auto my-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider mb-2">
                🚀 Coming Soon • Launching Shortly
              </span>
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                New Courses Launching Soon!
              </h3>
              <span className="text-xs font-semibold text-blue-600 mt-0.5">
                Comprehensive Curriculum &amp; HD Video Lectures in Preparation
              </span>
              <p className="text-xs md:text-sm text-slate-600 max-w-lg mt-2 mb-6 leading-relaxed">
                Prashant Sir's new HD video lectures and official study material are being uploaded. Click below to pre-book and get notified immediately when batches open.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`https://wa.me/918459344077?text=${encodeURIComponent("Namaskar Prashant Sir, please notify me when the new MindMaster online course batch launches!")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-full shadow-md shadow-emerald-500/20 inline-flex items-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <span>💬</span>
                  <span>Notify Me on WhatsApp (Pre-Book)</span>
                </a>
                <a
                  href="tel:+918459344077"
                  className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-full shadow-2xs inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>📞 +91 84593 44077</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {courses
                .filter((c) => matchesAcademyCategory(c, selectedCategory))
                .slice(0, 4)
                .map((c) => {
                const isFree = c.isFree || c.pricePaise === 0;
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-300 transition-all flex flex-col group"
                  >
                    <div className="p-5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-white px-2.5 py-1 rounded-full shadow-2xs border border-blue-200">
                        {c.code || c.category || "BATCH 2026"}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-blue-600">
                        <BookOpen className="w-5 h-5 stroke-[2]" />
                      </div>
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full shadow-2xs ${
                        isFree 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-white text-slate-900 border border-slate-200"
                      }`}>
                        {isFree ? "FREE" : `₹ ${c.pricePaise / 100}`}
                      </span>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <h3 className="font-extrabold text-base md:text-lg text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                          {isMarathi ? (c.titleMr || c.title) : (c.title || c.titleMr)}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal line-clamp-2">
                          {c.description || "MindMaster Academy certified memory and speed learning course."}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-3">
                          <span>{c.accessMonths ? `${c.accessMonths} Months` : "Lifetime"}</span>
                          <span>•</span>
                          <span>{c.category}</span>
                          <span>•</span>
                          <span>English & Marathi</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${
                          isFree ? "text-emerald-600" : "text-amber-600"
                        }`}>
                          {isFree ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Instant Free Access
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              Active Enrollment
                            </>
                          )}
                        </span>
                        <Link
                          href={`/course/${c.id}`}
                          className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>{isFree ? "Start Learning" : "Unlock Syllabus"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
