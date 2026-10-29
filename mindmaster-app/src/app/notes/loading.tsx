import React from "react";

export default function NotesLoading() {
  return (
    <div className="min-h-screen bg-[#F5F7FF] p-4 sm:p-6 lg:p-8 animate-pulse space-y-6 max-w-7xl mx-auto">
      <div className="h-20 bg-white rounded-3xl border border-slate-100 p-6 flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-200/60 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-96 bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="h-10 w-full bg-slate-200 rounded-xl" />
          <div className="h-48 w-full bg-slate-200/70 rounded-xl" />
        </div>
        <div className="lg:col-span-7 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-3xl border border-slate-100 p-5 space-y-3">
              <div className="h-4 w-1/3 bg-slate-200 rounded" />
              <div className="h-3 w-3/4 bg-slate-200/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
