"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentStaff } from "@/lib/staffStore";
import { getSubAdminCashSettlements, SubAdminCashSummary } from "@/lib/grantStore";
import { StaffUser, StaffPermission, hasStaffPermission } from "@/lib/types";
import {
  User,
  Shield,
  KeyRound,
  Coins,
  CheckCircle2,
  XCircle,
  Lock,
  RefreshCw,
  LogOut,
  MapPin,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building,
} from "lucide-react";
import Link from "next/link";

export default function SubAdminSettingsPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [cashSummary, setCashSummary] = useState<SubAdminCashSummary | null>(null);

  // Change Password Form State
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    const s = getCurrentStaff();
    setStaff(s);

    const summaries = getSubAdminCashSettlements();
    const mySummary = summaries.find(
      (item) =>
        item.staffId === s.id ||
        (s.staffId && item.staffId === s.staffId) ||
        item.staffName?.toLowerCase() === s.name?.toLowerCase()
    );
    setCashSummary(
      mySummary || {
        staffId: s.staffId || s.id,
        staffName: s.name,
        totalCashCollected: 0,
        unsettledCash: 0,
        settledCash: 0,
        unsettledGrantsCount: 0,
        totalGrantsCount: 0,
      }
    );

    const handleStaffChange = () => {
      const refreshed = getCurrentStaff();
      setStaff(refreshed);
    };

    window.addEventListener("mma_staff_changed", handleStaffChange);
    return () => {
      window.removeEventListener("mma_staff_changed", handleStaffChange);
    };
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (!tempPassword) {
      setPwError("Current / Temporary password is required.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New password and confirm password do not match.");
      return;
    }

    try {
      setIsChangingPw(true);
      const res = await fetch("/api/staff/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: staff.id || staff.staffId,
          temp_password: tempPassword,
          new_password: newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update password.");
      }

      setPwSuccess(true);
      setTempPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 5000);
    } catch (err: any) {
      setPwError(err.message || "An unexpected error occurred.");
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleSignOut = () => {
    if (confirm("Sign out from your staff terminal?")) {
      document.cookie = "mma_staff_session=; path=/; max-age=0;";
      window.location.href = "/admin/login";
    }
  };

  // Operational permissions status
  const permissionsList: Array<{ key: StaffPermission; label: string; desc: string }> = [
    {
      key: "students.view",
      label: "Student 360 & Directory Search",
      desc: "Search registered students, view contact records, and verify enrollments.",
    },
    {
      key: "messages.manage",
      label: "Support Desk Messaging",
      desc: "Reply directly to student questions and inquiries from Satara/Pune.",
    },
    {
      key: "freegrant.manage",
      label: "Offline Cash & UPI Admissions",
      desc: "Grant immediate or approval-mode access for offline students paying cash/UPI.",
    },
    {
      key: "courses.manage",
      label: "Courses & Syllabus Management",
      desc: "Create and update video lessons and YouTube playlists.",
    },
    {
      key: "notes.books.manage",
      label: "Digital Books & PDF Uploads",
      desc: "Upload official textbooks and speed calculation cheat sheets.",
    },
    {
      key: "coupons.manage",
      label: "Promotional Discount Coupons",
      desc: "Generate limited-time student fee waiver coupons.",
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
        {/* Header Banner */}
        <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0B57D0]/10 flex items-center justify-center text-[#0B57D0] shrink-0 font-bold text-lg">
              {staff.name ? staff.name.charAt(0) : "S"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#0E1B3D] tracking-tight">
                  Sub-Admin Staff Console
                </h1>
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0B57D0] border border-blue-200">
                  {staff.staffId || "MMA-STAFF"}
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Manage your personal terminal security, view admissions ledger tally, and review unlocked operations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center gap-2 transition active:scale-95 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Terminal</span>
          </button>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: My Staff Identity Card */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-[#E4E8F8] pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B57D0] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#0E1B3D]">Staff Identity Card</h2>
                <p className="text-xs text-[#5A6478]">Your verified operator credentials</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[#5A6478]">Full Name</span>
                <span className="font-extrabold text-[#0E1B3D]">{staff.name || "Prashant Staff Member"}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[#5A6478]">Staff Identification Code</span>
                <span className="font-mono font-bold text-[#0B57D0] bg-blue-50 px-2 py-0.5 rounded-md">
                  {staff.staffId || staff.id}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[#5A6478]">Role Designation</span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase text-[10px]">
                  {staff.role === "sub_admin" ? "Sub-Admin Executive" : staff.role}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[#5A6478] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Registered Phone
                </span>
                <span className="font-semibold text-[#0E1B3D]">{staff.phone || "+91 84593 44077"}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[#5A6478] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Assigned Operational Centre
                </span>
                <span className="font-semibold text-[#0E1B3D]">
                  {staff.district ? `${staff.district} Centre Desk` : "Satara & Pune Region"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-[#5A6478]">Account Status</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE & AUTHORIZED
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: My Cash & Admissions Ledger */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0E1B3D]">Cash & Admissions Ledger</h2>
                  <p className="text-xs text-[#5A6478]">Your collection balance and admission audit</p>
                </div>
              </div>
              <Link
                href="/sub/students"
                className="text-[11px] font-bold text-[#0B57D0] hover:underline flex items-center gap-1"
              >
                <span>New Grant</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <p className="text-[11px] font-bold text-amber-900">Unsettled Cash in Hand</p>
                <p className="text-2xl font-black text-amber-950 mt-1">
                  ₹{cashSummary ? cashSummary.unsettledCash.toLocaleString("en-IN") : "0"}
                </p>
                <p className="text-[10px] text-amber-800/80 mt-1">
                  Cash collected from offline students to be handed over to Main Admin.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                <p className="text-[11px] font-bold text-emerald-900">Settled Cash Handed Over</p>
                <p className="text-2xl font-black text-emerald-950 mt-1">
                  ₹{cashSummary ? cashSummary.settledCash.toLocaleString("en-IN") : "0"}
                </p>
                <p className="text-[10px] text-emerald-800/80 mt-1">
                  Total settled admissions verified and acknowledged by Prashant Sir.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E4E8F8] flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-[#0E1B3D]">Total Admissions Recorded</p>
                <p className="text-[11px] text-[#5A6478]">
                  {cashSummary?.totalGrantsCount || 0} students granted offline access by your code.
                </p>
              </div>
              <span className="text-base font-black text-[#0B57D0]">
                {cashSummary?.totalGrantsCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: My Assigned Permissions List */}
        <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#0E1B3D]">Assigned Operational Privileges</h2>
                <p className="text-xs text-[#5A6478]">
                  Module access dynamically granted to your staff profile by Main Admin Prashant Sir.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#5A6478]">
              {staff.permissions?.length || 0} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {permissionsList.map((perm) => {
              const isUnlocked = hasStaffPermission(staff, perm.key);
              return (
                <div
                  key={perm.key}
                  className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                    isUnlocked
                      ? "bg-emerald-50/30 border-emerald-200/80"
                      : "bg-slate-50/50 border-slate-200 opacity-60"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-[#0E1B3D] truncate">{perm.label}</p>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          isUnlocked
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isUnlocked ? "UNLOCKED" : "LOCKED"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A6478] mt-0.5 leading-relaxed">{perm.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 4: Change Password & Session Security */}
        <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-[#E4E8F8] pb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0E1B3D]">Change Password & Session Security</h2>
              <p className="text-xs text-[#5A6478]">
                Keep your staff operator terminal secure with an Argon2-encrypted password.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
            {pwError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password updated successfully! Your active session has been re-secured.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                Current or Temporary Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Enter current password..."
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                  New Secure Password
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters..."
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password..."
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPw}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#0B57D0] hover:bg-[#0052FF] text-white flex items-center gap-2 shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              {isChangingPw ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Encrypting & Updating...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Update My Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}