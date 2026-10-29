"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { VideoOff, RotateCcw, Home } from "lucide-react";

export default function WatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Watch page playback error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center text-white">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <VideoOff className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Video Player Error</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Unable to load this video lecture or verify your access token. Please retry or return to your courses.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Lecture</span>
          </button>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 active:scale-95 transition"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
