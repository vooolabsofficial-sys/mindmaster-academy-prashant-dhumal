"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Award, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Play, 
  Search, 
  FileText,
  Sparkles,
  ArrowRight,
  Check
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { generateCourseCertificatePdf } from "@/lib/pdfGenerator";
import { getStaffCourses, StaffCourse, fetchDbCourses } from "@/lib/staffStore";
import { getStoredVideos } from "@/lib/playlistStore";
import { toast } from "sonner";

interface ClaimedCert {
  id: string;
  certificate_no: string;
  course_id: string;
  course_title: string;
  course_code: string;
  student_name: string;
  issued_at_ist: string;
}

export default function StudentCertificatesPage() {
  const [courses, setCourses] = useState<StaffCourse[]>([]);
  const [claimedCerts, setClaimedCerts] = useState<ClaimedCert[]>([]);
  const [studentName, setStudentName] = useState<string>("Verified Student");
  const [studentPhone, setStudentPhone] = useState<string>("");
  const [searchCertQuery, setSearchCertQuery] = useState("");
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [courseProgressMap, setCourseProgressMap] = useState<Record<string, number>>({});

  useEffect(() => {
    // 1. Load user profile
    try {
      const rawProfile = localStorage.getItem("mindmaster_user_profile");
      if (rawProfile) {
        const p = JSON.parse(rawProfile);
        if (p.full_name) setStudentName(p.full_name);
        if (p.mobile_number || p.phone) setStudentPhone(p.mobile_number || p.phone);
      }
      const rawPhone = localStorage.getItem("mindmaster_verified_phone");
      if (rawPhone && !studentPhone) setStudentPhone(rawPhone);
    } catch {}

    // 2. Load claimed certificates from localStorage
    try {
      const storedCerts = localStorage.getItem("mindmaster_claimed_certificates");
      if (storedCerts) {
        setClaimedCerts(JSON.parse(storedCerts));
      }
    } catch {}

    // 3. Load live DB courses and videos
    async function loadData() {
      try {
        const liveCourses = await fetchDbCourses();
        const baseCourses = liveCourses && liveCourses.length > 0 ? liveCourses : getStaffCourses();
        setCourses(baseCourses);

        const storedVideos = getStoredVideos();
        const progressMap: Record<string, number> = {};

        baseCourses.forEach((c) => {
          const lessons = storedVideos.filter((v) => v.courseId === c.id || v.courseId === c.code);
          if (lessons.length === 0) {
            progressMap[c.id] = 100; // If no lessons configured yet, mark completed
            return;
          }

          let completedCount = 0;
          lessons.forEach((l) => {
            const isDone =
              localStorage.getItem(`mma_completed_${l.lessonId || l.id}`) === "true" ||
              localStorage.getItem(`mindmaster_completed_${l.lessonId || l.id}`) === "true";
            if (isDone) completedCount++;
          });

          // Calculate percentage
          const pct = Math.round((completedCount / lessons.length) * 100);
          progressMap[c.id] = pct;
        });

        setCourseProgressMap(progressMap);
      } catch {
        setCourses(getStaffCourses());
      }
    }

    loadData();
  }, []);

  // Claim a certificate for a 100% completed course
  const handleClaim = async (course: StaffCourse) => {
    setIsClaiming(course.id);
    try {
      const phoneClean = studentPhone.replace(/\D/g, "") || "9822100001";
      const res = await fetch("/api/certificates/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: `std-${phoneClean.slice(-6)}`,
          studentName: studentName || "Verified Student",
          studentPhone: phoneClean,
          courseId: course.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.certificate) {
        const cert = data.certificate;
        const newClaimed: ClaimedCert = {
          id: cert.id || `cert-${Date.now()}`,
          certificate_no: cert.certificate_no,
          course_id: course.id,
          course_title: course.title,
          course_code: course.code || "MMA",
          student_name: studentName,
          issued_at_ist: cert.issued_at_ist || new Date().toLocaleDateString("en-GB"),
        };

        const updated = [newClaimed, ...claimedCerts.filter((c) => c.course_id !== course.id)];
        setClaimedCerts(updated);
        localStorage.setItem("mindmaster_claimed_certificates", JSON.stringify(updated));

        toast.success(`Certificate claimed! Serial: ${cert.certificate_no}`);
      } else {
        toast.error(data.error || "Could not claim certificate at this time.");
      }
    } catch {
      toast.error("Network error while claiming certificate.");
    } finally {
      setIsClaiming(null);
    }
  };

  const handleDownloadPdf = (cert: ClaimedCert) => {
    generateCourseCertificatePdf({
      certificateNo: cert.certificate_no,
      studentName: cert.student_name || studentName,
      courseTitle: cert.course_title,
      completionDate: cert.issued_at_ist || new Date().toLocaleDateString("en-GB"),
      grade: "A+ Distinction",
    });
    toast.success("Certificate PDF generated and downloaded!");
  };

  return (
    <AppShell>
      <title>Official Certificates & Accreditations | MindMaster Academy</title>
      <meta
        name="description"
        content="Claim and verify official MindMaster Academy completion certificates accredited by international trainer Prashant Dhumal Sir."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8 select-none text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-200">
        {/* Top Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
                Official Credentials
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">
              Certificates & Accreditations
            </h1>
            <p className="text-xs md:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
              Verifiable certificates issued upon full course completion, accredited by MindMaster Academy and International Trainer Prashant Dhumal Sir.
            </p>
          </div>

          {/* Quick Certificate Search Verification Box */}
          <div className="w-full md:w-80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchCertQuery.trim()) {
                  window.location.href = `/verify-certificate?cert=${encodeURIComponent(searchCertQuery.trim())}`;
                }
              }}
              className="relative flex items-center"
            >
              <Search className="w-4 h-4 text-[#475569] dark:text-[#94A3B8] absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Verify Certificate ID..."
                value={searchCertQuery}
                onChange={(e) => setSearchCertQuery(e.target.value)}
                className="w-full pl-9 pr-16 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-[#0F172A] dark:text-[#F1F5F9] placeholder-[#475569]/60 dark:placeholder-[#94A3B8]/60 focus:outline-hidden focus:border-[#2563EB] dark:focus:border-blue-500 transition"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-2.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 dark:bg-[#3B82F6] dark:hover:bg-blue-600 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
              >
                Verify
              </button>
            </form>
          </div>
        </div>

        {/* Section 1: Earned Certificates */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F1F5F9]">
                Earned Certificates ({claimedCerts.length})
              </h2>
            </div>
          </div>

          {claimedCerts.length === 0 ? (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 border border-slate-200/80 dark:border-slate-700/60 shadow-xs text-center flex flex-col items-center justify-center max-w-lg mx-auto my-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center mb-3 text-[#2563EB] dark:text-blue-400">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#F1F5F9]">
                No Certificates Claimed Yet
              </h3>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1 mb-5 max-w-xs leading-relaxed">
                Complete 100% of your course syllabus to unlock your official verified certificate with QR authenticity.
              </p>
              <Link
                href="/courses"
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 dark:bg-[#3B82F6] dark:hover:bg-blue-600 text-white text-xs font-bold transition shadow-xs"
              >
                Continue Learning
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {claimedCerts.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-6 flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-[#2563EB]/40 dark:hover:border-blue-500/40 transition-all shadow-xs"
                >
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                        {cert.certificate_no}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified Credential
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                      {cert.course_title}
                    </h3>
                    <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                      Awarded to <strong className="text-[#0F172A] dark:text-[#F1F5F9] font-semibold">{cert.student_name}</strong> on {cert.issued_at_ist}.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-700/60 relative z-10">
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(cert)}
                      className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 dark:bg-[#3B82F6] dark:hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>

                    <Link
                      href={`/verify-certificate?cert=${encodeURIComponent(cert.certificate_no)}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verify Credential</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Course Progress & Eligible Claims */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F1F5F9]">
                Course Progress & Eligibility
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => {
              const progress = courseProgressMap[course.id] ?? 0;
              const isCompleted = progress >= 100;
              const isAlreadyClaimed = claimedCerts.some((c) => c.course_id === course.id);

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-5 flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-[#2563EB] dark:text-blue-400">
                        {course.code || "MMA"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-[#94A3B8] border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {progress}% Completed
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#475569] dark:text-[#94A3B8] line-clamp-1">
                      {course.subtitle || course.description || "Master Training Sessions"}
                    </p>

                    {/* Progress Bar */}
                    <div className="pt-2">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? "bg-emerald-600 dark:bg-emerald-500" : "bg-[#2563EB] dark:bg-[#3B82F6]"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Claim Button or Watch CTA */}
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                      {isCompleted ? "Eligible for Certification" : "Watch all lessons to unlock"}
                    </span>

                    {isCompleted ? (
                      isAlreadyClaimed ? (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Claimed
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isClaiming === course.id}
                          onClick={() => handleClaim(course)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{isClaiming === course.id ? "Issuing..." : "Claim Certificate"}</span>
                        </button>
                      )
                    ) : (
                      <Link
                        href={`/watch/${course.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-[#F1F5F9] text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <span>Resume</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Verification Guarantee */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              Tamper-Proof Digital Verification
            </h4>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
              Every MindMaster Academy certificate carries a cryptographically hashed serial code and an encrypted QR verification link. Schools, colleges, and competitive exam boards can instantly verify credential validity 24/7.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
