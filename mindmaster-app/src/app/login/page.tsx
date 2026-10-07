"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  GraduationCap,
} from "lucide-react";
import { createClient, getCookieDomain } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "/home";

  // Session check state
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Tab state: "signin" or "signup"
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Form states
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [recoveryPin, setRecoveryPin] = useState("");

  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 1. Check existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, is_verified")
            .eq("id", user.id)
            .maybeSingle();

          const localProfile = localStorage.getItem("mindmaster_user_profile");
          const hasProfile = (profile && profile.full_name) || localProfile;

          if (!hasProfile) {
            router.replace(`/onboarding?next=${encodeURIComponent(nextParam)}`);
          } else {
            router.replace(nextParam);
          }
          return;
        }
      } catch (err) {
        // Fallback check
      }

      const localSession = localStorage.getItem("mindmaster_session_token");
      if (localSession) {
        const localProfile = localStorage.getItem("mindmaster_user_profile");
        if (!localProfile) {
          router.replace(`/onboarding?next=${encodeURIComponent(nextParam)}`);
        } else {
          router.replace(nextParam);
        }
        return;
      }

      // No active session -> show login form
      setIsCheckingSession(false);
    }

    checkSession();
  }, [nextParam, router]);

  // Google OAuth 1-Click Login
  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/onboarding?next=${encodeURIComponent(nextParam)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || "Google लॉगिन सुरू करण्यात अडचण आली.");
      setGoogleLoading(false);
    }
  };

  // Handle Mobile + Password Login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          phone,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "लॉगिन अयशस्वी झाले. कृपया माहिती तपासा.");
      }

      // Save local storage session state
      localStorage.setItem("mindmaster_session_token", `tok-${data.user.id}`);
      localStorage.setItem("mindmaster_verified_phone", data.user.phone);

      setSuccessMessage("लॉगिन यशस्वी! कृपया थांबा...");

      setTimeout(() => {
        if (!data.onboardingCompleted) {
          router.replace(`/onboarding?next=${encodeURIComponent(nextParam)}&phone=${encodeURIComponent(phone)}`);
        } else {
          router.replace(nextParam);
        }
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.");
      setLoading(false);
    }
  };

  // Handle New Student Registration (Sign Up)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          phone,
          password,
          fullName,
          recoveryPin: recoveryPin || "1234",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "नोंदणी अयशस्वी झाली. कृपया पुन्हा प्रयत्न करा.");
      }

      localStorage.setItem("mindmaster_session_token", `tok-${data.user.id}`);
      localStorage.setItem("mindmaster_verified_phone", data.user.phone);

      setSuccessMessage("नोंदणी यशस्वी! आता तुमची माहिती भरा...");

      setTimeout(() => {
        router.replace(`/onboarding?next=${encodeURIComponent(nextParam)}&phone=${encodeURIComponent(phone)}`);
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || "नोंदणी करताना त्रुटी आली.");
      setLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-xs tracking-wide">सत्र तपासत आहे (Checking session)...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Ambience Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="px-6 py-4 flex items-center justify-between z-10 border-b border-slate-900 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <GraduationCap className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">
              MindMaster <span className="text-amber-400">Academy</span>
            </span>
            <span className="text-[11px] text-slate-400 block -mt-0.5">
              प्रशांत धुमाळ सर
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>१००% मोफत व सुरक्षित</span>
        </div>
      </header>

      {/* Main Glassmorphic Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 my-6">
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/60 relative">
          {/* Decorative Sparkle Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>विद्यार्थी प्रवेश पोर्टल</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {activeTab === "signin" ? "लॉगिन करा" : "नवीन नोंदणी करा"}
          </h1>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            {activeTab === "signin"
              ? "तुमच्या कोर्स आणि व्हिडिओ अभ्यासाला त्वरित सुरुवात करा"
              : "अवघ्या ३० सेकंदात तुमचे मोफत खाते तयार करा"}
          </p>

          {/* 1-CLICK GOOGLE SIGN-IN BUTTON */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 text-sm disabled:opacity-60 cursor-pointer"
          >
            {/* Google Colorful G SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? "Google कडे नेत आहे..." : "Google ने लॉगिन करा (1-Click)"}</span>
          </button>

          {/* DIVIDER */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative px-3 bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              किंवा मोबाईल नंबरने पुढे जा
            </span>
          </div>

          {/* TAB SWITCHER */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "signin"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              लॉगिन करा (Sign In)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "signup"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              नवीन नोंदणी (Sign Up)
            </button>
          </div>

          {/* ALERT NOTIFICATIONS */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {activeTab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  मोबाईल नंबर (Mobile Number)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-12 pr-10 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    पासवर्ड (Password)
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium transition"
                  >
                    पासवर्ड विसरलात?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10 || !password}
                className="w-full mt-3 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {loading ? "लॉगिन होत आहे..." : "लॉगिन करा (Sign In)"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  विद्यार्थ्याचे पूर्ण नाव (Full Name)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="उदा. रोहन कुलकणी"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition pr-10"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  मोबाईल नंबर (Mobile Number)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-12 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  पासवर्ड निवडा (Set Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="किमान ६ अक्षरे"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ४-अंकी सिक्युरिटी पिन (Security Recovery PIN)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="उदा. 1234 (पासवर्ड विसरल्यास उपयुक्त)"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition pr-10 tracking-widest"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  पासवर्ड विसरल्यास हा पिन वापरून तुम्ही स्वतः त्वरित पासवर्ड बदलू शकता.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10 || password.length < 6 || !fullName.trim()}
                className="w-full mt-3 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {loading ? "नोंदणी होत आहे..." : "खाते तयार करा (Create Account)"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Direct WhatsApp Assistance */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-400 block mb-1.5">
              काही मदत हवी आहे का?
            </span>
            <a
              href="https://wa.me/919823456789?text=Namaskar%20Prashant%20Sir%2C%20I%20need%20help%20with%20MindMaster%20Academy%20login."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              WhatsApp वर प्रशांत सरांशी संपर्क साधा
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-500 text-xs z-10 border-t border-slate-900">
        © 2026 MindMaster Academy • सर्व हक्क राखीव
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
