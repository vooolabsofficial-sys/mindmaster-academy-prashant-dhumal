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
import { isCourseVisibleToStudent } from "@/lib/courseVisibility";
import { getStaffCourses, getStaffStudents } from "@/lib/staffStore";
import EmptyState from "@/components/common/EmptyState";

type FilterType = "All" | "Free" | "Paid" | "Memory" | "Vedic Maths" | "Police Bharti" | "Calendar Technique";

const FILTER_CHIPS: FilterType[] = [
  "All",
  "Free",
  "Paid",
  "Memory",
  "Vedic Maths",
  "Police Bharti",
  "Calendar Technique",
];

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

const CATALOG_COURSES: CatalogCourse[] = [
  {
    id: "c-mm-01",
    code: "MM-01",
    badge: "FOUNDATIONAL",
    subBadge: "Narhe Certified",
    track: "Active Brain System",
    title: "Speed Reading & Active Brain Mapping",
    description: "Learn how to absorb textbook chapters 2x faster with conceptual visual anchoring and memory notes.",
    meta: "8 lessons • 3 months access • English & Marathi",
    price: "FREE",
    isFree: true,
    tint: "mint",
    category: "Memory",
    standards: [5, 6, 7, 8, 9, 10, 11, 12],
    imageSrc: "/assets/images/student_mindmaps_notebook.png",
    icon: Brain,
  },
  {
    id: "c-mm-05",
    code: "MM-05",
    badge: "BESTSELLER",
    subBadge: "Sutra Mastery",
    track: "Speed Math Vedic Series",
    title: "High-Scoring Mathematics & Vedic Maths",
    description: "Trigonometry, Algebra, and Geometry rapid mental calculation mnemonics to solve exam problems in seconds.",
    meta: "14 lessons • 3 months access • Practice Sheets",
    price: "₹ 1,499",
    isFree: false,
    tint: "sky",
    category: "Vedic Maths",
    standards: [5, 6, 7, 8, 9, 10, 11, 12],
    imageSrc: "/assets/images/vedic_maths_abacus_3d.png",
    icon: Calculator,
  },
  {
    id: "c-mm-04",
    code: "MM-04",
    badge: "2-SEC TRICK",
    subBadge: "Lightning Mental Skill",
    track: "Century Codes & Days",
    title: "Master The Calendar Technique",
    description: "Calculate any day of the week for any century in under 3 seconds in your head using century codes.",
    meta: "8 lessons • 3 months access • Interactive Drills",
    price: "FREE",
    isFree: true,
    tint: "lavender",
    category: "Calendar Technique",
    standards: [5, 6, 7, 8, 9, 10, 11, 12],
    imageSrc: "/assets/images/superfast_calendar_3d.png",
    icon: Calendar,
  },
  {
    id: "c-mm-03",
    code: "MM-03",
    badge: "RECRUITMENT READY",
    subBadge: "Maharashtra Police Bharti",
    track: "GK & Constitution Pegs",
    title: "Police Bharti Special GK & Fast Recall",
    description: "High-yield geography, history, and constitution memory pegs for guaranteed recall under exam pressure.",
    meta: "16 lessons • 3 months access • Audio Lectures",
    price: "₹ 999",
    isFree: false,
    tint: "peach",
    category: "Police Bharti",
    // Recruitment course - no school standards (इतर कोर्स)
    imageSrc: "/assets/images/police_bharti_prep_3d.png",
    icon: ShieldCheck,
  },
  {
    id: "c-mm-02",
    code: "MM-02",
    badge: "PRO LEVEL",
    subBadge: "Train the Trainer",
    track: "Spatial Memory Architecture",
    title: "Roman Room & Memory Palace Mastery",
    description: "Systematic spatial memorization for dense chemical equations, physics laws, and multi-tier classifications.",
    meta: "12 lessons • 3 months access • Mind Maps",
    price: "₹ 1,299",
    isFree: false,
    tint: "purple",
    category: "Memory",
    // Trainer certification - no school standards (इतर कोर्स)
    imageSrc: "/assets/images/memory_seminar_brain_3d.png",
    icon: Landmark,
  },
  {
    id: "c-mm-06",
    code: "MM-06",
    badge: "DAILY ROUTINE",
    subBadge: "10-Minute Daily",
    track: "Focus & Alpha Waves",
    title: "Concentration & Focus Drills",
    description: "Pranayama, alpha-wave mental conditioning, and distraction-proofing study routines before tests.",
    meta: "5 lessons • 3 months access • Guided Audio",
    price: "FREE",
    isFree: true,
    tint: "mint",
    category: "Memory",
    standards: [5, 6, 7, 8, 9, 10, 11, 12],
    imageSrc: "/assets/images/classroom_memory_drills.png",
    icon: Zap,
  },
];

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
  const [activeStandard, setActiveStandard] = useState<StandardFilter>("all");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [studentProfile, setStudentProfile] = useState<any>(null);

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

  const staffCourses = typeof window !== "undefined" ? getStaffCourses() : [];

  const visibleCourses = CATALOG_COURSES.filter((course) => {
    const staffMatch = staffCourses.find(
      (sc) => sc.code === course.code || sc.id === course.id
    );
    if (staffMatch) {
      return isCourseVisibleToStudent(staffMatch, studentProfile);
    }
    return true;
  });

  const filteredCourses = visibleCourses.filter((course) => {
    const staffMatch = staffCourses.find(
      (sc) => sc.code === course.code || sc.id === course.id
    );
    const courseStandards = staffMatch?.standards ?? course.standards;

    // 1. Standard Filter ("सर्व", "5वी"..."12वी", "इतर कोर्स")
    if (activeStandard !== "all") {
      if (activeStandard === "other") {
        if (courseStandards && courseStandards.length > 0) return false;
      } else {
        if (!courseStandards || !courseStandards.includes(Number(activeStandard))) {
          return false;
        }
      }
    }

    // 2. Category / Pricing Filter
    if (activeFilter === "All") return true;
    if (activeFilter === "Free") return course.isFree;
    if (activeFilter === "Paid") return !course.isFree;
    return course.category === activeFilter;
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
              <span>SPRING 2025 ENROLLMENT OPEN</span>
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

        {/* 1. Primary Filter: Standard Chips ("All", "5th"…"12th", "Other Courses") */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-0.5">
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

        {/* 2. Secondary Filter: Course Track & Fee Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x" role="tablist" aria-label="Course categories">
          {FILTER_CHIPS.map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <button
                key={chip}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(chip)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all duration-150 border cursor-pointer active:scale-95 touch-manipulation flex items-center justify-center ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm font-bold"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Course Cards Grid or Empty State */}
        {filteredCourses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Courses Found"
            description="No courses available for the selected standard and category filter. Click below to show all courses."
            actionText="Show All Courses"
            onAction={() => {
              setActiveStandard("all");
              setActiveFilter("All");
            }}
          />
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
                        href={course.isFree ? `/watch/les-mm01-01` : `/course/${course.id}`}
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
            <div className="flex -space-x-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">AP</span>
              <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">RK</span>
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">ST</span>
            </div>
            <span className="text-xs font-semibold text-slate-600">+1,420 enrolled this term</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
