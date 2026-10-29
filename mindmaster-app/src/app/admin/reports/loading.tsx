import React from "react";

export default function ReportsLoading() {
  return (
    <div className="p-6 bg-[#F5F7FF] min-h-screen space-y-6 animate-pulse">
      <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-[#E4E8F8] rounded-xl" />
          <div className="h-4 w-72 bg-[#EEF2FC] rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-[#E4E8F8] rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] h-72 space-y-4">
          <div className="h-5 w-40 bg-[#E4E8F8] rounded" />
          <div className="h-48 w-full bg-[#FAFBFD] rounded-2xl" />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] h-72 space-y-4">
          <div className="h-5 w-40 bg-[#E4E8F8] rounded" />
          <div className="h-48 w-full bg-[#FAFBFD] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
