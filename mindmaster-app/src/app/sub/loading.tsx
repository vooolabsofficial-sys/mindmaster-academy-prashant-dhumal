import React from "react";

export default function SubLoading() {
  return (
    <div className="p-6 bg-[#F5F7FF] min-h-screen space-y-6 animate-pulse">
      <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#E4E8F8] rounded-xl" />
          <div className="h-4 w-64 bg-[#EEF2FC] rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-[#E4E8F8] space-y-2">
            <div className="h-4 w-28 bg-[#EEF2FC] rounded" />
            <div className="h-7 w-32 bg-[#E4E8F8] rounded-xl" />
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] h-64" />
    </div>
  );
}
