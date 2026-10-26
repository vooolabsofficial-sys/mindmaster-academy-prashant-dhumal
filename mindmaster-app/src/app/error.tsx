"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      <div className="max-w-md w-full text-center bg-white/85 border border-white/80 rounded-3xl p-8 backdrop-blur-3xl shadow-[0_24px_70px_rgba(0,82,255,0.12)] ring-1 ring-slate-900/5">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-500 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Something went wrong
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          An unexpected error occurred while loading this page. Don&apos;t worry, your saved notes and course progress are completely safe.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-3 px-4 bg-[#0052FF] hover:bg-[#0047E0] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/home"
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-200 transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
