import Link from "next/link";
import { ArrowLeft, BookOpen, GraduationCap, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-[#0052FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 bg-white/85 border border-white/80 rounded-3xl p-8 backdrop-blur-3xl shadow-[0_24px_70px_rgba(0,82,255,0.12)] ring-1 ring-slate-900/5">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0052FF] to-sky-400 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 text-white">
          <GraduationCap className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0052FF] text-xs font-black uppercase tracking-widest mb-2">
          404 • Page Not Found
        </span>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          Page Not Found
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/home"
            className="flex-1 py-3 px-4 bg-[#0052FF] hover:bg-[#0047E0] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
          <Link
            href="/courses"
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-200 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Courses</span>
          </Link>
        </div>
      </div>

      <footer className="mt-8 text-slate-400 text-xs">
        © 2026 MindMaster Academy • Prashant Dhumal Sir
      </footer>
    </div>
  );
}
