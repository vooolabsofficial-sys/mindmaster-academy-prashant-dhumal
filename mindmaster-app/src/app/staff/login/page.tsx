"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setCurrentStaff } from "@/lib/staffStore";

function StaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
    setLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: staffId.trim(), password }),
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
          email: `${data.staff.staff_id.toLowerCase()}@mindmasteracademy.in`,
          phone: data.staff.phone,
          role: data.staff.role,
          permissions: data.staff.permissions,
          status: data.staff.status,
          lastLoginAt: "Just now",
          mustChangePassword: data.must_change_password,
        });
      }

      const nextParam = searchParams.get("next");
      if (data.must_change_password) {
        router.push("/staff/change-password");
      } else if (nextParam && (nextParam.startsWith("/sub") || nextParam.startsWith("/admin"))) {
        router.push(nextParam);
      } else {
        router.push(data.redirect_url || (data.role === "main_admin" ? "/admin" : "/sub"));
      }
    } catch (err: any) {
      console.error("Login fetch error:", err);
      setError("Network connection failed. Please check server.");
      setLoading(false);
    }
  };

  const quickFill = (demoStaffId: string, demoPass: string) => {
    setStaffId(demoStaffId);
    setPassword(demoPass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FF] flex flex-col justify-between items-center p-4">
      {/* Top Header */}
      <div className="w-full max-w-md pt-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0B57D0] flex items-center justify-center text-white text-2xl shadow-md mb-3">
          🧠
        </div>
        <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
          MindMaster Staff Console
        </h1>
        <p className="text-xs font-semibold text-[#5A6478] uppercase tracking-wider mt-1">
          Authorized Staff Authentication Gateway
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white border border-[#E4E8F8] rounded-3xl p-8 shadow-sm my-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0E1B3D]">Staff Sign In</h2>
          <p className="text-xs text-[#5A6478] mt-1">
            Argon2 password verification • Lockout after 5 failures • Auto session kill
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
            <span className="text-base leading-none">⚠️</span>
            <div className="flex-1">
              <p className="font-bold">Access Warning</p>
              <p className="text-[11px] mt-0.5">{error}</p>
              {lockoutSec && (
                <p className="text-[10px] text-red-800 font-mono font-bold mt-1">
                  ⏳ Locked: Try again in {Math.floor(lockoutSec / 60)}m {lockoutSec % 60}s
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
              Staff ID (or Registered Phone)
            </label>
            <input
              type="text"
              required
              disabled={!!lockoutSec}
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. MMA-000 or staff-2"
              className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm font-mono text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0] disabled:opacity-50"
            />
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
            <input
              type="password"
              required
              disabled={!!lockoutSec}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B57D0] text-[#0E1B3D] disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!lockoutSec}
            className="w-full py-3.5 px-6 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-semibold rounded-full shadow-sm transition-all transform active:scale-[0.99] text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying with Argon2..." : "Verify & Sign In →"}
          </button>
        </form>

        {/* Quick Test Accounts for Instant Verification */}
        <div className="mt-8 pt-6 border-t border-[#E4E8F8]">
          <p className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2 text-center">
            Phase-2 Seed Test Accounts
          </p>
          <div className="space-y-1.5">
            {/* OWNER SEED MMA-000 */}
            <button
              type="button"
              onClick={() => quickFill("MMA-000", "Owner@2026")}
              className="w-full text-left p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-indigo-950">👑 MMA-000 (Owner Seed)</span>
                <p className="text-[10px] text-indigo-800">Prashant Dhumal • must_change_password=true</p>
              </div>
              <span className="text-[#0B57D0] font-semibold text-[11px]">Fill →</span>
            </button>

            {/* SUB-ADMIN TRAINER */}
            <button
              type="button"
              onClick={() => quickFill("staff-2", "Master@2026")}
              className="w-full text-left p-2.5 rounded-xl border border-[#E4E8F8] hover:bg-[#F5F7FF] transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-[#0E1B3D]">🛡️ staff-2 (Sub-Admin Trainer)</span>
                <p className="text-[10px] text-[#5A6478]">Rohit More • videos.manage</p>
              </div>
              <span className="text-[#0B57D0] font-semibold text-[11px]">Fill →</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/home"
            className="text-xs text-[#5A6478] hover:text-[#0B57D0] transition-colors"
          >
            ← Return to Student App Portal
          </Link>
        </div>
      </div>

      <p className="text-xs text-[#8A94A6] pb-4 text-center">
        ● Strictly In-App Staff Console • Narhe Centre Desk • v2.0.0
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
