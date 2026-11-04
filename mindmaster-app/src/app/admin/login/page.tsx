"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { setCurrentStaff } from "@/lib/staffStore";
import AuthRoleSwitcher from "@/components/auth/AuthRoleSwitcher";

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const nextParam = searchParams.get("next") || "/admin";

  const executeAdminLogin = async (idToUse: string, passToUse: string) => {
    setError("");
    setSuccessMsg("Authenticating Main Admin credentials...");
    setLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: idToUse.trim(),
          password: passToUse,
          role: "main_admin",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Check your ID and password.");
        setLoading(false);
        return;
      }

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

      setSuccessMsg("Welcome, Prashant Sir! Opening Executive Console...");
      setTimeout(() => {
        window.location.href = nextParam.startsWith("/admin") ? nextParam : "/admin";
      }, 150);
    } catch (err: any) {
      console.error(err);
      setError("Network communication failed. Please check server.");
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim() || !password.trim()) {
      setError("Please enter your Admin Staff ID and Password.");
      return;
    }
    executeAdminLogin(staffId, password);
  };

  const handleFillDemoAdmin = () => {
    setStaffId("MMA-000");
    setPassword("MasterAdmin@2026");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between items-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Identity */}
      <div className="w-full max-w-md pt-8 text-center relative z-10">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0052FF] flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Main Admin Portal
        </h1>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
          MindMaster Academy • Executive Console Gateway
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none my-6 relative z-10">
        {/* Role Switcher */}
        <AuthRoleSwitcher activeRole="main_admin" />

        <div className="mb-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Executive Sign In
            </h2>
            {process.env.NODE_ENV !== "production" && (
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0052FF] dark:text-blue-400 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/40"
                title="Click to auto-fill MMA-000 Master credentials (Dev only)"
              >
                <Sparkles className="w-3 h-3" />
                <span>Fill MMA-000</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reserved for Founder &amp; Senior Academic Directors
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              <p className="font-bold">Access Alert</p>
              <p className="text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
              <span>Admin Staff ID or Phone</span>
              {staffId.trim().length >= 3 && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={staffId}
                onChange={(e) => {
                  setStaffId(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. MMA-000 or 8459344077"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF] transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Admin Password
              </label>
              <span className="text-[10px] font-medium text-slate-400">
                Argon2 Encrypted
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !staffId.trim() || !password}
            className="w-full py-3.5 px-6 bg-[#0052FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 text-sm transition-all transform active:scale-[0.99] mt-3 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Verifying Admin Credentials...</span>
            ) : (
              <>
                <span>Sign In to Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Separator / Navigation to Sub-Admin */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 text-center text-xs">
          <Link
            href="/sub/login"
            className="font-bold text-[#0052FF] dark:text-blue-400 hover:underline"
          >
            Switch to Sub-Admin Staff Login (/sub/login) →
          </Link>
          <a
            href={process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:5173"}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            ← Return to MindMaster Website
          </a>
        </div>
      </div>

      <div className="text-center pb-4 text-xs text-slate-400 relative z-10 flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Executive Command Desk • Satara HQ • Prashant Dhumal Sir</span>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">Loading Admin Portal...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
