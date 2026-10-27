"use client";

import React from "react";
import Link from "next/link";

interface Props {
  activeRole: "student" | "sub_admin" | "main_admin";
}

export default function AuthRoleSwitcher({ activeRole }: Props) {
  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto mb-6">
      <div className="bg-[#EAEFFD] p-1.5 rounded-2xl flex items-center gap-1 border border-[#D5E0FA] shadow-xs">
        {/* Student Tab */}
        <Link
          href="/login"
          className={`flex-1 py-2 px-2.5 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeRole === "student"
              ? "bg-white text-[#0B57D0] shadow-sm border border-[#C5D8FB]"
              : "text-[#5A6478] hover:text-[#0E1B3D] hover:bg-white/50"
          }`}
        >
          <span>👨‍🎓</span>
          <span className="hidden xs:inline">Student</span>
          <span className="xs:hidden">Student</span>
        </Link>

        {/* Sub-Admin Tab */}
        <Link
          href="/sub/login"
          className={`flex-1 py-2 px-2.5 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeRole === "sub_admin"
              ? "bg-white text-[#5E35B1] shadow-sm border border-[#D5CCFF]"
              : "text-[#5A6478] hover:text-[#0E1B3D] hover:bg-white/50"
          }`}
        >
          <span>🧑‍💼</span>
          <span className="hidden xs:inline">Sub-Admin</span>
          <span className="xs:hidden">Staff</span>
        </Link>

        {/* Main Admin Tab */}
        <Link
          href="/admin/login"
          className={`flex-1 py-2 px-2.5 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeRole === "main_admin"
              ? "bg-white text-[#B3261E] shadow-sm border border-[#F9DEDC]"
              : "text-[#5A6478] hover:text-[#0E1B3D] hover:bg-white/50"
          }`}
        >
          <span>🛡️</span>
          <span className="hidden xs:inline">Main Admin</span>
          <span className="xs:hidden">Admin</span>
        </Link>
      </div>
    </div>
  );
}
