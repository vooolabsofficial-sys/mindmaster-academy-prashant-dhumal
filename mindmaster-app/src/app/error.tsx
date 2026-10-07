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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      <div className="max-w-md w-full text-center bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-2">
          काहीतरी त्रुटी झाली (Unexpected Error)
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          तांत्रिक अडचणीमुळे ही स्क्रीन दाखवण्यात अडचण आली आहे. काळजी करू नका, तुमचे सेव्ह केलेले नोट्स व प्रोग्रेस सुरक्षित आहे.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>पुन्हा प्रयत्न करा (Retry)</span>
          </button>
          <Link
            href="/home"
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Home className="w-4 h-4" />
            <span>मुख्य पान (Home)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
