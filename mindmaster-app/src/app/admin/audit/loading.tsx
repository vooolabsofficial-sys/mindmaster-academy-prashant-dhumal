import React from "react";

export default function AuditLoading() {
  return (
    <div className="p-6 bg-[#F5F7FF] min-h-screen space-y-6 animate-pulse">
      <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#E4E8F8] rounded-xl" />
          <div className="h-4 w-72 bg-[#EEF2FC] rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-[#E4E8F8] rounded-full" />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 w-full bg-[#FAFBFD] border border-[#EEF2FC] rounded-xl flex items-center px-4 gap-4">
            <div className="h-4 w-28 bg-[#E4E8F8] rounded font-mono" />
            <div className="h-4 w-32 bg-[#E4E8F8] rounded" />
            <div className="h-5 w-24 bg-[#EEF2FC] rounded-full" />
            <div className="h-4 w-36 bg-[#E4E8F8] rounded" />
            <div className="h-4 w-48 bg-[#EEF2FC] rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
