"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StaffChangePasswordPage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState("MMA-000");
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mma_current_staff");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.staffId || parsed.id) {
          setStaffId(parsed.staffId || parsed.id);
        }
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hasLength || !hasNumber || !hasSpecial) {
      setError("New password must be at least 8 chars and contain at least 1 number and 1 special symbol.");
      return;
    }

    if (!passwordsMatch) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/staff/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: staffId.trim(),
          temp_password: tempPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update password.");
        setLoading(false);
        return;
      }

      // Update current staff locally
      try {
        const stored = localStorage.getItem("mma_current_staff");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.mustChangePassword = false;
          localStorage.setItem("mma_current_staff", JSON.stringify(parsed));
          window.dispatchEvent(new Event("mma_staff_changed"));
        }
      } catch {}

      setSuccess(true);
      setTimeout(() => {
        router.push(data.redirect_url || "/admin");
      }, 1500);
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FF] flex flex-col justify-between items-center p-4">
      <div className="w-full max-w-md pt-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#095ABA] flex items-center justify-center text-white text-2xl shadow-md mb-3">
          🔑
        </div>
        <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
          Security Verification
        </h1>
        <p className="text-xs font-semibold text-[#5A6478] uppercase tracking-wider mt-1">
          Mandatory Password Change (Argon2 Hashed)
        </p>
      </div>

      <div className="w-full max-w-md bg-white border border-[#E4E8F8] rounded-3xl p-8 shadow-sm my-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
            <span>🔒</span> Mandatory First-Time Reset
          </div>
          <h2 className="text-xl font-bold text-[#0E1B3D]">
            Set Personal Secure Password
          </h2>
          <p className="text-xs text-[#5A6478] mt-1">
            Your temporary default password must be replaced with an Argon2-hashed personal password before continuing.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <span>✅</span> Password securely updated with Argon2! Entering workspace...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
              Staff ID
            </label>
            <input
              type="text"
              required
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. MMA-000"
              className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm font-mono text-[#0E1B3D] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
              Current / Temporary Password
            </label>
            <input
              type="password"
              required
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Enter temporary password"
              className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B57D0] text-[#0E1B3D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
              New Secure Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 chars, 1 number, 1 symbol"
              className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B57D0] text-[#0E1B3D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B57D0] text-[#0E1B3D]"
            />
          </div>

          {/* Checklist */}
          <div className="p-3.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl text-xs space-y-1">
            <p className="font-bold text-[#0E1B3D] text-[11px] uppercase tracking-wider mb-1">
              Argon2 Password Standards:
            </p>
            <div className="flex items-center gap-2 text-[11px]">
              <span>{hasLength ? "✅" : "⚪"}</span>
              <span className={hasLength ? "text-emerald-700 font-medium" : "text-[#5A6478]"}>
                Minimum 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span>{hasNumber ? "✅" : "⚪"}</span>
              <span className={hasNumber ? "text-emerald-700 font-medium" : "text-[#5A6478]"}>
                At least 1 number (0-9)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span>{hasSpecial ? "✅" : "⚪"}</span>
              <span className={hasSpecial ? "text-emerald-700 font-medium" : "text-[#5A6478]"}>
                At least 1 special character (!@#$...)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span>{passwordsMatch ? "✅" : "⚪"}</span>
              <span className={passwordsMatch ? "text-emerald-700 font-medium" : "text-[#5A6478]"}>
                Both passwords match exactly
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 px-6 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-semibold rounded-full shadow-sm transition-all text-sm mt-2 disabled:opacity-50"
          >
            {loading ? "Computing Argon2 Hash..." : "Save Password & Proceed →"}
          </button>
        </form>
      </div>

      <p className="text-xs text-[#8A94A6] pb-4 text-center">
        ● MindMaster Staff Security Protocol
      </p>
    </div>
  );
}
