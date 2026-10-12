"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { Coupon, StaffUser, CouponRedemptionRecord } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffCoupons,
  saveStaffCoupon,
  deleteStaffCoupon,
  toggleStaffCouponStatus,
  getStaffCourses,
} from "@/lib/staffStore";
import { getRedemptions, getRedemptionsByCoupon } from "@/lib/couponRedemptionStore";
import {
  exportCouponRedemptionsToExcel,
  exportCouponsMasterToExcel,
} from "@/lib/excelExporter";
import { toast } from "sonner";

export default function CouponManagerPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [appliesFilter, setAppliesFilter] = useState<string>("all");

  // Slide-over Drawer State (Create & Edit)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSchool, setFormSchool] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"percentage" | "flat">("percentage");
  const [formValue, setFormValue] = useState(25);
  const [formMinOrder, setFormMinOrder] = useState<number>(499);
  const [formAppliesAll, setFormAppliesAll] = useState(true);
  const [formSelectedCourses, setFormSelectedCourses] = useState<string[]>([]);
  const [formPerUserUsage, setFormPerUserUsage] = useState<"once" | "multiple">("once");
  const [formValidityType, setFormValidityType] = useState<"days" | "date_range">("date_range");
  const [formValidDays, setFormValidDays] = useState(30);
  const [formStartsAt, setFormStartsAt] = useState("2026-10-01");
  const [formEndsAt, setFormEndsAt] = useState("2026-11-30");
  const [formUsageLimit, setFormUsageLimit] = useState(100);
  const [formIsActive, setFormIsActive] = useState(true);

  // Redemptions Modal State
  const [viewingRedemptionsCoupon, setViewingRedemptionsCoupon] = useState<Coupon | null>(null);
  const [redemptionSearch, setRedemptionSearch] = useState("");

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

  // Open Create Modal with clean defaults
  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormDesc("");
    setFormSchool("");
    setFormDiscountType("percentage");
    setFormValue(20);
    setFormMinOrder(499);
    setFormAppliesAll(true);
    setFormSelectedCourses([]);
    setFormPerUserUsage("once");
    setFormValidityType("date_range");
    setFormValidDays(30);
    const today = new Date().toISOString().slice(0, 10);
    const sixtyDaysLater = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    setFormStartsAt(today);
    setFormEndsAt(sixtyDaysLater);
    setFormUsageLimit(100);
    setFormIsActive(true);
    setIsDrawerOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cpn: Coupon) => {
    setEditingCoupon(cpn);
    setFormCode(cpn.code);
    setFormDesc(cpn.description || "");
    setFormSchool(cpn.school || "");
    setFormDiscountType(
      cpn.discountType === "percentage" || cpn.discountType === "percent" ? "percentage" : "flat"
    );
    setFormValue(
      cpn.discountType === "percentage" || cpn.discountType === "percent"
        ? cpn.discountValue
        : cpn.discountValue >= 1000
        ? Math.round(cpn.discountValue / 100)
        : cpn.discountValue
    );
    setFormMinOrder(
      cpn.minOrderValuePaise ? Math.round(cpn.minOrderValuePaise / 100) : 499
    );
    const isAll = cpn.applies_all !== undefined ? cpn.applies_all : cpn.appliesTo === "all";
    setFormAppliesAll(isAll);
    setFormSelectedCourses(cpn.selectedCourseIds || []);
    setFormPerUserUsage(cpn.per_user_usage || cpn.usageLimitPerUser || "once");
    setFormValidityType(
      cpn.validityType || (cpn.starts_at || cpn.validFrom ? "date_range" : "days")
    );
    setFormValidDays(cpn.validDays || 30);
    setFormStartsAt(
      cpn.starts_at ? cpn.starts_at.slice(0, 10) : cpn.validFrom ? cpn.validFrom.slice(0, 10) : "2026-10-01"
    );
    setFormEndsAt(
      cpn.ends_at ? cpn.ends_at.slice(0, 10) : cpn.validUntil ? cpn.validUntil.slice(0, 10) : "2026-11-30"
    );
    setFormUsageLimit(cpn.usage_limit || cpn.maxTotalUses || 100);
    setFormIsActive(cpn.is_active !== undefined ? cpn.is_active : cpn.status !== "disabled" && cpn.status !== "paused");
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
    if (!formCode.trim()) {
      toast.error("कृपया कूपन कोड प्रविष्ट करा.");
      return;
    }

    const cleanedCode = formCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

    // Determine status
    let status: "active" | "expired" | "scheduled" | "disabled" | "paused" = "active";
    if (!formIsActive) {
      status = "paused";
    } else if (formValidityType === "date_range") {
      const now = new Date();
      const start = new Date(formStartsAt);
      const end = new Date(`${formEndsAt}T23:59:59`);
      if (start > now) status = "scheduled";
      else if (end < now) status = "expired";
      else status = "active";
    }

    const currentUsed = editingCoupon ? editingCoupon.totalUsed || editingCoupon.used_count || 0 : 0;
    if (currentUsed >= Number(formUsageLimit)) {
      status = "expired";
    }

    const valueInPaiseOrPct =
      formDiscountType === "percentage" ? Number(formValue) : Number(formValue) * 100;

    const updatedCoupon: Coupon = {
      id: editingCoupon ? editingCoupon.id : `cpn-${Date.now()}`,
      code: cleanedCode,
      description: formDesc.trim() || `${cleanedCode} Discount Coupon`,
      school: formSchool.trim() || undefined,
      discountType: formDiscountType,
      discountValue: valueInPaiseOrPct,
      minOrderValuePaise: formMinOrder ? Number(formMinOrder) * 100 : undefined,
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
      totalUsed: currentUsed,
      used_count: currentUsed,
      status,
      is_active: formIsActive && status !== "expired",
      createdAt: editingCoupon ? editingCoupon.createdAt : new Date().toISOString().slice(0, 10),
    };

    saveStaffCoupon(updatedCoupon);
    reload();
    setIsDrawerOpen(false);
    toast.success(
      editingCoupon
        ? `कूपन "${cleanedCode}" यशस्वीरीत्या अपडेट केले!`
        : `नवीन कूपन "${cleanedCode}" यशस्वीरीत्या तयार झाले!`
    );
  };

  // Instant Pause / Resume Toggle
  const handleToggleStatus = (cpn: Coupon) => {
    const updated = toggleStaffCouponStatus(cpn.id);
    if (updated) {
      toast.success(
        updated.status === "active"
          ? `कूपन "${cpn.code}" पुन्हा सुरू (Active) झाले!`
          : `कूपन "${cpn.code}" तात्पुरते थांबवले (Paused)!`
      );
      reload();
    }
  };

  // 1-Click WhatsApp Promotional Announcement Share
  const handleShareWhatsApp = (cpn: Coupon) => {
    const discountStr =
      cpn.discountType === "percentage" || cpn.discountType === "percent"
        ? `${cpn.discountValue}% OFF`
        : `₹${cpn.discountValue >= 1000 ? Math.round(cpn.discountValue / 100) : cpn.discountValue} OFF`;

    const courseStr =
      cpn.applies_all !== false && (cpn.appliesTo === "all" || !cpn.selectedCourseIds?.length)
        ? "सर्व कोर्सेसवर लागू (Site-wide)"
        : `${cpn.selectedCourseIds?.length || 1} निवडक कोर्सेस`;

    const validityStr =
      cpn.validityType === "days"
        ? `पुढील ${cpn.validDays || 30} दिवस`
        : `${cpn.starts_at?.slice(0, 10) || cpn.validFrom || "सुरू"} ते ${cpn.ends_at?.slice(0, 10) || cpn.validUntil || "शेवट"}`;

    const limitStr = `फक्त पहिल्या ${cpn.usage_limit || cpn.maxTotalUses || 100} विद्यार्थ्यांसाठी!`;

    const msg = `🎓 *MindMaster Academy — विशेष सवलत कूपन!*\n\nप्रशांत धुमळ सरांच्या अकॅडमीतर्फे विशेष सवलत:\n🎟️ कूपन कोड: *${cpn.code}*\n💰 सूट: *${discountStr}*\n📚 लागू कोर्सेस: *${courseStr}*\n⏳ मुदत: *${validityStr}*\n👥 मर्यादा: *${limitStr}*${
      cpn.school ? `\n🏫 शाळा: *${cpn.school}*` : ""
    }\n\n👉 ॲडमिशन घेण्यासाठी व कूपन वापरण्यासाठी भेट द्या:\nhttps://mindmasteracademy.in/checkout?coupon=${cpn.code}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      toast.success(`कूपन "${cpn.code}" चा व्हॉट्सअ‍ॅप मेसेज क्लिपबोर्डवर कॉपी झाला!`);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteModalCoupon) return;
    deleteStaffCoupon(deleteModalCoupon.id);
    reload();
    toast.success(`कूपन "${deleteModalCoupon.code}" हटवण्यात आले.`);
    setDeleteModalCoupon(null);
  };

  // Helper for applying line
  const getAppliesLine = (cpn: Coupon) => {
    const appliesAll = cpn.applies_all !== undefined ? cpn.applies_all : cpn.appliesTo === "all";
    if (appliesAll) {
      return "सर्व कोर्सेस (Site-wide All Courses)";
    }
    const ids = cpn.selectedCourseIds || [];
    if (ids.length === 0) return "निवडक कोर्सेस (कोणताही नाही)";
    const matchedTitles = courses
      .filter((c) => ids.includes(c.id) || ids.includes(c.code))
      .map((c) => c.title);
    if (matchedTitles.length > 0) {
      return `${ids.length} कोर्सेस: ${matchedTitles.join(", ")}`;
    }
    return `${ids.length} निवडक कोर्सेस`;
  };

  // Helper for validity line
  const getValidityLine = (cpn: Coupon) => {
    if (cpn.validityType === "days" || cpn.validDays) {
      return `${cpn.validDays || 30} दिवस मुदत`;
    }
    const start = cpn.starts_at ? cpn.starts_at.slice(0, 10) : cpn.validFrom || "सुरू";
    const end = cpn.ends_at ? cpn.ends_at.slice(0, 10) : cpn.validUntil || "शेवट";
    return `${start} → ${end}`;
  };

  // Helper for status badge
  const getStatusBadge = (cpn: Coupon) => {
    const totalUses = cpn.totalUsed || cpn.used_count || 0;
    const maxUses = cpn.maxTotalUses || cpn.usage_limit || 100;
    const isQuotaFull = totalUses >= maxUses;

    if (isQuotaFull) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
          🔴 कोटा पूर्ण ({maxUses}/{maxUses})
        </span>
      );
    }
    if (cpn.status === "paused" || cpn.is_active === false || cpn.status === "disabled") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
          ⏸️ तात्पुरते बंद (Paused)
        </span>
      );
    }
    if (cpn.status === "scheduled") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
          ⏳ शेड्युल केलेले (Upcoming)
        </span>
      );
    }
    if (cpn.status === "expired") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
          ⌛ मुदत संपली (Expired)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
        🟢 चालू (Active)
      </span>
    );
  };

  // Export Master Coupons List
  const handleExportMasterSummary = () => {
    const rows = coupons.map((c) => {
      const totalUses = c.totalUsed || c.used_count || 0;
      const maxUses = c.maxTotalUses || c.usage_limit || 100;
      const remaining = Math.max(0, maxUses - totalUses);
      const discountStr =
        c.discountType === "percentage" || c.discountType === "percent"
          ? `${c.discountValue}% OFF`
          : `₹${c.discountValue >= 1000 ? Math.round(c.discountValue / 100) : c.discountValue} OFF`;

      return {
        code: c.code,
        description: c.description || "",
        school: c.school || "",
        discount: discountStr,
        scope:
          c.applies_all !== false && (c.appliesTo === "all" || !c.selectedCourseIds?.length)
            ? "All Courses"
            : `${c.selectedCourseIds?.length || 1} Courses`,
        validity: getValidityLine(c),
        quotaLimit: maxUses,
        usedCount: totalUses,
        remainingQuota: remaining,
        status: c.status,
      };
    });
    exportCouponsMasterToExcel(rows);
    toast.success("कूपन्स मास्टर रिपोर्ट एक्सेलमध्ये डाऊनलोड झाला!");
  };

  // Export Specific Coupon Redemptions
  const handleExportCouponRedemptions = (cpn: Coupon, list: CouponRedemptionRecord[]) => {
    const rows = list.map((r) => ({
      couponCode: cpn.code,
      studentName: r.studentName || "विद्यार्थी",
      studentMobile: r.studentMobile || "—",
      courseTitle: r.courseTitle || "MindMaster Course",
      originalPrice: Math.round((r.originalPricePaise || 99900) / 100),
      discountReceived: Math.round((r.discountPaise || 0) / 100),
      finalPaid: Math.round((r.paidPaise || 99900) / 100),
      redeemedAt: new Date(r.at).toLocaleString("mr-IN"),
    }));
    exportCouponRedemptionsToExcel(rows, cpn.code);
    toast.success(`कूपन "${cpn.code}" चा विद्यार्थी ट्रॅक रेकॉर्ड एक्सेलमध्ये डाऊनलोड झाला!`);
  };

  // Global KPIs calculation
  const allRedemptions = getRedemptions();
  const totalCouponsCount = coupons.length;
  const activeCouponsCount = coupons.filter(
    (c) => c.status === "active" && c.is_active !== false
  ).length;
  const totalRedemptionsCount = coupons.reduce(
    (acc, c) => acc + (c.used_count || c.totalUsed || 0),
    0
  );
  const totalDiscountGivenRupees = allRedemptions.reduce(
    (acc, r) => acc + Math.round((r.discountPaise || 0) / 100),
    0
  );
  const totalRevenueAttributedRupees = allRedemptions.reduce(
    (acc, r) => acc + Math.round((r.paidPaise || 0) / 100),
    0
  );

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
    } else if (statusFilter === "paused") {
      matchesStatus = c.status === "paused" || c.is_active === false;
    } else if (statusFilter === "quota_full") {
      const uses = c.totalUsed || c.used_count || 0;
      const max = c.maxTotalUses || c.usage_limit || 100;
      matchesStatus = uses >= max;
    } else if (statusFilter === "scheduled") {
      matchesStatus = c.status === "scheduled";
    } else if (statusFilter === "expired") {
      matchesStatus = c.status === "expired";
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-xs">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🎟️</span>
                <h1 className="text-2xl font-black text-[#0E1B3D] tracking-tight">
                  कूपन कोड व्यवस्थापक (Coupon & Discount Manager)
                </h1>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF]">
                  coupons.manage
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                सवलत कूपन्स तयार करा, कोर्सेसला जोडा, १०० विद्यार्थी वापर मर्यादा, मुदत आणि विद्यार्थ्यांचा ट्रॅक रेकॉर्ड तपासा.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleExportMasterSummary}
                className="px-4 py-2.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] font-bold text-xs rounded-full border border-[#D0E2FF] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>📥</span> एक्सपोर्ट मास्टर रिपोर्ट (.xlsx)
              </button>

              <button
                onClick={handleOpenAdd}
                id="create-coupon-btn"
                className="px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="text-base leading-none">➕</span> नवीन कूपन तयार करा
              </button>
            </div>
          </div>

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-[#E4E8F8] shadow-2xs">
              <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider block">
                एकूण कूपन्स
              </span>
              <p className="text-2xl font-black text-[#0E1B3D] mt-1">{totalCouponsCount}</p>
              <span className="text-[10px] text-[#5A6478]">सिस्टीममधील सर्व कोड्स</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E4E8F8] shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                सक्रिय (Live)
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{activeCouponsCount}</p>
              <span className="text-[10px] text-[#5A6478]">सध्या वापरात असलेले</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E4E8F8] shadow-2xs">
              <span className="text-[11px] font-bold text-[#0B57D0] uppercase tracking-wider block">
                एकूण वापर (Redemptions)
              </span>
              <p className="text-2xl font-black text-[#0B57D0] mt-1">{totalRedemptionsCount}</p>
              <span className="text-[10px] text-[#5A6478]">विद्यार्थ्यांनी रिडीम केलेले</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E4E8F8] shadow-2xs">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                दिलेली एकूण सूट
              </span>
              <p className="text-2xl font-black text-amber-600 mt-1">₹{totalDiscountGivenRupees.toLocaleString("en-IN")}</p>
              <span className="text-[10px] text-[#5A6478]">विद्यार्थ्यांना दिलेली बचत</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E4E8F8] shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider block">
                कूपन्सद्वारे महसूल
              </span>
              <p className="text-2xl font-black text-violet-600 mt-1">₹{totalRevenueAttributedRupees.toLocaleString("en-IN")}</p>
              <span className="text-[10px] text-[#5A6478]">कूपनमुळे मिळालेली एकूण फी</span>
            </div>
          </div>

          {/* Filters Bar: Search & Status Chips */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8A94A6]">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="कूपन कोड, शाळा किंवा मोहीम शोधा..."
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
                <span>दाखवत आहे:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F5F7FF] text-[#0E1B3D] font-bold border border-[#E4E8F8]">
                  {filteredCoupons.length} / {coupons.length} कूपन्स
                </span>
              </div>
            </div>

            {/* Filter Chips Rows */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-3 border-t border-[#E4E8F8]">
              {/* Status Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                  स्थिती:
                </span>
                {[
                  { key: "all", label: "सर्व (All)" },
                  { key: "active", label: "🟢 चालू (Active)" },
                  { key: "paused", label: "⏸️ थांबवलेले (Paused)" },
                  { key: "quota_full", label: "🔴 कोटा पूर्ण (Quota Full)" },
                  { key: "scheduled", label: "⏳ आगामी (Scheduled)" },
                  { key: "expired", label: "⌛ मुदत संपलेले (Expired)" },
                ].map((chip) => {
                  const isActive = statusFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      onClick={() => setStatusFilter(chip.key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#0E1B3D] text-white shadow-xs"
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
                  व्याप्ती:
                </span>
                {[
                  { key: "all", label: "सर्व व्याप्ती" },
                  { key: "all_courses", label: "🌐 सर्व कोर्सेस" },
                  { key: "selected_courses", label: "🎯 निवडक कोर्सेस" },
                ].map((chip) => {
                  const isActive = appliesFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      onClick={() => setAppliesFilter(chip.key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#0B57D0] text-white shadow-xs"
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

          {/* Coupons Master Table */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-xs overflow-hidden">
            {filteredCoupons.length === 0 ? (
              <div className="py-14 text-center">
                <span className="text-4xl">🎟️</span>
                <h3 className="text-base font-bold text-[#0E1B3D] mt-2">कोणताही कूपन कोड सापडला नाही</h3>
                <p className="text-xs text-[#5A6478] mt-1">
                  सर्च क्वेरी बदला किंवा नवीन कूपन तयार करण्यासाठी वरील बटणावर क्लिक करा.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setAppliesFilter("all");
                  }}
                  className="mt-4 px-4 py-1.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] border border-[#E4E8F8] rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  फिल्टर्स पूर्ववत करा (Reset)
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E8F8] text-[#8A94A6] uppercase tracking-wider font-semibold">
                      <th className="pb-3.5 pl-3">कूपन कोड & मोहीम</th>
                      <th className="pb-3.5">सूट (Discount)</th>
                      <th className="pb-3.5">लागू कोर्सेस (Scope)</th>
                      <th className="pb-3.5">वैधता कालावधी (Dates)</th>
                      <th className="pb-3.5">वापर / मर्यादा (Quota)</th>
                      <th className="pb-3.5">स्थिती (Status)</th>
                      <th className="pb-3.5 text-right pr-3">कृती (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E8F8]">
                    {filteredCoupons.map((c) => {
                      const totalUses = c.totalUsed || c.used_count || 0;
                      const maxUses = c.maxTotalUses || c.usage_limit || 100;
                      const usagePercent = Math.min(100, Math.round((totalUses / maxUses) * 100));
                      const remaining = Math.max(0, maxUses - totalUses);
                      const isPerUserOnce =
                        (c.per_user_usage || c.usageLimitPerUser || "once") === "once";

                      return (
                        <tr key={c.id} className="hover:bg-[#F9FAFF] transition-colors group">
                          {/* Code, School & Description */}
                          <td className="py-4 pl-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-xs tracking-wider text-[#0B57D0] px-2.5 py-1 bg-[#EEF4FF] border border-[#D0E2FF] rounded-md shadow-2xs">
                                {c.code}
                              </span>
                              {c.school && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                  🏫 {c.school}
                                </span>
                              )}
                              {isPerUserOnce && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                  👤 1x per student
                                </span>
                              )}
                            </div>
                            {c.description && (
                              <p className="text-[#5A6478] text-[11px] mt-1 max-w-xs line-clamp-1 font-medium">
                                {c.description}
                              </p>
                            )}
                          </td>

                          {/* Discount Value */}
                          <td className="py-4 font-black text-[#0E1B3D]">
                            <div className="space-y-0.5">
                              <span className="text-[#0E1B3D] text-xs font-black">
                                {c.discountType === "percentage" || c.discountType === "percent"
                                  ? `${c.discountValue}% OFF`
                                  : `₹${c.discountValue >= 1000 ? Math.round(c.discountValue / 100) : c.discountValue} OFF`}
                              </span>
                              {c.minOrderValuePaise && (
                                <p className="text-[10px] text-[#8A94A6] font-medium">
                                  किमान ₹{Math.round(c.minOrderValuePaise / 100)} खरेदीवर
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Applies Line */}
                          <td className="py-4 text-[#5A6478] max-w-xs">
                            <div className="flex items-center gap-1.5">
                              {c.applies_all !== false &&
                              (c.appliesTo === "all" || !c.selectedCourseIds?.length) ? (
                                <span className="inline-flex items-center gap-1 text-[#0E1B3D] font-semibold text-[11px]">
                                  <span className="text-xs">🌐</span> सर्व कोर्सेस
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[#0B57D0] font-semibold text-[11px] line-clamp-1"
                                  title={getAppliesLine(c)}
                                >
                                  <span className="text-xs">🎯</span> {getAppliesLine(c)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Validity Dates */}
                          <td className="py-4 text-[#5A6478] text-[11px] whitespace-nowrap">
                            <span className="font-semibold text-[#0E1B3D] bg-[#F5F7FF] px-2.5 py-1 rounded-md border border-[#E4E8F8]">
                              {getValidityLine(c)}
                            </span>
                          </td>

                          {/* Usage & Quota Bar */}
                          <td className="py-4">
                            <div className="w-32 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-[#0E1B3D] font-black">{totalUses} वापरले</span>
                                <span className="text-[#8A94A6]">/ {maxUses} मर्यादा</span>
                              </div>
                              <div className="w-full bg-[#E4E8F8] h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    usagePercent >= 100
                                      ? "bg-rose-600"
                                      : usagePercent >= 80
                                      ? "bg-amber-500"
                                      : "bg-[#0B57D0]"
                                  }`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-[#5A6478] font-medium">
                                {remaining === 0 ? "🔴 कोटा पूर्ण" : `⚡ ${remaining} शिल्लक`}
                              </p>
                            </div>
                          </td>

                          {/* Status & Instant Pause Switch */}
                          <td className="py-4 whitespace-nowrap">
                            <div className="space-y-1.5">
                              <div>{getStatusBadge(c)}</div>
                              <button
                                onClick={() => handleToggleStatus(c)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                                  c.status === "active" && c.is_active !== false
                                    ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                                }`}
                              >
                                {c.status === "active" && c.is_active !== false
                                  ? "⏸️ थांबवा (Pause)"
                                  : "▶️ पुन्हा सुरू करा (Resume)"}
                              </button>
                            </div>
                          </td>

                          {/* Actions: View Students, WhatsApp, Edit, Delete */}
                          <td className="py-4 text-right pr-3 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Redemptions (कोणी वापरले?) */}
                              <button
                                onClick={() => setViewingRedemptionsCoupon(c)}
                                className="px-2.5 py-1.5 bg-[#EEF4FF] hover:bg-[#D0E2FF] text-[#0B57D0] border border-[#D0E2FF] rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="या कूपनचा वापर केलेल्या विद्यार्थ्यांची यादी पहा"
                              >
                                <span>👥</span> विद्यार्थी ({totalUses})
                              </button>

                              {/* WhatsApp Share */}
                              <button
                                onClick={() => handleShareWhatsApp(c)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="व्हॉट्सअ‍ॅप मेसेज कॉपी करा"
                              >
                                <span>💬</span> शेअर
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEdit(c)}
                                className="px-2.5 py-1.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0E1B3D] border border-[#E4E8F8] rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                ✏️ बदला
                              </button>

                              {/* Delete (Admin Only) */}
                              {isMainAdmin && (
                                <button
                                  onClick={() => setDeleteModalCoupon(c)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                                  title="कूपन कायमचे हटवा"
                                >
                                  🗑️
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
          {/* SLIDE-OVER DRAWER FORM (CREATE / EDIT) */}
          {/* ========================================================= */}
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
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
                        <h2 className="text-lg font-black text-[#0E1B3D]">
                          {editingCoupon ? `कूपन संपादन: ${editingCoupon.code}` : "नवीन कूपन कोड तयार करा"}
                        </h2>
                      </div>
                      <p className="text-xs text-[#5A6478] mt-0.5">
                        कूपन नाव, १०० विद्यार्थी मर्यादा, वैधता तारीख व कोर्स निवडून कूपन सक्रिय करा.
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
                          कूपन कोड नाव (Coupon Code) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formCode}
                          onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                          placeholder="उदा. DIWALI50, POLICE100"
                          className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-mono font-black text-[#0B57D0] uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                        />
                      </div>

                      {/* Active Toggle Switch */}
                      <div className="p-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-[#0E1B3D]">स्थिती</p>
                          <p className="text-[9px] text-[#5A6478]">{formIsActive ? "चालू (Active)" : "थांबवलेले"}</p>
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
                        मोहीम / हेतू वर्णन (Campaign Description)
                      </label>
                      <input
                        type="text"
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="उदा. दिवाळी विशेष ५०% सवलत किंवा सातारा सेमिनार ऑफर"
                        className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                    </div>

                    {/* School Name (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                        शाळेचे नाव (School Restriction — ऐच्छिक, blank = सर्वांसाठी खुला)
                      </label>
                      <input
                        type="text"
                        value={formSchool}
                        onChange={(e) => setFormSchool(e.target.value)}
                        placeholder="उदा. अभिनव विद्यालय / आदर्श हायस्कूल"
                        className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] placeholder-[#8A94A6] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                      <p className="text-[11px] text-[#5A6478] mt-1">
                        {formSchool.trim()
                          ? `फक्त "${formSchool.trim()}" मधील विद्यार्थ्यांनाच हा कूपन कोड लागू होईल.`
                          : "रिकामे ठेवल्यास सर्व शाळांमधील विद्यार्थ्यांसाठी खुला राहील."}
                      </p>
                    </div>

                    {/* 2. Course Applicability Scope */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-bold text-[#0E1B3D]">
                            🎯 कोणत्या कोर्सेसवर लागू होणार? *
                          </label>
                          <p className="text-[11px] text-[#5A6478]">
                            {formAppliesAll ? "सर्व कोर्सेससाठी लागू (Site-wide)" : "फक्त निवडक कोर्सेससाठी लागू"}
                          </p>
                        </div>

                        {/* Applies All Toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0E1B3D]">
                            {formAppliesAll ? "सर्व कोर्सेस" : "निवडक"}
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
                            <span className="font-bold text-[#0E1B3D]">कोर्सेस निवडा (Select Courses):</span>
                            <span className="text-[#0B57D0] font-semibold">
                              {formSelectedCourses.length} निवडले
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                            {courses.map((course) => {
                              const isSelected =
                                formSelectedCourses.includes(course.id) ||
                                formSelectedCourses.includes(course.code);
                              return (
                                <button
                                  type="button"
                                  key={course.id}
                                  onClick={() => toggleCourseSelect(course.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isSelected
                                      ? "bg-[#EEF4FF] border-[#0B57D0] text-[#0B57D0] shadow-2xs font-bold"
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

                    {/* 3. Percent / Flat Segmented + Value & Min Order */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-3">
                      <label className="block text-xs font-bold text-[#0E1B3D]">
                        💰 सवलत प्रकार व रक्कम (Discount Amount) *
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Segmented Control: Percent vs Flat */}
                        <div className="flex bg-white p-1 rounded-xl border border-[#E4E8F8]">
                          <button
                            type="button"
                            onClick={() => setFormDiscountType("percentage")}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              formDiscountType === "percentage"
                                ? "bg-[#0B57D0] text-white shadow-2xs"
                                : "text-[#5A6478] hover:text-[#0E1B3D]"
                            }`}
                          >
                            % टक्केवारी (Percent)
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormDiscountType("flat")}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              formDiscountType === "flat"
                                ? "bg-[#0B57D0] text-white shadow-2xs"
                                : "text-[#5A6478] hover:text-[#0E1B3D]"
                            }`}
                          >
                            ₹ फ्लॅट रक्कम (Flat ₹)
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
                            className="w-full pl-8 pr-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs font-black text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                          />
                        </div>
                      </div>

                      {/* Min Order Value */}
                      <div className="pt-2 border-t border-[#E4E8F8] flex items-center justify-between gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#0E1B3D]">
                            किमान खरेदी मर्यादा (Min Order Value ₹):
                          </label>
                          <p className="text-[10px] text-[#5A6478]">
                            यापेक्षा कमी किमतीच्या कोर्सवर कूपन चालणार नाही.
                          </p>
                        </div>
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A94A6]">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={formMinOrder}
                            onChange={(e) => setFormMinOrder(Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-[#E4E8F8] rounded-xl text-xs font-bold text-[#0E1B3D]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. Validity Window (Start Date to End Date) */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-3">
                      <label className="block text-xs font-bold text-[#0E1B3D]">
                        ⏳ वैधता तारीख कालावधी (Starting to Expiring Date) *
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                            सुरुवात तारीख (Starting Date):
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
                            समाप्ती तारीख (Expiring Date):
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
                      <p className="text-[10px] text-[#5A6478]">
                        ⚡ समाप्ती तारीख उलटताच कूपन आपोआप एक्सपायर (Expired) होईल.
                      </p>
                    </div>

                    {/* 5. Total Usage Limit & Per-User Limit */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-3">
                      <label className="block text-xs font-bold text-[#0E1B3D]">
                        👥 वापर मर्यादा (Usage Limits) *
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                            एकूण विद्यार्थी मर्यादा (Total Uses):
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={formUsageLimit}
                            onChange={(e) => setFormUsageLimit(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl text-xs font-black text-[#0E1B3D]"
                          />
                          <p className="text-[10px] text-[#5A6478] mt-1">
                            उदा. १०० विद्यार्थी. १०० पूर्ण झाल्यावर आपोआप बंद होईल.
                          </p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                            प्रति विद्यार्थी मर्यादा:
                          </label>
                          <div className="flex bg-white p-1 rounded-xl border border-[#E4E8F8]">
                            <button
                              type="button"
                              onClick={() => setFormPerUserUsage("once")}
                              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                formPerUserUsage === "once"
                                  ? "bg-violet-600 text-white shadow-2xs"
                                  : "text-[#5A6478]"
                              }`}
                            >
                              🔒 १ वेळाच (1x)
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormPerUserUsage("multiple")}
                              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                formPerUserUsage === "multiple"
                                  ? "bg-indigo-600 text-white shadow-2xs"
                                  : "text-[#5A6478]"
                              }`}
                            >
                              🔄 एकापेक्षा जास्त
                            </button>
                          </div>
                          <p className="text-[10px] text-[#5A6478] mt-1">
                            एकाच विद्यार्थ्याने पुन्हा वापरू नये यासाठी १ वेळाच सुरक्षित.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 6. LIVE PREVIEW ROW */}
                    <div className="pt-4 border-t border-[#E4E8F8]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#8A94A6]">
                          ✨ लाईव्ह प्रिव्ह्यू (Live Preview)
                        </span>
                        <span className="text-[10px] text-[#5A6478]">
                          (ॲपमध्ये हे कूपन असे दिसेल)
                        </span>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-[#F9FAFF] to-white border border-[#D0E2FF] rounded-2xl shadow-2xs space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs tracking-wider text-[#0B57D0] px-2.5 py-1 bg-[#EEF4FF] border border-[#D0E2FF] rounded-md shadow-2xs">
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
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                              {formPerUserUsage === "once" ? "👤 Once per student" : "👥 Multiple uses"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ● {formUsageLimit} विद्यार्थी कोटा
                            </span>
                          </div>
                        </div>

                        {/* Sample calculation preview */}
                        <div className="mt-2 bg-white p-2.5 rounded-xl border border-[#E4E8F8] flex items-center justify-between text-[11px]">
                          <span className="text-[#5A6478]">₹९९९ च्या कोर्सवर विद्यार्थ्याचा हिशोब:</span>
                          <span className="font-black text-[#0B57D0]">
                            {formDiscountType === "percentage"
                              ? `बचत: ₹${Math.round((999 * formValue) / 100)} → विद्यार्थी भरेल: ₹${Math.max(1, 999 - Math.round((999 * formValue) / 100))}`
                              : `बचत: ₹${Math.min(999, formValue)} → विद्यार्थी भरेल: ₹${Math.max(1, 999 - formValue)}`}
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
                        रद्द करा (Cancel)
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        {editingCoupon ? "कूपन बदल सेव्ह करा" : "कूपन सक्रिय करा →"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* REDEMPTIONS MODAL (कोणी वापरले? - सविस्तर विद्यार्थी ट्रॅक रेकॉर्ड) */}
          {/* ========================================================= */}
          {viewingRedemptionsCoupon && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl border border-[#E4E8F8] max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-[#E4E8F8] pb-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-sm px-3 py-1 bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF] rounded-lg">
                        {viewingRedemptionsCoupon.code}
                      </span>
                      <h3 className="text-base font-black text-[#0E1B3D]">
                        विद्यार्थी रिडेम्पशन ट्रॅक रेकॉर्ड (Redemptions Log)
                      </h3>
                      {viewingRedemptionsCoupon.school && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          🏫 {viewingRedemptionsCoupon.school}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5A6478] mt-1">
                      {viewingRedemptionsCoupon.description || "हा कूपन कोड वापरलेल्या सर्व विद्यार्थ्यांची प्रत्यक्ष माहिती."}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setViewingRedemptionsCoupon(null);
                      setRedemptionSearch("");
                    }}
                    className="w-8 h-8 rounded-full bg-[#F5F7FF] border border-[#E4E8F8] flex items-center justify-center text-sm text-[#5A6478] hover:bg-slate-200 cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                </div>

                {/* Redemption Stats & Search */}
                {(() => {
                  const studentRedemptions = getRedemptionsByCoupon(viewingRedemptionsCoupon.code);
                  const totalUsedCount = viewingRedemptionsCoupon.totalUsed || viewingRedemptionsCoupon.used_count || studentRedemptions.length;
                  const quotaLimit = viewingRedemptionsCoupon.maxTotalUses || viewingRedemptionsCoupon.usage_limit || 100;
                  const totalSavingsGiven = studentRedemptions.reduce(
                    (acc, r) => acc + Math.round((r.discountPaise || 0) / 100),
                    0
                  );
                  const totalFeePaid = studentRedemptions.reduce(
                    (acc, r) => acc + Math.round((r.paidPaise || 0) / 100),
                    0
                  );

                  const filteredStudents = studentRedemptions.filter((r) => {
                    const q = redemptionSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      (r.studentName && r.studentName.toLowerCase().includes(q)) ||
                      (r.studentMobile && r.studentMobile.includes(q)) ||
                      (r.courseTitle && r.courseTitle.toLowerCase().includes(q))
                    );
                  });

                  return (
                    <>
                      {/* Mini KPI Bar */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-[#F5F7FF] rounded-2xl border border-[#E4E8F8]">
                          <span className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider block">
                            वापरलेले / कोटा
                          </span>
                          <p className="text-lg font-black text-[#0E1B3D] mt-0.5">
                            {totalUsedCount} / {quotaLimit}
                          </p>
                          <span className="text-[10px] text-[#5A6478]">
                            {Math.max(0, quotaLimit - totalUsedCount)} कोटा शिल्लक
                          </span>
                        </div>

                        <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                            एकूण दिलेली सूट
                          </span>
                          <p className="text-lg font-black text-amber-800 mt-0.5">
                            ₹{totalSavingsGiven.toLocaleString("en-IN")}
                          </p>
                          <span className="text-[10px] text-amber-600">विद्यार्थ्यांना मिळालेली बचत</span>
                        </div>

                        <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                            जमा झालेली फी
                          </span>
                          <p className="text-lg font-black text-emerald-800 mt-0.5">
                            ₹{totalFeePaid.toLocaleString("en-IN")}
                          </p>
                          <span className="text-[10px] text-emerald-600">अकॅडमीला मिळालेला महसूल</span>
                        </div>
                      </div>

                      {/* Search & Export Buttons */}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8A94A6]">
                            🔍
                          </span>
                          <input
                            type="text"
                            value={redemptionSearch}
                            onChange={(e) => setRedemptionSearch(e.target.value)}
                            placeholder="विद्यार्थ्याचे नाव किंवा मोबाईल शोधा..."
                            className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D]"
                          />
                        </div>

                        <button
                          onClick={() => handleExportCouponRedemptions(viewingRedemptionsCoupon, studentRedemptions)}
                          className="px-4 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                        >
                          <span>📥</span> एक्सेल डाऊनलोड (.xlsx)
                        </button>
                      </div>

                      {/* Students List Table */}
                      <div className="overflow-y-auto flex-1 border border-[#E4E8F8] rounded-2xl">
                        {filteredStudents.length === 0 ? (
                          <div className="py-12 text-center text-[#5A6478] space-y-1">
                            <span className="text-3xl block">📋</span>
                            <p className="text-xs font-bold text-[#0E1B3D]">
                              अद्याप कोणत्याही विद्यार्थ्याने हा कूपन वापरलेला नाही.
                            </p>
                            <p className="text-[11px] text-[#8A94A6]">
                              विद्यार्थ्याने चेकआऊटवर हा कोड वापरताच त्याची नोंद येथे आपोआप दिसेल.
                            </p>
                          </div>
                        ) : (
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#FAFBFD] sticky top-0 border-b border-[#E4E8F8] text-[#8A94A6] uppercase text-[10px]">
                              <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">विद्यार्थ्याचे नाव</th>
                                <th className="p-3">मोबाईल</th>
                                <th className="p-3">खरेदी केलेला कोर्स</th>
                                <th className="p-3">सूट (₹)</th>
                                <th className="p-3">भरलेली फी (₹)</th>
                                <th className="p-3 text-right">तारीख व वेळ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E8F8]">
                              {filteredStudents.map((r, idx) => (
                                <tr key={r.id} className="hover:bg-[#F9FAFF] transition-colors">
                                  <td className="p-3 text-[#8A94A6] font-semibold">{idx + 1}</td>
                                  <td className="p-3 font-bold text-[#0E1B3D]">
                                    {r.studentName || "विद्यार्थी"}
                                  </td>
                                  <td className="p-3 font-mono text-[11px] text-[#5A6478]">
                                    {r.studentMobile || "—"}
                                  </td>
                                  <td className="p-3 text-[#0E1B3D] max-w-[180px] truncate">
                                    {r.courseTitle || "MindMaster Course"}
                                  </td>
                                  <td className="p-3 font-bold text-amber-700">
                                    ₹{Math.round((r.discountPaise || 0) / 100)}
                                  </td>
                                  <td className="p-3 font-black text-emerald-700">
                                    ₹{Math.round((r.paidPaise || 0) / 100)}
                                  </td>
                                  <td className="p-3 text-right text-[11px] text-[#8A94A6] whitespace-nowrap">
                                    {new Date(r.at).toLocaleDateString("mr-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* Modal Footer */}
                <div className="flex items-center justify-end pt-2 border-t border-[#E4E8F8]">
                  <button
                    onClick={() => {
                      setViewingRedemptionsCoupon(null);
                      setRedemptionSearch("");
                    }}
                    className="px-5 py-2 rounded-full bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0E1B3D] font-bold text-xs border border-[#E4E8F8] cursor-pointer"
                  >
                    बंद करा (Close)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DELETE CONFIRMATION MODAL (ADMIN-ONLY) */}
          {/* ========================================================= */}
          {deleteModalCoupon && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-[#E4E8F8] max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
                  🗑️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0E1B3D]">
                    कूपन कोड कायमचा हटवायचा आहे का?
                  </h3>
                  <p className="text-xs text-[#5A6478] mt-1 leading-relaxed">
                    तुम्ही <span className="font-mono font-bold text-[#0E1B3D]">"{deleteModalCoupon.code}"</span> कूपन डिलीट करत आहात. ही कृती फक्त मुख्य ॲडमिनसाठी राखीव आहे आणि सिस्टीम ऑडिट लॉगमध्ये नोंदवली जाईल.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E8F8]">
                  <button
                    onClick={() => setDeleteModalCoupon(null)}
                    className="px-4 py-2 rounded-full border border-[#E4E8F8] text-xs font-bold text-[#5A6478] hover:bg-[#F5F7FF] cursor-pointer"
                  >
                    रद्द करा (Cancel)
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    होय, कूपन हटवा
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
