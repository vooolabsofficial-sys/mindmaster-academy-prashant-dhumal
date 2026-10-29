"use client";

import React, { useEffect } from "react";

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Reports & Analytics Error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#F5F7FF]">
      <div className="bg-white border border-rose-200 shadow-xl rounded-3xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto">
          📊
        </div>
        <h2 className="text-lg font-bold text-[#0E1B3D]">
          Analytics Hub Error
        </h2>
        <p className="text-xs text-[#5A6478]">
          {error.message || "Failed to load telemetry or compute analytics metrics."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0948AC] text-white rounded-full text-xs font-bold transition shadow-xs cursor-pointer"
        >
          Recalculate
        </button>
      </div>
    </div>
  );
}
