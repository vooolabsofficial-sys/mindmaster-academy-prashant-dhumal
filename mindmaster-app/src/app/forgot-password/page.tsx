"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"pin" | "email">("pin");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handlePinReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "forgot-password",
          phone,
          recoveryPin: pin,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Password reset failed.");
      }

      setSuccessMessage(data.message || "Password updated successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });

      if (error) throw error;

      setSuccessMessage(
        "Password reset link has been sent to your email. Please check your inbox!"
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Subtle Liquid Glass Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0052FF]/08 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/06 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-4 sm:px-8 py-3.5 flex items-center justify-between z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-700 hover:text-[#0052FF] font-semibold text-xs sm:text-sm transition">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Login</span>
        </Link>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0052FF] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
          Secure Recovery
        </span>
      </header>

      {/* Main Apple Liquid Glass Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 my-6">
        <div className="w-full max-w-[440px] bg-white/85 backdrop-blur-3xl border border-white/80 rounded-3xl p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,82,255,0.12)] relative overflow-hidden ring-1 ring-slate-900/5">
          {/* Subtle liquid reflection gradient overlay */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#0052FF] to-sky-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 text-white">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Forgot Password?
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Reset your password safely and quickly
            </p>
          </div>

          {/* Recovery Method Tabs: Apple Segmented Pill */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setMethod("pin");
                setErrorMessage("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                method === "pin"
                  ? "bg-white text-[#0052FF] shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Reset via Security PIN
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("email");
                setErrorMessage("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                method === "email"
                  ? "bg-white text-[#0052FF] shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Request Email Link
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {method === "pin" ? (
            <form onSubmit={handlePinReset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-12 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF] transition font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4-Digit Security PIN
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  placeholder="e.g. 1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF] transition font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Your 4-digit PIN set during registration (Default: 1234)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF] transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10 || pin.length !== 4 || newPassword.length < 6}
                className="w-full mt-2 py-3 bg-[#0052FF] hover:bg-[#0047E0] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                {loading ? "Resetting password..." : "Reset Password"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailReset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF] transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.includes("@")}
                className="w-full mt-2 py-3 bg-[#0052FF] hover:bg-[#0047E0] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                {loading ? "Sending..." : "Send Reset Link"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Instant WhatsApp Support Card */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-2 flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#0052FF]" />
              Can&apos;t remember your PIN or email?
            </p>
            <a
              href="https://wa.me/918459344077?text=Namaskar%20MindMaster%20Academy%20Team%2C%20I%20forgot%20my%20password%20and%20need%20help%20recovering%20my%20account."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Get Direct Help on WhatsApp
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3.5 text-center text-slate-400 text-xs z-10 border-t border-slate-200/60 bg-white/40">
        © 2026 MindMaster Academy • Prashant Dhumal Sir • All rights reserved
      </footer>
    </div>
  );
}
