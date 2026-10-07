"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [staffId, setStaffId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/staff/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_otp", staff_id: staffId.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to dispatch SMS OTP.");
        setLoading(false);
        return;
      }

      setPhoneMasked(data.phoneMasked || "");
      if (data.otpDebug) {
        setDebugOtp(data.otpDebug);
      }
      setSuccess("SMS OTP dispatched to registered mobile number.");
      setStep("verify");
      setLoading(false);
    } catch (err) {
      setError("Network error sending OTP request.");
      setLoading(false);
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/staff/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_reset",
          staff_id: staffId.trim(),
          otp: otp.trim(),
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        setLoading(false);
        return;
      }

      setSuccess("Password reset successfully with Argon2! Redirecting to login...");
      setTimeout(() => {
        router.push("/staff/login");
      }, 1500);
    } catch (err) {
      setError("Network error verifying OTP.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FF] flex flex-col justify-between items-center p-4">
      <div className="w-full max-w-md pt-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0B57D0] flex items-center justify-center text-white text-2xl shadow-md mb-3">
          📲
        </div>
        <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
          Password Recovery
        </h1>
        <p className="text-xs font-semibold text-[#5A6478] uppercase tracking-wider mt-1">
          SMS OTP Verification (No WhatsApp)
        </p>
      </div>

      <div className="w-full max-w-md bg-white border border-[#E4E8F8] rounded-3xl p-8 shadow-sm my-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0E1B3D]">
            {step === "request" ? "Request SMS OTP" : "Verify & Reset Password"}
          </h2>
          <p className="text-xs text-[#5A6478] mt-1">
            {step === "request"
              ? "Enter your Staff ID or registered phone number to receive a 6-digit SMS OTP."
              : `Enter the 6-digit OTP sent to ${phoneMasked || "your mobile phone"}.`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
            <span>✅</span> {success}
          </div>
        )}

        {debugOtp && step === "verify" && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-[#0B57D0] text-xs rounded-xl flex items-center justify-between font-mono">
            <span>[SIMULATED SMS] OTP:</span>
            <span className="font-bold text-sm bg-white px-2.5 py-0.5 rounded border border-blue-200">
              {debugOtp}
            </span>
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
                Staff ID or Registered Phone
              </label>
              <input
                type="text"
                required
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="e.g. MMA-000 or staff-2"
                className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm font-mono text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-semibold rounded-full shadow-sm transition-all text-sm mt-2 disabled:opacity-50"
            >
              {loading ? "Sending SMS OTP..." : "Send SMS OTP Code →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
                6-Digit SMS OTP
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-center font-mono text-lg font-bold tracking-widest text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B3D] mb-1.5">
                New Password (Argon2)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 chars"
                className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
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
                placeholder="Confirm password"
                className="w-full px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-sm text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-semibold rounded-full shadow-sm transition-all text-sm mt-2 disabled:opacity-50"
            >
              {loading ? "Verifying & Hashing..." : "Reset Password & Sign In →"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep("request")}
                className="text-xs text-[#5A6478] hover:text-[#0B57D0]"
              >
                ← Request different OTP
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center pt-4 border-t border-[#E4E8F8]">
          <Link
            href="/staff/login"
            className="text-xs text-[#0B57D0] font-semibold hover:underline"
          >
            ← Return to Staff Login
          </Link>
        </div>
      </div>

      <p className="text-xs text-[#8A94A6] pb-4 text-center">
        ● MindMaster Staff Security System • Direct SMS verification
      </p>
    </div>
  );
}
