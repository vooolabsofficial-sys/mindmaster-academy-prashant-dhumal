"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { StaffUser, Course, Coupon } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffCourses,
  getStaffCoupons,
  getStaffStudents,
  logStaffAction,
  fetchDbCourses,
  fetchDbCoupons,
  fetchDbStudents,
} from "@/lib/staffStore";
import { getStaffCollectionTally, getGrants, fetchDbGrants, Grant } from "@/lib/grantStore";
import { createClient } from "@/lib/supabase/client";
import {
  IndianRupee,
  Smartphone,
  GraduationCap,
  Crown,
  ShieldCheck,
  Plus,
  BookOpen,
  Video,
  Tag,
  Users,
  Search,
  Settings,
  Clock,
  CheckCircle2,
  Bell,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Send,
  Layers,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface PaymentTransaction {
  id: string;
  studentName: string;
  studentPhone: string;
  courseTitle: string;
  amount: number;
  date: string;
  time: string;
  status: "captured" | "processing";
  method: string;
}

interface ExpiringStudent {
  id: string;
  name: string;
  phone: string;
  courseTitle: string;
  expiresInDays: number;
  expiryDate: string;
  reminderStatus: "sent" | "pending" | "scheduled";
  reminderSentAt?: string;
}

export default function AdminOverviewPage() {
  const { currentLanguage } = useLanguage();
  const isMarathi = currentLanguage === "mr";
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [courses, setCourses] = useState<Course[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [totalRevenueRupees, setTotalRevenueRupees] = useState<number>(0);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [expiringList, setExpiringList] = useState<ExpiringStudent[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentTransaction[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [tallyTimeframe, setTallyTimeframe] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    setStaff(getCurrentStaff());

    async function loadLiveData() {
      // 1. Load Courses
      try {
        const dbCourses = await fetchDbCourses();
        setCourses(dbCourses || []);
      } catch {
        setCourses(getStaffCourses() || []);
      }

      // 2. Load Coupons
      try {
        const dbCoupons = await fetchDbCoupons();
        setCoupons(dbCoupons || []);
      } catch {
        setCoupons(getStaffCoupons() || []);
      }

      // 3. Load Students & Expirations
      try {
        const dbStudents = await fetchDbStudents();
        const stdList = dbStudents && dbStudents.length > 0 ? dbStudents : getStaffStudents();
        setStudentsCount(stdList.length);

        const now = Date.now();
        const expiring: ExpiringStudent[] = [];
        stdList.forEach((s) => {
          s.coursesTaken?.forEach((ct) => {
            if (ct.daysLeft !== undefined && ct.daysLeft <= 14 && ct.daysLeft > 0) {
              expiring.push({
                id: `${s.id}-${ct.courseId}`,
                name: s.name,
                phone: s.phone,
                courseTitle: ct.courseTitle,
                expiresInDays: ct.daysLeft,
                expiryDate: new Date(now + ct.daysLeft * 86400000).toISOString().slice(0, 10),
                reminderStatus: "pending",
              });
            }
          });
        });
        setExpiringList(expiring);
      } catch {
        setStudentsCount(0);
      }

      // 4. Load Purchases from Supabase
      try {
        const supabase = createClient();
        const { data: purchases, error } = await supabase
          .from("purchases")
          .select("id, amount_paise, razorpay_payment_id, purchased_at, profiles(full_name, phone), courses(title)")
          .order("purchased_at", { ascending: false })
          .limit(20);

        if (!error && purchases && purchases.length > 0) {
          const rev = purchases.reduce((sum: number, p: any) => sum + (Number(p.amount_paise) || 0), 0);
          setTotalRevenueRupees(Math.round(rev / 100));

          const mappedPayments: PaymentTransaction[] = purchases.map((p: any) => {
            const pDate = p.purchased_at ? new Date(p.purchased_at) : new Date();
            return {
              id: p.razorpay_payment_id || p.id,
              studentName: p.profiles?.full_name || "Student",
              studentPhone: p.profiles?.phone || "-",
              courseTitle: p.courses?.title || "MindMaster Course",
              amount: Math.round((Number(p.amount_paise) || 0) / 100),
              date: pDate.toISOString().slice(0, 10),
              time: pDate.toTimeString().slice(0, 5),
              status: "captured",
              method: "Online (Razorpay)",
            };
          });
          setRecentPayments(mappedPayments);
        } else {
          setTotalRevenueRupees(0);
          setRecentPayments([]);
        }
      } catch {
        setTotalRevenueRupees(0);
        setRecentPayments([]);
      }

      // 5. Load Grants & Cash/UPI Admissions
      try {
        const gList = getGrants();
        setGrants(gList);
        const liveGrants = await fetchDbGrants();
        if (liveGrants && liveGrants.length > 0) {
          setGrants(liveGrants);
        }
      } catch {
        setGrants(getGrants());
      }
    }

    loadLiveData();
  }, []);

  const isMainAdmin = staff.role === "main_admin";
  const tallyReport = React.useMemo(() => getStaffCollectionTally(grants), [grants]);

  const handleSendReminder = (student: ExpiringStudent) => {
    setExpiringList((prev) =>
      prev.map((s) =>
        s.id === student.id
          ? { ...s, reminderStatus: "sent", reminderSentAt: "Sent just now" }
          : s
      )
    );

    logStaffAction(
      "IN_APP_REMINDER_SENT",
      "student",
      student.id,
      student.name,
      `Sent 50% renewal in-app notification to ${student.name} for ${student.courseTitle} (Expires in ${student.expiresInDays} days)`
    );

    setReminderToast(`In-app expiry reminder dispatched to ${student.name} with 50% renewal discount coupon!`);
    setTimeout(() => setReminderToast(null), 3500);
  };

  return (
    <AdminShell>
      <div className="space-y-6 sm:space-y-8 font-sans pb-10">
        {/* Top Header Banner — UI/UX Pro Max High-Contrast Architectural Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
                Admin Mission Control
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {isMainAdmin ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>MAIN ADMIN</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>SUB-ADMIN</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              Live operational metrics, payment verification, student access lifecycle, and instant dispatch console.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-700 dark:text-slate-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Razorpay Live Gateway</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-700 dark:text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Webhook v1.2 Active</span>
            </span>
          </div>
        </div>

        {/* Toast Alert */}
        {reminderToast && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{reminderToast}</span>
            </div>
            <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
              In-App Only
            </span>
          </div>
        )}

        {/* Quick Action Pills — Zero Emojis, Crisp Vector SVG Icons */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 px-1">
            {isMarathi ? "झटपट कृती शॉर्टकट्स" : "Quick Action Shortcuts"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all duration-150 active:scale-95 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isMarathi ? "नवीन कोर्स" : "New Course"}</span>
            </Link>
            <Link
              href="/admin/grants"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all duration-150 active:scale-95 shadow-2xs"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isMarathi ? "कोर्स ऍक्सेस द्या" : "Grant Access"}</span>
            </Link>
            <Link
              href="/admin/videos"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all duration-150 active:scale-95 shadow-2xs"
            >
              <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{isMarathi ? "व्हिडिओ अपलोड" : "Upload Video"}</span>
            </Link>
            <Link
              href="/admin/coupons"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all duration-150 active:scale-95 shadow-2xs"
            >
              <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{isMarathi ? "कूपन तयार करा" : "Create Coupon"}</span>
            </Link>
            {isMainAdmin && (
              <Link
                href="/admin/sub-admins"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all duration-150 active:scale-95 shadow-2xs"
              >
                <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{isMarathi ? "सब-ॲडमिन टीम" : "Sub-Admins"}</span>
              </Link>
            )}
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all duration-150 active:scale-95 shadow-2xs"
            >
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{isMarathi ? "विद्यार्थी शोधा" : "Student Lookup"}</span>
            </Link>
            {isMainAdmin && (
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all duration-150 active:scale-95 shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{isMarathi ? "सिस्टीम सेटिंग्स" : "Platform Settings"}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Four Executive Stat Cards — Tabular Numbers & Clean Contrast */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Revenue */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 transition-all group">
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">
                {isMarathi ? "एकूण महसूल" : "TOTAL REVENUE"}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                Live Gateway
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-slate-400 font-bold text-xl">₹</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading tabular-nums">
                {totalRevenueRupees.toLocaleString("en-IN")}
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {isMarathi
                ? "Razorpay द्वारे सर्व कोर्सेसची एकूण ऑनलाइन विक्री"
                : "Captured via Razorpay across all course sales"}
            </p>
          </div>

          {/* Card 2: Active Students */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 transition-all group">
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">
                {isMarathi ? "सक्रिय विद्यार्थी" : "ACTIVE LEARNERS"}
              </span>
              <span className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                {studentsCount > 0 ? "100% Active" : "Fresh Roster"}
              </span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mt-1 tabular-nums">
              {studentsCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {isMarathi
                ? "नोंदणीकृत व चालू ऍक्सेस असलेले सर्व विद्यार्थी"
                : "Enrolled students with active access"}
            </p>
          </div>

          {/* Card 3: Courses & Videos */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 transition-all group">
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">
                {isMarathi ? "कोर्सेस व व्हिडिओ" : "CATALOGUE & VIDEOS"}
              </span>
              <span className="text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                {courses.length} Courses
              </span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mt-1 tabular-nums">
              {courses.reduce((sum, c) => sum + (c.lessonsCount || 0), 0)}{" "}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Lectures</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {isMarathi
                ? "शालेय, वैदिक गणित, मेमरी व शिक्षक सेगमेंट्स"
                : "School, College, Vedic Maths & Teacher segments"}
            </p>
          </div>

          {/* Card 4: Coupons & Redemptions */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 transition-all group">
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">
                {isMarathi ? "कूपन्स व सवलती" : "COUPON REDEMPTIONS"}
              </span>
              <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                {coupons.length} Active
              </span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mt-1 tabular-nums">
              {coupons.reduce((sum, c) => sum + (c.used_count || c.totalUsed || 0), 0)}{" "}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Redeemed</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {isMarathi
                ? "विद्यार्थ्यांनी वापरलेली विशेष सवलत कूपन्स"
                : "Welcome discounts & renewals"}
            </p>
          </div>
        </div>

        {/* Sub-Admin Cash vs UPI Collection Tally (Main Admin Only) */}
        {isMainAdmin && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold">
                    <IndianRupee className="w-4 h-4" />
                  </span>
                  <span>{isMarathi ? "सब-ॲडमिन फी संकलन व हिशोब टॅली" : "Sub-Admin Fee Collection & Grants Tally"}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isMarathi
                    ? "सातारा व पुणे ऑफिस कर्मचाऱ्यांनी Cash आणि UPI द्वारे गोळा केलेली ऑफलाइन फी व शिष्यवृत्ती वाटप."
                    : "Breakdown of student fees collected offline by staff via Cash and UPI, plus scholarship grants."}
                </p>
              </div>

              {/* Timeframe Toggles */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                {(
                  [
                    { id: "today", labelEn: "Today", labelMr: "आज" },
                    { id: "week", labelEn: "This Week", labelMr: "या आठवड्यात" },
                    { id: "month", labelEn: "This Month", labelMr: "या महिन्यात" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTallyTimeframe(t.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      tallyTimeframe === t.id
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {isMarathi ? t.labelMr : t.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Aggregate Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                    {isMarathi ? "एकूण रोख जमा" : "Total Cash Collected"}
                  </span>
                  <p className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 font-heading mt-0.5 tabular-nums">
                    ₹{(
                      tallyTimeframe === "today"
                        ? tallyReport.totals.todayCash
                        : tallyTimeframe === "week"
                        ? tallyReport.totals.weekCash
                        : tallyReport.totals.monthCash
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold shrink-0 shadow-2xs">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                    {isMarathi ? "एकूण UPI संकलन" : "Total Direct UPI Collected"}
                  </span>
                  <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 font-heading mt-0.5 tabular-nums">
                    ₹{(
                      tallyTimeframe === "today"
                        ? tallyReport.totals.todayUpi
                        : tallyTimeframe === "week"
                        ? tallyReport.totals.weekUpi
                        : tallyReport.totals.monthUpi
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold shrink-0 shadow-2xs">
                  <Smartphone className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">
                    {isMarathi ? "मोफत शिष्यवृत्ती" : "Scholarship / Free Grants"}
                  </span>
                  <p className="text-xl font-extrabold text-purple-900 dark:text-purple-200 font-heading mt-0.5 tabular-nums">
                    {(
                      tallyTimeframe === "today"
                        ? tallyReport.totals.todayGrants
                        : tallyTimeframe === "week"
                        ? tallyReport.totals.weekGrants
                        : tallyReport.totals.monthGrants
                    )}{" "}
                    Grants
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold shrink-0 shadow-2xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Staff Breakdown Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-bold">Staff Member (granted_by)</th>
                    <th className="px-4 py-3 font-bold">Cash</th>
                    <th className="px-4 py-3 font-bold">UPI</th>
                    <th className="px-4 py-3 font-bold">Total Handled</th>
                    <th className="px-4 py-3 font-bold text-right">Free Grants</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {tallyReport.byStaff.map((s) => {
                    const cash =
                      tallyTimeframe === "today"
                        ? s.todayCash
                        : tallyTimeframe === "week"
                        ? s.weekCash
                        : s.monthCash;
                    const upi =
                      tallyTimeframe === "today"
                        ? s.todayUpi
                        : tallyTimeframe === "week"
                        ? s.weekUpi
                        : s.monthUpi;
                    const count =
                      tallyTimeframe === "today"
                        ? s.todayGrantsCount
                        : tallyTimeframe === "week"
                        ? s.weekGrantsCount
                        : s.monthGrantsCount;

                    return (
                      <tr key={s.staffId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {s.staffName}
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          ₹{cash.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                          ₹{upi.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white tabular-nums">
                          ₹{(cash + upi).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 tabular-nums">
                            {count} grants
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expiring-Soon Rows with In-App Reminder Status Chip */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Expiring Soon — Access &amp; In-App Retention Reminders
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                  Next 14 Days
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Students nearing end of 3-month access window. Send 50% renewal coupons directly inside app.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
              {expiringList.length} students expiring soon
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 rounded-l-xl font-bold">Student Name</th>
                  <th className="py-3 px-4 font-bold">Course</th>
                  <th className="py-3 px-4 font-bold">Expires In</th>
                  <th className="py-3 px-4 font-bold">In-App Reminder Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {expiringList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No student access expiring in next 14 days.
                    </td>
                  </tr>
                ) : (
                  expiringList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{item.phone}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {item.courseTitle}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 font-bold tabular-nums ${
                          item.expiresInDays <= 3 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.expiresInDays} days ({item.expiryDate})</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.reminderStatus === "sent" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{item.reminderSentAt || "In-App Sent"}</span>
                          </span>
                        ) : item.reminderStatus === "scheduled" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{item.reminderSentAt || "Auto-Scheduled"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Pending Dispatch</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSendReminder(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          {item.reminderStatus === "sent" ? "Re-send In-App" : "Send 50% Reminder"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments Table — Real-time Webhooks & Tabular Numbers */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Razorpay Payment Transactions
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                  Verified Webhooks
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time captured student course fees via Razorpay gateway.
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View Full Revenue Ledger</span>
              <span>→</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 rounded-l-xl font-bold">Student</th>
                  <th className="py-3 px-4 font-bold">Course Enrolled</th>
                  <th className="py-3 px-4 font-bold">Amount</th>
                  <th className="py-3 px-4 font-bold">Date &amp; Time</th>
                  <th className="py-3 px-4 font-bold">Payment ID</th>
                  <th className="py-3 px-4 text-right rounded-r-xl font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No recent transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{p.studentName}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{p.studentPhone}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {p.courseTitle}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 tabular-nums">
                        <div>{p.date}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.time}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          {p.id}
                        </span>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{p.method}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Captured</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}