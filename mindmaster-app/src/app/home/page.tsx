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

export default function StudentHomePage() {
  const [studentName, setStudentName] = useState<string>("Student");

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
                <span>Spring 2025 Study Hub • Active Session</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {studentName}
              </h1>
              <p className="text-xs md:text-sm text-slate-600 mt-1.5 font-normal max-w-xl leading-relaxed">
                Continue your daily cognitive memory drills and speed calculations where you left off.
              </p>
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
                    7 Days Active
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
                    18 Mastered
                  </div>
                </div>
              </div>

              {/* Centre Rank */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 leading-tight">
                    Narhe Hub Rank
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 leading-tight mt-0.5">
                    #04 Top 5%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CONTINUE WATCHING CARD (Bright, Clean, Non-Dark) */}
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

        {/* 3. FREE VIDEOS ROW (Bright, Authentic Images, No Dark Voids) */}
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
              <span>See all courses</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Focus Hacks */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col group">
              <div className="relative h-38 bg-slate-100 overflow-hidden">
                <Image
                  src="/assets/images/student_mindmaps_notebook.png"
                  alt="Focus Hacks"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />
                
                <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center text-white z-10">
                  <span className="bg-white/90 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                    Focus Hacks
                  </span>
                  <span className="text-[10px] font-mono bg-slate-900/80 px-1.5 py-0.5 rounded">
                    12:30 min
                  </span>
                </div>

                <Link
                  href="/watch/les-mm01-01"
                  className="absolute inset-0 z-10 flex items-center justify-center"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center shadow hover:scale-110 transition">
                    <Play className="w-4 h-4 fill-blue-600 ml-0.5" />
                  </div>
                </Link>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    MODULE 01
                  </span>
                  <h3 className="font-extrabold text-xs md:text-sm text-slate-900 mt-0.5 line-clamp-2 leading-snug">
                    10-Minute Focus Warmup for Study Sessions
                  </h3>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>By Prof. Kulkarni</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Free Lesson
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Vedic Mental Math */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col group">
              <div className="relative h-38 bg-slate-100 overflow-hidden">
                <Image
                  src="/assets/images/vedic_maths_abacus_3d.png"
                  alt="Active Recall"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />
                
                <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center text-white z-10">
                  <span className="bg-white/90 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                    Speed Calculations
                  </span>
                  <span className="text-[10px] font-mono bg-slate-900/80 px-1.5 py-0.5 rounded">
                    16:45 min
                  </span>
                </div>

                <Link
                  href="/watch/les-mm01-02"
                  className="absolute inset-0 z-10 flex items-center justify-center"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center shadow hover:scale-110 transition">
                    <Play className="w-4 h-4 fill-blue-600 ml-0.5" />
                  </div>
                </Link>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    MODULE 02
                  </span>
                  <h3 className="font-extrabold text-xs md:text-sm text-slate-900 mt-0.5 line-clamp-2 leading-snug">
                    Active Recall: How to Revise Complex Theorems
                  </h3>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>By Dr. Anjali Joshi</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Free Lesson
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Calendar Technique & Mindset */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col group">
              <div className="relative h-38 bg-slate-100 overflow-hidden">
                <Image
                  src="/assets/images/superfast_calendar_3d.png"
                  alt="Calendar Technique & Mindset"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />
                
                <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center text-white z-10">
                  <span className="bg-white/90 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                    Exam Mindset
                  </span>
                  <span className="text-[10px] font-mono bg-slate-900/80 px-1.5 py-0.5 rounded">
                    09:15 min
                  </span>
                </div>

                <Link
                  href="/watch/les-mm01-01"
                  className="absolute inset-0 z-10 flex items-center justify-center"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center shadow hover:scale-110 transition">
                    <Play className="w-4 h-4 fill-blue-600 ml-0.5" />
                  </div>
                </Link>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    MODULE 03
                  </span>
                  <h3 className="font-extrabold text-xs md:text-sm text-slate-900 mt-0.5 line-clamp-2 leading-snug">
                    Overcoming Exam Anxiety & Pressure
                  </h3>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>By Counselor Deshmukh</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Free Lesson
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Course Card 1: Speed Reading (Foundational) */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-300 transition-all flex flex-col">
              <div className="p-5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-white px-2.5 py-1 rounded-full shadow-2xs">
                  FOUNDATIONAL
                </span>
                <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-emerald-600">
                  <Lightbulb className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[11px] font-extrabold text-emerald-700 bg-white px-2.5 py-1 rounded-full shadow-2xs">
                  FREE
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base md:text-lg text-slate-900 leading-snug">
                    Speed Reading & Active Brain Mapping
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                    Learn how to read textbook chapters 2x faster with conceptual visual anchoring notes.
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-3">
                    <span>6 Modules</span>
                    <span>•</span>
                    <span>4.5 Hours</span>
                    <span>•</span>
                    <span>English & Marathi</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Instant Free Access
                  </span>
                  <Link
                    href="/course/c-mm-01"
                    className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition inline-flex items-center gap-1.5"
                  >
                    <span>Start Learning</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Course Card 2: High-Scoring Mathematics (Masterclass) */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-300 transition-all flex flex-col">
              <div className="p-5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-white px-2.5 py-1 rounded-full shadow-2xs">
                  MASTERCLASS
                </span>
                <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-blue-600">
                  <FileText className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-xs font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-full shadow-2xs">
                  ₹ 1,499
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base md:text-lg text-slate-900 leading-snug">
                    High-Scoring Mathematics & Vedic Maths
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                    Trigonometry, Algebra and Geometry rapid mnemonics curated by state-top mentors.
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-3">
                    <span>12 Modules</span>
                    <span>•</span>
                    <span>8.0 Hours</span>
                    <span>•</span>
                    <span>Formula Cheatsheet</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Centre coupon eligible
                  </span>
                  <Link
                    href="/course/c-mm-05"
                    className="px-5 py-2.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold transition inline-flex items-center gap-1.5"
                  >
                    <span>Unlock Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
