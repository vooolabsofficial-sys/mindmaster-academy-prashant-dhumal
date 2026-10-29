import React from "react";

export default function WatchLoading() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 animate-pulse text-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Video Player Skeleton (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="aspect-video w-full rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-3 border-blue-500/30 border-t-blue-500 animate-spin" />
          </div>
          <div className="h-6 w-3/4 bg-slate-800 rounded" />
          <div className="h-4 w-1/2 bg-slate-800/60 rounded" />
        </div>

        {/* Lessons Playlist Sidebar Skeleton (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="h-6 w-32 bg-slate-800 rounded mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-900 border border-slate-800 p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-3/4 bg-slate-800 rounded" />
                <div className="h-2 w-1/3 bg-slate-800/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
