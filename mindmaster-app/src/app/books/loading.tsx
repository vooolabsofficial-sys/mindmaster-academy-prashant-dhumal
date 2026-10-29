import React from "react";

export default function BooksLoading() {
  return (
    <div className="min-h-screen bg-[#F5F7FF] p-4 sm:p-6 lg:p-8 animate-pulse space-y-6 max-w-7xl mx-auto">
      <div className="h-8 w-56 bg-slate-200 rounded" />
      <div className="h-4 w-80 bg-slate-200/70 rounded" />

      {/* Categories chips skeleton */}
      <div className="flex gap-2 overflow-x-auto py-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-28 rounded-full bg-slate-200 shrink-0" />
        ))}
      </div>

      {/* Books grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="aspect-3/4 rounded-2xl bg-slate-200" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-1/2 bg-slate-200/60 rounded" />
            <div className="h-9 w-full bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
