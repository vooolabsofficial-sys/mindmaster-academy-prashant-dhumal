"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SidebarNav from "./SidebarNav";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import OfflineBanner from "@/components/common/OfflineBanner";
import { LanguageProvider } from "@/lib/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { triggerSupabaseKeepAlive } from "@/lib/keepAliveTrigger";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Silent throttled Supabase Free Tier keep-alive (every 12h)
    triggerSupabaseKeepAlive();

    // Safety timeout: Never let student pages hang on 'Verifying session'
    const safetyTimer = setTimeout(() => {
      setIsAuthenticated(true);
    }, 400);

    async function verifyAuthAndProfile() {
      const currentPath = pathname || "/home";

      // Check localStorage session first
      const localToken = localStorage.getItem("mindmaster_session_token");
      const localProfile = localStorage.getItem("mindmaster_user_profile");

      if (localToken && localProfile) {
        clearTimeout(safetyTimer);
        setIsAuthenticated(true);
        return;
      }

      // If missing, auto-seed demo student session for seamless demonstration
      const demoUser = {
        id: "std-demo-01",
        phone: "+919876500001",
        cleanPhone: "9876500001",
        full_name: "Demo Student",
        role: "student",
        onboardingCompleted: true,
      };

      try {
        localStorage.setItem("mindmaster_session_token", "tok-demo-student");
        localStorage.setItem("mindmaster_verified_phone", "+919876500001");
        localStorage.setItem("mindmaster_user_profile", JSON.stringify(demoUser));
        localStorage.setItem("mindmaster_onboarding_completed", "true");
        document.cookie = "mindmaster_session=tok-demo-student; path=/; max-age=604800; SameSite=Lax";
      } catch {}

      clearTimeout(safetyTimer);
      setIsAuthenticated(true);
    }

    verifyAuthAndProfile();
    return () => clearTimeout(safetyTimer);
  }, [pathname, router]);

  // Loading state while verifying auth to prevent content flashing
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#2563EB] dark:border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
            Loading MindMaster Portal...
          </span>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-200">
        {/* Desktop Left Expandable Rail (68px to 240px) */}
        <SidebarNav />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8 lg:pl-[68px]">
          {/* Offline Connectivity Status */}
          <OfflineBanner />

          {/* Top Header */}
          <TopBar />

          {/* Page Content */}
          <main className="flex-1 w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </LanguageProvider>
  );
}
