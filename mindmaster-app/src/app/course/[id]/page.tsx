"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Play, 
  Lock, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  BookOpen, 
  FileText, 
  Sparkles,
  ChevronDown,
  Layers,
  Award,
  GraduationCap
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { getStaffCourses } from "@/lib/staffStore";
import { getStoredVideos } from "@/lib/playlistStore";
import { createClient } from "@/lib/supabase/client";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [showAllLessons, setShowAllLessons] = useState(false);
  const [dbCourse, setDbCourse] = useState<any>(null);
  const [dbLessons, setDbLessons] = useState<any[]>([]);

  const rawId = resolvedParams.id || "";

  useEffect(() => {
    async function fetchCourseDetails() {
      try {
        const supabase = createClient();
        const { data: cData } = await supabase
          .from("courses")
          .select("*")
          .or(`id.eq.${rawId},code.ilike.${rawId}`)
          .maybeSingle();

        if (cData) {
          setDbCourse({
            id: cData.id,
            code: cData.code,
            title: cData.title,
            description: cData.description,
            pricePaise: cData.price_paise,
            originalPricePaise: cData.original_price_paise,
            accessMonths: cData.access_months || 3,
            badgeText: cData.badge_text,
            category: cData.category,
          });

          const { data: lData } = await supabase
            .from("lessons")
            .select("*")
            .eq("course_id", cData.id)
            .order("position", { ascending: true });

          if (lData && lData.length > 0) {
            setDbLessons(
              lData.map((l: any) => ({
                id: l.id,
                courseId: l.course_id,
                title: l.title,
                durationSec: l.duration_sec,
                isFree: l.is_free,
                videoType: l.video_type || "youtube",
                videoId: l.video_id,
                position: l.position || 1,
                description: l.description,
              }))
            );
          }
        }
      } catch (e) {}
    }
    fetchCourseDetails();
  }, [rawId]);

  const staffCourses = typeof window !== "undefined" ? getStaffCourses() : [];
  const course =
    dbCourse ||
    staffCourses.find(
      (c) =>
        c.id?.toLowerCase() === rawId?.toLowerCase() ||
        c.code?.toLowerCase() === rawId?.toLowerCase()
    ) ||
    null;

  const storedVideos = typeof window !== "undefined" ? getStoredVideos() : [];
  const dynamicVideos = course ? storedVideos.filter((v) => v.courseId === course.id) : [];
  const allCourseLessons =
    dbLessons.length > 0
      ? dbLessons
      : dynamicVideos.length > 0
      ? dynamicVideos.map((v) => ({
          id: v.lessonId || v.id,
          courseId: v.courseId,
          title: v.lessonTitle,
          durationSec: v.durationSec,
          isFree: v.isFree,
          videoType: v.videoType,
          videoId: v.videoId,
          position: v.position || 1,
          description: v.description,
        }))
      : [];

  if (!course) {
    return (
      <AppShell>
        <div className="text-center py-24 max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Course Not Found</h2>
          <p className="text-sm text-slate-400 mt-2">
            The requested course does not exist or has been removed.
          </p>
          <Link
            href="/courses"
            className="mt-6 inline-block px-6 py-2.5 bg-[#0052FF] hover:bg-[#0047E0] text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25 transition cursor-pointer"
          >
            Browse All Courses
          </Link>
        </div>
      </AppShell>
    );
  }

  const priceRupees = Math.round((course.pricePaise || 0) / 100);
  const originalPriceRupees = Math.round((course.originalPricePaise || 0) / 100);
  const savingsRupees = Math.max(0, originalPriceRupees - priceRupees);

  const displayedLessons = showAllLessons
    ? allCourseLessons
    : allCourseLessons.slice(0, 7);

  return (
    <AppShell>
      <title>{`${course.title} | MindMaster Academy`}</title>
      <meta name="description" content={course.description} />
      <div className="flex flex-col gap-6 select-none max-w-6xl mx-auto">

        {/* Back Link Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link
            href="/courses"
            className="hover:text-blue-600 inline-flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Courses</span>
          </Link>
          <span>/</span>
          <span className="text-blue-600 font-extrabold">{course.code}</span>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* 1. HERO CARD */}
            <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white rounded-3xl p-8 border border-blue-200/70 text-center flex flex-col items-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-2xs border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <GraduationCap className="w-7 h-7 stroke-[2]" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                <span className="bg-white text-blue-700 border border-blue-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow-2xs">
                  {course.code}
                </span>
                <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                  {course.badgeText || "POPULAR"}
                </span>
                <span className="bg-white text-slate-600 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                  {course.category ? course.category.toUpperCase() : "ACADEMY"}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {course.title}
              </h1>
              <p className="text-xs md:text-sm text-slate-600 mt-2 max-w-lg leading-relaxed font-normal">
                {course.description}
              </p>

              {/* Meta Chips */}
              <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3 text-xs text-slate-800 font-semibold bg-white px-4 py-2 rounded-full border border-slate-200 shadow-2xs">
                <span>{allCourseLessons.length} lessons</span>
                <span>•</span>
                <span>{course.accessMonths} months access</span>
                <span>•</span>
                <span>Marathi + English</span>
              </div>
            </div>

            {/* 2. WHAT YOU GET */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#0E1B3D]">What you get</h2>
                <span className="bg-[#E8F8F2] text-[#0A8554] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Included with enrollment
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {(course.features || []).map((feat: string, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-[#E4E8F8] shadow-2xs flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#E8F1FD] text-[#0B57D0] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0E1B3D]">{feat}</h4>
                      <p className="text-[11px] text-[#5A6478] mt-0.5 leading-relaxed">
                        Full comprehensive training material and exercises designed by Prashant Dhumal Sir.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. SYLLABUS & LESSON BREAKDOWN */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#0E1B3D]">Syllabus & Video Lessons</h2>
                  <p className="text-xs text-[#5A6478] mt-0.5 font-medium">
                    {allCourseLessons.filter((l) => l.isFree).length} Free Preview Lessons • Unlock all with enrollment
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0B57D0] bg-[#EFF6FF] px-3 py-1 rounded-full">
                  {allCourseLessons.length} Total Lessons
                </span>
              </div>

              {/* Lesson Items */}
              <div className="flex flex-col gap-2">
                {displayedLessons.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAFAFC] border border-[#EAEFF8] rounded-2xl">
                    <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No Lessons Available</p>
                    <p className="text-xs text-slate-500 mt-1">There are currently no lessons published in this course.</p>
                  </div>
                ) : (
                  displayedLessons.map((l, index) => (
                    <div
                      key={l.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        l.isFree
                          ? "bg-white border-[#C2D7FF] shadow-2xs hover:border-[#0B57D0]"
                          : "bg-[#FAFAFC] border-[#EAEFF8] opacity-90"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                              l.isFree
                                ? "bg-[#E8F1FD] text-[#0B57D0]"
                                : "bg-[#F1F3F9] text-[#94A3B8]"
                            }`}
                          >
                            {l.isFree ? <Play className="w-4 h-4 fill-current ml-0.5" /> : <Lock className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#94A3B8] font-mono">
                                #{String(index + 1).padStart(2, "0")}
                              </span>
                              <h4 className="text-xs md:text-sm font-bold text-[#0E1B3D]">
                                {l.title.replace(/^\d+\.\s*/, "")}
                              </h4>
                            </div>
                            <p className="text-[11px] text-[#5A6478] mt-0.5 font-normal">
                              {l.description || `${Math.round(l.durationSec / 60)} mins • Marathi & English`}
                            </p>
                          </div>
                        </div>

                        {l.isFree ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider bg-[#E8F8F2] text-[#0A8554] px-2.5 py-1 rounded-md">
                              Free
                            </span>
                            <Link
                              href={`/watch/${l.id}`}
                              className="text-xs font-extrabold text-[#0B57D0] hover:text-[#0842A0] bg-[#E8F1FD] hover:bg-[#D3E3FD] px-3.5 py-1.5 rounded-full transition"
                            >
                              Preview →
                            </Link>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8] font-mono bg-[#F1F3F9] px-2 py-0.5 rounded-full">
                            {Math.round(l.durationSec / 60)} mins
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Show Remaining Toggle */}
              {!showAllLessons && allCourseLessons.length > 7 && (
                <button
                  type="button"
                  onClick={() => setShowAllLessons(true)}
                  className="w-full py-2 text-center text-xs font-bold text-[#0B57D0] hover:underline flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Show remaining {allCourseLessons.length - 7} lessons</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Pricing Card */}
          <div className="lg:sticky lg:top-20 flex flex-col gap-4">
            <div className="bg-white rounded-3xl p-6 border-2 border-[#0B57D0]/30 shadow-[0_16px_40px_rgba(11,87,208,0.12)]">
              {/* Offer Chip */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Limited Period Batch Offer</span>
                </span>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-slate-900">₹{priceRupees.toLocaleString("en-IN")}</span>
                {originalPriceRupees > priceRupees && (
                  <span className="text-sm text-slate-400 line-through">₹{originalPriceRupees.toLocaleString("en-IN")}</span>
                )}
                {savingsRupees > 0 && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Save ₹{savingsRupees.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-5 font-medium">
                One-time fee • {course.accessMonths} months unlimited access
              </p>

              {/* Action Button */}
              <Link
                href={`/checkout?courseId=${course.id}`}
                className="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-extrabold shadow-lg shadow-blue-500/25 transition text-center block cursor-pointer active:scale-98"
              >
                Unlock Full Course →
              </Link>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Payments by Razorpay</span>
                <span>•</span>
                <span className="text-emerald-600 font-bold">100% Secure</span>
              </div>

              {/* Bullet Checklist */}
              <div className="mt-5 pt-4 border-t border-[#F1F3F9] flex flex-col gap-2.5 text-xs text-[#0E1B3D] font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0A8554] shrink-0" />
                  <span>Instant access on Web + Android PWA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0A8554] shrink-0" />
                  <span>Verified Certificate of Completion</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0A8554] shrink-0" />
                  <span>Full Marathi + English explanations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0A8554] shrink-0" />
                  <span>Personal Notes & Digital Books included</span>
                </div>
              </div>

              {/* Centre Badge */}
              <div className="mt-5 p-3 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-[11px] text-[#5A6478] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-[#0E1B3D]">
                  <span className="w-2 h-2 rounded-full bg-[#0A8554]" />
                  Official Prashant Dhumal Academy
                </span>
                <span className="bg-white border border-[#E4E8F8] px-2 py-0.5 rounded text-[10px] font-bold">
                  Pune, MH
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
