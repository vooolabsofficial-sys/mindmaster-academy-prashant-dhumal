import React from "react";

export default function GrantsLoading() {
  return (
    <div className="p-6 bg-[#F5F7FF] min-h-screen space-y-6 animate-pulse">
      <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-60 bg-[#E4E8F8] rounded-xl" />
          <div className="h-4 w-72 bg-[#EEF2FC] rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-[#E4E8F8] rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-[#E4E8F8] space-y-2">
            <div className="h-4 w-28 bg-[#EEF2FC] rounded" />
            <div className="h-7 w-32 bg-[#E4E8F8] rounded-xl" />
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 w-full bg-[#FAFBFD] border border-[#EEF2FC] rounded-2xl p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#E4E8F8]" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-44 bg-[#E4E8F8] rounded" />
              <div className="h-3 w-28 bg-[#EEF2FC] rounded" />
            </div>
            <div className="h-6 w-20 bg-[#EEF2FC] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
