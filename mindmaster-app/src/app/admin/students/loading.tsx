import React from "react";

export default function StudentsLoading() {
  return (
    <div className="p-6 bg-[#F5F7FF] min-h-screen space-y-6 animate-pulse">
      {/* Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-[#E4E8F8] rounded-xl" />
          <div className="h-4 w-80 bg-[#EEF2FC] rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-[#E4E8F8] rounded-full" />
          <div className="h-10 w-28 bg-[#E4E8F8] rounded-full" />
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4E8F8] flex flex-wrap gap-3">
        <div className="h-10 flex-1 min-w-[200px] bg-[#EEF2FC] rounded-xl" />
        <div className="h-10 w-36 bg-[#EEF2FC] rounded-xl" />
        <div className="h-10 w-36 bg-[#EEF2FC] rounded-xl" />
        <div className="h-10 w-36 bg-[#EEF2FC] rounded-xl" />
      </div>

      {/* Student Table Skeleton */}
      <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] space-y-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-16 w-full bg-[#FAFBFD] border border-[#EEF2FC] rounded-2xl p-4 flex items-center gap-4">
            <div className="h-5 w-5 bg-[#E4E8F8] rounded" />
            <div className="w-10 h-10 rounded-full bg-[#E4E8F8]" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-40 bg-[#E4E8F8] rounded" />
              <div className="h-3 w-28 bg-[#EEF2FC] rounded" />
            </div>
            <div className="h-6 w-32 bg-[#EEF2FC] rounded-full" />
            <div className="h-8 w-24 bg-[#E4E8F8] rounded-xl ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
