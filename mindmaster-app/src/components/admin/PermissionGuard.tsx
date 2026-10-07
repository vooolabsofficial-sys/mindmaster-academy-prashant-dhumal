"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StaffPermission, hasStaffPermission, StaffUser } from "@/lib/types";
import { getCurrentStaff } from "@/lib/staffStore";

interface Props {
  permission?: StaffPermission;
  adminOnly?: boolean;
  children: React.ReactNode;
}

export default function PermissionGuard({ permission, adminOnly, children }: Props) {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStaff(getCurrentStaff());
    setMounted(true);

    const handleStaffChange = () => {
      setStaff(getCurrentStaff());
    };

    window.addEventListener("mma_staff_changed", handleStaffChange);
    return () => window.removeEventListener("mma_staff_changed", handleStaffChange);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B57D0]" />
      </div>
    );
  }

  // Admin-only check
  if (adminOnly && staff?.role !== "main_admin") {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-[#E4E8F8] rounded-2xl shadow-sm text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold">
          🔒
        </div>
        <h2 className="text-2xl font-bold text-[#0E1B3D] mb-2 font-heading">
          Main Admin Access Only
        </h2>
        <p className="text-[#5A6478] mb-6">
          This section requires supreme administrator privileges (Sub-Admin CRUD, Audit Logs, Settings, or Global Deletes). Your current role is{" "}
          <span className="font-semibold text-[#0E1B3D]">Sub-Admin ({staff?.name})</span>.
        </p>
        <div className="bg-[#F5F7FF] border border-[#E4E8F8] p-4 rounded-xl text-xs text-left mb-6">
          <p className="font-semibold text-[#0E1B3D] mb-1">Your Assigned Permissions:</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {staff?.permissions.map((p) => (
              <span key={p} className="px-2.5 py-1 bg-white border border-[#E4E8F8] rounded-md font-mono text-[#0B57D0]">
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/admin"
            className="px-6 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-medium rounded-full transition-colors text-sm"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Permission check for specific modules
  if (permission && !hasStaffPermission(staff, permission)) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-[#E4E8F8] rounded-2xl shadow-sm text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold text-[#0E1B3D] mb-2 font-heading">
          Permission Required: <code className="text-[#0B57D0]">{permission}</code>
        </h2>
        <p className="text-[#5A6478] mb-6">
          You do not have the required permission key to access this module. Please request permission delegation from Main Admin.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/admin"
            className="px-6 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-medium rounded-full transition-colors text-sm"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
