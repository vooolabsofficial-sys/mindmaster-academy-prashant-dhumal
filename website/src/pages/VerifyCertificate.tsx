import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { getAppUrl } from '../config/appConfig';

export interface VerifiedCertificate {
  id: string;
  certificate_no: string;
  student_name: string;
  student_phone_masked: string;
  course_title: string;
  course_code?: string;
  category: string;
  issued_at_ist: string;
  signatory_name: string;
  signatory_title: string;
  academy_name: string;
  centres: string;
  status: string;
  grade?: string;
  roll_no?: string;
  completion_percentage?: number;
}

export const VerifyCertificate: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCert = searchParams.get('cert') || searchParams.get('no') || '';

  const [serialInput, setSerialInput] = useState(queryCert);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [certData, setCertData] = useState<VerifiedCertificate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  const handleVerify = async (serialToTest?: string) => {
    const rawTarget = (serialToTest || serialInput).trim();
    if (!rawTarget) {
      setErrorMsg('Please enter a Certificate Serial Number.');
      return;
    }
    const target = rawTarget.toUpperCase();

    setIsLoading(true);
    setErrorMsg(null);
    setSearched(true);
    setCertData(null);

    // Update query params without reloading
    setSearchParams({ cert: target });

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
      setErrorMsg('Could not verify with server. Please verify your connection or check serial number.');
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

  const handleCopyLink = () => {
    if (!certData) return;
    const url = `https://mindmasteredu.in/verify-certificate?cert=${encodeURIComponent(certData.certificate_no)}`;
    navigator.clipboard.writeText(url);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppShareUrl = () => {
    if (!certData) return '#';
    const text = `🎓 Verified MindMaster Academy Credential!\n\nStudent: ${certData.student_name}\nCourse: ${certData.course_title}\nGrade: ${certData.grade || 'Certified'}\nSerial: ${certData.certificate_no}\n\nAuthenticate official certificate online:\nhttps://mindmasteredu.in/verify-certificate?cert=${encodeURIComponent(certData.certificate_no)}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <main className="w-full pt-24 sm:pt-28 bg-slate-50 min-h-screen print:pt-0 print:bg-white">
      <SEO
        title="Verify Certificate & Marksheet Online | MindMaster Academy"
        description="Verify the authenticity of MindMaster Academy course completion certificates and marksheets issued by Prashant Dhumal Sir. Real-time cryptographic validation."
        keywords="Verify MindMaster Certificate, Prashant Dhumal Certificate Check, Vedic Maths Certificate Verification Satara, Digital Marksheet Verification"
      />

      {/* Print isolation style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-certificate, #printable-certificate * {
            visibility: visible;
          }
          #printable-certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 2px solid #0E1B3D !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center">
        {/* Verification Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 print:hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
            <span>Official Academy Credential Verification Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Authenticate Certificate &amp; Marksheet
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Verify official course completion certificates, grades, and speed arithmetic credentials issued by <strong>Prashant Dhumal Sir</strong>. Enter the unique serial number printed on your certificate or scan the QR code to verify.
          </p>
        </div>

        {/* Input Box Card */}
        <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 mb-6 print:hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xl pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                placeholder="e.g. MMA-RVK-6789-VM26-K8X2"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 rounded-2xl text-xs sm:text-sm font-mono font-bold text-slate-900 tracking-wider placeholder:text-slate-400 focus:outline-none transition uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="py-3.5 px-6 bg-gradient-to-r from-[#0052FF] to-[#0E1B3D] hover:opacity-95 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-md shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">verified</span>
                  <span>Verify Now</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Authenticated Result Display */}
        {certData && (
          <div className="w-full max-w-2xl space-y-4 animate-fade-in">
            {/* Action Bar Above Certificate */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">Official Authenticated Record</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                  title="Print or Save as PDF"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Print / PDF</span>
                </button>
                <a
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                  title="Share Verified Credential on WhatsApp"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  <span>WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052FF] text-xs font-bold transition cursor-pointer"
                  title="Copy verification link"
                >
                  <span className="material-symbols-outlined text-[16px]">link</span>
                  <span>{copiedToast ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Printable Certificate Card */}
            <div
              id="printable-certificate"
              className="bg-white rounded-3xl border-4 border-[#0E1B3D] p-6 sm:p-10 shadow-2xl relative overflow-hidden"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(240, 244, 255, 0.4) 0%, rgba(255, 255, 255, 1) 100%)',
              }}
            >
              {/* Ornamental Frame Corner Accents */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-500 pointer-events-none" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-500 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-500 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-500 pointer-events-none" />

              {/* Certificate Header */}
              <div className="text-center border-b-2 border-slate-200 pb-5 mb-6 relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                  <span>ISO 9001:2015 CERTIFIED COGNITIVE PEDAGOGY</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0E1B3D] tracking-tight uppercase font-heading">
                  MindMaster Academy
                </h2>
                <p className="text-xs text-[#0052FF] font-bold tracking-widest uppercase mt-0.5">
                  Institute of Memory Science &amp; Vedic Mathematics
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Satara Flagship Campus HQ, Maharashtra • Reg. No. MMA-EDU-2026
                </p>
              </div>

              {/* Certificate Body */}
              <div className="text-center space-y-4 my-6">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  Certificate of Cognitive Excellence &amp; Mastery
                </span>

                <p className="text-xs text-slate-500 italic mt-2">
                  This official credential certifies that
                </p>

                {/* Student Full Name */}
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-serif border-b-2 border-amber-400/60 pb-2 inline-block px-4">
                  {certData.student_name}
                </h3>

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
                  {certData.roll_no && (
                    <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-md">
                      Roll No: <strong>{certData.roll_no}</strong>
                    </span>
                  )}
                  <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-md">
                    Reg: <strong>{certData.student_phone_masked}</strong>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 max-w-lg mx-auto leading-relaxed pt-2">
                  has successfully demonstrated extraordinary mental calculation mastery and completed all syllabus modules of:
                </p>

                {/* Course Name */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 max-w-xl mx-auto">
                  <h4 className="text-base sm:text-lg font-extrabold text-[#0052FF]">
                    {certData.course_title}
                  </h4>
                  <span className="text-xs font-semibold text-slate-600">
                    Category: {certData.category}
                  </span>
                </div>

                {/* Performance Grade Badge */}
                {certData.grade && (
                  <div className="inline-block mt-2">
                    <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300">
                      🏆 Result: {certData.grade}
                    </span>
                  </div>
                )}
              </div>

              {/* Certificate Footer: Seal, QR Code & Signatory */}
              <div className="pt-6 border-t-2 border-slate-200 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                {/* QR Code Verification */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://mindmasteredu.in/verify-certificate?cert=${encodeURIComponent(certData.certificate_no)}`}
                    alt="Certificate QR Verification Code"
                    className="w-20 h-20 rounded-lg border border-slate-300 p-1 bg-white shadow-xs"
                  />
                  <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase">
                    Scan to Verify Online
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-800">
                    {certData.certificate_no}
                  </span>
                </div>

                {/* Academy Seal */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-18 h-18 rounded-full border-3 border-dashed border-amber-600 bg-amber-50/80 p-2 flex flex-col items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-amber-700 text-xl">verified</span>
                    <span className="text-[7px] font-black uppercase text-amber-900 leading-tight">
                      MINDMASTER<br />OFFICIAL SEAL<br />SATARA
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">
                    Issued: {certData.issued_at_ist}
                  </span>
                </div>

                {/* Authorized Signatory */}
                <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
                  <div className="font-serif italic font-bold text-lg text-slate-900 border-b border-slate-400 pb-0.5 px-2">
                    Prashant Dhumal
                  </div>
                  <span className="text-xs font-bold text-slate-900 mt-0.5">
                    {certData.signatory_name}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    {certData.signatory_title}
                  </span>
                  <span className="text-[9px] text-[#0052FF] font-semibold mt-0.5">
                    MindMaster Academy Satara
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Not Found Alert */}
        {searched && errorMsg && (
          <div className="w-full max-w-2xl bg-white rounded-3xl border-2 border-rose-300 p-6 sm:p-8 shadow-xl text-center space-y-4 animate-fade-in print:hidden">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">cancel</span>
            </div>

            <div>
              <h3 className="text-lg font-black text-rose-700">Certificate Not Found</h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                {errorMsg}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
