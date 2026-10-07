import Link from "next/link";
import { ArrowLeft, BookOpen, GraduationCap, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
          <GraduationCap className="w-8 h-8 text-slate-950" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest mb-2">
          ४०४ • पान सापडले नाही
        </span>

        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          पेज उपलब्ध नाही (Page Not Found)
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          तुम्ही शोधत असलेले पान हलवले गेले आहे किंवा लिंक चुकीची आहे. कृपया खालील पर्यायांमधून मुख्य पानावर जा.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/home"
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
          >
            <Home className="w-4 h-4" />
            <span>मुख्य पान (Home)</span>
          </Link>
          <Link
            href="/courses"
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>कोर्सेस पहा (Courses)</span>
          </Link>
        </div>
      </div>

      <footer className="mt-8 text-slate-600 text-xs">
        © 2026 MindMaster Academy • प्रशांत धुमाळ सर
      </footer>
    </div>
  );
}
