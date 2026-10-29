"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { FileWarning, RotateCcw, Home } from "lucide-react";

export default function NotesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Notes workspace error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <FileWarning className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Notes Workspace Error</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Unable to synchronize your lecture notes with offline storage. Please retry or return to your dashboard.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Notes</span>
          </button>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 active:scale-95 transition"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
