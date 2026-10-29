import React from "react";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-600 flex items-center justify-center mb-4">
        <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="h-4 w-32 bg-slate-200 rounded-md mb-2" />
      <div className="h-3 w-48 bg-slate-200/70 rounded-md" />
    </div>
  );
}
