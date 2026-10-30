"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Play, 
  RotateCcw, 
  FileText, 
  Lock, 
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
  ThumbsUp,
  PhoneCall,
  Check
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import MyCoursesNotificationBanner from "@/components/notifications/MyCoursesNotificationBanner";
import { generateFeeReceiptPdf, generateCourseCertificatePdf } from "@/lib/pdfGenerator";
import { getStaffCourses, StaffCourse, fetchDbCourses } from "@/lib/staffStore";
import { getStoredVideos } from "@/lib/playlistStore";
import { normalizePhone } from "@/lib/phoneUtils";
import { getStudentActiveEnrollments } from "@/app/actions/studentAccess";
import { formatIST, isExpiredIST, getRemainingTimeIST } from "@/lib/istTime";
import { useLanguage } from "@/lib/LanguageContext";

export default function MyLearningPage() {
  const { currentLanguage } = useLanguage();
  const isMarathi = currentLanguage === "mr";
  const [courses, setCourses] = useState<StaffCourse[]>([]);
  const [activePurchases, setActivePurchases] = useState<Record<string, string>>({});
  const [studentName, setStudentName] = useState<string>("");
  const [studentPhone, setStudentPhone] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"enrolled" | "history" | "liked">("enrolled");
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [likedLessons, setLikedLessons] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClaimingCert, setIsClaimingCert] = useState<string | null>(null);

  const handleClaimCertificate = async (courseTitle: string, courseId: string) => {
    try {
      setIsClaimingCert(courseId);
      const res = await fetch("/api/certificates/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentPhone ? `std-${studentPhone.replace(/\D/g, "").slice(-6)}` : "std-learner",
          studentName: studentName || "Verified Learner",
          studentPhone: studentPhone || "9876500001",
          courseId,
        }),
      });
      const data = await res.json();
      if (data.success && data.certificate) {
        generateCourseCertificatePdf({
          certificateNo: data.certificate.certificate_no,
          studentName: data.certificate.student_name,
          courseTitle: data.certificate.course_title,
          completionDate: data.certificate.issued_at_ist,
        });
      }
    } catch (err) {
      console.error("Certificate claim error:", err);
    } finally {
      setIsClaimingCert(null);
    }
  };

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
        const live = (allCourses && allCourses.length > 0 ? allCourses : getStaffCourses()).filter(
          (c) => c.status !== "draft"
        );
        
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

  const enrolled = courses.filter((c) =>
    Boolean(activePurchases[c.id] || (c.code && activePurchases[c.code]))
  );

  return (
    <AppShell>
      <title>My Courses | MindMaster Academy</title>
      <meta
        name="description"
        content="Your enrolled active courses, progress tracking, and certifications. Prashant Dhumal Academy."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 select-none text-[#F8FAFC]">
        {/* Top Header Row */}
        <div className="flex flex-col gap-2 pb-4 border-b border-white/[0.08]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#0052FF] bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                Academic Session 2026
              </span>
              {studentPhone && (
                <span className="text-[10px] text-[#94A3B8] font-mono">
                  ID: #{studentPhone.slice(-6)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                {enrolled.length} Active Masterclasses
              </span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
            My Courses
          </h1>
          <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed">
            Resume your active video masterclasses, track speed calculation drills, and download accredited fee receipts.
          </p>
        </div>

        {/* In-App Expiry Reminder */}
        <MyCoursesNotificationBanner />

        {/* Navigation Tabs (Enrolled, Watch History, Liked) */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("enrolled")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === "enrolled"
                ? "bg-[#0052FF] text-white shadow-md shadow-blue-900/40"
                : "bg-white/[0.04] text-[#94A3B8] border border-white/[0.06] hover:bg-white/[0.08] hover:text-[#F8FAFC]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Enrolled Masterclasses</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "enrolled" ? "bg-white/20 text-white" : "bg-white/10 text-[#94A3B8]"
              }`}
            >
              {enrolled.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === "history"
                ? "bg-[#0052FF] text-white shadow-md shadow-blue-900/40"
                : "bg-white/[0.04] text-[#94A3B8] border border-white/[0.06] hover:bg-white/[0.08] hover:text-[#F8FAFC]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Watch History</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "history" ? "bg-white/20 text-white" : "bg-white/10 text-[#94A3B8]"
              }`}
            >
              {watchHistory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("liked")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === "liked"
                ? "bg-[#0052FF] text-white shadow-md shadow-blue-900/40"
                : "bg-white/[0.04] text-[#94A3B8] border border-white/[0.06] hover:bg-white/[0.08] hover:text-[#F8FAFC]"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Liked Lessons</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "liked" ? "bg-white/20 text-white" : "bg-white/10 text-[#94A3B8]"
              }`}
            >
              {likedLessons.length}
            </span>
          </button>
        </div>

        {/* 1. ACTIVE ENROLLED MODULES SECTION */}
        {activeTab === "enrolled" && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-[#94A3B8]">
                Active Enrolled Masterclasses
              </span>
            </div>

            {!isLoaded ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-[#121722] rounded-2xl border border-white/[0.08] h-64 p-6 flex flex-col justify-between animate-pulse"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="w-16 h-5 bg-white/10 rounded-full" />
                        <div className="w-24 h-5 bg-white/10 rounded-full" />
                      </div>
                      <div className="w-3/4 h-6 bg-white/10 rounded-xl" />
                      <div className="w-full h-4 bg-white/5 rounded-lg" />
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
                      <div className="w-28 h-4 bg-white/10 rounded-lg" />
                      <div className="w-24 h-8 bg-blue-600/30 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : enrolled.length === 0 ? (
              <div className="bg-[#121722] rounded-2xl p-8 md:p-12 border border-white/[0.08] shadow-2xl text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#0052FF] flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-[#0052FF]" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider mb-2">
                  New Batch Admissions Open
                </span>
                <h3 className="text-xl font-bold text-[#F8FAFC]">
                  No Enrolled Courses Found
                </h3>
                <p className="text-xs md:text-sm text-[#94A3B8] max-w-md mt-2 mb-6 leading-relaxed">
                  Enroll in MindMaster certified courses or chat with Prashant Sir for instant admission assistance.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/918459344077?text=${encodeURIComponent("Hello Prashant Sir, I would like to inquire about MindMaster Academy courses.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 inline-flex items-center gap-2 transition active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </a>
                  <Link
                    href="/courses"
                    className="px-5 py-2.5 bg-[#0052FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/30 inline-flex items-center gap-1.5 transition active:scale-95"
                  >
                    <span>Browse Courses</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolled.map((course) => {
                  const expiryStr =
                    activePurchases[course.id] ||
                    (course.code ? activePurchases[course.code] : "") ||
                    "";
                  const isExpired = expiryStr ? isExpiredIST(expiryStr) : false;
                  const remaining = expiryStr
                    ? getRemainingTimeIST(expiryStr)
                    : {
                        days: (course.accessMonths || 3) * 30,
                        label: `${course.accessMonths || 3} Months`,
                        isExpired: false,
                      };
                  const formattedISTDate = expiryStr ? formatIST(expiryStr) : "";

                  return (
                    <div
                      key={course.id}
                      className="bg-[#121722] rounded-2xl border border-white/[0.08] hover:border-blue-500/40 transition-all flex flex-col justify-between overflow-hidden shadow-xl"
                    >
                      {/* Course Header */}
                      <div className="p-5 bg-white/[0.02] border-b border-white/[0.06] flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                            {course.code || "MMA"}
                          </span>

                          {isExpired ? (
                            <span
                              className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-0.5 rounded-full flex items-center gap-1"
                              title={formattedISTDate}
                            >
                              <Clock className="w-3 h-3 text-rose-400" />
                              <span>Expired on {formattedISTDate}</span>
                            </span>
                          ) : (
                            <span
                              className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 rounded-full flex items-center gap-1"
                              title={formattedISTDate}
                            >
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>{remaining.label} Remaining</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 text-xs font-bold text-[#F8FAFC] mt-1">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                            {course.category === "vedic" ? (
                              <Calculator className="w-4 h-4 stroke-[2]" />
                            ) : (
                              <Brain className="w-4 h-4 stroke-[2]" />
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#94A3B8] block leading-none">
                              {course.category || "ACADEMY MASTERCLASS"}
                            </span>
                            <span className="text-xs font-bold text-[#F8FAFC] leading-none mt-1 block">
                              {course.subtitle || "Complete Syllabus"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-base text-[#F8FAFC]">
                            {isMarathi ? course.titleMr || course.title : course.title || course.titleMr}
                          </h3>
                          <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                            {course.description ||
                              "MindMaster Academy certified memory and speed training sessions."}
                          </p>

                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mb-2">
                              <div
                                className="bg-[#0052FF] h-full rounded-full transition-all"
                                style={{ width: "45%" }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-[#F8FAFC] font-semibold">In Progress • 45%</span>
                              <span className="text-[#94A3B8] text-[11px]">Next: Drill Session</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              generateFeeReceiptPdf({
                                receiptNo: `REC-${course.code || "MM"}-8492`,
                                date: new Date().toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }),
                                studentName: studentName || "Verified Student",
                                studentPhone: studentPhone || "9822100001",
                                district: "Satara",
                                courseCode: course.code || "MM-01",
                                courseTitle: course.title,
                                amountPaise: course.pricePaise || 99900,
                                paymentId: "pay_rzp_live_grant",
                                accessMonths: course.accessMonths || 3,
                                expiryDate: expiryStr
                                  ? formatIST(expiryStr, { dateOnly: true })
                                  : "3 Months",
                              })
                            }
                            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download Fee Receipt</span>
                          </button>

                          {isExpired ? (
                            <Link
                              href={`/checkout?courseId=${course.id}`}
                              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5 active:scale-95"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Renew Access</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/watch/${course.id}`}
                              className="px-5 py-2 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold transition inline-flex items-center gap-1.5 active:scale-95 shadow-md shadow-blue-900/30"
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
            )}
          </section>
        )}

        {/* 2. WATCH HISTORY TAB */}
        {activeTab === "history" && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-[#94A3B8]">
                Watch History
              </span>
              {watchHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("mindmaster_watch_history");
                    setWatchHistory([]);
                  }}
                  className="text-[#94A3B8] hover:text-red-400 text-xs font-semibold cursor-pointer transition"
                >
                  Clear History
                </button>
              )}
            </div>

            {watchHistory.length === 0 ? (
              <div className="bg-[#121722] rounded-2xl p-8 border border-white/[0.08] text-center flex flex-col items-center justify-center max-w-md mx-auto my-4">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] mb-3">
                  <Clock className="w-7 h-7 text-[#0052FF]" />
                </div>
                <h3 className="font-bold text-sm text-[#F8FAFC]">
                  No Watch History Yet
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1 mb-5 leading-relaxed">
                  As soon as you stream video episodes, they will be saved here so you can resume anytime.
                </p>
                <Link
                  href="/courses"
                  className="px-6 py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold transition shadow-lg shadow-blue-900/30"
                >
                  Browse Masterclasses
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
                      className="bg-[#121722] rounded-xl p-4 border border-white/[0.08] flex items-center justify-between gap-3 hover:border-blue-500/40 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 fill-blue-400 ml-0.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-[#F8FAFC] truncate">
                            {item.lessonTitle}
                          </h4>
                          <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                            {item.courseTitle} • {timeFormatted} / {durMins} mins
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/watch/${item.lessonId}?t=${item.positionSec || 0}`}
                        className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-blue-400 border border-white/[0.06] text-xs font-bold shrink-0 flex items-center gap-1 transition"
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
              <span className="font-bold uppercase tracking-wider text-[#94A3B8]">
                Liked Lessons
              </span>
              <span className="text-[#94A3B8]">{likedLessons.length} Videos</span>
            </div>

            {likedLessons.length === 0 ? (
              <div className="bg-[#121722] rounded-2xl p-8 border border-white/[0.08] text-center flex flex-col items-center justify-center max-w-md mx-auto my-4">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] mb-3">
                  <ThumbsUp className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="font-bold text-sm text-[#F8FAFC]">
                  No Liked Lessons Yet
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1 mb-5 leading-relaxed">
                  Tap the Like button below any lecture to save your favorite lessons here.
                </p>
                <Link
                  href="/courses"
                  className="px-6 py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold transition shadow-lg shadow-blue-900/30"
                >
                  Explore Lessons
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {likedLessons.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#121722] rounded-xl p-4 border border-white/[0.08] flex items-center justify-between gap-3 hover:border-emerald-500/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <ThumbsUp className="w-4 h-4 fill-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-[#F8FAFC] truncate">
                          {item.lessonTitle || item.title}
                        </h4>
                        <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                          {item.courseTitle || "MindMaster Academy"} • {Math.round((item.durationSec || 900) / 60)} mins
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/watch/${item.lessonId || item.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-emerald-400 border border-white/[0.06] text-xs font-bold shrink-0 flex items-center gap-1 transition"
                    >
                      <Play className="w-3 h-3 fill-emerald-400" />
                      <span>Play</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 4. Bottom Support Notice */}
        <div className="bg-[#121722] rounded-2xl p-4 md:p-5 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0052FF] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <p className="text-xs text-[#94A3B8]">
              <strong className="text-[#F8FAFC]">Academic Support Desk:</strong> Offline proctored test series and memory workshops available at Satara & Pune centers.
            </p>
          </div>

          <a
            href="tel:+918459344077"
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#F8FAFC] text-xs font-semibold transition inline-flex items-center gap-1.5 self-end sm:self-auto shrink-0"
          >
            <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
            <span>Helpline: +91 84593 44077</span>
          </a>
        </div>
      </div>
    </AppShell>
  );
}
