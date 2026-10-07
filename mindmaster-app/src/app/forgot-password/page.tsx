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
        throw new Error(data.error || "पासवर्ड रिसेट अयशस्वी झाला.");
      }

      setSuccessMessage(data.message || "पासवर्ड यशस्वीरित्या बदलला आहे!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.");
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
        "तुमच्या ईमेलवर पासवर्ड रिसेट लिंक पाठवली आहे. कृपया इनबॉक्स तपासा!"
      );
    } catch (err: any) {
      setErrorMessage(err.message || "ईमेल पाठवण्यात अडचण आली.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between z-10 border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
        <Link href="/login" className="flex items-center gap-2 text-slate-300 hover:text-amber-400 transition">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">लॉगिन कडे परत जा</span>
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
          सुरक्षित रिकव्हरी
        </span>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 my-8">
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
              <KeyRound className="w-7 h-7 text-slate-950" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              पासवर्ड विसरलात?
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              काही सेकंदात मोफत आणि सुरक्षित पासवर्ड बदला
            </p>
          </div>

          {/* Recovery Method Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 border border-slate-800/60 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMethod("pin");
                setErrorMessage("");
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                method === "pin"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              सिक्युरिटी पिनने बदला
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("email");
                setErrorMessage("");
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                method === "email"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ईमेलने लिंक मागवा
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {method === "pin" ? (
            <form onSubmit={handlePinReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  नोंदणीकृत मोबाईल नंबर (Mobile Number)
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ४-अंकी सिक्युरिटी पिन (Security PIN)
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  placeholder="उदा. 1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 tracking-widest text-center focus:outline-none focus:border-amber-500 transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  नोंदणी करताना दिलेला ४-अंकी पिन (डिफॉल्ट: 1234)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  नवीन पासवर्ड (New Password)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="किमान ६ अक्षरे"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10 || pin.length !== 4 || newPassword.length < 6}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? "पासवर्ड बदलत आहे..." : "पासवर्ड बदला (Reset Password)"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  नोंदणीकृत ईमेल पत्ता (Email Address)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.includes("@")}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? "पाठवत आहे..." : "रिसेट लिंक पाठवा (Send Link)"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Instant WhatsApp Support Card */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400 mb-2.5 flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              पिन किंवा ईमेल आठवत नाही का?
            </p>
            <a
              href="https://wa.me/919823456789?text=Namaskar%20MindMaster%20Academy%20Team%2C%20I%20forgot%20my%20password%20and%20need%20help%20recovering%20my%20account."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              WhatsApp वर थेट मदत मिळवा
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-600 text-xs z-10 border-t border-slate-900">
        © 2026 MindMaster Academy • प्रशांत धुमाळ सर
      </footer>
    </div>
  );
}
