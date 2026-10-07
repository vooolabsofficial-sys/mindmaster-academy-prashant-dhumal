"use client";

import React, { ReactNode } from "react";
import AdminTopbar from "./AdminTopbar";
import AdminSidebar from "./AdminSidebar";

interface AdminShellProps {
  children: ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#F5F7FF] flex flex-col font-sans">
      <AdminTopbar />
      <div className="flex flex-1">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Universal Footer as required by DESIGN.md */}
      <footer className="py-4 border-t border-[#E4E8F8] bg-white text-center text-xs text-[#8A94A6]">
        ● Single sign-on active across MindMaster domains (Portal, TestSeries, VideoPlayer) | Privacy Policy • Terms of Service • Narhe Centre Desk • v2.0.0 (Phase-2 Staff Console)
      </footer>
    </div>
  );
}
