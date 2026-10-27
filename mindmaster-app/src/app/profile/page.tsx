"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, 
  Phone, 
  MapPin, 
  School, 
  CreditCard, 
  Globe, 
  MessageCircle, 
  LogOut, 
  ChevronRight, 
  Edit3, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  Download,
  Smartphone, 
  ShieldCheck, 
  PhoneCall,
  Target,
  FileText
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { signOutAndClearCookie } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageModal from "@/components/common/LanguageModal";
import { generateFeeReceiptPdf, generateCourseCertificatePdf } from "@/lib/pdfGenerator";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("Student");
  const [district, setDistrict] = useState("Pune");
  const [school, setSchool] = useState("Maharashtra State Board");
  const [phone, setPhone] = useState("");
  const [targetExam, setTargetExam] = useState("Maharashtra Police Bharti 2026");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({
    supportPhone: "+91 84593 44077",
    centreAddress: "Narhe Campus: Survey No. 49, Zeal Chowk, Narhe, Pune",
  });

  const { languageInfo, t } = useLanguage();

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setPlatformSettings({
            supportPhone: data.settings.support_phone || "+91 84593 44077",
            centreAddress: data.settings.centre_address || "Narhe Campus: Survey No. 49, Zeal Chowk, Narhe, Pune",
          });
        }
      })
      .catch(() => {});

    try {
      const raw = localStorage.getItem("mindmaster_user_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.full_name) setFullName(p.full_name);
        if (p.district) setDistrict(p.district);
        if (p.school_name) setSchool(p.school_name);
        if (p.phone) setPhone(p.phone);
        if (p.target_exam) setTargetExam(p.target_exam);
      }
      const savedPhone = localStorage.getItem("mindmaster_verified_phone");
      if (savedPhone) setPhone(savedPhone);
    } catch {}
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const current = JSON.parse(localStorage.getItem("mindmaster_user_profile") || "{}");
      localStorage.setItem("mindmaster_user_profile", JSON.stringify({
        ...current,
        full_name: fullName,
        district,
        school_name: school,
        phone,
        target_exam: targetExam,
      }));
    } catch {}
    setIsEditing(false);
    setSavedSuccess(true);
    toast.success("Profile saved successfully!");
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out from all devices?")) {
      await signOutAndClearCookie();
      window.location.href = "/login";
    }
  };

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "ST";

  return (
    <AppShell>
      <title>Student Profile & Settings | MindMaster Academy</title>
      <meta name="description" content="Manage your personal details, registered phone number, center info, and learning statistics." />
      <div className="flex flex-col gap-6 max-w-4xl mx-auto select-none">

        {/* 1. HEADER CARD (Exact from 11-profile-settings.png) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E4E8F8] shadow-[0_12px_32px_rgba(16,20,38,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Avatar Circle with Initials and Green Online Dot */}
            <div className="relative">
              <div className="w-18 h-18 rounded-full bg-[#E8F1FD] text-[#0B57D0] flex items-center justify-center text-xl font-black shrink-0 ring-4 ring-white shadow-sm">
                {initials}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#0A8554] border-2 border-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-[#0E1B3D]">
                  {fullName}
                </h1>
                <span className="bg-[#F1F3F9] text-[#717D96] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  Verified Student
                </span>
              </div>
              <p className="text-xs text-[#5A6478] font-medium mt-1">
                {school} • {district}
              </p>
              <div className="flex items-center gap-3 text-xs text-[#94A3B8] font-mono mt-1">
                <span>{phone}</span>
                <span>•</span>
                <span>ID: MM-8492</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF] text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span>🎯</span>
                  <span>{targetExam}</span>
                </span>
                <span className="bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span>⚡</span>
                  <span>Active Student</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-5 py-2 rounded-full bg-white border border-[#E4E8F8] text-[#0E1B3D] text-xs font-bold hover:border-[#0B57D0] hover:bg-[#F5F7FF] transition inline-flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#0B57D0]" />
            <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-[#E8F8F2] border border-[#C6ECD9] text-xs font-bold text-[#0A8554] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile information updated successfully!</span>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl p-6 border border-[#E4E8F8] shadow-sm flex flex-col gap-4"
          >
            <h3 className="font-extrabold text-sm text-[#0E1B3D]">Edit Student Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-[#0E1B3D] block mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F7FF] border border-[#E4E8F8] text-[#0E1B3D] font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-[#0E1B3D] block mb-1">Class / School / Board</label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F7FF] border border-[#E4E8F8] text-[#0E1B3D] font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-[#0E1B3D] block mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F7FF] border border-[#E4E8F8] text-[#0E1B3D] font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-[#0E1B3D] block mb-1">Target Exam Goal</label>
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F7FF] border border-[#E4E8F8] text-[#0E1B3D] font-medium text-xs focus:ring-2 focus:ring-[#0B57D0]"
                >
                  <option value="Maharashtra Police Bharti 2026">Maharashtra Police Bharti 2026</option>
                  <option value="MPSC / Civil Services Foundation">MPSC / Civil Services Foundation</option>
                  <option value="10th SSC Board Maths Special">10th SSC Board Maths Special</option>
                  <option value="Vedic Maths & Speed Memory">Vedic Maths & Speed Memory</option>
                  <option value="Scholarship Exam (5th/8th Std)">Scholarship Exam (5th/8th Std)</option>
                  <option value="General Skills / Self Improvement">General Skills / Self Improvement</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-full bg-[#F5F7FF] text-xs font-bold text-[#5A6478]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-[#0B57D0] text-white text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* 2. STAT PILLS (Exact from 11-profile-settings.png) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-[#E4E8F8] shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F1FD] text-[#0B57D0] flex items-center justify-center shrink-0 font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#94A3B8] leading-tight">
                ENROLLED
              </div>
              <div className="text-base font-extrabold text-[#0E1B3D] leading-tight mt-0.5">
                2 Courses
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-[#E4E8F8] shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F8F2] text-[#0A8554] flex items-center justify-center shrink-0 font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#94A3B8] leading-tight">
                ATTENDANCE
              </div>
              <div className="text-base font-extrabold text-[#0E1B3D] leading-tight mt-0.5">
                94.8%
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-[#E4E8F8] shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F0EEFD] text-[#6352D0] flex items-center justify-center shrink-0 font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#94A3B8] leading-tight">
                NARHE RANK
              </div>
              <div className="text-base font-extrabold text-[#0E1B3D] leading-tight mt-0.5">
                #04
              </div>
            </div>
          </div>
        </div>

        {/* 3. ACCOUNT SECTION */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] px-2">
            {t("profile.sectionAccount")}
          </span>

          <div className="bg-white rounded-3xl border border-[#E4E8F8] shadow-2xs overflow-hidden divide-y divide-[#F1F3F9]">
            {/* My Purchases */}
            <Link
              href="/my-courses"
              className="p-4 md:p-5 flex items-center justify-between hover:bg-[#F5F7FF] transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F1FD] text-[#0B57D0] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#0E1B3D]">{t("profile.myPurchases")}</h4>
                  <p className="text-xs text-[#5A6478]">{t("profile.myPurchasesSub")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#5A6478]">2 courses</span>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>
            </Link>

            {/* Language Selection Row */}
            <div
              onClick={() => setIsLangModalOpen(true)}
              className="p-4 md:p-5 flex items-center justify-between hover:bg-[#F5F7FF] transition cursor-pointer active:scale-[0.99] touch-manipulation"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F0EEFD] text-[#6352D0] flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#0E1B3D]">{t("profile.language")}</h4>
                  <p className="text-xs text-[#5A6478]">{t("profile.languageSub")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
                  {languageInfo.nativeName} ({languageInfo.englishName})
                </span>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>
            </div>

            {/* Help & Support */}
            <a
              href={`tel:${platformSettings.supportPhone.replace(/\s+/g, "")}`}
              className="p-4 md:p-5 flex items-center justify-between hover:bg-[#F5F7FF] transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F8F2] text-[#0A8554] flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#0E1B3D]">{t("profile.help")}</h4>
                  <p className="text-xs text-[#5A6478]">{t("profile.helpSub")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#0B57D0] bg-[#EEF4FF] px-2.5 py-1 rounded-full">
                  ● Campus Desk (Room 302)
                </span>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>
            </a>
          </div>
        </div>

        {/* OFFICIAL DOCUMENTS & CERTIFICATES */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] px-2">
            OFFICIAL CERTIFICATES & FEE RECEIPTS
          </span>

          <div className="bg-white rounded-3xl border border-[#E4E8F8] shadow-2xs p-5 space-y-4">
            <p className="text-xs text-[#5A6478]">
              Download signed admission fee receipts and course certificates for competitive exams and academic verification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Receipt 1 */}
              <div className="p-4 rounded-2xl bg-[#F9FAFF] border border-[#E4E8F8] flex flex-col justify-between gap-3 hover:border-[#D0E2FF] transition">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#8A94A6]">
                    <span>FEE RECEIPT</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">● PAID</span>
                  </div>
                  <h4 className="font-extrabold text-xs text-[#0E1B3D] mt-1">
                    Police Bharti 2026 Special Batch
                  </h4>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">
                    Ref: MMA-REC-9482 • ₹2,499.00
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    generateFeeReceiptPdf({
                      receiptNo: "MMA-PB-8492",
                      date: new Date().toLocaleDateString("en-IN"),
                      studentName: fullName,
                      studentPhone: phone,
                      district,
                      courseCode: "PB-MATH-2026",
                      courseTitle: "Police Bharti 2026 - Maths & Reasoning Superfast",
                      amountPaise: 249900,
                      paymentId: "pay_rzp_pb_verified",
                      accessMonths: 12,
                      expiryDate: "October 2027",
                    })
                  }
                  className="w-full py-2 bg-white hover:bg-[#EEF4FF] border border-[#D0E2FF] text-[#0B57D0] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Fee Receipt (PDF)</span>
                </button>
              </div>

              {/* Certificate 1 */}
              <div className="p-4 rounded-2xl bg-[#FFFDF5] border border-[#FDE68A] flex flex-col justify-between gap-3 hover:border-amber-300 transition">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-800">
                    <span>COURSE CERTIFICATE</span>
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">★ CERTIFIED</span>
                  </div>
                  <h4 className="font-extrabold text-xs text-[#0E1B3D] mt-1">
                    Vedic Maths & Speed Memory Level-1
                  </h4>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">
                    Cert ID: MMA-CERT-VM01 • Grade A+
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    generateCourseCertificatePdf({
                      certificateNo: "MMA-CERT-VM01-8492",
                      studentName: fullName,
                      courseTitle: "Vedic Maths & Memory Mastery Special Foundation",
                      completionDate: new Date().toLocaleDateString("en-IN"),
                      grade: "A+",
                    })
                  }
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Download Certificate (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. APP SECTION */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] px-2">
            {t("profile.sectionApp")}
          </span>

          <div className="bg-white rounded-3xl border border-[#E4E8F8] shadow-2xs overflow-hidden divide-y divide-[#F1F3F9]">
            {/* App Version */}
            <div className="p-4 md:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F5F7FF] text-[#5A6478] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#0E1B3D]">{t("profile.appVersion")}</h4>
                  <p className="text-xs text-[#5A6478]">Narhe PWA Client Runtime</p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-[#5A6478] bg-[#F1F3F9] px-2.5 py-1 rounded-full">
                v1.0.0 (Latest Release)
              </span>
            </div>

            {/* Install App */}
            <div className="p-4 md:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F8F2] text-[#0A8554] flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#0E1B3D]">Install App</h4>
                  <p className="text-xs text-[#5A6478]">Offline storage & fast lecture caching</p>
                </div>
              </div>

              <span className="text-xs font-bold text-[#0A8554] bg-[#E8F8F2] border border-[#C6ECD9] px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Installed (PWA Ready)</span>
              </span>
            </div>
          </div>
        </div>

        {/* 5. LOGOUT ROW */}
        <div className="p-4 md:p-5 rounded-3xl bg-[#FDE8F1]/60 border border-[#F9CADF] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FDE8F1] text-[#D02B6D] flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#D02B6D]">{t("profile.logout")}</h4>
              <p className="text-xs text-[#5A6478]">End session across all MindMaster devices</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="px-5 py-2 rounded-full bg-white text-[#D02B6D] hover:bg-[#FDE8F1] border border-[#F9CADF] text-xs font-extrabold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>Sign Out</span>
            <span className="text-sm">→</span>
          </button>
        </div>

        {/* 6. CAMPUS ADDRESS FOOTER */}
        <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-xs text-[#5A6478] flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0B57D0]" />
            <span>{platformSettings.centreAddress}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-[#94A3B8]">DESK #02</span>
        </div>
      </div>

      {/* Language Selection Modal */}
      <LanguageModal isOpen={isLangModalOpen} onClose={() => setIsLangModalOpen(false)} />
    </AppShell>
  );
}
