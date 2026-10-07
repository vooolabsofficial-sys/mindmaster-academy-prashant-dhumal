"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StaffUser } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffUsers,
  setCurrentStaff,
  logoutStaff,
} from "@/lib/staffStore";
import { getUnreadCountForStaff } from "@/lib/messageStore";

export default function AdminTopbar() {
  const router = useRouter();
  const [currentStaff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [allStaff, setAllStaff] = useState<StaffUser[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [msgUnread, setMsgUnread] = useState(0);

  useEffect(() => {
    setStaff(getCurrentStaff());
    setAllStaff(getStaffUsers());
    setMsgUnread(getUnreadCountForStaff());

    const handleStaffChange = () => {
      setStaff(getCurrentStaff());
      setAllStaff(getStaffUsers());
      setMsgUnread(getUnreadCountForStaff());
    };
    const handleMsgChange = () => setMsgUnread(getUnreadCountForStaff());

    window.addEventListener("mma_staff_changed", handleStaffChange);
    window.addEventListener("mma_messages_changed", handleMsgChange);
    return () => {
      window.removeEventListener("mma_staff_changed", handleStaffChange);
      window.removeEventListener("mma_messages_changed", handleMsgChange);
    };
  }, []);

  const handlePersonaSwitch = (staffId: string) => {
    const target = allStaff.find((s) => s.id === staffId);
    if (target) {
      if (target.mustChangePassword) {
        setCurrentStaff(target);
        router.push("/staff/change-password");
        return;
      }
      setCurrentStaff(target);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/staff/logout", { method: "POST" });
    } catch {}
    logoutStaff();
    router.push("/staff/login");
  };

  const homeHref = currentStaff.role === "sub_admin" ? "/sub" : "/admin";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E4E8F8] px-4 md:px-8 flex items-center justify-between shadow-sm">
      {/* Left: Brand Badge */}
      <div className="flex items-center gap-3">
        <Link href={homeHref} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0B57D0] to-[#0A1128] flex items-center justify-center text-white shadow-md font-bold text-lg group-hover:scale-105 transition-transform">
            🧠
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#0E1B3D] text-base leading-none font-heading">
                MindMaster Academy
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EBF3FE] text-[#0B57D0]">
                Admin Console
              </span>
            </div>
            <p className="text-[11px] text-[#5A6478] leading-none mt-1">
              Prashant Dhumal • Narhe Centre Desk
            </p>
          </div>
        </Link>
      </div>

      {/* Right: Persona Switcher, Notifications, Lavender Role Chip & Avatar */}
      <div className="flex items-center gap-3">
        {/* Quick Persona Switcher for Testing RBAC */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#F5F7FF] border border-[#E4E8F8] px-3 py-1 rounded-full text-xs">
          <span className="text-[#8A94A6] text-[10px] uppercase font-bold">Switch:</span>
          <select
            value={currentStaff.id}
            onChange={(e) => handlePersonaSwitch(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#0E1B3D] focus:outline-none cursor-pointer"
          >
            {allStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role === "main_admin" ? "Admin" : "Sub-Admin"})
              </option>
            ))}
          </select>
        </div>

        {/* Notifications Icon (Strictly In-App) */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-full bg-[#F5F7FF] hover:bg-[#EEF4FF] border border-[#E4E8F8] flex items-center justify-center text-sm text-[#0E1B3D] transition-colors relative"
            title="In-App System Alerts"
          >
            🔔
            {msgUnread > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-1 ring-2 ring-white">
                {msgUnread > 9 ? "9+" : msgUnread}
              </span>
            ) : (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E4E8F8] rounded-2xl shadow-xl p-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E8F8]">
                <span className="font-bold text-[#0E1B3D]">In-App Broadcasts</span>
                <span className="text-[10px] text-[#8A94A6] bg-slate-100 px-2 py-0.5 rounded-full">
                  No WhatsApp
                </span>
              </div>
              <div className="mt-2 space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#F5F7FF] border border-[#E4E8F8]">
                  <p className="font-semibold text-[#0E1B3D]">New Course Enrollment</p>
                  <p className="text-[#5A6478] text-[11px] mt-0.5">
                    Aditi Patil enrolled in Vedic Maths Speed Foundation.
                  </p>
                  <span className="text-[10px] text-[#8A94A6]">10 mins ago</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F5F7FF] border border-[#E4E8F8]">
                  <p className="font-semibold text-[#0E1B3D]">Coupon Redeemed</p>
                  <p className="text-[#5A6478] text-[11px] mt-0.5">
                    Code WELCOME50 applied by student Rahul Shinde.
                  </p>
                  <span className="text-[10px] text-[#8A94A6]">25 mins ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lavender Role Chip per design-reference/admin */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE] shadow-sm">
          <span className="text-xs">
            {currentStaff.role === "main_admin" ? "👑" : "🛡️"}
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wide">
            {currentStaff.role === "main_admin" ? "Main Admin" : "Sub-Admin"}
          </span>
        </div>

        {/* Staff Avatar with status ring */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E4E8F8]">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4338CA] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-[#DDD6FE]">
              {currentStaff.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-[#0E1B3D] leading-tight">
              {currentStaff.name}
            </p>
            <p className="text-[10px] text-[#7C3AED] font-semibold">
              {currentStaff.phone}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="ml-1 p-2 text-xs text-[#8A94A6] hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
            title="Sign Out"
          >
            🚪
          </button>
        </div>
      </div>
    </header>
  );
}
