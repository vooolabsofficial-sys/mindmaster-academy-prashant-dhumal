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
  Zap,
  Tag,
  GraduationCap,
  MessageCircle,
  PhoneCall,
  Plus,
  Lock
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import FilterChips, { StandardFilter } from "@/components/courses/FilterChips";
import { getStaffCourses, getStaffStudents, fetchDbCourses } from "@/lib/staffStore";
import { ACADEMY_CATEGORIES, AcademyCategory, matchesAcademyCategory } from "@/lib/academyCategories";
import { useLanguage } from "@/lib/LanguageContext";

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
  category: "Memory" | "Vedic Maths" | "Teacher Certification" | "Calendar Technique";
  imageSrc: string;
  icon: any;
  standards?: number[];
}

const CATALOG_COURSES: CatalogCourse[] = [];

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
  const { currentLanguage } = useLanguage();
  const isMarathi = currentLanguage === "mr";
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

  const dynamicCatalogCourses: CatalogCourse[] = staffCourses.map((sc) => {
    const existing = CATALOG_COURSES.find((c) => c.code === sc.code || c.id === sc.id);
    const isFreeCourse = sc.isFree || sc.pricePaise === 0;
    const resolvedTitle = isMarathi ? (sc.titleMr || sc.title) : (sc.title || sc.titleMr);
    const cat: CatalogCourse["category"] =
      sc.category === "vedic"
        ? "Vedic Maths"
        : sc.category === "trainer" || sc.code === "MM-02" || sc.code === "MM-06"
        ? "Teacher Certification"
        : sc.category === "calendar"
        ? "Calendar Technique"
        : "Memory";

    if (existing) {
      return {
        ...existing,
        title: resolvedTitle,
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
      track: resolvedTitle,
      title: resolvedTitle,
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

  const visibleCourses = dynamicCatalogCourses;

  const filteredCourses = visibleCourses.filter((course) => {
    const staffMatch = staffCourses.find(
      (sc) => sc.code === course.code || sc.id === course.id
    );
    const courseStandards = staffMatch?.standards ?? course.standards;

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

    if (activeStandard !== "all") {
      if (activeStandard === "other") {
        if (courseStandards && courseStandards.length > 0) return false;
      } else {
        if (!courseStandards || !courseStandards.includes(Number(activeStandard))) {
          return false;
        }
      }
    }

    if (feeFilter === "Free") return course.isFree;
    if (feeFilter === "Paid") return !course.isFree;
    return true;
  });

  return (
    <AppShell>
      <title>Certified Courses Catalog | MindMaster Academy</title>
      <meta
        name="description"
        content="Explore Prashant Dhumal's certified courses in Memory Techniques, Vedic Maths, and Calendar Mastery."
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 select-none text-[#F8FAFC]">
        {/* Header with Term Chip */}
        <div className="flex flex-col gap-2 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#0052FF]" />
              <span>Session 2026 Admissions Open</span>
            </span>

            <span className="text-xs text-[#94A3B8] font-medium">
              Showing {filteredCourses.length} Certified Courses
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
            All Masterclasses
          </h1>
          <p className="text-xs md:text-sm text-[#94A3B8] max-w-2xl leading-relaxed">
            Explore certified memory mastery, competitive exam prep, and speed calculation workshops curated for Maharashtra students and recruitment aspirants.
          </p>
        </div>

        {/* 1. Primary Category Tabs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] px-0.5">
            <span className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
              <Tag className="w-3.5 h-3.5 text-[#0052FF]" /> Course Categories:
            </span>
            <span className="text-[11px] text-[#0052FF] font-semibold">
              Open to all learners
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist">
            {ACADEMY_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[38px] px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                    isActive
                      ? "bg-[#0052FF] text-white border-blue-500 shadow-md shadow-blue-900/40"
                      : "bg-white/[0.04] text-[#94A3B8] border-white/[0.06] hover:bg-white/[0.08] hover:text-[#F8FAFC]"
                  }`}
                >
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Secondary Filter: Standard & Fee Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/[0.06]">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-[#94A3B8] px-0.5 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                <GraduationCap className="w-3.5 h-3.5 text-[#0052FF]" /> Select Standard:
              </span>
              {activeStandard !== "all" && (
                <button
                  onClick={() => setActiveStandard("all")}
                  className="text-[11px] text-blue-400 hover:underline font-bold cursor-pointer"
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
                      ? "bg-[#0052FF] text-white border-blue-500 shadow-sm"
                      : "bg-white/[0.04] text-[#94A3B8] border-white/[0.06] hover:bg-white/[0.08] hover:text-[#F8FAFC]"
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
          <div className="bg-[#121722] rounded-2xl p-8 md:p-12 border border-white/[0.08] shadow-2xl text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#0052FF] flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-[#0052FF]" />
            </div>
            <span className="px-3.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider mb-2">
              Coming Soon • Launching Shortly
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-[#F8FAFC]">
              New Courses Launching Soon
            </h3>
            <span className="text-xs font-semibold text-blue-400 mt-0.5">
              Comprehensive Curriculum & HD Video Lectures in Preparation
            </span>
            <p className="text-xs md:text-sm text-[#94A3B8] max-w-md mt-2 mb-6 leading-relaxed">
              Prashant Sir&apos;s new HD video lectures and official study material are being uploaded. Click below to pre-book and get notified immediately.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={`https://wa.me/918459344077?text=${encodeURIComponent("Namaskar Prashant Sir, please notify me when the new MindMaster online course batch launches!")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 inline-flex items-center gap-2 transition active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Notify Me on WhatsApp</span>
              </a>
              <a
                href="tel:+918459344077"
                className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#F8FAFC] border border-white/[0.08] font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition"
              >
                <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                <span>+91 84593 44077</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const staffMatch = staffCourses.find(
                (sc) => sc.code === course.code || sc.id === course.id
              );
              const courseStandards = staffMatch?.standards ?? course.standards;
              const Icon = course.icon;

              return (
                <div
                  key={course.id}
                  className="bg-[#121722] rounded-2xl border border-white/[0.08] overflow-hidden shadow-xl hover:border-blue-500/40 transition-all flex flex-col justify-between group"
                >
                  {/* Header with Icon & 3D Artwork */}
                  <div className="p-5 border-b border-white/[0.06] bg-white/[0.02] flex flex-col gap-3 relative">
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                          {course.badge}
                        </span>

                        <span className="text-[10px] font-bold bg-white/[0.04] text-[#94A3B8] border border-white/[0.06] px-2.5 py-0.5 rounded-full">
                          {courseStandards && courseStandards.length > 0
                            ? (courseStandards.length === 8 ? "Class 5th - 12th" : `${courseStandards.map((s: number) => `${s}th`).join(", ")} Std`)
                            : "All Standards"}
                        </span>
                      </div>

                      <span className="text-[10px] text-[#94A3B8] bg-white/[0.04] px-2.5 py-0.5 rounded-full font-semibold">
                        {course.subBadge}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC]">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0052FF] flex items-center justify-center">
                          <Icon className="w-4 h-4 stroke-[2]" />
                        </div>
                        <span className="truncate">{course.track}</span>
                      </div>

                      <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-white/[0.04] p-1 border border-white/[0.08] group-hover:scale-105 transition-transform duration-300">
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
                      <h3 className="font-bold text-base text-[#F8FAFC] leading-snug group-hover:text-blue-400 transition">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-1.5 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                      <div className="text-[11px] text-[#94A3B8] font-medium mt-3 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
                        <span>{course.meta}</span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                      <span className={`text-base font-bold ${course.isFree ? "text-emerald-400" : "text-[#F8FAFC]"}`}>
                        {course.price}
                      </span>

                      <Link
                        href={`/course/${course.id}`}
                        className="px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold transition shadow-md shadow-blue-900/30 flex items-center gap-1 active:scale-95"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
