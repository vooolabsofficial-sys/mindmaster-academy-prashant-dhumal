import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getAppUrl } from '../config/appConfig';

export interface VerifiedCertificate {
  certificate_no: string;
  student_name: string;
  student_phone_masked: string;
  course_title: string;
  category: string;
  issued_at_ist: string;
  signatory_name: string;
  signatory_title: string;
  academy_name: string;
  centres: string;
  status: string;
}

export const VerifyCertificate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryCert = searchParams.get('cert') || searchParams.get('no') || '';

  const [serialInput, setSerialInput] = useState(queryCert);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [certData, setCertData] = useState<VerifiedCertificate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async (serialToTest?: string) => {
    const target = (serialToTest || serialInput).trim();
    if (!target) {
      setErrorMsg('Please enter a Certificate Serial Number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSearched(true);
    setCertData(null);

    try {
      const endpoint = getAppUrl(`/api/certificates/verify?cert=${encodeURIComponent(target)}`);
      const res = await fetch(endpoint);
      const data = await res.json();

      if (res.ok && data.success && data.certificate) {
        setCertData(data.certificate);
      } else {
        setErrorMsg(
          data.error ||
            'This Certificate Number was not found in official MindMaster Academy records. Please check the serial code and try again.'
        );
      }
    } catch {
      setErrorMsg('Failed to connect to verification server. Please check your internet connection.');
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
    <main className="w-full pt-24 sm:pt-28 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center">
        {/* Verification Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider mb-3">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Official Academy Credential Verification</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Authenticate Certificate
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Verify the authenticity of digital certificates issued by MindMaster Academy (Prashant Dhumal Sir).
            Enter the unique Serial Number printed on the certificate.
          </p>
        </div>

        {/* Input Box Card */}
        <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                placeholder="e.g. MMA-RVK-6789-VM26-K8X2"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-2xl text-sm font-mono font-bold text-slate-900 tracking-wider placeholder:text-slate-400 focus:outline-none transition uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-md shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Verify Certificate</span>
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-2.5 ml-1">
            Format: <span className="font-mono font-semibold">MMA-[Initials]-[Digits]-[Code]-[Hash]</span>. Direct serial validation.
          </p>
        </div>

        {/* Authenticated Result Card */}
        {certData && (
          <div className="w-full max-w-2xl bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl overflow-hidden animate-fade-in">
            {/* Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">
                    Officially Verified & Authentic
                  </h3>
                  <p className="text-xs text-emerald-100 font-mono">
                    Serial: {certData.certificate_no}
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase">
                100% Verified
              </span>
            </div>

            {/* Details Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Certified Student Name
                </p>
                <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                  {certData.student_name}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Registered Mobile: {certData.student_phone_masked}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">
                    Completed Curriculum
                  </p>
                  <p className="font-extrabold text-slate-900 text-sm">{certData.course_title}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {certData.category}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">
                    Issuance Timestamp (IST)
                  </p>
                  <p className="font-mono font-extrabold text-slate-900 text-xs">
                    {certData.issued_at_ist}
                  </p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Status: Mastered & Active
                  </span>
                </div>
              </div>

              {/* Signatory */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                    Authorized Signatory
                  </p>
                  <p className="font-black text-slate-900 text-sm">{certData.signatory_name}</p>
                  <p className="text-xs text-slate-500">{certData.signatory_title}</p>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                    {certData.academy_name} • {certData.centres}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-500 flex items-center justify-center text-center p-1 bg-amber-50">
                  <span className="text-[8px] font-black uppercase text-amber-800 leading-tight">
                    ACADEMY SEAL
                  </span>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100">
                🔒 Cryptographic Checksum Confirmed. Recorded in the MindMaster Academy Master Certification Ledger.
              </div>
            </div>
          </div>
        )}

        {/* Not Found Alert */}
        {searched && errorMsg && (
          <div className="w-full max-w-2xl bg-white rounded-3xl border-2 border-rose-300 p-6 sm:p-8 shadow-xl text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-black text-rose-700">Certificate Not Found</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                {errorMsg}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
