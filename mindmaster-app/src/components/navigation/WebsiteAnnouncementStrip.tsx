"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, Copy, Check, Sparkles, ExternalLink } from "lucide-react";
import { AnnouncementConfig, DEFAULT_WEBSITE_CMS } from "@/lib/websiteCmsStore";

const THEME_STYLES: Record<string, { bg: string; badgeBg: string; buttonBg: string; couponBg: string }> = {
  saffron: {
    bg: "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white border-b border-amber-400/30",
    badgeBg: "bg-white/20 text-white border border-white/30",
    buttonBg: "bg-white text-orange-900 hover:bg-amber-100",
    couponBg: "bg-yellow-300 text-slate-950 font-black",
  },
  navy: {
    bg: "bg-gradient-to-r from-[#0E1B3D] via-[#0B57D0] to-[#0E1B3D] text-white border-b border-blue-400/20",
    badgeBg: "bg-blue-400/20 text-blue-200 border border-blue-300/30",
    buttonBg: "bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold",
    couponBg: "bg-emerald-400 text-slate-950 font-black",
  },
  crimson: {
    bg: "bg-gradient-to-r from-red-700 via-rose-600 to-red-800 text-white border-b border-red-400/30",
    badgeBg: "bg-white/20 text-white border border-white/30",
    buttonBg: "bg-white text-red-900 hover:bg-rose-100",
    couponBg: "bg-yellow-300 text-slate-950 font-black",
  },
  emerald: {
    bg: "bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 text-white border-b border-emerald-400/30",
    badgeBg: "bg-emerald-400/20 text-emerald-100 border border-emerald-300/30",
    buttonBg: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold",
    couponBg: "bg-white text-emerald-950 font-black",
  },
  purple: {
    bg: "bg-gradient-to-r from-purple-900 via-indigo-800 to-purple-950 text-white border-b border-purple-400/30",
    badgeBg: "bg-purple-300/20 text-purple-100 border border-purple-300/30",
    buttonBg: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold",
    couponBg: "bg-emerald-400 text-slate-950 font-black",
  },
};

export default function WebsiteAnnouncementStrip() {
  const [announcement, setAnnouncement] = useState<AnnouncementConfig | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // default hidden until verified
  const [copiedCoupon, setCopiedCoupon] = useState<boolean>(false);

  useEffect(() => {
    // Check if dismissed in this session
    try {
      const dismissed = sessionStorage.getItem("mma_announcement_dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
        return;
      }
    } catch {}

    // Load CMS announcement configuration
    async function loadAnnouncement() {
      try {
        const res = await fetch("/api/website-cms");
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.announcement) {
            setAnnouncement(json.data.announcement);
            setIsDismissed(!json.data.announcement.enabled);
            return;
          }
        }
      } catch (err) {
        console.warn("Announcement strip fetch notice:", err);
      }

      // Fallback to default
      setAnnouncement(DEFAULT_WEBSITE_CMS.announcement);
      setIsDismissed(!DEFAULT_WEBSITE_CMS.announcement.enabled);
    }

    loadAnnouncement();

    // Listen for live updates when admin edits CMS in another tab
    const handleCmsUpdate = () => loadAnnouncement();
    window.addEventListener("mma_website_cms_updated", handleCmsUpdate);
    return () => window.removeEventListener("mma_website_cms_updated", handleCmsUpdate);
  }, []);

  if (!announcement || !announcement.enabled || isDismissed) {
    return null;
  }

  const themeKey = announcement.themeColor && THEME_STYLES[announcement.themeColor] ? announcement.themeColor : "navy";
  const theme = THEME_STYLES[themeKey];

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem("mma_announcement_dismissed", "true");
    } catch {}
  };

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!announcement.couponBadge) return;
    navigator.clipboard.writeText(announcement.couponBadge);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  return (
    <div
      role="region"
      aria-label="Announcement Banner"
      className={`relative z-40 w-full transition-all duration-300 ${theme.bg}`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs">
        {/* Left: Tag + Message */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 flex items-center gap-1 ${theme.badgeBg}`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{announcement.tagText || "विशेष सूचना"}</span>
          </span>

          <p className="font-semibold truncate sm:whitespace-normal text-xs leading-snug">
            {announcement.message || "माइंडमास्टर अकॅडमी विशेष घोषणा"}
          </p>
        </div>

        {/* Right: Coupon Badge + CTA Button + Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Coupon Code Chip */}
          {announcement.couponBadge && (
            <button
              type="button"
              onClick={handleCopyCoupon}
              title="कूपन कोड कॉपी करा"
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] tracking-wider uppercase flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-xs ${theme.couponBg}`}
            >
              {copiedCoupon ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3 opacity-70" />}
              <span>{copiedCoupon ? "कॉपी झाले!" : announcement.couponBadge}</span>
            </button>
          )}

          {/* Action Link / Button */}
          {announcement.ctaText && (
            <Link
              href={announcement.ctaUrl || "/courses"}
              className={`px-3 py-1 sm:py-1.5 rounded-full text-[11px] font-bold shadow-xs transition active:scale-95 flex items-center gap-1 whitespace-nowrap ${theme.buttonBg}`}
            >
              <span>{announcement.ctaText}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
          )}

          {/* Close Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="पट्टी बंद करा"
            title="ही सूचना पट्टी लपवा"
            className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-xs transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
