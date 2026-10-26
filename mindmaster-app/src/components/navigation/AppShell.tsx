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

    async function verifyAuthAndProfile() {
      const currentPath = pathname || "/home";

      // Check localStorage session first
      const localToken = localStorage.getItem("mindmaster_session_token");
      const localProfile = localStorage.getItem("mindmaster_user_profile");

      if (localToken && localProfile) {
        setIsAuthenticated(true);
        return;
      }

      // If localStorage profile/session is missing (e.g. crossing website/ port 5173 -> app port 3000),
      // DO NOT bounce to /login immediately. First call /api/student/auth using HTTP cookies to hydrate localStorage.
      try {
        const res = await fetch("/api/student/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "validate-session",
            token: localToken || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && (data.valid || data.success) && data.user) {
            localStorage.setItem("mindmaster_session_token", data.sessionToken || localToken || `tok-${data.user.id}`);
            localStorage.setItem("mindmaster_verified_phone", data.user.phone);
            localStorage.setItem("mindmaster_user_profile", JSON.stringify(data.user));

            if (data.onboardingCompleted || data.onboarding_completed) {
              localStorage.setItem("mindmaster_onboarding_completed", "true");
              setIsAuthenticated(true);
            } else {
              window.location.href = `/onboarding?next=${encodeURIComponent(currentPath)}&phone=${encodeURIComponent(data.user.phone)}`;
            }
            return;
          }
        }
      } catch (hydrationErr) {
        console.warn("Session hydration error in AppShell:", hydrationErr);
      }

      // Fallback check for Supabase OAuth session
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, is_verified, onboarding_completed, district, school_name, village")
            .eq("id", user.id)
            .maybeSingle();

          const hasCompletedProfile = (profile && profile.full_name) || Boolean(profile?.onboarding_completed);

          if (!hasCompletedProfile) {
            window.location.href = `/onboarding?next=${encodeURIComponent(currentPath)}`;
            return;
          }

          setIsAuthenticated(true);
          return;
        }
      } catch (err) {
        console.warn("Client auth check fallback to storage:", err);
      }

      if (localToken && !localProfile) {
        window.location.href = `/onboarding?next=${encodeURIComponent(currentPath)}`;
        return;
      }

      // No valid session found -> redirect to login
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
