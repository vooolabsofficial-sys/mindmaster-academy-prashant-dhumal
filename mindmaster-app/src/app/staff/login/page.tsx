"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { setCurrentStaff } from "@/lib/staffStore";
import AuthRoleSwitcher from "@/components/auth/AuthRoleSwitcher";
import SubmitButton from "@/components/ui/SubmitButton";
import MindMasterLogo from "@/components/common/MindMasterLogo";

function StaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "";
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockoutSec, setLockoutSec] = useState<number | null>(null);

  // Check URL query parameters (e.g. ?error=suspended)
  useEffect(() => {
    const errParam = searchParams.get("error");
    if (errParam === "suspended") {
      setError("Your account has been suspended by the Main Admin. Session terminated.");
    }
  }, [searchParams]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSec && lockoutSec > 0) {
      const timer = setInterval(() => {
        setLockoutSec((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSec]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: staffId.trim(),
          password,
          role: roleParam || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isLocked && data.remainingSec) {
          setLockoutSec(data.remainingSec);
        }
        setError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      // Success
      if (data.staff) {
        setCurrentStaff({
          id: data.staff.staff_id,
          staffId: data.staff.staff_id,
          name: data.staff.name,
          email: `${data.staff.staff_id.toLowerCase()}@mindmasteredu.in`,
          phone: data.staff.phone,
          role: data.staff.role,
          permissions: data.staff.permissions,
          status: data.staff.status,
          lastLoginAt: "Just now",
          mustChangePassword: data.must_change_password,
        });
      }

      const nextParam = searchParams.get("next");
      const targetUrl = data.must_change_password
        ? "/staff/change-password"
        : (nextParam && (nextParam.startsWith("/sub") || nextParam.startsWith("/admin")))
        ? nextParam
        : (data.redirect_url || (data.role === "main_admin" ? "/admin" : "/sub"));

      const roleLabel = data.role === "main_admin" ? "Admin Console" : "Staff Console";
      setSuccessMsg(`Welcome, ${data.staff?.name || "Staff"}! Opening ${roleLabel}...`);

      // Use window.location.href to guarantee full session cookie persistence across server boundaries
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 150);
    } catch (err: any) {
      console.error("Login fetch error:", err);
      setError("Network connection failed. Please check server.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between items-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-md pt-8 text-center relative z-10 flex flex-col items-center">
        <MindMasterLogo size="lg" className="mb-3" />
        <h1 className="text-2xl font-black text-slate-900 dark:text-white font-heading">
          MindMaster Staff Gateway
        </h1>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
          Authorized Staff Authentication Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none my-6 relative z-10">
        {/* Role Switcher */}
        <AuthRoleSwitcher activeRole={roleParam === "main_admin" ? "main_admin" : "sub_admin"} />

        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {roleParam === "main_admin" ? "Main Admin Sign In" : "Sub-Admin Staff Sign In"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Argon2 password verification • 5-attempt security lock • Session protection
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              <p className="font-bold">Access Warning</p>
              <p className="text-[11px] mt-0.5">{error}</p>
              {lockoutSec && (
                <p className="text-[10px] text-red-800 dark:text-red-300 font-mono font-bold mt-1">
                  ⏳ Locked: Try again in {Math.floor(lockoutSec / 60)}m {lockoutSec % 60}s
                </p>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5 flex items-center justify-between">
              <span>Staff ID (or Registered Phone)</span>
              {staffId.trim().length >= 3 && !error && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Entered
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={!!lockoutSec}
                value={staffId}
                onChange={(e) => {
                  setStaffId(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. MMA-000 or MMA-001"
                className={`w-full px-4 py-3 rounded-xl text-sm font-mono text-[#0E1B3D] focus:outline-none transition-all disabled:opacity-50 ${
                  error
                    ? "border border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-500/20 animate-shake"
                    : staffId.trim().length >= 3
                    ? "border border-emerald-400 bg-emerald-50/15 focus:ring-2 focus:ring-emerald-500/20"
                    : "border border-[#E4E8F8] bg-[#F5F7FF] focus:ring-2 focus:ring-[#0B57D0]"
                }`}
              />
              {error ? (
                <AlertCircle className="w-4 h-4 text-red-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              ) : staffId.trim().length >= 3 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              ) : null}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#0E1B3D]">
                Password (Argon2 Verified)
              </label>
              <Link
                href="/staff/forgot-password"
                className="text-[11px] text-[#0B57D0] hover:underline font-semibold"
              >
                Forgot via SMS OTP?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                disabled={!!lockoutSec}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="••••••••••••"
                className={`w-full px-4 py-3 rounded-xl text-sm text-[#0E1B3D] focus:outline-none transition-all disabled:opacity-50 ${
                  error
                    ? "border border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-500/20 animate-shake"
                    : password.length >= 6
                    ? "border border-emerald-400 bg-emerald-50/15 focus:ring-2 focus:ring-emerald-500/20"
                    : "border border-[#E4E8F8] bg-[#F5F7FF] focus:ring-2 focus:ring-[#0B57D0]"
                }`}
              />
              {error ? (
                <AlertCircle className="w-4 h-4 text-red-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              ) : password.length >= 6 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              ) : null}
            </div>
          </div>

          <SubmitButton
            type="submit"
            loading={loading}
            loadingText="Verifying credentials..."
            disabled={!!lockoutSec || !!successMsg || !staffId.trim() || !password}
            className="w-full py-3.5 px-6 rounded-full text-sm mt-2"
          >
            <span>Verify &amp; Sign In →</span>
          </SubmitButton>
        </form>

        <div className="mt-8 text-center">
          <a
            href={process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:5173"}
            className="text-xs text-[#5A6478] hover:text-[#0B57D0] transition-colors"
          >
            ← Return to MindMaster Website
          </a>
        </div>
      </div>

      <p className="text-xs text-[#8A94A6] pb-4 text-center">
        ● Strictly In-App Staff Console • Satara Centre Desk • v2.0.0
      </p>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7FF] flex items-center justify-center text-xs text-[#8A94A6]">Loading staff console...</div>}>
      <StaffLoginContent />
    </Suspense>
  );
}
