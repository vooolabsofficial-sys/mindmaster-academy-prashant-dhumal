"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Play, 
  RotateCcw, 
  FileText, 
  Lock, 
  Flame, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  MessageCircle,
  Sparkles,
  Brain,
  Calculator,
  MapPin,
  Award,
  BookOpen,
  ThumbsUp
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import MyCoursesNotificationBanner from "@/components/notifications/MyCoursesNotificationBanner";
import { generateFeeReceiptPdf, generateCourseCertificatePdf } from "@/lib/pdfGenerator";
import { getStaffCourses, StaffCourse, fetchDbCourses } from "@/lib/staffStore";
import { getStoredVideos } from "@/lib/playlistStore";
import { normalizePhone } from "@/lib/phoneUtils";
import { getStudentActiveEnrollments } from "@/app/actions/studentAccess";
import { formatIST, isExpiredIST, getRemainingTimeIST } from "@/lib/istTime";

export default function MyLearningPage() {
  const [courses, setCourses] = useState<StaffCourse[]>([]);
  const [activePurchases, setActivePurchases] = useState<Record<string, string>>({});
  const [studentName, setStudentName] = useState<string>("");
  const [studentPhone, setStudentPhone] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"enrolled" | "history" | "liked">("enrolled");
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [likedLessons, setLikedLessons] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      let resolvedPhone = "";
      let resolvedUserId = "";
      try {
        const rawProfile = localStorage.getItem("mindmaster_user_profile");
        if (rawProfile) {
          const p = JSON.parse(rawProfile);
          if (p.full_name) setStudentName(p.full_name);
          if (p.mobile_number || p.phone) {
            resolvedPhone = p.mobile_number || p.phone;
            setStudentPhone(resolvedPhone);
          }
          if (p.id) resolvedUserId = p.id;
        }
      } catch {}

      const localPurchases: Record<string, string> = {};
      try {
        const rawPurchases = localStorage.getItem("mindmaster_active_purchases");
        if (rawPurchases) {
          Object.assign(localPurchases, JSON.parse(rawPurchases));
        }
      } catch {}

      // Query live enrollments via Service Role server action (admin.ts)
      try {
        const liveEnrollments = await getStudentActiveEnrollments({
          userPhone: resolvedPhone,
          userId: resolvedUserId,
        });
        if (liveEnrollments && Object.keys(liveEnrollments).length > 0) {
          Object.assign(localPurchases, liveEnrollments);
        }
      } catch (liveErr) {
        console.warn("Live enrollments query fallback:", liveErr);
      }

      try {
        const allCourses = await fetchDbCourses();
        const live = (allCourses && allCourses.length > 0 ? allCourses : getStaffCourses()).filter((c) => c.status !== "draft");
        
        // Ensure bidirectional mapping for activePurchases (both UUID and code/slug)
        Object.keys(localPurchases).forEach((key) => {
          const expiry = localPurchases[key];
          const matched = live.find((c) => c.id === key || c.code === key);
          if (matched) {
            if (matched.id) localPurchases[matched.id] = expiry;
            if (matched.code) localPurchases[matched.code] = expiry;
          }
        });

        setActivePurchases({ ...localPurchases });
        setCourses(live);
      } catch {
        setActivePurchases(localPurchases);
        setCourses([]);
      }

      try {
        const rawHistory = localStorage.getItem("mindmaster_watch_history");
        if (rawHistory) {
          setWatchHistory(JSON.parse(rawHistory));
        }
      } catch {}

      try {
        const rawLiked = localStorage.getItem("mindmaster_liked_videos");
        const likedIds: string[] = rawLiked ? JSON.parse(rawLiked) : [];
        const allVideos = getStoredVideos();
        const resolved = likedIds.map((id) => {
          const match = allVideos.find((v) => v.lessonId === id || v.id === id);
          return (
            match || {
              id,
              lessonId: id,
              lessonTitle: `Lesson ${id}`,
              courseTitle: "MindMaster Curriculum",
              durationSec: 900,
            }
          );
        });
        setLikedLessons(resolved);
      } catch {}

      setIsLoaded(true);
    };

    loadData();
    window.addEventListener("storage", loadData);
    window.addEventListener("mma_courses_changed", loadData);
    return () => {
      window.removeEventListener("storage", loadData);
      window.removeEventListener("mma_courses_changed", loadData);
    };
  }, []);
  return (
    <AppShell>
      <title>My Courses | MindMaster Academy</title>
      <meta name="description" content="Your enrolled active courses, progress tracking, and certifications. Prashant Dhumal Academy." />
      <div className="flex flex-col gap-8 select-none">

        {/* Top Header Row */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                ● Academic Term 2024-25
              </span>
              <span className="text-[10px] text-slate-500 font-semibold font-mono">
                Enrollment ID: #MM-8492
              </span>
            </div>

            {/* Right Status Chips */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
                • {courses.filter((c) => Boolean(activePurchases[c.id] || (c.code && activePurchases[c.code]))).length} Active Courses
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
                • 1 Completed
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Streak: 5 Days</span>
              </span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Courses
          </h1>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Track your active video lessons, practice drill milestones, and offline Narhe Centre certifications.
          </p>
        </div>

        {/* IN-APP EXPIRY REMINDER & RENEWAL BANNER */}
        <MyCoursesNotificationBanner />

        {/* Navigation Tabs (Enrolled, Watch History, Liked) */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("enrolled")}
            className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === "enrolled"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Enrolled Courses</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "enrolled" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {courses.filter((c) => Boolean(activePurchases[c.id] || (c.code && activePurchases[c.code]))).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === "history"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Watch History</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "history" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {watchHistory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("liked")}
            className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === "liked"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Liked Lessons</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "liked" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {likedLessons.length}
            </span>
          </button>
        </div>

        {/* 1. ACTIVE ENROLLED MODULES SECTION */}
        {activeTab === "enrolled" && (
          <>
          <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-slate-500">
              ACTIVE ENROLLED MODULES
            </span>
            <span className="text-slate-600 font-semibold cursor-pointer hover:text-blue-600">
              Sort by Recent Progress ⌄
            </span>
          </div>

          {(() => {
            const enrolled = courses.filter((c) =>
              Boolean(activePurchases[c.id] || (c.code && activePurchases[c.code]))
            );

            if (!isLoaded) {
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs h-64 flex flex-col justify-between p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="w-16 h-5 bg-slate-200 rounded-full" />
                          <div className="w-24 h-5 bg-amber-100 rounded-full" />
                        </div>
                        <div className="w-3/4 h-6 bg-slate-200 rounded-xl" />
                        <div className="w-full h-4 bg-slate-100 rounded-lg" />
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <div className="w-28 h-4 bg-slate-200 rounded-lg" />
                        <div className="w-24 h-8 bg-blue-200 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            if (courses.length === 0 || enrolled.length === 0) {
              return (
                <div className="bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/90 rounded-3xl p-8 md:p-12 border border-blue-200/80 shadow-sm text-center flex flex-col items-center justify-center max-w-2xl mx-auto my-6 animate-fadeIn">
                  <div className="w-16 h-16 rounded-3xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wider mb-2">
                    New Batch Admissions Open
                  </span>
                  <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                    New Courses Coming Soon!
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 max-w-lg mt-2 mb-6 leading-relaxed">
                    Contact Prashant Sir for course details and enrollment.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={`https://wa.me/918459344077?text=${encodeURIComponent("Hello Prashant Sir, I would like to inquire about MindMaster Academy courses.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-full shadow-md shadow-emerald-500/20 inline-flex items-center gap-2 transition cursor-pointer active:scale-95"
                    >
                      <span>💬</span>
                      <span>Chat with Prashant Sir on WhatsApp</span>
                    </a>
                    <Link
                      href="/courses"
                      className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-full shadow-2xs inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Browse Courses</span>
                    </Link>
                  </div>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolled.map((course) => {
                  const expiryStr = activePurchases[course.id] || (course.code ? activePurchases[course.code] : "") || "";
                  const isExpired = expiryStr ? isExpiredIST(expiryStr) : false;
                  const remaining = expiryStr ? getRemainingTimeIST(expiryStr) : { days: (course.accessMonths || 3) * 30, label: `${course.accessMonths || 3} Months`, isExpired: false };
                  const formattedISTDate = expiryStr ? formatIST(expiryStr) : "";

                  return (
                    <div
                      key={course.id}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      {/* Course Header */}
                      <div className="p-5 bg-blue-50/70 border-b border-blue-100 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-white border border-blue-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                            {course.code || "MM"}
                          </span>

                          {/* IST EXPIRY CHIP */}
                          {isExpired ? (
                            <span className="text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-0.5 rounded-full shadow-2xs flex items-center gap-1" title={formattedISTDate}>
                              <Clock className="w-3 h-3 text-rose-600" />
                              <span>Expired on {formattedISTDate}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full shadow-2xs flex items-center gap-1" title={formattedISTDate}>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{remaining.label} (IST)</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 mt-1">
                          <div className="w-8 h-8 rounded-xl bg-white text-blue-600 flex items-center justify-center font-bold shadow-2xs">
                            {course.category === "vedic" ? (
                              <Calculator className="w-4 h-4 stroke-[2]" />
                            ) : (
                              <Brain className="w-4 h-4 stroke-[2]" />
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-extrabold text-slate-500 block leading-none">
                              {course.category || "ACADEMY SPECIAL"}
                            </span>
                            <span className="text-xs font-bold text-slate-900 leading-none mt-0.5 block">
                              {course.subtitle || "Masterclass & Drills"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900">
                            {course.titleMr || course.title}
                          </h3>
                          {course.titleMr && course.title !== course.titleMr && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {course.title}
                            </p>
                          )}
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {course.description || "MindMaster Academy certified memory and speed training sessions."}
                          </p>

                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                              <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: "45%" }} />
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-900">Active Practice • 45%</span>
                              <span className="text-slate-500 font-medium text-[11px]">Next: Daily Drill</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer with fee receipt & Continue Button */}
                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              generateFeeReceiptPdf({
                                receiptNo: `REC-${course.code || "MM"}-8492`,
                                date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                                studentName: studentName,
                                studentPhone: studentPhone,
                                district: "Pune",
                                courseCode: course.code || "MM-01",
                                courseTitle: course.title,
                                amountPaise: course.pricePaise || 99900,
                                paymentId: "pay_rzp_live_grant",
                                accessMonths: course.accessMonths || 3,
                                expiryDate: expiryStr ? formatIST(expiryStr, { dateOnly: true }) : "3 Months",
                              })
                            }
                            className="text-[11px] font-bold text-[#0B57D0] hover:text-[#0842A0] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download Fee Receipt</span>
                          </button>

                          {isExpired ? (
                            <Link
                              href={`/checkout?courseId=${course.id}`}
                              className="touch-target-44 min-h-[44px] px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-500/25 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Renew Access</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/watch/${course.id}`}
                              className="touch-target-44 min-h-[44px] px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation"
                            >
                              <span>Continue</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>

        {/* 2. EXPIRED & COMPLETED SECTION */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-slate-600 font-semibold">
              EXPIRED & COMPLETED
            </span>
            <span className="text-slate-600 font-medium">1 Completed Course</span>
          </div>

          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <Award className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm md:text-base text-slate-900">
                    Master The Calendar Technique
                  </h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    Completed 100%
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 font-normal">
                  Access ended on 12 Aug 2026 • 6 lessons completed • Narhe Offline Batch #V24
                </p>
              </div>
            </div>

            {/* Download Certificate & Buy Again */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() =>
                  generateCourseCertificatePdf({
                    certificateNo: "MMA-CERT-2026-0492",
                    studentName: "Tanvi Deshpande",
                    courseTitle: "Master The 500-Year Calendar Technique",
                    completionDate: "12 Aug 2026",
                  })
                }
                className="touch-target-44 min-h-[44px] px-4 py-2 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 text-xs font-extrabold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Certificate</span>
              </button>

              <Link
                href="/checkout?courseId=c-mm-04"
                className="touch-target-44 min-h-[44px] px-5 py-2.5 rounded-full bg-white border border-slate-200 hover:border-blue-600 text-slate-900 text-xs font-extrabold shadow-2xs hover:bg-blue-50 transition inline-flex items-center gap-1.5 self-end sm:self-auto shrink-0 cursor-pointer active:scale-95 touch-manipulation"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                <span>Buy Again</span>
              </Link>
            </div>
          </div>
        </section>
        </>
        )}

        {/* 2. WATCH HISTORY TAB */}
        {activeTab === "history" && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold uppercase tracking-wider text-slate-500">
                Watch History
              </span>
              {watchHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("mindmaster_watch_history");
                    setWatchHistory([]);
                  }}
                  className="text-slate-500 hover:text-red-600 text-xs font-semibold cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            {watchHistory.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 text-center flex flex-col items-center justify-center max-w-md mx-auto my-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-3">
                  ⏱️
                </div>
                <h3 className="font-extrabold text-sm md:text-base text-slate-900">
                  No Watch History Yet
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
                  As soon as you start watching video lessons, they will be saved here so you can resume anytime.
                </p>
                <Link
                  href="/courses"
                  className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchHistory.map((item, idx) => {
                  const mins = Math.floor((item.positionSec || 0) / 60);
                  const secs = (item.positionSec || 0) % 60;
                  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
                  const durMins = Math.floor((item.durationSec || 900) / 60);

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-blue-300 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                          <Play className="w-4 h-4 fill-blue-600 ml-0.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate">
                            {item.lessonTitle}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.courseTitle} • {timeFormatted} / {durMins} mins
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/watch/${item.lessonId}?t=${item.positionSec || 0}`}
                        className="px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold shrink-0 flex items-center gap-1 transition"
                      >
                        <span>Resume</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 3. LIKED VIDEOS TAB */}
        {activeTab === "liked" && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold uppercase tracking-wider text-slate-500">
                Liked Lessons
              </span>
              <span className="text-slate-500 font-semibold">{likedLessons.length} Videos</span>
            </div>

            {likedLessons.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 text-center flex flex-col items-center justify-center max-w-md mx-auto my-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-3">
                  👍
                </div>
                <h3 className="font-extrabold text-sm md:text-base text-slate-900">
                  No Liked Lessons Yet
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
                  Tap the 👍 button below any lecture video to save your favorite lessons here!
                </p>
                <Link
                  href="/courses"
                  className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                >
                  Explore Lessons
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {likedLessons.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-300 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                        <ThumbsUp className="w-4 h-4 fill-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">
                          {item.lessonTitle || item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.courseTitle || "MindMaster Academy"} • {Math.round((item.durationSec || 900) / 60)} mins
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/watch/${item.lessonId || item.id}`}
                      className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0 flex items-center gap-1 transition"
                    >
                      <Play className="w-3 h-3 fill-emerald-700" />
                      <span>Play</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 4. BOTTOM CENTRE NOTICE */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <p className="text-xs font-normal text-slate-900">
              <strong className="font-bold text-slate-900">Satara Campus Desk Notice:</strong> Offline proctored test series and memory workshops available this Saturday.
            </p>
          </div>

          <a
            href="tel:+918459344077"
            className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition inline-flex items-center gap-1.5 self-end sm:self-auto shrink-0"
          >
            <span>📞</span>
            <span>Helpline: +91 84593 44077</span>
          </a>
        </div>
      </div>
    </AppShell>
  );
}
