"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { setCurrentStaff } from "@/lib/staffStore";
import AuthRoleSwitcher from "@/components/auth/AuthRoleSwitcher";

function SubAdminLoginContent() {
  const searchParams = useSearchParams();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const nextParam = searchParams.get("next") || "/sub";

  const executeSubLogin = async (idToUse: string, passToUse: string) => {
    setError("");
    setSuccessMsg("Authenticating Sub-Admin...");
    setLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: idToUse.trim(),
          password: passToUse,
          role: "sub_admin",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

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

      setSuccessMsg("Welcome! Opening Sub-Admin Staff Console...");
      setTimeout(() => {
        window.location.href = nextParam.startsWith("/sub") ? nextParam : "/sub";
      }, 200);
    } catch (err: any) {
      console.error(err);
      setError("Failed to communicate with authentication server.");
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim() || !password.trim()) {
      setError("Please enter your Staff ID and Password.");
      return;
    }
    executeSubLogin(staffId, password);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FF] flex flex-col justify-between items-center p-4">
      {/* Top Brand */}
      <div className="w-full max-w-md pt-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0052FF] flex items-center justify-center text-white text-3xl shadow-lg mb-3">
          🛡️
        </div>
        <h1 className="text-2xl font-extrabold text-[#0E1B3D] tracking-tight">
          Sub-Admin Console
        </h1>
        <p className="text-xs font-semibold text-[#5A6478] uppercase tracking-wider mt-1">
          MindMaster Academy • Staff Desk Gateway
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-[#E4E8F8] rounded-3xl p-8 shadow-sm my-6">
        {/* Role Switcher */}
        <AuthRoleSwitcher activeRole="sub_admin" />

        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#0E1B3D]">Staff Sign In</h2>
          <p className="text-xs text-[#5A6478] mt-1">
            Dedicated login for Student Management, Messages & Grants
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

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
              Staff ID or Registered Phone
            </label>
            <input
              type="text"
              required
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. MMA-001 or 9876543211"
              className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm font-mono text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
              Staff Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF] text-[#0E1B3D]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#0052FF] hover:bg-[#0047E0] text-white font-semibold rounded-full shadow-sm text-sm transition-all transform active:scale-[0.99] mt-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? "Authenticating Sub-Admin..." : "Sign In to Sub-Admin Console →"}
          </button>
        </form>

        {/* Separator / Navigation to Admin */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2 text-center">
          <Link
            href="/admin/login"
            className="text-xs font-semibold text-[#0052FF] hover:underline"
          >
            🛡️ Switch to Main Admin Login (/admin/login) →
          </Link>
          <a
            href={process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:5173"}
            className="text-xs text-[#5A6478] hover:text-[#0052FF] transition-colors"
          >
            ← Return to MindMaster Website
          </a>
        </div>
      </div>

      <p className="text-xs text-[#8A94A6] pb-4 text-center">
        MindMaster Academy • Staff Desk • Pune Narhe
      </p>
    </div>
  );
}

export default function SubAdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7FF] flex items-center justify-center text-xs text-[#8A94A6]">Loading Sub-Admin Portal...</div>}>
      <SubAdminLoginContent />
    </Suspense>
  );
}
