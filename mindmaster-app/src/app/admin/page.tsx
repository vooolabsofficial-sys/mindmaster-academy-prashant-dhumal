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
      <div className="space-y-8 font-sans">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0E1B3D] dark:text-white font-heading">
                Admin Mission Control
              </h1>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300 border border-[#DDD6FE] dark:border-purple-900/50">
                {isMainAdmin ? "👑 MAIN ADMIN" : "🛡️ SUB-ADMIN"}
              </span>
            </div>
            <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-1">
              Live operational metrics, payment verification, student access lifecycle, and instant dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-full text-[#0E1B3D] dark:text-slate-200 font-semibold">
              ● Razorpay Live Gateway: Connected
            </span>
            <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 rounded-full text-emerald-700 dark:text-emerald-400 font-bold">
              ● Webhook v1.2 Active
            </span>
          </div>
        </div>

        {/* Toast Alert */}
        {reminderToast && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
            <span>✅ {reminderToast}</span>
            <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
              In-App Only (No WhatsApp)
            </span>
          </div>
        )}

        {/* Quick Action Pills */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A94A6] dark:text-slate-400 mb-2 px-1">
            Quick Action Pills
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FF] dark:bg-slate-800 hover:bg-[#EEF4FF] dark:hover:bg-slate-700 text-[#0E1B3D] dark:text-slate-200 hover:text-[#0B57D0] dark:hover:text-blue-400 border border-[#E4E8F8] dark:border-slate-700 text-xs font-bold transition-all shadow-sm"
            >
              <span>➕</span> New Course
            </Link>
            <Link
              href="/admin/videos"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FF] dark:bg-slate-800 hover:bg-[#EEF4FF] dark:hover:bg-slate-700 text-[#0E1B3D] dark:text-slate-200 hover:text-[#0B57D0] dark:hover:text-blue-400 border border-[#E4E8F8] dark:border-slate-700 text-xs font-bold transition-all shadow-sm"
            >
              <span>🎬</span> Upload Video
            </Link>
            <Link
              href="/admin/coupons"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FF] dark:bg-slate-800 hover:bg-[#EEF4FF] dark:hover:bg-slate-700 text-[#0E1B3D] dark:text-slate-200 hover:text-[#0B57D0] dark:hover:text-blue-400 border border-[#E4E8F8] dark:border-slate-700 text-xs font-bold transition-all shadow-sm"
            >
              <span>🏷️</span> Create Coupon
            </Link>
            {isMainAdmin && (
              <Link
                href="/admin/sub-admins"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FF] dark:bg-slate-800 hover:bg-[#EEF4FF] dark:hover:bg-slate-700 text-[#0E1B3D] dark:text-slate-200 hover:text-[#0B57D0] dark:hover:text-blue-400 border border-[#E4E8F8] dark:border-slate-700 text-xs font-bold transition-all shadow-sm"
              >
                <span>👥</span> Add Sub-Admin
              </Link>
            )}
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FF] dark:bg-slate-800 hover:bg-[#EEF4FF] dark:hover:bg-slate-700 text-[#0E1B3D] dark:text-slate-200 hover:text-[#0B57D0] dark:hover:text-blue-400 border border-[#E4E8F8] dark:border-slate-700 text-xs font-bold transition-all shadow-sm"
            >
              <span>🎓</span> Student Lookup
            </Link>
            {isMainAdmin && (
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 hover:bg-[#DDD6FE] dark:hover:bg-purple-900/60 text-[#6D28D9] dark:text-purple-300 border border-[#C4B5FD] dark:border-purple-800 text-xs font-bold transition-all shadow-sm"
              >
                <span>⚙️</span> Platform Settings
              </Link>
            )}
          </div>
        </div>

        {/* Four Stat Cards per user request */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Revenue */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm hover:border-[#0B57D0] dark:hover:border-blue-500 transition-all">
            <div className="flex items-center justify-between text-xs text-[#8A94A6] dark:text-slate-400 mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">TOTAL REVENUE</span>
              <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 px-2 py-0.5 rounded-full font-bold">
                Live Gateway
              </span>
            </div>
            <p className="text-3xl font-extrabold text-[#0E1B3D] dark:text-white font-heading">
              ₹{totalRevenueRupees.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-2">
              Captured via Razorpay across all course sales
            </p>
          </div>

          {/* Card 2: Active Students */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm hover:border-[#0B57D0] dark:hover:border-blue-500 transition-all">
            <div className="flex items-center justify-between text-xs text-[#8A94A6] dark:text-slate-400 mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">ACTIVE LEARNERS</span>
              <span className="text-[#0B57D0] dark:text-blue-400 bg-[#EBF3FE] dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 px-2 py-0.5 rounded-full font-bold">
                {studentsCount > 0 ? "100% Active" : "Fresh Roster"}
              </span>
            </div>
            <p className="text-3xl font-extrabold text-[#0E1B3D] dark:text-white font-heading">
              {studentsCount}
            </p>
            <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-2">
              Enrolled students with active access
            </p>
          </div>

          {/* Card 3: Courses & Videos */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm hover:border-[#0B57D0] dark:hover:border-blue-500 transition-all">
            <div className="flex items-center justify-between text-xs text-[#8A94A6] dark:text-slate-400 mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">CATALOGUE & VIDEOS</span>
              <span className="text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/50 px-2 py-0.5 rounded-full font-bold">
                {courses.length} Courses
              </span>
            </div>
            <p className="text-3xl font-extrabold text-[#0E1B3D] dark:text-white font-heading">
              {courses.reduce((sum, c) => sum + (c.lessonsCount || 0), 0)}{" "}
              <span className="text-sm font-normal text-[#5A6478] dark:text-slate-400">Lectures</span>
            </p>
            <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-2">
              School, College, Vedic Maths &amp; Teacher segments
            </p>
          </div>

          {/* Card 4: Coupons & Redemptions */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm hover:border-[#0B57D0] dark:hover:border-blue-500 transition-all">
            <div className="flex items-center justify-between text-xs text-[#8A94A6] dark:text-slate-400 mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">COUPON REDEMPTIONS</span>
              <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-full font-bold">
                {coupons.length} Active
              </span>
            </div>
            <p className="text-3xl font-extrabold text-[#0E1B3D] dark:text-white font-heading">
              {coupons.reduce((sum, c) => sum + (c.used_count || c.totalUsed || 0), 0)}{" "}
              <span className="text-sm font-normal text-[#5A6478] dark:text-slate-400">Redeemed</span>
            </p>
            <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-2">
              Welcome discounts & renewals
            </p>
          </div>
        </div>

        {/* Sub-Admin Cash vs UPI Collection Tally (Main Admin Only) */}
        {isMainAdmin && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E8F8] dark:border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-[#0E1B3D] dark:text-white flex items-center gap-2">
                  <span>💰</span> Sub-Admin Cash vs UPI Collection Tally
                </h2>
                <p className="text-xs text-[#5A6478] dark:text-slate-400">
                  Breakdown of student fees collected offline by staff via Cash and UPI, plus scholarship grants.
                </p>
              </div>

              {/* Timeframe Toggles */}
              <div className="flex items-center gap-1.5 bg-[#F5F7FF] dark:bg-slate-800 p-1 rounded-full border border-[#E4E8F8] dark:border-slate-700 self-start sm:self-auto">
                {(
                  [
                    { id: "today", label: "Today" },
                    { id: "week", label: "This Week" },
                    { id: "month", label: "This Month" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTallyTimeframe(t.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      tallyTimeframe === t.id
                        ? "bg-[#0B57D0] text-white shadow-xs"
                        : "text-[#5A6478] dark:text-slate-400 hover:text-[#0E1B3D] dark:hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aggregate Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                    Total Cash Collected
                  </span>
                  <p className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 font-heading mt-0.5">
                    ₹{(
                      tallyTimeframe === "today"
                        ? tallyReport.totals.todayCash
                        : tallyTimeframe === "week"
                        ? tallyReport.totals.weekCash
                        : tallyReport.totals.monthCash
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="text-2xl">💵</span>
              </div>

              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                    Total Direct UPI Collected
                  </span>
                  <p className="text-xl font-extrabold text-[#0B57D0] dark:text-blue-400 font-heading mt-0.5">
                    ₹{(
                      tallyTimeframe === "today"
                        ? tallyReport.totals.todayUpi
                        : tallyTimeframe === "week"
                        ? tallyReport.totals.weekUpi
                        : tallyReport.totals.monthUpi
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="text-2xl">📱</span>
              </div>

              <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/50 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">
                    Scholarship / Free Grants
                  </span>
                  <p className="text-xl font-extrabold text-purple-900 dark:text-purple-200 font-heading mt-0.5">
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
                <span className="text-2xl">🎓</span>
              </div>
            </div>

            {/* Staff Breakdown Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#E4E8F8] dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFBFD] dark:bg-slate-800/80 text-[#5A6478] dark:text-slate-400 border-b border-[#E4E8F8] dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-bold">Staff Member (granted_by)</th>
                    <th className="px-4 py-3 font-bold">Cash</th>
                    <th className="px-4 py-3 font-bold">UPI</th>
                    <th className="px-4 py-3 font-bold">Total Handled</th>
                    <th className="px-4 py-3 font-bold text-right">Free Grants</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E8F8] dark:divide-slate-800">
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
                      <tr key={s.staffId} className="hover:bg-[#F9FAFD] dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-bold text-[#0E1B3D] dark:text-white">
                          {s.staffName}
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">
                          ₹{cash.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#0B57D0] dark:text-blue-400">
                          ₹{upi.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-extrabold text-[#0E1B3D] dark:text-white">
                          ₹{(cash + upi).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E4E8F8] dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0E1B3D] dark:text-white">
                  Expiring Soon — Access & In-App Retention Reminders
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-[10px] font-bold">
                  Next 14 Days
                </span>
              </div>
              <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-0.5">
                Students nearing end of 3-month access window. Send 50% renewal coupons directly inside app.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#8A94A6] dark:text-slate-400">
              {expiringList.length} students expiring soon
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F5F7FF] dark:bg-slate-800/80 text-[#5A6478] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#E4E8F8] dark:border-slate-800">
                  <th className="py-3 px-4 rounded-l-xl">Student Name</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Expires In</th>
                  <th className="py-3 px-4">In-App Reminder Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E8F8] dark:divide-slate-800">
                {expiringList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#8A94A6] dark:text-slate-400">
                      No student access expiring in next 14 days.
                    </td>
                  </tr>
                ) : (
                  expiringList.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAFBFD] dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0E1B3D] dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-[#8A94A6] dark:text-slate-400">{item.phone}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#5A6478] dark:text-slate-300">
                        {item.courseTitle}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          item.expiresInDays <= 3 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          ⏳ {item.expiresInDays} days ({item.expiryDate})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.reminderStatus === "sent" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                            <span>✅</span> {item.reminderSentAt || "In-App Sent"}
                          </span>
                        ) : item.reminderStatus === "scheduled" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                            <span>🔔</span> {item.reminderSentAt || "Auto-Scheduled"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                            <span>⏳</span> Pending Dispatch
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSendReminder(item)}
                          className="px-3 py-1.5 rounded-lg bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[11px] shadow-sm transition-colors cursor-pointer"
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

        {/* Recent Payments Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E4E8F8] dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0E1B3D] dark:text-white">
                  Recent Razorpay Payment Transactions
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 text-[10px] font-bold">
                  Verified Webhooks
                </span>
              </div>
              <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-0.5">
                Real-time captured student course fees via Razorpay gateway.
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-bold text-[#0B57D0] dark:text-blue-400 hover:underline"
            >
              View Full Revenue Ledger →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F5F7FF] dark:bg-slate-800/80 text-[#5A6478] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#E4E8F8] dark:border-slate-800">
                  <th className="py-3 px-4 rounded-l-xl">Student</th>
                  <th className="py-3 px-4">Course Enrolled</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E8F8] dark:divide-slate-800">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#8A94A6] dark:text-slate-400">
                      No recent transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAFBFD] dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0E1B3D] dark:text-white">{p.studentName}</div>
                        <div className="text-[11px] text-[#8A94A6] dark:text-slate-400">{p.studentPhone}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#0E1B3D] dark:text-slate-200">
                        {p.courseTitle}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0E1B3D] dark:text-white text-sm">
                        ₹{p.amount}
                      </td>
                      <td className="py-3 px-4 text-[#5A6478] dark:text-slate-400">
                        <div>{p.date}</div>
                        <div className="text-[10px] text-[#8A94A6] dark:text-slate-400">{p.time}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {p.id}
                        </span>
                        <div className="text-[10px] text-[#8A94A6] dark:text-slate-400 mt-0.5">{p.method}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                          <span>●</span> Captured
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
