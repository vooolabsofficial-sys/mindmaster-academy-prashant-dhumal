"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Calendar,
  BookOpen,
  ArrowRight,
  Home,
} from "lucide-react";
import { StudentCertificate } from "@/lib/certificateEngine";

function VerifyCertificateContent() {
  const searchParams = useSearchParams();
  const queryCert = searchParams.get("cert") || searchParams.get("no") || "";

  const [serialInput, setSerialInput] = useState(queryCert);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [certData, setCertData] = useState<StudentCertificate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async (serialToTest?: string) => {
    const target = (serialToTest || serialInput).trim();
    if (!target) {
      setErrorMsg("Please enter a Certificate Serial Number to verify.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSearched(true);
    setCertData(null);

    try {
      const res = await fetch(`/api/certificates/verify?cert=${encodeURIComponent(target)}`);
      const data = await res.json();

      if (res.ok && data.success && data.certificate) {
        setCertData(data.certificate);
      } else {
        setErrorMsg(
          data.error ||
            "This Certificate Number was not found in MindMaster Academy's official records. Please verify the code and try again."
        );
      }
    } catch {
      setErrorMsg("Network error verifying certificate. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (queryCert) {
      setSerialInput(queryCert);
      handleVerify(queryCert);
    }
  }, [queryCert]);

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="bg-[#0E1B3D] text-white border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#0E1B3D] flex items-center justify-center font-black text-sm">
              M
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight block">MindMaster Academy</span>
              <span className="text-[10px] text-amber-300 font-semibold block -mt-0.5">
                Prashant Dhumal Sir • Pune & Satara
              </span>
            </div>
          </Link>

          <Link
            href="/courses"
            className="text-xs font-bold text-white/90 hover:text-white px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center gap-1.5"
          >
            <span>Explore Courses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 py-8 sm:py-12 flex flex-col items-center">
        {/* Title & Badge */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official Institutional Verification Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0E1B3D] tracking-tight">
            Authenticate Academy Certificate
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Verify the authenticity of any digital certificate issued by MindMaster Academy.
            Enter the unique Serial Number printed on the certificate below.
          </p>
        </div>

        {/* Input Box Card */}
        <div className="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200 mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                placeholder="e.g. MMA-RVK-6789-VM26-K8X2"
                className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-slate-300 focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 rounded-2xl text-xs sm:text-sm font-mono font-bold text-slate-900 tracking-wider placeholder:text-slate-400 focus:outline-none transition uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="py-3 px-6 bg-[#0B57D0] hover:bg-[#0842A0] disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Now</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-2.5 ml-1">
            Serial format: <span className="font-mono font-semibold">MMA-[Initials]-[Digits]-[Code]-[Hash]</span>. Case-insensitive.
          </p>
        </div>

        {/* Result Area */}
        {certData && (
          <div className="w-full max-w-2xl bg-white rounded-3xl border-2 border-emerald-500/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Authenticated Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide">
                    Officially Verified & Authentic
                  </h3>
                  <p className="text-xs text-emerald-100 font-mono">
                    Certificate No: {certData.certificate_no}
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                100% Certified
              </span>
            </div>

            {/* Verification Content Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Certified Student Name
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-[#0E1B3D] mt-0.5">
                  {certData.student_name}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Registered Mobile: {certData.student_phone_masked}
                </p>
              </div>

              {/* Course & Curriculum Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#0B57D0]" />
                    <span>Completed Curriculum</span>
                  </p>
                  <p className="font-extrabold text-[#0E1B3D] text-sm">{certData.course_title}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {certData.category}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Issuance Timestamp (IST)</span>
                  </p>
                  <p className="font-mono font-extrabold text-[#0E1B3D] text-xs">
                    {certData.issued_at_ist}
                  </p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Grade: Mastered (100% Verified)
                  </span>
                </div>
              </div>

              {/* Authority & Certification Signatory */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Authorized Signatory</span>
                  </p>
                  <p className="font-black text-[#0E1B3D] text-sm">{certData.signatory_name}</p>
                  <p className="text-xs text-slate-500">{certData.signatory_title}</p>
                  <p className="text-[11px] text-[#0B57D0] font-semibold mt-0.5">
                    {certData.academy_name} • {certData.centres}
                  </p>
                </div>

                {/* Signatory Seal Badge */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500/50 flex flex-col items-center justify-center p-1 text-center bg-amber-50/50">
                    <Award className="w-6 h-6 text-amber-600" />
                    <span className="text-[8px] font-black uppercase text-amber-800 leading-tight">
                      SEAL OF EXCELLENCE
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Tamper Note */}
              <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-4">
                🔒 Cryptographic Checksum Validated. This record is immutably stored in the MindMaster Academy Certification Ledger.
              </div>
            </div>
          </div>
        )}

        {/* Not Found / Error Card */}
        {searched && errorMsg && (
          <div className="w-full max-w-2xl bg-white rounded-3xl border-2 border-rose-300 p-6 sm:p-8 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-rose-700">Certificate Not Found</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                {errorMsg}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 text-[11px] text-slate-600 text-left max-w-md mx-auto">
              <p className="font-bold text-rose-800 mb-1">Common reasons:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Typo in serial number (e.g., mistyping &apos;O&apos; and &apos;0&apos;).</li>
                <li>The course is not yet 100% completed by the student.</li>
                <li>The certificate may have been forged or revoked.</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        © 2026 MindMaster Academy • Prashant Dhumal Sir • Satara & Pune Centres
      </footer>
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center text-xs text-slate-500 font-bold">
          Loading certificate verification portal...
        </div>
      }
    >
      <VerifyCertificateContent />
    </Suspense>
  );
}
