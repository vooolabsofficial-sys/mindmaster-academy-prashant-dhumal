"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  FileText, 
  RotateCcw, 
  ArrowLeft, 
  Lock, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  PhoneCall, 
  Mail, 
  MapPin, 
  Building2 
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";

type LegalTab = "privacy" | "terms" | "refund";

function LegalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as LegalTab) || "privacy";
  const [activeTab, setActiveTab] = useState<LegalTab>(
    ["privacy", "terms", "refund"].includes(initialTab) ? initialTab : "privacy"
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab") as LegalTab;
    if (tabParam && ["privacy", "terms", "refund"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const switchTab = (tab: LegalTab) => {
    setActiveTab(tab);
    router.replace(`/legal?tab=${tab}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-20 select-none">
      {/* Top Breadcrumb & Header */}
      <div className="mb-6 flex flex-col gap-2">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B57D0] hover:text-[#0842A0] transition mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to MindMaster App</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0E1B3D] tracking-tight">
              Legal, Policies &amp; Compliance Center
            </h1>
            <p className="text-xs text-[#5A6478] mt-1">
              Official policies for MindMaster Academy • Founded &amp; Mentored by Prashant Dhumal Sir
            </p>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-extrabold uppercase tracking-wider text-[#0A8554] bg-[#E8F8F2] border border-[#C6ECD9] px-3 py-1 rounded-full">
            ● Active • 2026 Edition
          </span>
        </div>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-[#E4E8F8] shadow-2xs flex gap-1 mb-8">
        <button
          type="button"
          onClick={() => switchTab("privacy")}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "privacy"
              ? "bg-[#0B57D0] text-white shadow-sm"
              : "text-[#5A6478] hover:bg-[#F5F7FF] hover:text-[#0E1B3D]"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy Policy</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("terms")}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "terms"
              ? "bg-[#0B57D0] text-white shadow-sm"
              : "text-[#5A6478] hover:bg-[#F5F7FF] hover:text-[#0E1B3D]"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Terms &amp; Conditions</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("refund")}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "refund"
              ? "bg-[#0B57D0] text-white shadow-sm"
              : "text-[#5A6478] hover:bg-[#F5F7FF] hover:text-[#0E1B3D]"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refund &amp; Cancellation</span>
        </button>
      </div>

      {/* TAB 1: PRIVACY POLICY */}
      {activeTab === "privacy" && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E4E8F8] shadow-xs space-y-6 text-[#1A2644] text-xs sm:text-sm leading-relaxed">
          <div className="border-b border-[#F1F3F9] pb-4">
            <span className="text-[11px] font-black uppercase text-[#0B57D0] tracking-wider block mb-1">
              Data Protection &amp; Student Confidentiality
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#0E1B3D]">
              Privacy Policy
            </h2>
            <p className="text-xs text-[#5A6478] mt-1">
              Last updated: October 2026 • Effective for all mobile app, PWA, and portal students.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">1. Information We Collect</h3>
            <p>
              MindMaster Academy collects minimal, purpose-specific personal information essential to deliver competitive exam courses, Vedic Maths syllabi, and official certificates:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#334155]">
              <li><strong>Student Identity:</strong> Full Name, Mobile Phone Number, District, Taluka, and School/College Name.</li>
              <li><strong>Academic Progression:</strong> Video watch telemetry, completed lessons, speed calculation quiz answers, and test scores.</li>
              <li><strong>Device &amp; Security Logs:</strong> Device fingerprint token, browser agent, and session timestamp to enforce single-device session integrity.</li>
              <li><strong>Financial Transactions:</strong> Razorpay payment identifiers and order numbers. <em>Note: MindMaster Academy never stores debit/credit card numbers, CVVs, or UPI PINs on its servers.</em></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">2. How We Use Your Data</h3>
            <p>
              Your data is strictly utilized for the following educational purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#334155]">
              <li>Unlocking and personalizing video lectures, test papers, and digital PDF books.</li>
              <li>Generating genuine ISO-compliant Certificates of Completion and GST-compliant Fee Receipts in the student&apos;s legal name.</li>
              <li>Issuing WhatsApp or SMS academic notifications (new batch alerts, live exam revisions, and certificate approvals).</li>
              <li>Enforcing strict single-device login security and preventing unauthorized account sharing.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">3. Payment Security &amp; Gateway Compliance</h3>
            <p>
              All online fee payments on MindMaster Academy are processed through <strong>Razorpay Payment Gateway</strong>, a certified PCI-DSS Level 1 compliant provider. Payment communications are protected using 256-bit TLS/SSL encryption. We do not sell, rent, or trade student telephone numbers or private data with any third-party marketing agencies.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">4. Data Retention &amp; Rights</h3>
            <p>
              Student accounts and purchase histories remain active throughout their enrollment validity. Students may request an update or correction of their personal details at any time by contacting our Satara Helpdesk or emailing our grievance officer.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] flex items-center gap-3">
            <Lock className="w-5 h-5 text-[#0B57D0] shrink-0" />
            <p className="text-xs text-[#334155]">
              <strong>Privacy Assurance:</strong> Your registered phone number will never be spammed. It is strictly used for study reminders, batch alerts, and login authentication.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: TERMS AND CONDITIONS */}
      {activeTab === "terms" && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E4E8F8] shadow-xs space-y-6 text-[#1A2644] text-xs sm:text-sm leading-relaxed">
          <div className="border-b border-[#F1F3F9] pb-4">
            <span className="text-[11px] font-black uppercase text-[#0B57D0] tracking-wider block mb-1">
              User Agreement &amp; Code of Conduct
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#0E1B3D]">
              Terms &amp; Conditions
            </h2>
            <p className="text-xs text-[#5A6478] mt-1">
              Mandatory terms governing access to MindMaster Academy online courses, video streams, and digital materials.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">1. Strict Single-Device Session Policy</h3>
            <div className="p-4 rounded-2xl bg-[#FFF9E6] border border-[#FDE68A] flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
              <div className="text-xs text-[#78350F]">
                <strong>One Student • One Device:</strong> Every student enrollment is granted for individual educational use only. Our platform actively detects simultaneous logins across multiple phones, laptops, or tablets. Logging in on a new device will immediately terminate and invalidate any prior active session.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">2. Anti-Piracy, Recording &amp; Copyright Notice</h3>
            <p>
              All video lectures, Vedic Maths mnemonic tables, 500-year calendar speed shortcuts, test series questions, and digital books are the exclusive intellectual property of <strong>Prashant Dhumal Sir / MindMaster Academy</strong>.
            </p>
            <div className="p-4 rounded-2xl bg-[#FEECEB] border border-[#FCD3CF] text-xs text-red-800 space-y-2">
              <div className="font-black flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Strict Prohibition on Screen Recording &amp; Distribution:</span>
              </div>
              <p>
                Screen recording, downloading via third-party scrapers, sharing credentials on Telegram/WhatsApp, or unauthorized public rebroadcast is strictly illegal under the <strong>Indian Copyright Act, 1957</strong> and the <strong>Information Technology Act, 2000</strong>.
              </p>
              <p className="font-semibold text-red-900">
                Any account detected capturing video or redistributing study content will face permanent suspension without notice or refund, accompanied by appropriate civil and criminal legal action.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">3. Access Validity &amp; Course Completion</h3>
            <p>
              Course access is granted for the specific validity period selected during enrollment (e.g. 1 Month, 3 Months, 6 Months, or 12 Months). Upon expiration, course materials and video playback will lock automatically unless extended through official renewal or offline academy grant.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">4. Jurisdiction</h3>
            <p>
              Any disputes or legal proceedings arising from or connected with MindMaster Academy courses shall be subject to the exclusive jurisdiction of the competent courts in <strong>Satara, Maharashtra, India</strong>.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: REFUND & CANCELLATION POLICY */}
      {activeTab === "refund" && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E4E8F8] shadow-xs space-y-6 text-[#1A2644] text-xs sm:text-sm leading-relaxed">
          <div className="border-b border-[#F1F3F9] pb-4">
            <span className="text-[11px] font-black uppercase text-[#0B57D0] tracking-wider block mb-1">
              Razorpay &amp; Payment Compliance
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#0E1B3D]">
              Refund &amp; Cancellation Policy
            </h2>
            <p className="text-xs text-[#5A6478] mt-1">
              Clear, transparent financial terms for digital course subscriptions and digital book purchases.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">1. Digital Content Delivery &amp; Refund Policy</h3>
            <p>
              MindMaster Academy provides immediate, real-time digital access to video lectures, downloadable notes, practice test drills, and digital books upon successful payment.
            </p>
            <p>
              <strong>General Policy:</strong> Because intellectual property, proprietary memory formulas, and video curricula are unlocked instantly upon purchase, <strong>course and book subscription fees are non-refundable once content has been accessed or streamed</strong>.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">2. Technical Glitches &amp; Duplicate Payment Refunds</h3>
            <div className="p-4 rounded-2xl bg-[#E8F8F2] border border-[#C6ECD9] space-y-2 text-xs text-[#065F46]">
              <div className="font-extrabold flex items-center gap-1.5 text-[#0A8554]">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Refund for Duplicate or Accidental Transactions:</span>
              </div>
              <p>
                If your bank account or UPI is debited multiple times for the same course or book due to an internet drop, network latency, or gateway timeout:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The excess duplicate amount will be <strong>refunded 100%</strong> without any cancellation deductions.</li>
                <li>Refunds are automatically processed through the original payment route (UPI, NetBanking, or Debit/Credit Card) within <strong>5 to 7 working days</strong> as per standard banking protocol.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">3. Pre-Purchase Free Demo Experience</h3>
            <p>
              To ensure 100% student satisfaction before payment, MindMaster Academy provides free preview lessons, sample lectures, and speed calculation drills for every major course. Students and parents are strongly encouraged to experience these free demos prior to completing paid enrollment.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0E1B3D]">4. Grievance Redressal &amp; Support Contact</h3>
            <p>
              If money has been deducted from your account but course access was delayed, or if you require an invoice adjustment, please contact our helpdesk with your Order ID and transaction screenshot:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-xs">
                <span className="font-extrabold text-[#0E1B3D] block mb-1">WhatsApp &amp; Helpline:</span>
                <a href="tel:+918459344077" className="text-[#0B57D0] font-bold hover:underline flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>+91 84593 44077</span>
                </a>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-xs">
                <span className="font-extrabold text-[#0E1B3D] block mb-1">Official Grievance Email:</span>
                <a href="mailto:mindmasterdhumal@gmail.com" className="text-[#0B57D0] font-bold hover:underline flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>mindmasterdhumal@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Academy Footer Card */}
      <div className="mt-8 p-6 rounded-3xl bg-white border border-[#E4E8F8] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5A6478]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F1FD] text-[#0B57D0] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-[#0E1B3D] text-xs">
              MindMaster Academy • Head Office
            </h4>
            <p className="text-[11px] text-[#5A6478]">
              Near Powai Naka, Satara (415001) | Pune Campus: Zeal Chowk, Narhe, Pune
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/support"
            className="px-4 py-2 rounded-xl bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] font-bold text-xs transition"
          >
            Contact Helpdesk
          </Link>
          <Link
            href="/courses"
            className="px-4 py-2 rounded-xl bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-xs transition shadow-xs"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-[#0B57D0] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <LegalContent />
      </Suspense>
    </AppShell>
  );
}
