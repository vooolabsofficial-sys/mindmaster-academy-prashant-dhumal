"use client";

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
  Award
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import MyCoursesNotificationBanner from "@/components/notifications/MyCoursesNotificationBanner";
import { generateFeeReceiptPdf, generateCourseCertificatePdf } from "@/lib/pdfGenerator";

export default function MyLearningPage() {
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
                • 2 Active Courses
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

        {/* 1. ACTIVE ENROLLED MODULES SECTION */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-slate-500">
              ACTIVE ENROLLED MODULES
            </span>
            <span className="text-slate-600 font-semibold cursor-pointer hover:text-blue-600">
              Sort by Recent Progress ⌄
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: MM-05 Vedic Maths with Peach Expiry Chip */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between">
              {/* Sky Header */}
              <div className="p-5 bg-blue-50/70 border-b border-blue-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-white border border-blue-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                    MM-05
                  </span>

                  {/* PEACH EXPIRY CHIP */}
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Expires in 74 days</span>
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 mt-1">
                  <div className="w-8 h-8 rounded-xl bg-white text-blue-600 flex items-center justify-center font-bold shadow-2xs">
                    <Calculator className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 block leading-none">
                      VEDIC MATRIX
                    </span>
                    <span className="text-xs font-bold text-slate-900 leading-none mt-0.5 block">
                      Speed Sutras & Multipliers
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    High-Scoring Mathematics & Vedic Maths
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Maharashtra State Board & Speed Calculation Drills • English & Marathi
                  </p>

                  {/* Progress Bar & Next Lesson */}
                  <div className="mt-4">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                      <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: "45%" }} />
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-900">5 of 12 lessons completed (45%)</span>
                      <span className="text-slate-500 font-medium text-[11px]">Next: 06. Fast Square Roots</span>
                    </div>
                  </div>
                </div>

                {/* Footer with fee receipt & Continue Button */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      generateFeeReceiptPdf({
                        receiptNo: "REC-MM05-8492",
                        date: "14 Jul 2026",
                        studentName: "Tanvi Deshpande",
                        studentPhone: "+91 98221 00001",
                        district: "Pune",
                        courseCode: "MM-05",
                        courseTitle: "High-Scoring Mathematics & Vedic Maths",
                        amountPaise: 79900,
                        paymentId: "pay_rzp_live_849201",
                        accessMonths: 3,
                        expiryDate: "14 Oct 2026",
                      })
                    }
                    className="text-[11px] font-bold text-[#0B57D0] hover:text-[#0842A0] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download Fee Receipt (पावती)</span>
                  </button>

                  <Link
                    href="/watch/les-mm05-01"
                    className="touch-target-44 min-h-[44px] px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: MM-01 Speed Reading with Peach Expiry Chip */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between active:scale-[0.99]">
              {/* Mint Header */}
              <div className="p-5 bg-emerald-50/70 border-b border-emerald-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                    MM-01
                  </span>

                  {/* PEACH EXPIRY CHIP */}
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Expires in 89 days</span>
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 mt-1">
                  <div className="w-8 h-8 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                    <Brain className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 block leading-none">
                      COGNITIVE MEMORY
                    </span>
                    <span className="text-xs font-bold text-slate-900 leading-none mt-0.5 block">
                      Subvocalization Reduction
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body & Progress */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-5">
                <div className="flex flex-col gap-3">
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                    Speed Reading & Active Brain Mapping
                  </h3>

                  {/* Progress Bar with Milestone Pin */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Completed: 5 / 8 Lessons</span>
                      <span className="font-extrabold text-emerald-700">62%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[62%]" />
                    </div>
                  </div>

                  {/* Next Lesson Preview Pill */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-900 truncate">
                        Up Next: Lesson 6 — Mind Palace Anchoring
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 shrink-0 font-medium">18 mins</span>
                  </div>
                </div>

                {/* Footer with Fee Receipt & Continue Button */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      generateFeeReceiptPdf({
                        receiptNo: "REC-MM01-8493",
                        date: "10 Aug 2026",
                        studentName: "Tanvi Deshpande",
                        studentPhone: "+91 98221 00001",
                        district: "Pune",
                        courseCode: "MM-01",
                        courseTitle: "Speed Reading & Active Brain Mapping",
                        amountPaise: 99900,
                        paymentId: "pay_rzp_live_849202",
                        accessMonths: 3,
                        expiryDate: "10 Nov 2026",
                      })
                    }
                    className="text-[11px] font-bold text-[#0B57D0] hover:text-[#0842A0] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download Fee Receipt (पावती)</span>
                  </button>

                  <Link
                    href="/watch/les-mm01-01"
                    className="touch-target-44 min-h-[44px] px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
                <span>Certificate (प्रमाणपत्र)</span>
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

        {/* 3. BOTTOM CENTRE NOTICE */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <p className="text-xs font-normal text-slate-900">
              <strong className="font-bold text-slate-900">Narhe Centre Desk Notice:</strong> Offline proctored test series available this Saturday in Room 302.
            </p>
          </div>

          <a
            href="tel:+919922000000"
            className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition inline-flex items-center gap-1.5 self-end sm:self-auto shrink-0"
          >
            <span>📞</span>
            <span>Helpline Desk</span>
          </a>
        </div>
      </div>
    </AppShell>
  );
}
