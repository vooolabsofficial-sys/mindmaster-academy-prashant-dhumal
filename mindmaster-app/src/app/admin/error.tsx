"use client";

import React, { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Segment Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F5F7FF]">
      <div className="bg-white border border-rose-200 shadow-xl rounded-3xl p-8 max-w-lg w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-3xl mx-auto">
          ⚠️
        </div>
        <h2 className="text-xl font-extrabold text-[#0E1B3D]">
          Operational Error in Admin Panel
        </h2>
        <p className="text-xs text-[#5A6478] leading-relaxed">
          {error.message ||
            "An unexpected error occurred while communicating with database services or rendering panel records."}
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-[#8A94A6] bg-[#F5F7FF] py-1 px-2 rounded">
            Digest: {error.digest}
          </p>
        )}
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0948AC] text-white rounded-full text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Retry Action
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#F5F7FF] hover:bg-[#EEF2FC] text-[#5A6478] rounded-full text-xs font-bold transition border border-[#E4E8F8] cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
