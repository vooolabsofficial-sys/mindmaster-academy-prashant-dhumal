"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getCurrentStaff, logoutStaff } from "@/lib/staffStore";
import { StaffUser } from "@/lib/types";

function ForbiddenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [staff, setStaff] = useState<StaffUser | null>(null);

  const reason = searchParams.get("reason");
  const requiredPerm = searchParams.get("perm");

  useEffect(() => {
    setStaff(getCurrentStaff());
  }, []);

  const handleLogout = () => {
    logoutStaff();
    fetch("/api/staff/logout", { method: "POST" }).catch(() => {});
    router.push("/staff/login");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FF] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E4E8F8] p-8 shadow-xl text-center">
        {/* Shield Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-3xl shadow-inner text-red-600">
          🛡️
        </div>

        {/* 403 Badge */}
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 mb-2">
          HTTP 403 • Access Forbidden
        </span>

        <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading mt-2">
          Restricted Zone
        </h1>

        <p className="text-sm text-[#5A6478] mt-2 leading-relaxed">
          {reason === "main_admin_required" ? (
            <>
              This area (<code className="px-1.5 py-0.5 bg-gray-100 rounded text-red-600 font-mono text-xs">/admin/*</code>) is strictly reserved for the <strong>Main Admin</strong>. Sub-admins must use designated <code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-xs text-blue-600">/sub/*</code> modules.
            </>
          ) : reason === "sub_admin_required" ? (
            <>
              This module is only accessible to Sub-Admin accounts with explicit privileges.
            </>
          ) : requiredPerm ? (
            <>
              Your account lacks the mandatory permission:{" "}
              <span className="block mt-1.5 font-mono text-xs font-bold px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded">
                🔑 {requiredPerm}
              </span>
            </>
          ) : (
            "You do not possess the necessary security clearance or permission key to view this resource."
          )}
        </p>

        {/* Current Staff Info Card */}
        {staff && (
          <div className="mt-5 p-3.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl text-left">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#8A94A6]">Current Staff:</span>
              <span className="font-bold text-[#0E1B3D]">{staff.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#8A94A6]">Staff ID:</span>
              <span className="font-mono font-semibold text-[#0B57D0]">{staff.staffId || staff.id}</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#8A94A6]">Role:</span>
              <span className="font-semibold text-[#0E1B3D] capitalize">{staff.role.replace("_", " ")}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8A94A6]">Granted Keys:</span>
              <span className="font-semibold text-xs text-[#0E1B3D]">{staff.permissions?.length || 0} keys</span>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="mt-6 space-y-2.5">
          {staff?.role === "sub_admin" ? (
            <Link
              href="/sub/videos"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0B57D0] text-white font-bold text-sm shadow-md hover:bg-[#095ABA] transition-all"
            >
              ↩ Return to My Permitted Modules
            </Link>
          ) : (
            <Link
              href="/admin"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0B57D0] text-white font-bold text-sm shadow-md hover:bg-[#095ABA] transition-all"
            >
              ↩ Return to Admin Mission Control
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E4E8F8] text-[#5A6478] font-medium text-xs hover:bg-gray-50 transition-colors"
          >
            Log Out & Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7FF] flex items-center justify-center text-sm text-[#8A94A6]">Loading access check...</div>}>
      <ForbiddenContent />
    </Suspense>
  );
}
