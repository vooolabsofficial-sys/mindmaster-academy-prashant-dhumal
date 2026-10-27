"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  User, 
  Phone, 
  MapPin, 
  School, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { MAHARASHTRA_DISTRICTS } from "@/lib/constants";
import { createClient, getCookieDomain } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/phoneUtils";

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone") || "9823456789";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(phoneParam);
  const [village, setVillage] = useState("");
  const [taluka, setTaluka] = useState("");
  const [district, setDistrict] = useState("Pune"); // Default: Pune
  const [schoolName, setSchoolName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // If onboarding is already marked completed, navigate forward
    const completed = localStorage.getItem("mindmaster_onboarding_completed");
    if (completed === "true") {
      const rawNext = searchParams.get("next");
      const nextParam = (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/login"))
        ? rawNext
        : "/home";
      window.location.href = nextParam;
      return;
    }

    // Check if phone was stored during login
    const savedPhone = localStorage.getItem("mindmaster_verified_phone");
    if (savedPhone) {
      setPhone(savedPhone);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || !village.trim() || !taluka.trim() || !district) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const clean = normalizePhone(phone);
      let existingId = "";
      try {
        const existingRaw = localStorage.getItem("mindmaster_user_profile");
        if (existingRaw) existingId = JSON.parse(existingRaw)?.id || "";
      } catch {}

      const studentId = existingId || `std-${clean || Date.now()}`;
      const fullProfile = {
        id: studentId,
        phone: clean ? `+91${clean}` : phone,
        cleanPhone: clean,
        full_name: fullName.trim(),
        village: village.trim(),
        taluka: taluka.trim(),
        district: district,
        school: schoolName.trim() || null,
        school_name: schoolName.trim() || null,
        role: "student",
        onboardingCompleted: true,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      // Try Supabase client upsert
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").upsert({
            ...fullProfile,
            id: user.id,
            phone: clean,
          }, { onConflict: "phone" });
        } else {
          await supabase.from("profiles").upsert({
            ...fullProfile,
            phone: clean,
          }, { onConflict: "phone" });
        }
      } catch (authErr) {
        console.warn("Supabase auth offline, proceeding with local session", authErr);
      }

      // Persist to local storage for instant access across the app
      localStorage.setItem("mindmaster_user_profile", JSON.stringify(fullProfile));
      localStorage.setItem("mindmaster_onboarding_completed", "true");
      localStorage.setItem("mindmaster_verified_phone", fullProfile.phone);
      if (!localStorage.getItem("mindmaster_session_token")) {
        localStorage.setItem("mindmaster_session_token", `tok-${studentId}`);
      }

      // Auto-apply active all/district/taluka/school grants to new signups at onboarding
      try {
        const { autoApplyGrantsForStudent } = await import("@/lib/grantStore");
        autoApplyGrantsForStudent(fullProfile);
      } catch (grantErr) {
        console.warn("Error auto-applying grants at onboarding:", grantErr);
      }

      // Notify backend auth API to mark onboarding complete, sync profiles & link grants
      try {
        const res = await fetch("/api/student/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete-onboarding",
            phone: clean,
            fullName: fullProfile.full_name,
            district: fullProfile.district,
            taluka: fullProfile.taluka,
            schoolName: fullProfile.school_name,
            village: fullProfile.village,
          }),
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.sessionToken) {
            localStorage.setItem("mindmaster_session_token", resData.sessionToken);
          }
        }
      } catch (apiErr) {
        console.warn("Could not notify auth API of onboarding completion:", apiErr);
      }

      // Clear onboarding pending cookie across domain and localhost
      const domain = getCookieDomain();
      if (domain) {
        document.cookie = `mindmaster_onboarding_pending=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      }
      document.cookie = `mindmaster_onboarding_pending=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

      // Redirect to ?next or /home using hard navigation for clean cookie and localStorage sync
      const rawNext = searchParams.get("next");
      const nextParam = (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/login"))
        ? rawNext
        : "/home";
      window.location.href = nextParam;
    } catch (err: any) {
      console.error("Onboarding submission error:", err);
      setErrorMessage(err.message || "Error saving profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FF] flex flex-col justify-center items-center p-4 py-8">
      <title>Student Onboarding | MindMaster Academy</title>
      <meta name="description" content="Complete your student profile at MindMaster Academy to access video lessons and e-certificates." />
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 md:p-10 border border-[#E4E8F8] shadow-[0_16px_40px_rgba(16,20,38,0.08)]">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-[#0B57D0]/20 shadow-md mb-3 shrink-0">
            <Image
              src="/assets/images/prashant_dhumal_studio_portrait.png"
              alt="Prashant Dhumal"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E8F8F2] text-[#0A8554] text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mobile Number Successfully Verified</span>
          </div>

          <h1 className="text-xl md:text-2xl font-extrabold text-[#0E1B3D]">
            Complete Your Student Profile
          </h1>
          <p className="text-xs md:text-sm text-[#5A6478] mt-1 max-w-md">
            Welcome to MindMaster Academy! Please enter your details below for course certificates and attendance.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FDE8F1] border border-[#F9CADF] text-xs font-bold text-[#D02B6D] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Six-field form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 1: Full Name */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#0E1B3D] block mb-1.5">
                1. Full Name (for Certificates) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Vishal Satish Patil"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-xs font-semibold text-[#0E1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20"
                />
              </div>
            </div>

            {/* Field 2: Verified Mobile (Disabled) */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#0E1B3D] block mb-1.5 flex items-center justify-between">
                <span>2. Verified Mobile Number</span>
                <span className="text-[10px] text-[#0A8554] font-bold bg-[#E8F8F2] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5A6478]">
                  +91
                </span>
                <input
                  type="text"
                  value={phone}
                  disabled
                  readOnly
                  className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-[#E2E8F0]/40 border border-[#CBD5E1] text-xs font-bold text-[#5A6478] cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Field 3: Village / City */}
            <div>
              <label className="text-xs font-bold text-[#0E1B3D] block mb-1.5">
                3. Village / City <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Baramati / Pune"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-xs font-semibold text-[#0E1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#0B57D0]"
                />
              </div>
            </div>

            {/* Field 4: Taluka */}
            <div>
              <label className="text-xs font-bold text-[#0E1B3D] block mb-1.5">
                4. Taluka <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Haveli / Shirur"
                value={taluka}
                onChange={(e) => setTaluka(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-xs font-semibold text-[#0E1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#0B57D0]"
              />
            </div>

            {/* Field 5: District Dropdown of Maharashtra */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#0E1B3D] block mb-1.5">
                5. District (Maharashtra) <span className="text-red-500">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-xs font-bold text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0] cursor-pointer"
              >
                {MAHARASHTRA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 6: School / College (Optional) */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#0E1B3D] block mb-1.5 flex items-center justify-between">
                <span>6. School / College / Academy Name</span>
                <span className="text-[10px] text-[#94A3B8] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Vidya Pratishthan College / Police Academy"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-xs font-semibold text-[#0E1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#0B57D0]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs md:text-sm font-extrabold shadow-lg shadow-[#0B57D0]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? "Saving profile..." : "Complete Profile & Continue"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading onboarding...</div>}>
      <OnboardingForm />
    </Suspense>
  );
}
