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
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  GraduationCap,
} from "lucide-react";
import { createClient, getCookieDomain } from "@/lib/supabase/client";
import SubmitButton from "@/components/ui/SubmitButton";
import Spinner from "@/components/ui/Spinner";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "/home";

  // Session check state - default to false so form is instantly visible without spinner hang
  const [isCheckingSession, setIsCheckingSession] = useState(false);

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
    const errorParam = searchParams.get("error");
    const reasonParam = searchParams.get("reason");
    const msgParam = searchParams.get("msg");

    if (errorParam === "device_conflict" || reasonParam === "single_device") {
      try {
        localStorage.removeItem("mindmaster_session_token");
        localStorage.removeItem("mindmaster_user_profile");
      } catch {}
      setErrorMessage(
        msgParam
          ? decodeURIComponent(msgParam)
          : "सुरक्षेच्या कारणास्तव एका वेळी एकाच फोनवर अभ्यास करता येतो. तुमचे खाते दुसऱ्या डिव्हाइसवर उघडल्यामुळे हे सत्र बंद झाले आहे. (Only 1 active device session allowed at a time.)"
      );
      return;
    }

    try {
      const localSession = localStorage.getItem("mindmaster_session_token");
      const localProfile = localStorage.getItem("mindmaster_user_profile");
      if (localSession && localProfile) {
        document.cookie = `mindmaster_session=${localSession}; path=/; max-age=604800; SameSite=Lax`;
        const targetUrl = (!nextParam || nextParam === "/" || nextParam.startsWith("/login")) ? "/home" : nextParam;
        window.location.href = targetUrl;
      }
    } catch {}
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
      setErrorMessage(err.message || "Failed to start Google sign in.");
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
        // Smart Auto-Switch: If phone is not found in profiles, automatically switch to Sign Up
        if (
          data.code === "USER_NOT_FOUND" ||
          (data.error &&
            (data.error.toLowerCase().includes("not found") ||
              data.error.toLowerCase().includes("not registered")))
        ) {
          setActiveTab("signup");
          setErrorMessage("");
          setSuccessMessage("This mobile number is not registered yet. Please create your account below.");
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Login failed. Please verify your details.");
      }

      // Save local storage session state
      const profileData = {
        id: data.user.id,
        phone: data.user.phone,
        cleanPhone: data.user.cleanPhone,
        full_name: data.user.full_name,
        district: data.user.district || "",
        taluka: data.user.taluka || "",
        village: data.user.village || "",
        school: data.user.school || data.user.school_name || "",
        role: "student",
        onboardingCompleted: Boolean(data.onboardingCompleted),
      };
      localStorage.setItem("mindmaster_session_token", data.sessionToken || `tok-${data.user.id}`);
      localStorage.setItem("mindmaster_verified_phone", data.user.phone);
      localStorage.setItem("mindmaster_user_profile", JSON.stringify(profileData));

      if (data.onboardingCompleted) {
        localStorage.setItem("mindmaster_onboarding_completed", "true");
      }

      // Ensure session cookie is set for Edge middleware
      const sessionTok = data.sessionToken || `tok-${data.user.id}`;
      document.cookie = `mindmaster_session=${sessionTok}; path=/; max-age=604800; SameSite=Lax`;

      setSuccessMessage("Login successful! Redirecting...");

      setTimeout(() => {
        const canonicalNext = (!nextParam || nextParam === "/" || nextParam.startsWith("/login")) ? "/home" : nextParam;
        const targetUrl = !data.onboardingCompleted
          ? `/onboarding?next=${encodeURIComponent(canonicalNext)}&phone=${encodeURIComponent(phone)}`
          : canonicalNext;
        window.location.href = targetUrl;
      }, 200);
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong. Please try again.");
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
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      const profileData = {
        id: data.user.id,
        phone: data.user.phone,
        cleanPhone: data.user.cleanPhone,
        full_name: data.user.full_name,
        district: "",
        taluka: "",
        village: "",
        school: "",
        role: "student",
        onboardingCompleted: false,
      };
      localStorage.setItem("mindmaster_session_token", data.sessionToken || `tok-${data.user.id}`);
      localStorage.setItem("mindmaster_verified_phone", data.user.phone);
      localStorage.setItem("mindmaster_user_profile", JSON.stringify(profileData));

      // Ensure session cookie is set for Edge middleware
      const regTok = data.sessionToken || `tok-${data.user.id}`;
      document.cookie = `mindmaster_session=${regTok}; path=/; max-age=604800; SameSite=Lax`;

      setSuccessMessage("Registration successful! Setting up your account...");

      setTimeout(() => {
        window.location.href = `/onboarding?next=${encodeURIComponent(nextParam)}&phone=${encodeURIComponent(phone)}`;
      }, 200);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred during registration.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Subtle Liquid Glass Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0052FF]/08 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/06 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar with prominent Back to Website button */}
      <header className="px-4 sm:px-8 py-3.5 flex items-center justify-between z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0052FF] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 block leading-tight">
              MindMaster <span className="text-[#0052FF]">Academy</span>
            </span>
            <span className="text-[11px] text-slate-500 block font-medium">
              Prashant Dhumal Sir
            </span>
          </div>
        </div>

        {/* Back to Website Button */}
        <div className="flex items-center gap-2">
          <a
            href={process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:5173"}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0052FF] border border-slate-200/90 shadow-xs backdrop-blur-sm text-xs sm:text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Return to Main Website"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Website</span>
          </a>
        </div>
      </header>

      {/* Main Apple Liquid Glass Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 my-4 sm:my-6">
        <div className="w-full max-w-[440px] bg-white/85 backdrop-blur-3xl border border-white/80 rounded-3xl p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,82,255,0.12)] relative overflow-hidden ring-1 ring-slate-900/5">
          {/* Subtle liquid reflection gradient overlay */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Decorative Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#0052FF] text-xs font-bold mb-3.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Access Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {activeTab === "signin" ? "Student Sign In" : "Create New Account"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            {activeTab === "signin"
              ? "Sign in with your 10-digit mobile number"
              : "Enter your name, mobile number and password to start learning"}
          </p>

          {/* Official Google 1-Click Button (Google Brand Guidelines) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 text-xs sm:text-sm cursor-pointer disabled:opacity-60"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          {/* Minimal Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative px-3 bg-white/90 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Or with Phone
            </span>
          </div>

          {/* Tab Switcher: Apple Segmented Pill */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "signin"
                  ? "bg-white text-[#0052FF] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "signup"
                  ? "bg-white text-[#0052FF] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Alert Notifications */}
          {errorMessage && (
            <div className="mb-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          {activeTab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Mobile Number</span>
                  {phone.length === 10 && !errorMessage && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified 10-Digit
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ""));
                      if (errorMessage) setErrorMessage("");
                    }}
                    className={`w-full pl-12 pr-10 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono transition-all ${
                      errorMessage && phone.length !== 10
                        ? "border border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-500/20 animate-shake"
                        : phone.length === 10
                        ? "border border-emerald-400 bg-emerald-50/15 focus:ring-2 focus:ring-emerald-500/20"
                        : "border border-slate-200 bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
                    }`}
                  />
                  {errorMessage && phone.length !== 10 ? (
                    <AlertCircle className="w-4 h-4 text-red-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  ) : phone.length === 10 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  ) : (
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Password
                  </label>
                  <Link
                    href={`/forgot-password?next=${encodeURIComponent(nextParam)}`}
                    className="text-[11px] text-[#0052FF] hover:underline font-semibold"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                      errorMessage
                        ? "border border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-500/20 animate-shake"
                        : password.length >= 6
                        ? "border border-emerald-400 bg-emerald-50/15 focus:ring-2 focus:ring-emerald-500/20"
                        : "border border-slate-200 bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <SubmitButton
                type="submit"
                loading={loading}
                loadingText="Signing In..."
                disabled={phone.length !== 10 || !password}
                className="w-full mt-2 py-3 bg-[#0052FF] hover:bg-[#0047E0] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-xs sm:text-sm"
              >
                <span>Sign In & Start Learning</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </SubmitButton>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Student Full Name</span>
                  {fullName.trim().length >= 3 && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Valid
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
                    placeholder="e.g. John Doe / Rahul Patil"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                      fullName.trim().length >= 3
                        ? "border border-emerald-400 bg-emerald-50/15 focus:ring-2 focus:ring-emerald-500/20"
                        : "border border-slate-200 bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
                    }`}
                  />
                  {fullName.trim().length >= 3 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Mobile Number</span>
                  {phone.length === 10 && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 10 Digits
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className={`w-full pl-12 pr-10 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono transition-all ${
                      phone.length === 10
                        ? "border border-emerald-400 bg-emerald-50/15 focus:ring-2 focus:ring-emerald-500/20"
                        : "border border-slate-200 bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
                    }`}
                  />
                  {phone.length === 10 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  ) : (
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Set Password</span>
                  {password.length >= 6 && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Secure (6+ chars)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                      password.length >= 6
                        ? "border border-emerald-400 bg-emerald-50/15 focus:ring-2 focus:ring-emerald-500/20"
                        : "border border-slate-200 bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>4-Digit Security PIN (Password Recovery)</span>
                  {recoveryPin.length === 4 && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 4-Digit Set
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="1234"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, ""))}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono tracking-widest transition-all ${
                      recoveryPin.length === 4
                        ? "border border-emerald-400 bg-emerald-50/15 focus:ring-2 focus:ring-emerald-500/20"
                        : "border border-slate-200 bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
                    }`}
                  />
                  {recoveryPin.length === 4 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Used to quickly reset your password if forgotten.
                </p>
              </div>

              <SubmitButton
                type="submit"
                loading={loading}
                loadingText="Creating Account..."
                disabled={phone.length !== 10 || password.length < 6 || !fullName.trim()}
                className="w-full mt-2 py-3 bg-[#0052FF] hover:bg-[#0047E0] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-xs sm:text-sm"
              >
                <span>Create Account & Start Learning</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </SubmitButton>
            </form>
          )}

          {/* WhatsApp Assistance */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 block mb-1">
              Need assistance with your student account?
            </span>
            <a
              href="https://wa.me/918459344077?text=Namaskar%20Prashant%20Sir%2C%20I%20need%20help%20with%20MindMaster%20Academy%20student%20login."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>WhatsApp Student Helpline: +91 84593 44077</span>
            </a>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="py-4 text-center text-slate-500 text-xs z-10 border-t border-slate-200/60 bg-white/40 space-y-1.5">
        <div>© 2026 MindMaster Academy • Prashant Dhumal Sir • All rights reserved</div>
        <div className="flex items-center justify-center gap-2.5 text-[11px] text-slate-500 font-semibold flex-wrap">
          <Link href="/help" className="hover:text-blue-600 font-bold text-blue-600 transition">How to Use App</Link>
          <span>•</span>
          <Link href="/privacy-policy" className="hover:text-blue-600 transition">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-blue-600 transition">Terms of Service</Link>
          <span>•</span>
          <Link href="/refund-policy" className="hover:text-blue-600 transition">Refund Policy</Link>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#0052FF] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
