"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Tag, ArrowRight, ExternalLink } from "lucide-react";
import {
  StudentNotification,
  getStudentNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/studentNotificationStore";

export default function StudentNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const reload = () => {
    setNotifications(getStudentNotifications());
    setUnreadCount(getUnreadNotificationCount());
  };

  useEffect(() => {
    reload();
    window.addEventListener("mma_notifications_changed", reload);
    return () => window.removeEventListener("mma_notifications_changed", reload);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleCopyCoupon = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const handleItemClick = (notif: StudentNotification) => {
    if (!notif.readAt) {
      markNotificationAsRead(notif.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition relative cursor-pointer active:scale-95"
        title="In-App Notifications"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-[#E4E8F8] shadow-2xl z-50 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-gradient-to-b from-[#FAFBFD] to-white border-b border-[#E4E8F8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#0E1B3D]">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EEF4FF] text-[#0B57D0]">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                  All caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead()}
                className="text-[11px] font-bold text-[#0B57D0] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Container */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E4E8F8]/60">
            {notifications.length === 0 ? (
              <div className="text-center py-10 px-4 text-xs text-[#8A94A6]">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No in-app notifications yet.
              </div>
            ) : (
              notifications.slice(0, 5).map((notif) => {
                const isUnread = !notif.readAt;
                const isRenewal = notif.type === "renewal";

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 hover:bg-[#F8FAFF] transition cursor-pointer flex flex-col gap-1.5 relative ${
                      isUnread ? "bg-[#F5F8FF]/60" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {isRenewal ? "⏳" : notif.type === "reminder" ? "🧠" : "📢"}
                        </span>
                        <h4 className="text-xs font-bold text-[#0E1B3D] leading-tight line-clamp-1">
                          {notif.title}
                        </h4>
                      </div>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#0B57D0] shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-[11px] text-[#5A6478] leading-relaxed pl-5">
                      {notif.body}
                    </p>

                    {/* Coupon Pill if Renewal Notification */}
                    {notif.couponCode && (
                      <div className="pl-5 pt-1 flex items-center gap-2 flex-wrap">
                        <button
                          onClick={(e) => handleCopyCoupon(notif.couponCode!, e)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{copiedCoupon === notif.couponCode ? "Copied!" : `Code: ${notif.couponCode}`}</span>
                        </button>
                        {notif.actionUrl && (
                          <Link
                            href={notif.actionUrl}
                            onClick={() => setIsOpen(false)}
                            className="px-2.5 py-1 bg-[#0B57D0] text-white hover:bg-[#0842A0] rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-xs"
                          >
                            <span>Apply & Renew</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    )}

                    <div className="pl-5 pt-1 flex items-center justify-between text-[10px] text-[#8A94A6]">
                      <span>{notif.createdAt}</span>
                      {notif.courseCode && (
                        <span className="font-mono font-semibold">{notif.courseCode}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer View All Link */}
          <div className="p-3 bg-[#FAFBFD] border-t border-[#E4E8F8] text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#0B57D0] hover:text-[#0842A0] inline-flex items-center gap-1.5"
            >
              <span>View All In-App Notifications</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
