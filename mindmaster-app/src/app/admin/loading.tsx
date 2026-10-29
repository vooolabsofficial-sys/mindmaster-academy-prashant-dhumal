import React from "react";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#F5F7FF] p-6 sm:p-8 animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#E4E8F8] rounded-xl" />
          <div className="h-4 w-72 bg-[#EEF2FC] rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-[#E4E8F8] rounded-full" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-[#E4E8F8] space-y-3">
            <div className="h-4 w-24 bg-[#EEF2FC] rounded" />
            <div className="h-8 w-36 bg-[#E4E8F8] rounded-xl" />
            <div className="h-3 w-20 bg-[#EEF2FC] rounded" />
          </div>
        ))}
      </div>

      {/* Table / Content Skeleton */}
      <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-[#E4E8F8]">
          <div className="h-5 w-40 bg-[#E4E8F8] rounded-lg" />
          <div className="h-9 w-64 bg-[#EEF2FC] rounded-full" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 w-full bg-[#F8FAFF] border border-[#EEF2FC] rounded-xl flex items-center px-4 gap-4">
              <div className="h-4 w-6 bg-[#E4E8F8] rounded" />
              <div className="h-4 w-40 bg-[#E4E8F8] rounded" />
              <div className="h-4 w-32 bg-[#EEF2FC] rounded" />
              <div className="h-4 w-20 bg-[#EEF2FC] rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
