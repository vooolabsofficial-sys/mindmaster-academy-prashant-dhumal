"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SidebarNav from "./SidebarNav";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import OfflineBanner from "@/components/common/OfflineBanner";
import { LanguageProvider } from "@/lib/LanguageContext";
import { createClient } from "@/lib/supabase/client";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function verifyAuthAndProfile() {
      const currentPath = pathname || "/home";

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Check if profile exists and has a full_name
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, is_verified")
            .eq("id", user.id)
            .maybeSingle();

          const localProfile = localStorage.getItem("mindmaster_user_profile");
          const hasCompletedProfile = (profile && profile.full_name) || localProfile;

          if (!hasCompletedProfile) {
            router.replace(`/onboarding?next=${encodeURIComponent(currentPath)}`);
            return;
          }

          setIsAuthenticated(true);
          return;
        }
      } catch (err) {
        console.warn("Client auth check fallback to storage:", err);
      }

      // Check localStorage session fallback for demo / test environment
      const localToken = localStorage.getItem("mindmaster_session_token");
      if (localToken) {
        const localProfile = localStorage.getItem("mindmaster_user_profile");
        if (!localProfile) {
          router.replace(`/onboarding?next=${encodeURIComponent(currentPath)}`);
          return;
        }
        setIsAuthenticated(true);
        return;
      }

      // No session found -> redirect to login
      router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
    }

    verifyAuthAndProfile();
  }, [pathname, router]);

  // Loading state while verifying auth to prevent content flashing
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-900">
            Verifying MindMaster Academy session...
          </span>

        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen flex bg-slate-50 text-slate-800">
        {/* Desktop Left Sidebar */}
        <SidebarNav />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
          {/* Offline Connectivity Status */}
          <OfflineBanner />

          {/* Top Header */}
          <TopBar />

          {/* Page Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </LanguageProvider>
  );
}
