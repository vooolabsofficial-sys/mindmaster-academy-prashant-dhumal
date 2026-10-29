import React from "react";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#F5F7FF] p-4 sm:p-6 lg:p-8 animate-pulse space-y-6 max-w-7xl mx-auto">
      {/* Banner Skeleton */}
      <div className="h-44 sm:h-56 rounded-3xl bg-slate-200/80" />

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white border border-slate-100 p-4 space-y-2">
            <div className="h-4 w-16 bg-slate-200 rounded" />
            <div className="h-6 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Courses Grid Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-white border border-slate-100 p-5 space-y-4">
              <div className="h-32 rounded-2xl bg-slate-200/80" />
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-200/70 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
