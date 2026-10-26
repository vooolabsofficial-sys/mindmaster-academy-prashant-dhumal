"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/navigation/AppShell";
import {
  Bell,
  CheckCheck,
  Tag,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  StudentNotification,
  getStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchDbStudentNotifications,
} from "@/lib/studentNotificationStore";

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "renewal" | "reminder" | "announcement">("all");
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const reload = async () => {
    // 1. Load immediately from local state
    setNotifications(getStudentNotifications());

    // 2. Fetch live from Supabase in_app_notifications
    try {
      const live = await fetchDbStudentNotifications();
      if (live && live.length > 0) {
        setNotifications(live);
      }
    } catch (e) {
      console.warn("Could not fetch live in_app_notifications from Supabase:", e);
    }
  };

  useEffect(() => {
    reload();
    const handleChanged = () => {
      setNotifications(getStudentNotifications());
    };
    window.addEventListener("mma_notifications_changed", handleChanged);
    return () => window.removeEventListener("mma_notifications_changed", handleChanged);
  }, []);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.readAt;
    if (filter === "renewal") return n.type === "renewal";
    if (filter === "reminder") return n.type === "reminder";
    if (filter === "announcement") return n.type === "announcement";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 font-sans select-none pb-12">
        {/* Header Bar */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E4E8F8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF4FF] text-[#0B57D0] flex items-center justify-center shadow-xs">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-[#0E1B3D] font-heading">
                  In-App Notification Center
                </h1>
                <p className="text-xs text-[#5A6478] mt-0.5">
                  Direct student alerts, access expiry warnings, renewal discounts, and academy updates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead()}
                className="px-4 py-2 rounded-full bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: "all", label: `All Alerts (${notifications.length})` },
            { key: "unread", label: `Unread (${unreadCount})` },
            { key: "renewal", label: "⏳ Expiring & Renewals" },
            { key: "reminder", label: "🧠 Study Routine" },
            { key: "announcement", label: "📢 Announcements" },
          ].map((item) => {
            const isActive = filter === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-[#0B57D0] text-white shadow-xs"
                    : "bg-white text-[#5A6478] hover:bg-[#F5F7FF] border border-[#E4E8F8]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E4E8F8] p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0E1B3D]">No notifications found</h3>
              <p className="text-xs text-[#8A94A6] mt-1">
                You are all caught up with your study routines and course notices.
              </p>
            </div>
          ) : (
            filtered.map((notif) => {
              const isUnread = !notif.readAt;
              const isRenewal = notif.type === "renewal";

              return (
                <div
                  key={notif.id}
                  className={`p-5 md:p-6 rounded-3xl border transition-all ${
                    isUnread
                      ? isRenewal
                        ? "bg-gradient-to-r from-amber-50/50 via-purple-50/30 to-white border-amber-200 shadow-sm"
                        : "bg-white border-[#0B57D0]/30 shadow-xs ring-1 ring-[#0B57D0]/10"
                      : "bg-white border-[#E4E8F8] opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-base shadow-xs ${
                          isRenewal
                            ? "bg-amber-100 text-amber-800"
                            : notif.type === "reminder"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isRenewal ? "⏳" : notif.type === "reminder" ? "🧠" : "📢"}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm md:text-base font-extrabold text-[#0E1B3D]">
                            {notif.title}
                          </h3>
                          {isUnread && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0B57D0] text-white">
                              NEW
                            </span>
                          )}
                          {notif.courseCode && (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#F5F7FF] text-[#0B57D0] rounded border border-[#D0E2FF]">
                              {notif.courseCode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5A6478] leading-relaxed max-w-2xl">
                          {notif.body}
                        </p>

                        {/* Renewal Coupon Card */}
                        {notif.couponCode && (
                          <div className="mt-3 p-3.5 bg-white border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                                🏷️
                              </span>
                              <div>
                                <p className="text-[11px] font-bold text-[#0E1B3D]">
                                  Personal Renewal Discount
                                </p>
                                <p className="text-[10px] text-[#5A6478]">
                                  Single-use voucher valid for 7 days
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopyCoupon(notif.couponCode!)}
                                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Tag className="w-3.5 h-3.5" />
                                <span>{copiedCoupon === notif.couponCode ? "Copied!" : notif.couponCode}</span>
                              </button>

                              {notif.actionUrl && (
                                <Link
                                  href={notif.actionUrl}
                                  onClick={() => markNotificationAsRead(notif.id)}
                                  className="px-4 py-1.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                                >
                                  <span>Renew Course</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0">
                      <span className="font-mono text-[11px] text-[#8A94A6] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{notif.createdAt}</span>
                      </span>

                      {isUnread && (
                        <button
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="text-[11px] font-bold text-[#5A6478] hover:text-[#0B57D0] hover:underline cursor-pointer"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
