"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { Coupon, StaffUser } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffCoupons,
  saveStaffCoupon,
  deleteStaffCoupon,
  getStaffCourses,
} from "@/lib/staffStore";

export default function CouponManagerPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [appliesFilter, setAppliesFilter] = useState<string>("all");

  // Slide-over Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSchool, setFormSchool] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"percentage" | "flat">("percentage");
  const [formValue, setFormValue] = useState(25);
  const [formAppliesAll, setFormAppliesAll] = useState(true);
  const [formSelectedCourses, setFormSelectedCourses] = useState<string[]>([]);
  const [formPerUserUsage, setFormPerUserUsage] = useState<"once" | "multiple">("once");
  const [formValidityType, setFormValidityType] = useState<"days" | "date_range">("days");
  const [formValidDays, setFormValidDays] = useState(14);
  const [formStartsAt, setFormStartsAt] = useState("2026-09-10");
  const [formEndsAt, setFormEndsAt] = useState("2026-10-10");
  const [formUsageLimit, setFormUsageLimit] = useState(500);
  const [formIsActive, setFormIsActive] = useState(true);

  // Delete Modal State
  const [deleteModalCoupon, setDeleteModalCoupon] = useState<Coupon | null>(null);

  const courses = getStaffCourses();

  const reload = () => {
    setCoupons(getStaffCoupons());
    setStaff(getCurrentStaff());
  };

  useEffect(() => {
    reload();
    window.addEventListener("mma_staff_changed", reload);
    return () => window.removeEventListener("mma_staff_changed", reload);
  }, []);

  const isMainAdmin = staff.role === "main_admin";

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormDesc("");
    setFormSchool("");
    setFormDiscountType("percentage");
    setFormValue(20);
    setFormAppliesAll(true);
    setFormSelectedCourses([]);
    setFormPerUserUsage("once");
    setFormValidityType("days");
    setFormValidDays(14);
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    setFormStartsAt(today);
    setFormEndsAt(thirtyDaysLater);
    setFormUsageLimit(500);
    setFormIsActive(true);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (cpn: Coupon) => {
    setEditingCoupon(cpn);
    setFormCode(cpn.code);
    setFormDesc(cpn.description || "");
    setFormSchool(cpn.school || "");
    setFormDiscountType(cpn.discountType === "percentage" || cpn.discountType === "percent" ? "percentage" : "flat");
    setFormValue(
      cpn.discountType === "percentage" || cpn.discountType === "percent"
        ? cpn.discountValue
        : cpn.discountValue >= 1000
        ? Math.round(cpn.discountValue / 100)
        : cpn.discountValue
    );
    const isAll = cpn.applies_all !== undefined ? cpn.applies_all : cpn.appliesTo === "all";
    setFormAppliesAll(isAll);
    setFormSelectedCourses(cpn.selectedCourseIds || []);
    setFormPerUserUsage(cpn.per_user_usage || cpn.usageLimitPerUser || "once");
    setFormValidityType(cpn.validityType || (cpn.starts_at || cpn.validFrom ? "date_range" : "days"));
    setFormValidDays(cpn.validDays || 14);
    setFormStartsAt(
      cpn.starts_at ? cpn.starts_at.slice(0, 10) : cpn.validFrom ? cpn.validFrom.slice(0, 10) : "2026-09-10"
    );
    setFormEndsAt(
      cpn.ends_at ? cpn.ends_at.slice(0, 10) : cpn.validUntil ? cpn.validUntil.slice(0, 10) : "2026-10-10"
    );
    setFormUsageLimit(cpn.usage_limit || cpn.maxTotalUses || 500);
    setFormIsActive(cpn.is_active !== undefined ? cpn.is_active : cpn.status !== "disabled");
    setIsDrawerOpen(true);
  };

  const toggleCourseSelect = (courseId: string) => {
    if (formSelectedCourses.includes(courseId)) {
      setFormSelectedCourses(formSelectedCourses.filter((id) => id !== courseId));
    } else {
      setFormSelectedCourses([...formSelectedCourses, courseId]);
    }
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) return;

    const cleanedCode = formCode.trim().toUpperCase();

    // Determine status
    let status: "active" | "expired" | "scheduled" | "disabled" = "active";
    if (!formIsActive) {
      status = "disabled";
    } else if (formValidityType === "date_range") {
      const now = new Date();
      const start = new Date(formStartsAt);
      const end = new Date(formEndsAt);
      if (start > now) status = "scheduled";
      else if (end < now) status = "expired";
      else status = "active";
    }

    const valueInPaiseOrPct =
      formDiscountType === "percentage" ? Number(formValue) : Number(formValue) * 100;

    const updatedCoupon: Coupon = {
      id: editingCoupon ? editingCoupon.id : `cpn-${Date.now()}`,
      code: cleanedCode,
      description: formDesc.trim(),
      school: formSchool.trim() || undefined,
      discountType: formDiscountType,
      discountValue: valueInPaiseOrPct,
      appliesTo: formAppliesAll ? "all" : "selected",
      applies_all: formAppliesAll,
      selectedCourseIds: formAppliesAll ? [] : formSelectedCourses,
      usageLimitPerUser: formPerUserUsage,
      per_user_usage: formPerUserUsage,
      validityType: formValidityType,
      validDays: formValidityType === "days" ? Number(formValidDays) : undefined,
      validFrom: formValidityType === "date_range" ? formStartsAt : undefined,
      validUntil: formValidityType === "date_range" ? formEndsAt : undefined,
      starts_at: formValidityType === "date_range" ? `${formStartsAt}T00:00:00Z` : undefined,
      ends_at: formValidityType === "date_range" ? `${formEndsAt}T23:59:59Z` : null,
      maxTotalUses: Number(formUsageLimit),
      usage_limit: Number(formUsageLimit),
      totalUsed: editingCoupon ? editingCoupon.totalUsed || editingCoupon.used_count || 0 : 0,
      used_count: editingCoupon ? editingCoupon.used_count || editingCoupon.totalUsed || 0 : 0,
      status,
      is_active: formIsActive,
      createdAt: editingCoupon ? editingCoupon.createdAt : new Date().toISOString().slice(0, 10),
    };

    saveStaffCoupon(updatedCoupon);
    reload();
    setIsDrawerOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalCoupon) return;
    deleteStaffCoupon(deleteModalCoupon.id);
    reload();
    setDeleteModalCoupon(null);
  };

  // Helper for applying line
  const getAppliesLine = (cpn: Coupon) => {
    const appliesAll = cpn.applies_all !== undefined ? cpn.applies_all : cpn.appliesTo === "all";
    if (appliesAll) {
      return "All courses (Site-wide)";
    }
    const ids = cpn.selectedCourseIds || [];
    if (ids.length === 0) return "Specific courses (None selected)";
    const matchedTitles = courses
      .filter((c) => ids.includes(c.id) || ids.includes(c.code))
      .map((c) => c.title);
    if (matchedTitles.length > 0) {
      return `${ids.length} course${ids.length > 1 ? "s" : ""}: ${matchedTitles.join(", ")}`;
    }
    return `${ids.length} selected course${ids.length > 1 ? "s" : ""}`;
  };

  // Helper for validity line
  const getValidityLine = (cpn: Coupon) => {
    if (cpn.validityType === "days" || cpn.validDays) {
      return `${cpn.validDays || 14} days from issue`;
    }
    const start = cpn.starts_at ? cpn.starts_at.slice(0, 10) : cpn.validFrom || "Start";
    const end = cpn.ends_at ? cpn.ends_at.slice(0, 10) : cpn.validUntil || "End";
    return `${start} → ${end}`;
  };

  // Helper for status badge
  const getStatusBadge = (cpn: Coupon) => {
    const isInactive = cpn.is_active === false || cpn.status === "disabled";
    if (isInactive) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
          ● Disabled
        </span>
      );
    }
    if (cpn.status === "scheduled") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
          ● Scheduled
        </span>
      );
    }
    if (cpn.status === "expired") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
          ● Expired
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
        ● Active
      </span>
    );
  };

  // Filter logic
  const filteredCoupons = coupons.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === "" ||
      c.code.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query)) ||
      (c.school && c.school.toLowerCase().includes(query));

    // Status Filter
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = c.status === "active" && c.is_active !== false;
    } else if (statusFilter === "scheduled") {
      matchesStatus = c.status === "scheduled";
    } else if (statusFilter === "expired") {
      matchesStatus = c.status === "expired";
    } else if (statusFilter === "disabled") {
      matchesStatus = c.status === "disabled" || c.is_active === false;
    }

    // Applies Filter
    let matchesApplies = true;
    const isAll = c.applies_all !== undefined ? c.applies_all : c.appliesTo === "all";
    if (appliesFilter === "all_courses") {
      matchesApplies = isAll;
    } else if (appliesFilter === "selected_courses") {
      matchesApplies = !isAll;
    }

    return matchesSearch && matchesStatus && matchesApplies;
  });

  return (
    <PermissionGuard permission="coupons.manage">
      <AdminShell>
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading tracking-tight">
                  Coupon Manager
                </h1>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF]">
                  coupons.manage
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Configure discount vouchers, course applicability rules, single vs multiple use per student, and validity periods.
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              id="create-coupon-btn"
              className="px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <span className="text-base leading-none">➕</span> Create New Coupon
            </button>
          </div>

          {/* Filters Bar: Search, Status Chips, Applies Chips */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8A94A6]">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search code or description..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-full text-xs text-[#0E1B3D] placeholder-[#8A94A6] focus:outline-none focus:ring-2 focus:ring-[#0B57D0] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A94A6] hover:text-[#0E1B3D]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Counts Badge */}
              <div className="text-xs font-semibold text-[#5A6478] flex items-center gap-2 self-start md:self-auto">
                <span>Showing</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F5F7FF] text-[#0E1B3D] font-bold border border-[#E4E8F8]">
                  {filteredCoupons.length} of {coupons.length} coupons
                </span>
              </div>
            </div>

            {/* Filter Chips Rows */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-3 border-t border-[#E4E8F8]">
              {/* Status Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                  Status:
                </span>
                {[
                  { key: "all", label: "All" },
                  { key: "active", label: "Active" },
                  { key: "scheduled", label: "Scheduled" },
                  { key: "expired", label: "Expired" },
                  { key: "disabled", label: "Disabled" },
                ].map((chip) => {
                  const isActive = statusFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      onClick={() => setStatusFilter(chip.key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#0E1B3D] text-white shadow-sm"
                          : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EEF4FF] hover:text-[#0B57D0] border border-[#E4E8F8]"
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              {/* Applies Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                  Applies To:
                </span>
                {[
                  { key: "all", label: "All Scope" },
                  { key: "all_courses", label: "🌐 All Courses" },
                  { key: "selected_courses", label: "🎯 Selected Courses" },
                ].map((chip) => {
                  const isActive = appliesFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      onClick={() => setAppliesFilter(chip.key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#0B57D0] text-white shadow-sm"
                          : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EEF4FF] hover:text-[#0B57D0] border border-[#E4E8F8]"
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coupons Table / Rows */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm overflow-hidden">
            {filteredCoupons.length === 0 ? (
              <div className="py-14 text-center">
                <span className="text-4xl">🎟️</span>
                <h3 className="text-base font-bold text-[#0E1B3D] mt-2">No coupons match your filters</h3>
                <p className="text-xs text-[#5A6478] mt-1">
                  Try clearing your search query or changing the status/scope filter chips.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setAppliesFilter("all");
                  }}
                  className="mt-4 px-4 py-1.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] border border-[#E4E8F8] rounded-full text-xs font-bold transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E8F8] text-[#8A94A6] uppercase tracking-wider font-semibold">
                      <th className="pb-3.5 pl-3">Coupon Code</th>
                      <th className="pb-3.5">Discount</th>
                      <th className="pb-3.5">Applies Scope</th>
                      <th className="pb-3.5">Validity Dates</th>
                      <th className="pb-3.5">Per-User Limit</th>
                      <th className="pb-3.5">Usage / Limit</th>
                      <th className="pb-3.5">Status</th>
                      <th className="pb-3.5 text-right pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E8F8]">
                    {filteredCoupons.map((c) => {
                      const totalUses = c.totalUsed || c.used_count || 0;
                      const maxUses = c.maxTotalUses || c.usage_limit || 500;
                      const usagePercent = Math.min(100, Math.round((totalUses / maxUses) * 100));
                      const isPerUserOnce =
                        (c.per_user_usage || c.usageLimitPerUser || "once") === "once";

                      return (
                        <tr key={c.id} className="hover:bg-[#F9FAFF] transition-colors group">
                          {/* Mono Code & Description */}
                          <td className="py-4 pl-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-extrabold text-xs tracking-wider text-[#0B57D0] px-2.5 py-1 bg-[#EEF4FF] border border-[#D0E2FF] rounded-md shadow-xs">
                                {c.code}
                              </span>
                              {c.school && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                  🏫 {c.school}
                                </span>
                              )}
                            </div>
                            {c.description && (
                              <p className="text-[#5A6478] text-[11px] mt-1 max-w-xs line-clamp-1">
                                {c.description}
                              </p>
                            )}
                          </td>

                          {/* Discount Value */}
                          <td className="py-4 font-black text-[#0E1B3D]">
                            {c.discountType === "percentage" || c.discountType === "percent" ? (
                              <span className="text-[#0E1B3D] text-xs">
                                {c.discountValue}% OFF
                              </span>
                            ) : (
                              <span className="text-[#0E1B3D] text-xs">
                                ₹{c.discountValue >= 1000 ? Math.round(c.discountValue / 100) : c.discountValue} OFF
                              </span>
                            )}
                          </td>

                          {/* Applies Line */}
                          <td className="py-4 text-[#5A6478] max-w-xs">
                            <div className="flex items-center gap-1.5">
                              {c.applies_all !== false && (c.appliesTo === "all" || !c.selectedCourseIds?.length) ? (
                                <span className="inline-flex items-center gap-1 text-[#0E1B3D] font-medium text-[11px]">
                                  <span className="text-xs">🌐</span> All courses (Site-wide)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[#0B57D0] font-medium text-[11px] line-clamp-1" title={getAppliesLine(c)}>
                                  <span className="text-xs">🎯</span> {getAppliesLine(c)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Validity Dates */}
                          <td className="py-4 text-[#5A6478] text-[11px] whitespace-nowrap">
                            <span className="font-medium text-[#0E1B3D] bg-[#F5F7FF] px-2 py-1 rounded-md border border-[#E4E8F8]">
                              {getValidityLine(c)}
                            </span>
                          </td>

                          {/* Per-User Chip */}
                          <td className="py-4">
                            {isPerUserOnce ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 whitespace-nowrap">
                                👤 Once per user
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                👥 Multiple uses
                              </span>
                            )}
                          </td>

                          {/* Usage x/limit */}
                          <td className="py-4">
                            <div className="w-28 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-[#0E1B3D]">{totalUses}</span>
                                <span className="text-[#8A94A6]">/ {maxUses}</span>
                              </div>
                              <div className="w-full bg-[#E4E8F8] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    usagePercent >= 90
                                      ? "bg-rose-500"
                                      : usagePercent >= 50
                                      ? "bg-amber-500"
                                      : "bg-[#0B57D0]"
                                  }`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status Chip */}
                          <td className="py-4">
                            {getStatusBadge(c)}
                          </td>

                          {/* Edit & Delete Actions */}
                          <td className="py-4 text-right pr-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(c)}
                                className="px-3 py-1.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] border border-[#E4E8F8] rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Edit
                              </button>

                              {isMainAdmin && (
                                <button
                                  onClick={() => setDeleteModalCoupon(c)}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Admin-only delete"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SLIDE-OVER DRAWER FORM */}
          {/* ========================================================= */}
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                onClick={() => setIsDrawerOpen(false)}
              />

              <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
                <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-[#E4E8F8] flex items-center justify-between bg-[#FAFBFD]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎟️</span>
                        <h2 className="text-lg font-bold text-[#0E1B3D] font-heading">
                          {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Coupon"}
                        </h2>
                      </div>
                      <p className="text-xs text-[#5A6478] mt-0.5">
                        Set code, discount type, course applicability, per-user limits, and validity.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-8 h-8 rounded-full bg-white border border-[#E4E8F8] flex items-center justify-center text-sm text-[#5A6478] hover:bg-slate-100 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Drawer Form Body */}
                  <form onSubmit={handleSaveCoupon} id="coupon-drawer-form" className="p-6 space-y-5 flex-1">
                    {/* 1. Code & Active Toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                          Coupon Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={formCode}
                          onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                          placeholder="e.g. FESTIVE30"
                          className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-mono font-black text-[#0B57D0] uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                        />
                      </div>

                      {/* Active Toggle Switch */}
                      <div className="p-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-[#0E1B3D]">Active</p>
                          <p className="text-[9px] text-[#5A6478]">{formIsActive ? "Accepting" : "Disabled"}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formIsActive}
                            onChange={(e) => setFormIsActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                        Marketing Label / Description
                      </label>
                      <input
                        type="text"
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="e.g. Special festival rebate for rural students"
                        className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                    </div>

                    {/* School Name (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                        शाळेचे नाव (optional — blank = सर्वांसाठी)
                      </label>
                      <input
                        type="text"
                        value={formSchool}
                        onChange={(e) => setFormSchool(e.target.value)}
                        placeholder="उदा. आदर्श विद्यालय / Abhinava Vidyalaya"
                        className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] placeholder-[#8A94A6] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                      <p className="text-[11px] text-[#5A6478] mt-1">
                        {formSchool.trim()
                          ? `फक्त "${formSchool.trim()}" मधील विद्यार्थ्यांनाच हा कूपन कोड लागू होईल.`
                          : "रिकामे ठेवल्यास सर्व शाळांमधील विद्यार्थ्यांसाठी लागू राहील."}
                      </p>
                    </div>

                    {/* 2. Percent / Flat Segmented + Value */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-3">
                      <label className="block text-xs font-bold text-[#0E1B3D]">
                        💰 Discount Type & Amount *
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Segmented Control: Percent vs Flat */}
                        <div className="flex bg-white p-1 rounded-xl border border-[#E4E8F8]">
                          <button
                            type="button"
                            onClick={() => setFormDiscountType("percentage")}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              formDiscountType === "percentage"
                                ? "bg-[#0B57D0] text-white shadow-xs"
                                : "text-[#5A6478] hover:text-[#0E1B3D]"
                            }`}
                          >
                            % Percentage
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormDiscountType("flat")}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              formDiscountType === "flat"
                                ? "bg-[#0B57D0] text-white shadow-xs"
                                : "text-[#5A6478] hover:text-[#0E1B3D]"
                            }`}
                          >
                            ₹ Flat INR
                          </button>
                        </div>

                        {/* Value Input */}
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A94A6]">
                            {formDiscountType === "percentage" ? "%" : "₹"}
                          </span>
                          <input
                            type="number"
                            required
                            min="1"
                            max={formDiscountType === "percentage" ? 100 : 50000}
                            value={formValue}
                            onChange={(e) => setFormValue(Number(e.target.value))}
                            className="w-full pl-8 pr-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs font-extrabold text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Applies All Toggle or Multi-Course Chips */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-bold text-[#0E1B3D]">
                            🎯 Course Applicability Scope *
                          </label>
                          <p className="text-[11px] text-[#5A6478]">
                            {formAppliesAll ? "Valid for every course academy-wide" : "Restricted to specific selected courses"}
                          </p>
                        </div>

                        {/* Applies All Toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0E1B3D]">
                            {formAppliesAll ? "All Courses" : "Specific Courses"}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formAppliesAll}
                              onChange={(e) => setFormAppliesAll(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B57D0]"></div>
                          </label>
                        </div>
                      </div>

                      {/* Multi-course chips if applies_all is false */}
                      {!formAppliesAll && (
                        <div className="pt-3 border-t border-[#E4E8F8] space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#0E1B3D]">Select Applicable Courses:</span>
                            <span className="text-[#0B57D0] font-semibold">
                              {formSelectedCourses.length} selected
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                            {courses.map((course) => {
                              const isSelected = formSelectedCourses.includes(course.id) || formSelectedCourses.includes(course.code);
                              return (
                                <button
                                  type="button"
                                  key={course.id}
                                  onClick={() => toggleCourseSelect(course.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isSelected
                                      ? "bg-[#EEF4FF] border-[#0B57D0] text-[#0B57D0] shadow-xs"
                                      : "bg-white border-[#E4E8F8] text-[#5A6478] hover:border-slate-300"
                                  }`}
                                >
                                  <span>{isSelected ? "✓" : "+"}</span>
                                  <span className="font-mono text-[11px] font-bold">{course.code}</span>
                                  <span className="text-[11px] max-w-[140px] truncate">{course.title}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Per User Usage Segmented: Once vs Multiple */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-2.5">
                      <label className="block text-xs font-bold text-[#0E1B3D]">
                        👤 Per-User Usage Limit *
                      </label>
                      <div className="flex bg-white p-1 rounded-xl border border-[#E4E8F8]">
                        <button
                          type="button"
                          onClick={() => setFormPerUserUsage("once")}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            formPerUserUsage === "once"
                              ? "bg-violet-600 text-white shadow-xs"
                              : "text-[#5A6478] hover:text-[#0E1B3D]"
                          }`}
                        >
                          <span>🔒</span> Once Per User (Single Use)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormPerUserUsage("multiple")}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            formPerUserUsage === "multiple"
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "text-[#5A6478] hover:text-[#0E1B3D]"
                          }`}
                        >
                          <span>🔄</span> Multiple Uses Allowed
                        </button>
                      </div>
                      <p className="text-[11px] text-[#5A6478]">
                        {formPerUserUsage === "once"
                          ? "Student cannot redeem this code again after their first successful payment."
                          : "Students can reuse this coupon across multiple separate enrollments."}
                      </p>
                    </div>

                    {/* 5. Validity Segmented: Days vs Specific Start/End Date Pickers */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-3">
                      <label className="block text-xs font-bold text-[#0E1B3D]">
                        ⏳ Validity Window Rule *
                      </label>

                      {/* Segmented Selector */}
                      <div className="flex bg-white p-1 rounded-xl border border-[#E4E8F8]">
                        <button
                          type="button"
                          onClick={() => setFormValidityType("days")}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            formValidityType === "days"
                              ? "bg-[#0E1B3D] text-white shadow-xs"
                              : "text-[#5A6478] hover:text-[#0E1B3D]"
                          }`}
                        >
                          ⏱️ Days from Issue
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormValidityType("date_range")}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            formValidityType === "date_range"
                              ? "bg-[#0E1B3D] text-white shadow-xs"
                              : "text-[#5A6478] hover:text-[#0E1B3D]"
                          }`}
                        >
                          📅 Specific Start & End Dates
                        </button>
                      </div>

                      {formValidityType === "days" ? (
                        <div className="pt-2 flex items-center gap-3">
                          <label className="text-xs font-semibold text-[#5A6478]">
                            Valid Duration:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={formValidDays}
                              onChange={(e) => setFormValidDays(Number(e.target.value))}
                              className="w-24 px-3 py-1.5 bg-white border border-[#E4E8F8] rounded-xl text-xs font-bold text-[#0E1B3D]"
                            />
                            <span className="text-xs font-semibold text-[#5A6478]">days from issuance</span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                              Starts At (Starts From):
                            </label>
                            <input
                              type="date"
                              required
                              value={formStartsAt}
                              onChange={(e) => setFormStartsAt(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                              Ends At (Expires On):
                            </label>
                            <input
                              type="date"
                              required
                              value={formEndsAt}
                              onChange={(e) => setFormEndsAt(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D]"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 6. Total Limit Input */}
                    <div>
                      <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                        Total Academy-Wide Redemption Limit *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formUsageLimit}
                        onChange={(e) => setFormUsageLimit(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                      <p className="text-[11px] text-[#5A6478] mt-1">
                        Max total times this coupon can be redeemed across all students.
                      </p>
                    </div>

                    {/* 7. LIVE PREVIEW ROW */}
                    <div className="pt-4 border-t border-[#E4E8F8]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A94A6]">
                          ✨ Live Preview Row
                        </span>
                        <span className="text-[10px] text-[#5A6478]">
                          (How this will render in the staff list)
                        </span>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-[#F9FAFF] to-white border border-[#D0E2FF] rounded-2xl shadow-xs space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs tracking-wider text-[#0B57D0] px-2.5 py-1 bg-[#EEF4FF] border border-[#D0E2FF] rounded-md shadow-xs">
                              {formCode.trim().toUpperCase() || "CODE_PREVIEW"}
                            </span>
                            {formSchool.trim() && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                🏫 {formSchool.trim()}
                              </span>
                            )}
                            <span className="text-xs font-black text-[#0E1B3D]">
                              {formDiscountType === "percentage" ? `${formValue}% OFF` : `₹${formValue} OFF`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {formPerUserUsage === "once" ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                👤 Once per user
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                👥 Multiple uses
                              </span>
                            )}

                            {formIsActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ● Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                ● Disabled
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5A6478] pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span>🎯</span>
                            <span className="font-medium text-[#0E1B3D]">
                              {formAppliesAll
                                ? "All courses (Site-wide)"
                                : `${formSelectedCourses.length} selected courses`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span>⏳</span>
                            <span className="font-medium text-[#0E1B3D]">
                              {formValidityType === "days"
                                ? `${formValidDays} days validity`
                                : `${formStartsAt} → ${formEndsAt}`}
                            </span>
                          </div>

                          <div className="text-[10px] text-[#8A94A6]">
                            Limit: {formUsageLimit} max uses
                          </div>
                        </div>

                        {/* Sample calculation preview */}
                        <div className="mt-1 bg-white p-2 rounded-xl border border-[#E4E8F8] flex items-center justify-between text-[11px]">
                          <span className="text-[#5A6478]">Sample discount on ₹999 course:</span>
                          <span className="font-black text-[#0B57D0]">
                            {formDiscountType === "percentage"
                              ? `Saves ₹${Math.round((999 * formValue) / 100)} → Student pays ₹${Math.max(1, 999 - Math.round((999 * formValue) / 100))}`
                              : `Saves ₹${Math.min(999, formValue)} → Student pays ₹${Math.max(1, 999 - formValue)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Drawer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E8F8]">
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="px-5 py-2.5 rounded-full border border-[#E4E8F8] text-xs font-bold text-[#5A6478] hover:bg-[#F5F7FF] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        {editingCoupon ? "Save Coupon Changes" : "Create Coupon →"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* DELETE CONFIRMATION MODAL (ADMIN-ONLY) */}
          {deleteModalCoupon && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-[#E4E8F8] max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
                  🗑️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0E1B3D]">
                    Permanently Delete Coupon?
                  </h3>
                  <p className="text-xs text-[#5A6478] mt-1 leading-relaxed">
                    Are you sure you want to delete coupon <span className="font-mono font-bold text-[#0E1B3D]">"{deleteModalCoupon.code}"</span>?
                    This action is restricted to Main Admin and will be recorded in the system audit log.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E8F8]">
                  <button
                    onClick={() => setDeleteModalCoupon(null)}
                    className="px-4 py-2 rounded-full border border-[#E4E8F8] text-xs font-bold text-[#5A6478] hover:bg-[#F5F7FF]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                  >
                    Yes, Delete Coupon
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
