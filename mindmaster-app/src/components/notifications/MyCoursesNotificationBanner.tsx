"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, ArrowRight, X, Clock, AlertTriangle, Sparkles } from "lucide-react";
import {
  StudentNotification,
  getStudentNotifications,
  markNotificationAsRead,
} from "@/lib/studentNotificationStore";

export default function MyCoursesNotificationBanner() {
  const [renewalNotif, setRenewalNotif] = useState<StudentNotification | null>(null);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const reload = () => {
      const notifs = getStudentNotifications();
      // Find latest unread renewal or expiring notification
      const renewal = notifs.find(
        (n) => (n.type === "renewal" || (n.daysLeft !== undefined && n.daysLeft <= 7)) && !n.readAt
      );
      setRenewalNotif(renewal || notifs.find((n) => n.type === "renewal") || null);
    };

    reload();
    window.addEventListener("mma_notifications_changed", reload);
    return () => window.removeEventListener("mma_notifications_changed", reload);
  }, []);

  if (!renewalNotif || dismissed) return null;

  const handleCopy = () => {
    if (renewalNotif.couponCode) {
      navigator.clipboard.writeText(renewalNotif.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDismiss = () => {
    markNotificationAsRead(renewalNotif.id);
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border-2 border-amber-300 rounded-3xl p-5 md:p-6 shadow-sm relative overflow-hidden transition-all">
      {/* Background Accent Pill */}
      <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider">
                ⏳ 3-Month Expiry Reminder
              </span>
              <span className="text-xs font-mono font-bold text-amber-900">
                {renewalNotif.daysLeft ? `Expires in ${renewalNotif.daysLeft} days` : "Action Recommended"}
              </span>
            </div>

            <h3 className="text-sm md:text-base font-extrabold text-[#0E1B3D]">
              {renewalNotif.title}
            </h3>

            <p className="text-xs text-[#5A6478] max-w-2xl leading-relaxed">
              {renewalNotif.body}
            </p>
          </div>
        </div>

        {/* Right CTA / Coupon Area */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0 pt-2 md:pt-0">
          {renewalNotif.couponCode && (
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Copy personal renewal coupon"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{copied ? "Copied!" : renewalNotif.couponCode}</span>
            </button>
          )}

          {renewalNotif.actionUrl && (
            <Link
              href={renewalNotif.actionUrl}
              className="px-5 py-2 rounded-xl bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-500/25 cursor-pointer"
            >
              <span>Renew Access (50% OFF)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center border border-slate-200 transition cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
