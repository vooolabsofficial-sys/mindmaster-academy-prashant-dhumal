"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, UserCheck } from "lucide-react";

interface Props {
  activeRole: "sub_admin" | "main_admin" | "student";
}

export default function AuthRoleSwitcher({ activeRole }: Props) {
  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto mb-6">
      <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-700 shadow-inner">
        {/* Main Admin Tab */}
        <Link
          href="/admin/login"
          className={`flex-1 py-2 px-3 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeRole === "main_admin"
              ? "bg-white dark:bg-slate-900 text-[#0052FF] dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Main Admin</span>
        </Link>

        {/* Sub-Admin Tab */}
        <Link
          href="/sub/login"
          className={`flex-1 py-2 px-3 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeRole === "sub_admin"
              ? "bg-white dark:bg-slate-900 text-[#0052FF] dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Sub-Admin Staff</span>
        </Link>
      </div>
    </div>
  );
}