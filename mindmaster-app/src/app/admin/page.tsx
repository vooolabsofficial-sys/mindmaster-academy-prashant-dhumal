"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { StaffUser, AuditLogEntry, Course, Coupon } from "@/lib/types";
import {
  getCurrentStaff,
  getAuditLogs,
  getStaffCourses,
  getStaffCoupons,
  getStaffUsers,
  getStaffStudents,
  logStaffAction,
} from "@/lib/staffStore";

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
  const [studentsCount, setStudentsCount] = useState<number>(1420);
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  // Expiring Soon mock list
  const [expiringList, setExpiringList] = useState<ExpiringStudent[]>([
    {
      id: "exp-1",
      name: "Rahul Shinde",
      phone: "+91 98231 44556",
      courseTitle: "Vedic Maths Speed Foundation",
      expiresInDays: 3,
      expiryDate: "2026-09-13",
      reminderStatus: "sent",
      reminderSentAt: "Sent 2 hrs ago",
    },
    {
      id: "exp-2",
      name: "Snehal Kulkarni",
      phone: "+91 94220 77889",
      courseTitle: "Police Bharti Mental Ability Test",
      expiresInDays: 5,
      expiryDate: "2026-09-15",
      reminderStatus: "pending",
    },
    {
      id: "exp-3",
      name: "Amit Deshmukh",
      phone: "+91 97654 11223",
      courseTitle: "Memory Masterclass 10X Recall",
      expiresInDays: 8,
      expiryDate: "2026-09-18",
      reminderStatus: "scheduled",
      reminderSentAt: "Scheduled Tomorrow",
    },
    {
      id: "exp-4",
      name: "Pooja Chavan",
      phone: "+91 98812 99001",
      courseTitle: "School Exam Fast Calculations",
      expiresInDays: 11,
      expiryDate: "2026-09-21",
      reminderStatus: "pending",
    },
  ]);

  // Recent Payments mock transactions
  const recentPayments: PaymentTransaction[] = [
    {
      id: "pay_MM98412093",
      studentName: "Aditi Ramesh Patil",
      studentPhone: "+91 98224 88771",
      courseTitle: "Vedic Maths Speed Foundation",
      amount: 999,
      date: "2026-09-10",
      time: "17:42",
      status: "captured",
      method: "UPI (GooglePay)",
    },
    {
      id: "pay_MM98410948",
      studentName: "Mahesh Jadhav",
      studentPhone: "+91 94230 11992",
      courseTitle: "Police Bharti Special Maths",
      amount: 1499,
      date: "2026-09-10",
      time: "15:20",
      status: "captured",
      method: "Card (Razorpay)",
    },
    {
      id: "pay_MM98408112",
      studentName: "Tanvi Gaikwad",
      studentPhone: "+91 91580 33445",
      courseTitle: "Memory Techniques Masterclass",
      amount: 1999,
      date: "2026-09-10",
      time: "12:05",
      status: "captured",
      method: "UPI (PhonePe)",
    },
    {
      id: "pay_MM98403918",
      studentName: "Vikram Bhosale",
      studentPhone: "+91 99210 55667",
      courseTitle: "Calendar Tricks & Reasoning",
      amount: 799,
      date: "2026-09-09",
      time: "19:15",
      status: "captured",
      method: "NetBanking",
    },
  ];

  useEffect(() => {
    setStaff(getCurrentStaff());
    setCourses(getStaffCourses());
    setCoupons(getStaffCoupons());
    const students = getStaffStudents();
    if (students.length > 0) {
      setStudentsCount(students.length);
    }
  }, []);

  const isMainAdmin = staff.role === "main_admin";

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0E1B3D] font-heading">
                Admin Mission Control
              </h1>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]">
                {isMainAdmin ? "👑 MAIN ADMIN" : "🛡️ SUB-ADMIN"}
              </span>
            </div>
            <p className="text-xs text-[#5A6478] mt-1">
              Live operational metrics, payment verification, student access lifecycle, and instant dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-full text-[#0E1B3D] font-semibold">
              ● Razorpay Live Gateway: Connected
            </span>
            <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 font-bold">
              ● Webhook v1.2 Active
            </span>
          </div>
        </div>

        {/* Toast Alert */}
        {reminderToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
            <span>✅ {reminderToast}</span>
            <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded-full">
              In-App Only (No WhatsApp)
            </span>
          </div>
        )}

        {/* Quick Action Pills */}
        <div className="bg-white p-4 rounded-2xl border border-[#E4E8F8] shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A94A6] mb-2 px-1">
            Quick Action Pills
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0E1B3D] hover:text-[#0B57D0] border border-[#E4E8F8] text-xs font-bold transition-all shadow-sm"
            >
              <span>➕</span> New Course
            </Link>
            <Link
              href="/admin/videos"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0E1B3D] hover:text-[#0B57D0] border border-[#E4E8F8] text-xs font-bold transition-all shadow-sm"
            >
              <span>🎬</span> Upload Video
            </Link>
            <Link
              href="/admin/coupons"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0E1B3D] hover:text-[#0B57D0] border border-[#E4E8F8] text-xs font-bold transition-all shadow-sm"
            >
              <span>🏷️</span> Create Coupon
            </Link>
            {isMainAdmin && (
              <Link
                href="/admin/sub-admins"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0E1B3D] hover:text-[#0B57D0] border border-[#E4E8F8] text-xs font-bold transition-all shadow-sm"
              >
                <span>👥</span> Add Sub-Admin
              </Link>
            )}
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0E1B3D] hover:text-[#0B57D0] border border-[#E4E8F8] text-xs font-bold transition-all shadow-sm"
            >
              <span>🎓</span> Student Lookup
            </Link>
            {isMainAdmin && (
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#6D28D9] border border-[#C4B5FD] text-xs font-bold transition-all shadow-sm"
              >
                <span>⚙️</span> Platform Settings
              </Link>
            )}
          </div>
        </div>

        {/* Four Stat Cards per user request */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Revenue */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm hover:border-[#0B57D0] transition-all">
            <div className="flex items-center justify-between text-xs text-[#8A94A6] mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">TOTAL REVENUE</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                +18.4% MoM
              </span>
            </div>
            <p className="text-3xl font-extrabold text-[#0E1B3D] font-heading">
              ₹8,92,400
            </p>
            <p className="text-xs text-[#5A6478] mt-2">
              Captured via Razorpay across all course sales
            </p>
          </div>

          {/* Card 2: Active Students */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm hover:border-[#0B57D0] transition-all">
            <div className="flex items-center justify-between text-xs text-[#8A94A6] mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">ACTIVE LEARNERS</span>
              <span className="text-[#0B57D0] bg-[#EBF3FE] px-2 py-0.5 rounded-full font-bold">
                94% Active
              </span>
            </div>
            <p className="text-3xl font-extrabold text-[#0E1B3D] font-heading">
              {studentsCount}
            </p>
            <p className="text-xs text-[#5A6478] mt-2">
              Enrolled students with active 3-month access
            </p>
          </div>

          {/* Card 3: Courses & Videos */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm hover:border-[#0B57D0] transition-all">
            <div className="flex items-center justify-between text-xs text-[#8A94A6] mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">CATALOGUE & VIDEOS</span>
              <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                {courses.length} Courses
              </span>
            </div>
            <p className="text-3xl font-extrabold text-[#0E1B3D] font-heading">
              184 <span className="text-sm font-normal text-[#5A6478]">Lectures</span>
            </p>
            <p className="text-xs text-[#5A6478] mt-2">
              School, Police, Maths & General segments
            </p>
          </div>

          {/* Card 4: Coupons & Redemptions */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm hover:border-[#0B57D0] transition-all">
            <div className="flex items-center justify-between text-xs text-[#8A94A6] mb-2 font-medium">
              <span className="font-extrabold uppercase tracking-wide">COUPON REDEMPTIONS</span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                {coupons.length} Active
              </span>
            </div>
            <p className="text-3xl font-extrabold text-[#0E1B3D] font-heading">
              340 <span className="text-sm font-normal text-[#5A6478]">Redeemed</span>
            </p>
            <p className="text-xs text-[#5A6478] mt-2">
              Welcome discounts & 50% renewals
            </p>
          </div>
        </div>

        {/* Expiring-Soon Rows with In-App Reminder Status Chip */}
        <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E4E8F8]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0E1B3D]">
                  Expiring Access & In-App Retention Reminders
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">
                  Next 14 Days
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-0.5">
                Students nearing end of 3-month access window. Send 50% renewal coupons directly inside app.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#8A94A6]">
              {expiringList.length} students expiring soon
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F5F7FF] text-[#5A6478] uppercase text-[10px] tracking-wider border-b border-[#E4E8F8]">
                  <th className="py-3 px-4 rounded-l-xl">Student Name</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Expires In</th>
                  <th className="py-3 px-4">In-App Reminder Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E8F8]">
                {expiringList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAFBFD] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0E1B3D]">{item.name}</div>
                      <div className="text-[11px] text-[#8A94A6]">{item.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#5A6478]">
                      {item.courseTitle}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        item.expiresInDays <= 3 ? "text-red-600" : "text-amber-600"
                      }`}>
                        ⏳ {item.expiresInDays} days ({item.expiryDate})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.reminderStatus === "sent" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span>✅</span> {item.reminderSentAt || "In-App Sent"}
                        </span>
                      ) : item.reminderStatus === "scheduled" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <span>🔔</span> {item.reminderSentAt || "Auto-Scheduled"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span>⏳</span> Pending Dispatch
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSendReminder(item)}
                        className="px-3 py-1.5 rounded-lg bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[11px] shadow-sm transition-colors"
                      >
                        {item.reminderStatus === "sent" ? "Re-send In-App" : "Send 50% Reminder"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments Table */}
        <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E4E8F8]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0E1B3D]">
                  Recent Razorpay Payment Transactions
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  Verified Webhooks
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-0.5">
                Real-time captured student course fees via Razorpay gateway.
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-bold text-[#0B57D0] hover:underline"
            >
              View Full Revenue Ledger →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F5F7FF] text-[#5A6478] uppercase text-[10px] tracking-wider border-b border-[#E4E8F8]">
                  <th className="py-3 px-4 rounded-l-xl">Student</th>
                  <th className="py-3 px-4">Course Enrolled</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E8F8]">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAFBFD] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0E1B3D]">{p.studentName}</div>
                      <div className="text-[11px] text-[#8A94A6]">{p.studentPhone}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#0E1B3D]">
                      {p.courseTitle}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#0E1B3D] text-sm">
                      ₹{p.amount}
                    </td>
                    <td className="py-3 px-4 text-[#5A6478]">
                      <div>{p.date}</div>
                      <div className="text-[10px] text-[#8A94A6]">{p.time}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {p.id}
                      </span>
                      <div className="text-[10px] text-[#8A94A6] mt-0.5">{p.method}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span>●</span> Captured
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
