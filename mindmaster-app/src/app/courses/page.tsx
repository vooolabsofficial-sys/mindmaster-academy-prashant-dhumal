"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Brain, 
  Calculator, 
  Calendar, 
  Landmark, 
  Zap 
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import FilterChips, { StandardFilter } from "@/components/courses/FilterChips";
import { getStaffCourses, getStaffStudents, fetchDbCourses } from "@/lib/staffStore";
import { ACADEMY_CATEGORIES, AcademyCategory, matchesAcademyCategory } from "@/lib/academyCategories";
import EmptyState from "@/components/common/EmptyState";

type FeeFilter = "All" | "Free" | "Paid";
const FEE_CHIPS: FeeFilter[] = ["All", "Free", "Paid"];

interface CatalogCourse {
  id: string;
  code: string;
  badge: string;
  subBadge: string;
  track: string;
  title: string;
  description: string;
  meta: string;
  price: string;
  isFree: boolean;
  tint: "mint" | "sky" | "lavender" | "peach" | "purple";
  category: "Memory" | "Vedic Maths" | "Police Bharti" | "Calendar Technique";
  imageSrc: string;
  icon: any;
  standards?: number[]; // [5,6,7...]; empty/undefined = for all / other courses
}

// Production Clean Slate: 0 Fake Courses
const CATALOG_COURSES: CatalogCourse[] = [];

const TINT_STYLES = {
  mint: {
    header: "bg-emerald-50/70 border-emerald-100",
    badgeText: "text-emerald-700",
    badgeBg: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
  },
  sky: {
    header: "bg-blue-50/70 border-blue-100",
    badgeText: "text-blue-700",
    badgeBg: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
  },
  lavender: {
    header: "bg-indigo-50/70 border-indigo-100",
    badgeText: "text-indigo-700",
    badgeBg: "bg-indigo-50 border-indigo-200",
    iconColor: "text-indigo-600",
  },
  peach: {
    header: "bg-amber-50/70 border-amber-100",
    badgeText: "text-amber-700",
    badgeBg: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
  },
  purple: {
    header: "bg-purple-50/70 border-purple-100",
    badgeText: "text-purple-700",
    badgeBg: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
  },
};

function extractStandardNumber(val: any): number | null {
  if (!val) return null;
  if (typeof val === "number" && val >= 5 && val <= 12) return val;
  const str = String(val);
  const match = str.match(/\b(5|6|7|8|9|10|11|12)\b/);
  if (match) return parseInt(match[1], 10);
  const digits = str.match(/\d+/);
  if (digits) {
    const n = parseInt(digits[0], 10);
    if (n >= 5 && n <= 12) return n;
  }
  return null;
}

export default function CoursesCatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState<AcademyCategory>("All Categories");
  const [feeFilter, setFeeFilter] = useState<FeeFilter>("All");
  const [activeStandard, setActiveStandard] = useState<StandardFilter>("all");
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [staffCourses, setStaffCourses] = useState(() => (typeof window !== "undefined" ? getStaffCourses() : []));

  useEffect(() => {
    async function initCatalog() {
      try {
        const live = await fetchDbCourses();
        if (live && live.length > 0) {
          setStaffCourses(live);
        }
      } catch (e) {}
    }
    initCatalog();

    const handleUpdate = () => {
      setStaffCourses(getStaffCourses());
    };
    window.addEventListener("mindmaster_courses_updated", handleUpdate);
    return () => window.removeEventListener("mindmaster_courses_updated", handleUpdate);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mindmaster_user_profile");
      if (raw) {
        const profile = JSON.parse(raw);
        setStudentProfile(profile);

        // Pre-select student's enrolled/recorded standard if available
        const stdRaw = profile.standard || profile.target_standard || profile.grade;
        let stdFound: number | null = extractStandardNumber(stdRaw);

        if (!stdFound && profile.phone) {
          const staffStudents = getStaffStudents();
          const cleanPhone = profile.phone.replace(/\D/g, "");
          const match = staffStudents.find(
            (s) => s.phone.replace(/\D/g, "") === cleanPhone
          );
          if (match?.standard) {
            stdFound = extractStandardNumber(match.standard);
          }
        }

        if (stdFound && stdFound >= 5 && stdFound <= 12) {
          setActiveStandard(stdFound as StandardFilter);
        }
      }
    } catch {}
  }, []);

  // Map dynamic staff courses to CatalogCourse items
  const dynamicCatalogCourses: CatalogCourse[] = staffCourses.map((sc) => {
    const existing = CATALOG_COURSES.find((c) => c.code === sc.code || c.id === sc.id);
    const isFreeCourse = sc.isFree || sc.pricePaise === 0;
    const cat: CatalogCourse["category"] =
      sc.category === "vedic"
        ? "Vedic Maths"
        : sc.category === "police"
        ? "Police Bharti"
        : sc.category === "calendar"
        ? "Calendar Technique"
        : "Memory";

    if (existing) {
      return {
        ...existing,
        title: sc.titleMr || sc.title,
        description: sc.description || existing.description,
        price: isFreeCourse ? "FREE" : `₹${Math.round(sc.pricePaise / 100)}`,
        isFree: isFreeCourse,
        standards: sc.standards,
        imageSrc: sc.imageSrc || existing.imageSrc,
      };
    }

    return {
      id: sc.id,
      code: sc.code,
      badge: sc.badgeText || (isFreeCourse ? "FREE" : "POPULAR"),
      subBadge: sc.subtitle || "MindMaster Certified",
      track: sc.titleMr || sc.title,
      title: sc.titleMr || sc.title,
      description: sc.description || "Prashant Dhumal Sir certified video training curriculum.",
      meta: `${sc.lessonsCount || 8} Lessons • ${sc.accessMonths || 6} Months Access • English & Marathi`,
      price: isFreeCourse ? "FREE" : `₹${Math.round(sc.pricePaise / 100)}`,
      isFree: isFreeCourse,
      tint: (sc.headerTint || "sky") as any,
      category: cat,
      imageSrc: sc.imageSrc || "/assets/images/student_mindmaps_notebook.png",
      icon: cat === "Vedic Maths" ? Calculator : cat === "Calendar Technique" ? Calendar : Brain,
      standards: sc.standards,
    };
  });

  const activeCatalog = dynamicCatalogCourses;

  // Unrestricted Student Access: Students can view & enroll in all courses across categories
  const visibleCourses = activeCatalog;

  const filteredCourses = visibleCourses.filter((course) => {
    const staffMatch = staffCourses.find(
      (sc) => sc.code === course.code || sc.id === course.id
    );
    const courseStandards = staffMatch?.standards ?? course.standards;

    // 1. Primary Category Filter (6 Core Academic & Memory Tracks)
    if (selectedCategory !== "All Categories") {
      const isMatch = matchesAcademyCategory({
        title: course.title,
        description: course.description,
        category: course.category,
        code: course.code,
        badge: course.badge,
        badgeText: course.subBadge,
        standards: courseStandards,
      }, selectedCategory);
      if (!isMatch) return false;
    }

    // 2. Standard Filter ("All", "5th"..."12th", "Other Courses")
    if (activeStandard !== "all") {
      if (activeStandard === "other") {
        if (courseStandards && courseStandards.length > 0) return false;
      } else {
        if (!courseStandards || !courseStandards.includes(Number(activeStandard))) {
          return false;
        }
      }
    }

    // 3. Fee Filter (All / Free / Paid)
    if (feeFilter === "Free") return course.isFree;
    if (feeFilter === "Paid") return !course.isFree;
    return true;
  });

  return (
    <AppShell>
      <title>Certified Courses Catalog | MindMaster Academy</title>
      <meta name="description" content="Explore Prashant Dhumal's certified courses in Memory Techniques, Vedic Maths, Calendar Mastery, and Police Bharti prep." />
      <div className="flex flex-col gap-6 select-none touch-manipulation">

        {/* Header with Spring 2025 Enrollment Chip */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-extrabold text-blue-700 uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>SPRING 2026 ENROLLMENT OPEN</span>
            </span>

            <span className="text-xs text-slate-600 font-semibold">
              Showing {filteredCourses.length} Certified Courses
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            All Courses
          </h1>
          <p className="text-xs md:text-sm text-slate-600 max-w-2xl leading-relaxed font-normal">
            Explore certified memory mastery, competitive exam prep, and speed calculation workshops curated for Maharashtra board and recruitment aspirants.
          </p>
        </div>

        {/* 1. Primary Category Tabs: 6 Main Academy Categories */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-0.5">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <span>🏷️</span> Course Categories:
            </span>
            <span className="text-[11px] text-blue-600 font-semibold">
              Open to all learners
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x" role="tablist" aria-label="Academy categories">
            {ACADEMY_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[38px] px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all duration-150 border cursor-pointer active:scale-95 touch-manipulation flex items-center justify-center gap-1.5 ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50"
                  }`}
                >
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Secondary Filter: Standard & Fee Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-0.5 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <span>🎓</span> Select Standard:
              </span>
              {activeStandard !== "all" && (
                <button
                  onClick={() => setActiveStandard("all")}
                  className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                >
                  Show All (Reset)
                </button>
              )}
            </div>
            <FilterChips
              activeStandard={activeStandard}
              onSelect={(std) => setActiveStandard(std)}
            />
          </div>

          {/* Pricing Chips */}
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-end sm:mb-1">
            {FEE_CHIPS.map((chip) => {
              const isActive = feeFilter === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setFeeFilter(chip)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Course Cards Grid or Attractive Empty State */}
        {filteredCourses.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/90 rounded-3xl p-8 md:p-12 border border-blue-200/80 shadow-sm text-center flex flex-col items-center justify-center max-w-2xl mx-auto my-6 animate-fadeIn">
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
              <Link
                href="/staff/login"
                className="px-5 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-full shadow-2xs inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>➕ Add Course (Admin Login)</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const staffMatch = staffCourses.find(
                (sc) => sc.code === course.code || sc.id === course.id
              );
              const courseStandards = staffMatch?.standards ?? course.standards;
              const tint = TINT_STYLES[course.tint];
              const Icon = course.icon;

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between group active:scale-[0.99]"
                >
                  {/* Tint Header with 3D Thumbnail */}
                  <div className={`p-5 border-b ${tint.header} flex flex-col gap-3 relative`}>
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border ${tint.badgeBg} ${tint.badgeText} shadow-2xs`}>
                          {course.badge}
                        </span>

                        {/* Standard Tag Badge */}
                        <span className="text-[10px] font-bold bg-white text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                          {courseStandards && courseStandards.length > 0
                            ? (courseStandards.length === 8 ? "Class 5th - 12th" : `${courseStandards.map((s: number) => `${s}th`).join(", ")} Std`)
                            : "All Standards"}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-700 bg-white/90 px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                        {course.subBadge}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <div className={`w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center ${tint.iconColor}`}>
                          <Icon className="w-4 h-4 stroke-[2]" />
                        </div>
                        <span className="truncate">{course.track}</span>
                      </div>

                      <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-white/80 p-1 shadow-2xs border border-white group-hover:scale-105 transition-transform duration-300">
                        <Image
                          src={course.imageSrc}
                          alt={course.title}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 leading-snug group-hover:text-blue-600 transition">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                        {course.description}
                      </p>
                      <div className="text-[11px] text-slate-600 font-medium mt-3 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{course.meta}</span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-base font-extrabold ${course.isFree ? "text-emerald-600" : "text-slate-900"}`}>
                        {course.price}
                      </span>

                      <Link
                        href={`/course/${course.id}`}
                        className={`touch-target-44 min-h-[44px] px-5 py-2.5 rounded-full text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation ${
                          course.isFree
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25"
                            : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        <span>{course.isFree ? "Start Free" : "Unlock Syllabus"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Hybrid Certification Banner */}
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                MindMaster Centre Pune Offline Hybrid Certification
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Students in Narhe, Ambegaon & Katraj receive proctored batch certificates at completion.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              Official Academy Certification
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
