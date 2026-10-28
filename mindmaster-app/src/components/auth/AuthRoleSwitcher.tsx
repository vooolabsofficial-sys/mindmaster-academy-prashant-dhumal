"use client";

import React from "react";
import Link from "next/link";

interface Props {
  activeRole: "sub_admin" | "main_admin" | "student";
}

export default function AuthRoleSwitcher({ activeRole }: Props) {
  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto mb-6">
      <div className="bg-[#EAEFFD] p-1.5 rounded-2xl flex items-center gap-1.5 border border-[#D5E0FA] shadow-xs">
        {/* Main Admin Tab */}
        <Link
          href="/admin/login"
          className={`flex-1 py-2.5 px-3 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeRole === "main_admin"
              ? "bg-white text-[#B3261E] shadow-sm border border-[#F9DEDC]"
              : "text-[#5A6478] hover:text-[#0E1B3D] hover:bg-white/50"
          }`}
        >
          <span>🛡️</span>
          <span>Main Admin Login</span>
        </Link>

        {/* Sub-Admin Tab */}
        <Link
          href="/sub/login"
          className={`flex-1 py-2.5 px-3 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeRole === "sub_admin"
              ? "bg-white text-[#5E35B1] shadow-sm border border-[#D5CCFF]"
              : "text-[#5A6478] hover:text-[#0E1B3D] hover:bg-white/50"
          }`}
        >
          <span>🧑‍💼</span>
          <span>Sub-Admin Login</span>
        </Link>
      </div>
    </div>
  );
}