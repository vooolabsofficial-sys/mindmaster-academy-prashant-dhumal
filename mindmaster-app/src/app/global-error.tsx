"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4F7FC] text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-500 mx-auto flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Application Error
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            A critical system error occurred. Your account data and progress remain intact.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 px-4 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
