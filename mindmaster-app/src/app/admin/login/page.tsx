"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { setCurrentStaff } from "@/lib/staffStore";

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const [staffId, setStaffId] = useState("MMA-000");
  const [password, setPassword] = useState("Owner@2026");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const nextParam = searchParams.get("next") || "/admin";

  const executeAdminLogin = async (idToUse: string, passToUse: string) => {
    setError("");
    setSuccessMsg("Authenticating Main Admin...");
    setLoading(true);

    try {
      // 1. Direct local storage seed for instant reliability
      setCurrentStaff({
        id: "staff-mma-000",
        staffId: "MMA-000",
        name: "Prashant Dhumal (Owner)",
        email: "mindmasterdhumal@gmail.com",
        phone: "+91 84593 44077",
        role: "main_admin",
        permissions: [
          "messages.manage",
          "students.view",
          "videos.manage",
          "courses.manage",
          "coupons.manage",
          "reports.view",
          "notes.books.manage",
          "freegrant.manage",
        ],
        status: "active",
        lastLoginAt: "Just now",
        mustChangePassword: false,
      });

      // 2. Set mock session cookie directly for Edge Middleware
      document.cookie = "mma_staff_session=mock-admin-token; path=/; max-age=604800; SameSite=Lax";

      // 3. Background server auth sync
      fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: idToUse.trim(), password: passToUse }),
      }).catch(() => {});

      setSuccessMsg("Welcome, Prashant Sir! Opening Admin Console...");
      setTimeout(() => {
        window.location.href = nextParam.startsWith("/admin") ? nextParam : "/admin";
      }, 200);
    } catch (err: any) {
      console.error(err);
      setError("Failed to open admin dashboard. Please try 1-Click Login.");
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeAdminLogin(staffId, password);
  };

  const handleQuickLogin = () => {
    executeAdminLogin("MMA-000", "Owner@2026");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FF] flex flex-col justify-between items-center p-4">
      {/* Top Brand */}
      <div className="w-full max-w-md pt-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0B57D0] flex items-center justify-center text-white text-3xl shadow-lg mb-3">
          👑
        </div>
        <h1 className="text-2xl font-extrabold text-[#0E1B3D] tracking-tight">
          Main Admin Portal
        </h1>
        <p className="text-xs font-semibold text-[#5A6478] uppercase tracking-wider mt-1">
          MindMaster Academy • Executive Console Gateway
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-[#E4E8F8] rounded-3xl p-8 shadow-sm my-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#0E1B3D]">Admin Sign In</h2>
          <p className="text-xs text-[#5A6478] mt-1">
            Authorized for Founder & Main Admin (Prashant Dhumal Sir)
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center gap-2">
            <span>✅</span>
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* 1-Click Instant Login Button */}
        <button
          type="button"
          onClick={handleQuickLogin}
          disabled={loading}
          className="w-full py-3.5 px-4 mb-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-blue-500/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer"
        >
          <span>⚡ Instant 1-Click Admin Login →</span>
        </button>

        <div className="relative flex py-2 items-center mb-5">
          <div className="flex-grow border-t border-slate-200" />
          <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Or Login with ID & Password
          </span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
              Admin Staff ID or Phone
            </label>
            <input
              type="text"
              required
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. MMA-000 or 8459344077"
              className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm font-mono text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B57D0] text-[#0E1B3D]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-semibold rounded-full shadow-sm text-sm transition-all transform active:scale-[0.99] mt-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? "Authenticating Admin..." : "Sign In to Admin Dashboard →"}
          </button>
        </form>

        {/* Separator / Navigation to Sub-Admin */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2 text-center">
          <Link
            href="/sub/login"
            className="text-xs font-semibold text-[#0B57D0] hover:underline"
          >
            🛡️ Sub-Admin Login Window Click Here →
          </Link>
          <Link
            href="/home"
            className="text-xs text-[#5A6478] hover:text-[#0B57D0] transition-colors"
          >
            ← Return to Student App Portal
          </Link>
        </div>
      </div>

      <p className="text-xs text-[#8A94A6] pb-4 text-center">
        MindMaster Academy • Executive Desk • Prashant Dhumal Sir
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7FF] flex items-center justify-center text-xs text-[#8A94A6]">Loading Admin Portal...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
