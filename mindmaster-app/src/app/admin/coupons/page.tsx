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
  getStaffBooks,
  getStaffUsers,
} from "@/lib/staffStore";
import { getRedemptions, getRedemptionsByCoupon } from "@/lib/couponRedemptionStore";
import {
  exportCouponRedemptionsToExcel,
  exportCouponsMasterToExcel,
} from "@/lib/excelExporter";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import SubmitButton from "@/components/ui/SubmitButton";
import Spinner from "@/components/ui/Spinner";

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
  const [formAssignedPhone, setFormAssignedPhone] = useState("");
  const [formPromoterStaffId, setFormPromoterStaffId] = useState("");
  const [formIsPublicChip, setFormIsPublicChip] = useState(true);
  const [formDiscountType, setFormDiscountType] = useState<"percentage" | "flat">("percentage");
  const [formValue, setFormValue] = useState(25);
  const [formMinOrder, setFormMinOrder] = useState<number>(499);
  const [formAppliesAll, setFormAppliesAll] = useState(true);
  const [formSelectedCourses, setFormSelectedCourses] = useState<string[]>([]);
  const [formSelectedBooks, setFormSelectedBooks] = useState<string[]>([]);
  const [formPerUserUsage, setFormPerUserUsage] = useState<"once" | "multiple">("once");
  const [formValidityType, setFormValidityType] = useState<"days" | "date_range">("date_range");
  const [formValidDays, setFormValidDays] = useState(30);
  const [formStartsAt, setFormStartsAt] = useState("2026-10-01");
  const [formEndsAt, setFormEndsAt] = useState("2026-11-30");
  const [formUsageLimit, setFormUsageLimit] = useState(100);
  const [formIsActive, setFormIsActive] = useState(true);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Redemptions Modal State
  const [viewingRedemptionsCoupon, setViewingRedemptionsCoupon] = useState<Coupon | null>(null);
  const [redemptionSearch, setRedemptionSearch] = useState("");

  // Delete Modal State
  const [deleteModalCoupon, setDeleteModalCoupon] = useState<Coupon | null>(null);

  const courses = getStaffCourses();
  const books = getStaffBooks();

  const reload = () => {
    setCoupons(getStaffCoupons());
    setStaff(getCurrentStaff());
    setStaffList(getStaffUsers());
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
    setFormAssignedPhone("");
    setFormPromoterStaffId("");
    setFormIsPublicChip(true);
    setFormDiscountType("percentage");
    setFormValue(20);
    setFormMinOrder(499);
    setFormAppliesAll(true);
    setFormSelectedCourses([]);
    setFormSelectedBooks([]);
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
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (cpn: Coupon) => {
    setEditingCoupon(cpn);
    setFormCode(cpn.code);
    setFormDesc(cpn.description || "");
    setFormSchool(cpn.school || "");
    setFormAssignedPhone(cpn.assigned_phone || cpn.assignedPhone || "");
    setFormPromoterStaffId(cpn.promoter_staff_id || cpn.promoterStaffId || "");
    setFormIsPublicChip(
      cpn.is_public_chip !== undefined ? cpn.is_public_chip : cpn.isPublicChip !== undefined ? cpn.isPublicChip : true
    );
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
    setFormSelectedBooks(cpn.selectedBookIds || []);
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
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleCourseSelect = (courseId: string) => {
    if (formSelectedCourses.includes(courseId)) {
      setFormSelectedCourses(formSelectedCourses.filter((id) => id !== courseId));
    } else {
      setFormSelectedCourses([...formSelectedCourses, courseId]);
    }
  };

  const toggleBookSelect = (bookId: string) => {
    if (formSelectedBooks.includes(bookId)) {
      setFormSelectedBooks(formSelectedBooks.filter((id) => id !== bookId));
    } else {
      setFormSelectedBooks([...formSelectedBooks, bookId]);
    }
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      toast.error("Please enter a coupon code.");
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

    const cleanAssignedPhone = formAssignedPhone.trim()
      ? formAssignedPhone.trim().replace(/\D/g, "").slice(-10)
      : undefined;

    const promoterStaff = formPromoterStaffId
      ? staffList.find((s) => s.id === formPromoterStaffId || s.staffId === formPromoterStaffId)
      : null;

    const updatedCoupon: Coupon = {
      id: editingCoupon ? editingCoupon.id : `cpn-${Date.now()}`,
      code: cleanedCode,
      description: formDesc.trim() || `${cleanedCode} Discount Coupon`,
      school: formSchool.trim() || undefined,
      assigned_phone: cleanAssignedPhone,
      assignedPhone: cleanAssignedPhone,
      promoter_staff_id: formPromoterStaffId || undefined,
      promoterStaffId: formPromoterStaffId || undefined,
      promoterStaffName: promoterStaff?.name || undefined,
      is_public_chip: formIsPublicChip,
      isPublicChip: formIsPublicChip,
      discountType: formDiscountType,
      discountValue: valueInPaiseOrPct,
      minOrderValuePaise: formMinOrder ? Number(formMinOrder) * 100 : undefined,
      appliesTo: formAppliesAll ? "all" : "selected",
      applies_all: formAppliesAll,
      selectedCourseIds: formAppliesAll ? [] : formSelectedCourses,
      selectedBookIds: formAppliesAll ? [] : formSelectedBooks,
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
        ? `Coupon "${cleanedCode}" updated successfully!`
        : `New coupon "${cleanedCode}" created successfully!`
    );
  };

  // Instant Pause / Resume Toggle
  const handleToggleStatus = (cpn: Coupon) => {
    const updated = toggleStaffCouponStatus(cpn.id);
    if (updated) {
      toast.success(
        updated.status === "active"
          ? `Coupon "${cpn.code}" is now Active!`
          : `Coupon "${cpn.code}" is now Paused!`
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
        ? "All Courses (Site-wide)"
        : `${cpn.selectedCourseIds?.length || 1} Selected Courses`;

    const validityStr =
      cpn.validityType === "days"
        ? `Next ${cpn.validDays || 30} days`
        : `${cpn.starts_at?.slice(0, 10) || cpn.validFrom || "Start"} to ${cpn.ends_at?.slice(0, 10) || cpn.validUntil || "End"}`;

    const limitStr = `Limited to first ${cpn.usage_limit || cpn.maxTotalUses || 100} students!`;

    const msg = `🎓 *MindMaster Academy — Special Discount Coupon!*\n\nSpecial discount from Prashant Dhumal Sir's Academy:\n🎟️ Coupon Code: *${cpn.code}*\n💰 Discount: *${discountStr}*\n📚 Applicable Courses: *${courseStr}*\n⏳ Validity: *${validityStr}*\n👥 Limit: *${limitStr}*${
      cpn.school ? `\n🏫 School: *${cpn.school}*` : ""
    }\n\n👉 To enroll and apply coupon, visit:\nhttps://mindmasteredu.in/checkout?coupon=${cpn.code}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      toast.success(`Coupon "${cpn.code}" WhatsApp message copied to clipboard!`);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteModalCoupon) return;
    if (!isMainAdmin) {
      toast.error("Unauthorized: Coupon deletion is strictly reserved for Main Admin.");
      setDeleteModalCoupon(null);
      return;
    }
    deleteStaffCoupon(deleteModalCoupon.id);
    reload();
    toast.success(`Coupon "${deleteModalCoupon.code}" deleted successfully.`);
    setDeleteModalCoupon(null);
  };

  // Helper for applying line
  const getAppliesLine = (cpn: Coupon) => {
    const appliesAll = cpn.applies_all !== undefined ? cpn.applies_all : cpn.appliesTo === "all";
    if (appliesAll) {
      return "All Courses (Site-wide)";
    }
    const ids = cpn.selectedCourseIds || [];
    if (ids.length === 0) return "Selected Courses (None selected)";
    const matchedTitles = courses
      .filter((c) => ids.includes(c.id) || ids.includes(c.code))
      .map((c) => c.title);
    if (matchedTitles.length > 0) {
      return `${ids.length} Courses: ${matchedTitles.join(", ")}`;
    }
    return `${ids.length} Selected Courses`;
  };

  // Helper for validity line
  const getValidityLine = (cpn: Coupon) => {
    if (cpn.validityType === "days" || cpn.validDays) {
      return `${cpn.validDays || 30} days validity`;
    }
    const start = cpn.starts_at ? cpn.starts_at.slice(0, 10) : cpn.validFrom || "Start";
    const end = cpn.ends_at ? cpn.ends_at.slice(0, 10) : cpn.validUntil || "End";
    return `${start} → ${end}`;
  };

  // Helper for status badge using unified SVG StatusBadge
  const getStatusBadge = (cpn: Coupon) => {
    const totalUses = cpn.totalUsed || cpn.used_count || 0;
    const maxUses = cpn.maxTotalUses || cpn.usage_limit || 100;
    const isQuotaFull = totalUses >= maxUses;

    if (isQuotaFull) {
      return (
        <StatusBadge
          status="expired"
          label={`Quota Full (${maxUses}/${maxUses})`}
          size="sm"
        />
      );
    }
    if (cpn.status === "paused" || cpn.is_active === false || cpn.status === "disabled") {
      return <StatusBadge status="paused" label="Paused" size="sm" />;
    }
    if (cpn.status === "scheduled") {
      return <StatusBadge status="upcoming" label="Scheduled" size="sm" />;
    }
    if (cpn.status === "expired") {
      return <StatusBadge status="expired" label="Expired" size="sm" />;
    }
    return <StatusBadge status="active" label="Active" size="sm" />;
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
    toast.success("Coupons master report downloaded in Excel!");
  };

  // Export Specific Coupon Redemptions
  const handleExportCouponRedemptions = (cpn: Coupon, list: CouponRedemptionRecord[]) => {
    const rows = list.map((r) => ({
      couponCode: cpn.code,
      studentName: r.studentName || "Student",
      studentMobile: r.studentMobile || "—",
      courseTitle: r.courseTitle || "MindMaster Course",
      originalPrice: Math.round((r.originalPricePaise || 99900) / 100),
      discountReceived: Math.round((r.discountPaise || 0) / 100),
      finalPaid: Math.round((r.paidPaise || 99900) / 100),
      redeemedAt: new Date(r.at).toLocaleString("en-IN"),
    }));
    exportCouponRedemptionsToExcel(rows, cpn.code);
    toast.success(`Coupon "${cpn.code}" redemptions track record downloaded in Excel!`);
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
          {isDrawerOpen ? (
            /* ========================================================= */
            /* IN-PAGE DEDICATED COUPON STUDIO WORKSPACE */
            /* ========================================================= */
            <div className="space-y-6 animate-fadeIn">
              {/* Studio Header Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-[#E4E8F8] dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => !isSaving && setIsDrawerOpen(false)}
                    className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl transition shadow-xs cursor-pointer"
                    title="यादीकडे परत जा"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🎟️</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#0B57D0] dark:text-blue-400 font-mono text-xs font-black">
                        {formCode.trim().toUpperCase() || "NEW_COUPON"}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">• {editingCoupon ? "कूपन संपादन मोड" : "नवीन कूपन निर्मिती"}</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#0E1B3D] dark:text-white font-heading">
                      {editingCoupon ? `कूपन संपादन स्टुडिओ: ${editingCoupon.code}` : "कूपन निर्मिती स्टुडिओ (Create New Coupon)"}
                    </h1>
                    <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-0.5">
                      कूपन कोड, सवलत मूल्य, मर्यादा, वैधता तारीख आणि लागू कोर्सेस निवडून सक्रिय करा.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    रद्द करा (Cancel)
                  </button>
                  <SubmitButton
                    type="button"
                    onClick={() => {
                      const form = document.getElementById("coupon-drawer-form") as HTMLFormElement;
                      if (form) form.requestSubmit();
                    }}
                    loading={isSaving}
                    loadingText="कूपन सेव्ह करत आहे..."
                    disabled={!formCode.trim()}
                    className="px-6 py-2.5 rounded-xl text-xs font-black shadow-md cursor-pointer"
                  >
                    <span>{editingCoupon ? "बदल सेव्ह करा (Save)" : "कूपन सक्रिय करा (Activate Coupon →)"}</span>
                  </SubmitButton>
                </div>
              </div>

              {/* ⚡ 1-CLICK MARATHI COUPON TEMPLATES */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-3xl border border-blue-200/80 dark:border-slate-700 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-[#0B57D0] dark:text-blue-400 flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <span>रेडीमेड १-क्लिक कूपन टेम्पलेट्स (1-Click Instant Templates):</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">एका क्लिकवर कोड, सवलत आणि तपशील भरा</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { code: "POLICE20", disc: "20", type: "percentage", desc: "पोलीस भरती विशेष २०% सवलत", tag: "⚡ पोलीस भरती २०%" },
                    { code: "GUDHI50", disc: "50", type: "percentage", desc: "गुढीपाडवा विशेष ५०% सवलत", tag: "🚩 गुढीपाडवा ५०%" },
                    { code: "FLAT500", disc: "500", type: "flat", desc: "थेट ₹५०० ची विशेष सूट", tag: "💰 ₹५०० थेट सूट" },
                    { code: "SEMINAR2026", disc: "30", type: "percentage", desc: "सातारा व पुणे सेमिनार ३०% सवलत", tag: "🏢 सेमिनार ३०%" },
                  ].map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormCode(tmpl.code);
                        setFormValue(Number(tmpl.disc));
                        setFormDiscountType(tmpl.type as any);
                        setFormDesc(tmpl.desc);
                        setFormAppliesAll(true);
                        setFormIsPublicChip(true);
                        toast.success(`🎉 "${tmpl.code}" टेम्पलेट भरले!`);
                      }}
                      className="p-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-2xl text-left transition cursor-pointer shadow-2xs hover:border-[#0B57D0]"
                    >
                      <p className="font-mono font-black text-sm text-[#0B57D0] dark:text-blue-400">{tmpl.code}</p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">{tmpl.tag}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Body - 2 Column Responsive Workspace */}
              <form onSubmit={handleSaveCoupon} id="coupon-drawer-form" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column (6 cols): Code, Description, Restrictions, Promoter */}
                  <div className="lg:col-span-6 space-y-6">
                    {/* Code & Active Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm space-y-4">
                      <h3 className="font-bold text-sm text-[#0E1B3D] dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <span>🏷️</span>
                        <span>कूपन कोड व स्थिती (Coupon Identity)</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-[#0E1B3D] dark:text-slate-200 mb-1 flex items-center justify-between">
                            <span>कूपन कोड (Coupon Code) *</span>
                            {formCode.trim().length >= 3 && (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> मान्य कोड
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={formCode}
                              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                              placeholder="उदा. DIWALI50, MINDMASTER100"
                              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-black text-[#0B57D0] dark:text-blue-400 uppercase tracking-wider focus:outline-none transition-all ${
                                formCode.trim().length >= 3
                                  ? "bg-emerald-50/15 border border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                                  : "bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 focus:ring-2 focus:ring-[#0B57D0]"
                              }`}
                            />
                            {formCode.trim().length >= 3 && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                            )}
                          </div>
                        </div>

                        {/* Active Toggle Switch */}
                        <div className="p-2.5 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-[#0E1B3D] dark:text-white">स्थिती (Status)</p>
                            <p className="text-[9px] text-[#5A6478] dark:text-slate-400">{formIsActive ? "Active (सक्रिय)" : "Paused (थांबवले)"}</p>
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
                        <label className="block text-xs font-bold text-[#0E1B3D] dark:text-slate-200 mb-1">
                          कूपन मोहीम वर्णन (Campaign Description)
                        </label>
                        <input
                          type="text"
                          value={formDesc}
                          onChange={(e) => setFormDesc(e.target.value)}
                          placeholder="उदा. गुढीपाडवा विशेष ५०% सवलत किंवा सातारा सेमिनार"
                          className="w-full px-3.5 py-2.5 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-xl text-xs text-[#0E1B3D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                        />
                      </div>

                      {/* School Restriction */}
                      <div>
                        <label className="block text-xs font-bold text-[#0E1B3D] dark:text-slate-200 mb-1">
                          शाळेचे नाव (ऐच्छिक - फक्त त्या शाळेतील विद्यार्थ्यांसाठी)
                        </label>
                        <input
                          type="text"
                          value={formSchool}
                          onChange={(e) => setFormSchool(e.target.value)}
                          placeholder="उदा. अभिनव विद्यालय / आदर्श हायस्कूल"
                          className="w-full px-3.5 py-2.5 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-xl text-xs text-[#0E1B3D] dark:text-white placeholder-[#8A94A6] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                        />
                        <p className="text-[11px] text-[#5A6478] dark:text-slate-400 mt-1">
                          {formSchool.trim()
                            ? `हा कूपन फक्त "${formSchool.trim()}" शाळेतील विद्यार्थ्यांसाठी लागू होईल.`
                            : "रिकामे ठेवल्यास सर्व शाळांमधील विद्यार्थ्यांना लागू होईल."}
                        </p>
                      </div>

                      {/* Student Mobile Lock & Promoter Attribution */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#0E1B3D] dark:text-slate-200 mb-1">
                            🎯 विद्यार्थी मोबाईल लॉक (ऐच्छिक)
                          </label>
                          <input
                            type="tel"
                            maxLength={10}
                            value={formAssignedPhone}
                            onChange={(e) => setFormAssignedPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder="उदा. 9822012345"
                            className="w-full px-3.5 py-2.5 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-[#0E1B3D] dark:text-white placeholder-[#8A94A6] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                          />
                          <p className="text-[10px] text-[#5A6478] dark:text-slate-400 mt-1">
                            {formAssignedPhone.trim()
                              ? `फक्त +91 ${formAssignedPhone.trim()} हाच विद्यार्थी वापरू शकेल.`
                              : "रिकामे = कोणताही विद्यार्थी वापरू शकेल."}
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#0E1B3D] dark:text-slate-200 mb-1">
                            🤝 सब-ॲडमिन संदर्भ (Promoter)
                          </label>
                          <select
                            value={formPromoterStaffId}
                            onChange={(e) => setFormPromoterStaffId(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#0E1B3D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                          >
                            <option value="">None (अकादमी थेट ऑफर)</option>
                            {staffList
                              .filter((s) => s.role !== "main_admin")
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.staffId || s.id} • {s.name} {s.district ? `(${s.district})` : ""}
                                </option>
                              ))}
                          </select>
                          <p className="text-[10px] text-[#5A6478] dark:text-slate-400 mt-1">
                            या कूपनचे ॲट्रिब्युशन विशिष्ट स्टाफ सदस्याशी लिंक करा.
                          </p>
                        </div>
                      </div>

                      {/* Public 1-Click Chip Toggle */}
                      <div className="p-3 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#0E1B3D] dark:text-white flex items-center gap-1.5">
                            <span>👁️</span> Public /checkout १-क्लिक चिप
                          </p>
                          <p className="text-[11px] text-[#5A6478] dark:text-slate-400 mt-0.5">
                            {formIsPublicChip
                              ? "चेकआउट पानावर विद्यार्थ्यांना आपोआप '🏷️ टॅप करा व सूट मिळवा' म्हणून दिसेल."
                              : "चेकआउट यादीतून लपवलेला गुप्त प्रोमो कोड (फक्त कोड टाकल्यावर चालेल)."}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formIsPublicChip}
                            onChange={(e) => setFormIsPublicChip(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B57D0]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (6 cols): Scope, Discount %, Quotas, Live Preview */}
                  <div className="lg:col-span-6 space-y-6">
                    {/* Scope Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm space-y-4">
                      <h3 className="font-bold text-sm text-[#0E1B3D] dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <span>🎯</span>
                        <span>लागू होणारे कोर्सेस व पुस्तके (Scope)</span>
                      </h3>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#0E1B3D] dark:text-slate-200">
                            {formAppliesAll ? "सर्व कोर्सेस व पुस्तकांसाठी लागू (Site-wide)" : "फक्त निवडक कोर्सेस/पुस्तकांसाठी"}
                          </p>
                          <p className="text-[11px] text-[#5A6478] dark:text-slate-400">
                            {formAppliesAll ? "विद्यार्थी कोणत्याही कोर्सवर वापरू शकतात." : "फक्त खाली निवडलेल्या आयटम्सवरच कूपन चालेल."}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0E1B3D] dark:text-slate-200">
                            {formAppliesAll ? "All Items" : "Selected"}
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

                      {/* Multi-item selectors if applies_all is false */}
                      {!formAppliesAll && (
                        <div className="pt-3 border-t border-[#E4E8F8] dark:border-slate-700 space-y-4">
                          {/* Course Selection */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#0E1B3D] dark:text-white">1. विशिष्ट कोर्सेस निवडा:</span>
                              <span className="text-[#0B57D0] font-semibold">{formSelectedCourses.length} कोर्सेस निवडले</span>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-[#F5F7FF] dark:bg-slate-800 rounded-2xl">
                              {courses.map((course) => {
                                const isSelected = formSelectedCourses.includes(course.id) || formSelectedCourses.includes(course.code);
                                return (
                                  <button
                                    type="button"
                                    key={course.id}
                                    onClick={() => toggleCourseSelect(course.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isSelected
                                        ? "bg-[#EEF4FF] dark:bg-blue-950 border-[#0B57D0] text-[#0B57D0] dark:text-blue-400 shadow-2xs font-bold"
                                        : "bg-white dark:bg-slate-700 border-[#E4E8F8] dark:border-slate-600 text-[#5A6478] dark:text-slate-300 hover:border-slate-300"
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

                          {/* Paid Books Selection */}
                          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#0E1B3D] dark:text-white">2. विशिष्ट पुस्तके निवडा:</span>
                              <span className="text-purple-600 font-semibold">{formSelectedBooks.length} पुस्तके निवडली</span>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-[#F5F7FF] dark:bg-slate-800 rounded-2xl">
                              {books.filter((b) => !b.isFree && (b.pricePaise || 0) > 0).map((book) => {
                                const isSelected = formSelectedBooks.includes(book.id) || Boolean(book.code && formSelectedBooks.includes(book.code));
                                return (
                                  <button
                                    type="button"
                                    key={book.id}
                                    onClick={() => toggleBookSelect(book.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isSelected
                                        ? "bg-purple-50 dark:bg-purple-950/40 border-purple-600 text-purple-700 dark:text-purple-300 shadow-2xs font-bold"
                                        : "bg-white dark:bg-slate-700 border-[#E4E8F8] dark:border-slate-600 text-[#5A6478] dark:text-slate-300 hover:border-slate-300"
                                    }`}
                                  >
                                    <span>{isSelected ? "✓" : "+"}</span>
                                    <span className="font-mono text-[11px] font-bold">{book.code || "BK"}</span>
                                    <span className="text-[11px] max-w-[140px] truncate">{book.title}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Discount & Limits Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-sm space-y-4">
                      <h3 className="font-bold text-sm text-[#0E1B3D] dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <span>💰</span>
                        <span>सवलत प्रकार, मूल्य आणि मर्यादा (Discount & Limits)</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Discount Type Segmented Control */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#5A6478] dark:text-slate-400 mb-1">
                            सवलत प्रकार:
                          </label>
                          <div className="flex bg-[#F5F7FF] dark:bg-slate-800 p-1 rounded-xl border border-[#E4E8F8] dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => setFormDiscountType("percentage")}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                formDiscountType === "percentage"
                                  ? "bg-[#0B57D0] text-white shadow-2xs"
                                  : "text-[#5A6478] dark:text-slate-400 hover:text-[#0E1B3D]"
                              }`}
                            >
                              % Percentage
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormDiscountType("flat")}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                formDiscountType === "flat"
                                  ? "bg-[#0B57D0] text-white shadow-2xs"
                                  : "text-[#5A6478] dark:text-slate-400 hover:text-[#0E1B3D]"
                              }`}
                            >
                              ₹ Flat Amount
                            </button>
                          </div>
                        </div>

                        {/* Value Input */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#5A6478] dark:text-slate-400 mb-1">
                            सवलत मूल्य ({formDiscountType === "percentage" ? "%" : "₹"}):
                          </label>
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
                              className="w-full pl-8 pr-3 py-2 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-xl text-xs font-black text-[#0E1B3D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Validity Window (Dates) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <label className="block text-[11px] font-bold text-[#5A6478] dark:text-slate-400 mb-1">
                            सुरुवात तारीख:
                          </label>
                          <input
                            type="date"
                            required
                            value={formStartsAt}
                            onChange={(e) => setFormStartsAt(e.target.value)}
                            className="w-full px-3 py-2 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#0E1B3D] dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#5A6478] dark:text-slate-400 mb-1">
                            समाप्ती तारीख:
                          </label>
                          <input
                            type="date"
                            required
                            value={formEndsAt}
                            onChange={(e) => setFormEndsAt(e.target.value)}
                            className="w-full px-3 py-2 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#0E1B3D] dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Usage Quota & Per-User Limit */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <label className="block text-[11px] font-bold text-[#5A6478] dark:text-slate-400 mb-1">
                            एकूण विद्यार्थी कोटा (Total Quota):
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={formUsageLimit}
                            onChange={(e) => setFormUsageLimit(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-xl text-xs font-black text-[#0E1B3D] dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#5A6478] dark:text-slate-400 mb-1">
                            प्रति विद्यार्थी मर्यादा:
                          </label>
                          <div className="flex bg-[#F5F7FF] dark:bg-slate-800 p-1 rounded-xl border border-[#E4E8F8] dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => setFormPerUserUsage("once")}
                              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                formPerUserUsage === "once"
                                  ? "bg-violet-600 text-white shadow-2xs"
                                  : "text-[#5A6478] dark:text-slate-400"
                              }`}
                            >
                              🔒 १ वेळा (1x)
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormPerUserUsage("multiple")}
                              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                formPerUserUsage === "multiple"
                                  ? "bg-indigo-600 text-white shadow-2xs"
                                  : "text-[#5A6478] dark:text-slate-400"
                              }`}
                            >
                              🔄 Multiple
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* LIVE PREVIEW ROW */}
                      <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-200 dark:border-slate-700 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xs tracking-wider text-[#0B57D0] dark:text-blue-400 px-2.5 py-1 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-md">
                            {formCode.trim().toUpperCase() || "CODE_PREVIEW"}
                          </span>
                          <span className="text-xs font-black text-[#0E1B3D] dark:text-white">
                            {formDiscountType === "percentage" ? `${formValue}% OFF` : `₹${formValue} OFF`}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-[#E4E8F8] dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-[#5A6478] dark:text-slate-400">उदा. ₹९९९ च्या कोर्सवर:</span>
                          <span className="font-black text-[#0B57D0] dark:text-blue-400">
                            {formDiscountType === "percentage"
                              ? `बचत: ₹${Math.round((999 * formValue) / 100)} → विद्यार्थी भरतील: ₹${Math.max(1, 999 - Math.round((999 * formValue) / 100))}`
                              : `बचत: ₹${Math.min(999, formValue)} → विद्यार्थी भरतील: ₹${Math.max(1, 999 - formValue)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Sticky Action Bar */}
                <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    ← कूपन यादीकडे परत जा (Back to List)
                  </button>

                  <SubmitButton
                    type="submit"
                    loading={isSaving}
                    loadingText="कूपन सेव्ह करत आहे..."
                    disabled={!formCode.trim()}
                    className="px-7 py-3 rounded-xl text-xs font-black shadow-md cursor-pointer"
                  >
                    <span>{editingCoupon ? "बदल सेव्ह करा (Save Changes)" : "कूपन सक्रिय करा (Activate Coupon →)"}</span>
                  </SubmitButton>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🎟️</span>
                <h1 className="text-2xl font-black text-[#0E1B3D] dark:text-white tracking-tight">
                  Coupon & Discount Manager
                </h1>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF]">
                  coupons.manage
                </span>
              </div>
              <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-1">
                Create discount coupons, link to courses, set 100 student quota, expiry dates, and track student redemptions.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleExportMasterSummary}
                className="px-4 py-2.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] font-bold text-xs rounded-full border border-[#D0E2FF] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>📥</span> Export Master Report (.xlsx)
              </button>

              <button
                onClick={handleOpenAdd}
                id="create-coupon-btn"
                className="px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="text-base leading-none">➕</span> Create New Coupon
              </button>
            </div>
          </div>

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E4E8F8] dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider block">
                Total Coupons
              </span>
              <p className="text-2xl font-black text-[#0E1B3D] dark:text-white mt-1">{totalCouponsCount}</p>
              <span className="text-[10px] text-[#5A6478]">All codes in system</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E4E8F8] dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Live (Active)
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{activeCouponsCount}</p>
              <span className="text-[10px] text-[#5A6478]">Currently available</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E4E8F8] dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-bold text-[#0B57D0] uppercase tracking-wider block">
                Redemptions
              </span>
              <p className="text-2xl font-black text-[#0B57D0] mt-1">{totalRedemptionsCount}</p>
              <span className="text-[10px] text-[#5A6478]">Redeemed by students</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E4E8F8] dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                Total Discount Given
              </span>
              <p className="text-2xl font-black text-amber-600 mt-1">₹{totalDiscountGivenRupees.toLocaleString("en-IN")}</p>
              <span className="text-[10px] text-[#5A6478]">Total savings given</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E4E8F8] dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider block">
                Attributed Revenue
              </span>
              <p className="text-2xl font-black text-violet-600 mt-1">₹{totalRevenueAttributedRupees.toLocaleString("en-IN")}</p>
              <span className="text-[10px] text-[#5A6478]">Fee received with coupons</span>
            </div>
          </div>

          {/* Filters Bar: Search & Status Chips */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 shadow-xs space-y-4">
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
                  placeholder="Search coupon code, school, or campaign..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F5F7FF] dark:bg-slate-800 border border-[#E4E8F8] dark:border-slate-700 rounded-full text-xs text-[#0E1B3D] dark:text-white placeholder-[#8A94A6] focus:outline-none focus:ring-2 focus:ring-[#0B57D0] transition-all"
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
                <span>Showing:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F5F7FF] text-[#0E1B3D] font-bold border border-[#E4E8F8]">
                  {filteredCoupons.length} / {coupons.length} coupons
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
                  { key: "active", label: "🟢 Active" },
                  { key: "paused", label: "⏸️ Paused" },
                  { key: "quota_full", label: "🔴 Quota Full" },
                  { key: "scheduled", label: "⏳ Scheduled" },
                  { key: "expired", label: "⌛ Expired" },
                ].map((chip) => {
                  const isActive = statusFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      onClick={() => setStatusFilter(chip.key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#0E1B3D] text-white shadow-xs"
                          : "bg-[#F5F7FF] dark:bg-slate-800 text-[#5A6478] dark:text-slate-300 hover:bg-[#EEF4FF] dark:hover:bg-slate-700 hover:text-[#0B57D0] border border-[#E4E8F8] dark:border-slate-700"
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
                  Scope:
                </span>
                {[
                  { key: "all", label: "All Scopes" },
                  { key: "all_courses", label: "🌐 All Courses" },
                  { key: "selected_courses", label: "🎯 Selected Courses" },
                ].map((chip) => {
                  const isActive = appliesFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      onClick={() => setAppliesFilter(chip.key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#0B57D0] text-white shadow-xs"
                          : "bg-[#F5F7FF] dark:bg-slate-800 text-[#5A6478] dark:text-slate-300 hover:bg-[#EEF4FF] dark:hover:bg-slate-700 hover:text-[#0B57D0] border border-[#E4E8F8] dark:border-slate-700"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E4E8F8] dark:border-slate-800 p-6 shadow-xs overflow-hidden">
            {coupons.length === 0 ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#EEF4FF] border border-[#D0E2FF] flex items-center justify-center mx-auto text-3xl shadow-xs">
                  🎟️
                </div>
                <h3 className="text-base font-black text-[#0E1B3D] mt-3">
                  No Coupons Available (Clean Slate)
                </h3>
                <p className="text-xs text-[#5A6478] mt-1.5 leading-relaxed">
                  All old and mock coupons have been removed. Live coupons created by admins will appear here.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="mt-5 px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-xs rounded-full shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>➕</span> Create First Coupon
                </button>
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="py-14 text-center">
                <span className="text-4xl">🔍</span>
                <h3 className="text-base font-bold text-[#0E1B3D] mt-2">No coupons found matching search</h3>
                <p className="text-xs text-[#5A6478] mt-1">
                  Change search query or reset filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setAppliesFilter("all");
                  }}
                  className="mt-4 px-4 py-1.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] border border-[#E4E8F8] rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E8F8] dark:border-slate-800 text-[#8A94A6] dark:text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3.5 pl-3">Coupon Code & Campaign</th>
                      <th className="pb-3.5">Discount</th>
                      <th className="pb-3.5">Applicable Courses (Scope)</th>
                      <th className="pb-3.5">Validity Dates</th>
                      <th className="pb-3.5">Usage / Limit (Quota)</th>
                      <th className="pb-3.5">Status</th>
                      <th className="pb-3.5 text-right pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E8F8] dark:divide-slate-800">
                    {filteredCoupons.map((c) => {
                      const totalUses = c.totalUsed || c.used_count || 0;
                      const maxUses = c.maxTotalUses || c.usage_limit || 100;
                      const usagePercent = Math.min(100, Math.round((totalUses / maxUses) * 100));
                      const remaining = Math.max(0, maxUses - totalUses);
                      const isPerUserOnce =
                        (c.per_user_usage || c.usageLimitPerUser || "once") === "once";

                      return (
                        <tr key={c.id} className="hover:bg-[#F9FAFF] dark:hover:bg-slate-800/50 transition-colors group">
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
                              {c.assigned_phone && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                                  🎯 {c.assigned_phone}
                                </span>
                              )}
                              {(c.promoter_staff_id || c.promoterStaffName) && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  🤝 Promoter: {c.promoterStaffName || c.promoter_staff_id}
                                </span>
                              )}
                              {c.is_public_chip === false ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  🔒 Secret Code
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  👁️ Public Chip
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
                                  Min order ₹{Math.round(c.minOrderValuePaise / 100)}
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
                                  <span className="text-xs">🌐</span> All Courses
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
                                <span className="text-[#0E1B3D] font-black">{totalUses} used</span>
                                <span className="text-[#8A94A6]">/ {maxUses} limit</span>
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
                                {remaining === 0 ? "🔴 Quota Full" : `⚡ ${remaining} remaining`}
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
                                  ? "⏸️ Pause"
                                  : "▶️ Resume"}
                              </button>
                            </div>
                          </td>

                          {/* Actions: View Students, WhatsApp, Edit, Delete */}
                          <td className="py-4 text-right pr-3 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Redemptions */}
                              <button
                                onClick={() => setViewingRedemptionsCoupon(c)}
                                className="px-2.5 py-1.5 bg-[#EEF4FF] hover:bg-[#D0E2FF] text-[#0B57D0] border border-[#D0E2FF] rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="View list of students who used this coupon"
                              >
                                <span>👥</span> Students ({totalUses})
                              </button>

                              {/* WhatsApp Share */}
                              <button
                                onClick={() => handleShareWhatsApp(c)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Copy WhatsApp message"
                              >
                                <span>💬</span> Share
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEdit(c)}
                                className="px-2.5 py-1.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0E1B3D] border border-[#E4E8F8] rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                ✏️ Edit
                              </button>

                              {/* Delete (Admin Only) */}
                              {isMainAdmin && (
                                <button
                                  onClick={() => setDeleteModalCoupon(c)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Delete coupon permanently"
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

        </>
      )}


          {/* ========================================================= */}
          {/* REDEMPTIONS MODAL (Real-time student track record) */}
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
                        Student Redemptions Log
                      </h3>
                      {viewingRedemptionsCoupon.school && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          🏫 {viewingRedemptionsCoupon.school}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5A6478] mt-1">
                      {viewingRedemptionsCoupon.description || "Real-time records of all students who redeemed this coupon code."}
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-[#F5F7FF] rounded-2xl border border-[#E4E8F8]">
                          <span className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider block">
                            Used / Quota
                          </span>
                          <p className="text-lg font-black text-[#0E1B3D] mt-0.5">
                            {totalUsedCount} / {quotaLimit}
                          </p>
                          <span className="text-[10px] text-[#5A6478]">
                            {Math.max(0, quotaLimit - totalUsedCount)} quota remaining
                          </span>
                        </div>

                        <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                            Total Discount Given
                          </span>
                          <p className="text-lg font-black text-amber-800 mt-0.5">
                            ₹{totalSavingsGiven.toLocaleString("en-IN")}
                          </p>
                          <span className="text-[10px] text-amber-600">Total savings provided</span>
                        </div>

                        <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                            Fee Collected
                          </span>
                          <p className="text-lg font-black text-emerald-800 mt-0.5">
                            ₹{totalFeePaid.toLocaleString("en-IN")}
                          </p>
                          <span className="text-[10px] text-emerald-600">Academy revenue earned</span>
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
                            placeholder="Search student name or mobile..."
                            className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D]"
                          />
                        </div>

                        <button
                          onClick={() => handleExportCouponRedemptions(viewingRedemptionsCoupon, studentRedemptions)}
                          className="px-4 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                        >
                          <span>📥</span> Download Excel (.xlsx)
                        </button>
                      </div>

                      {/* Students List Table */}
                      <div className="overflow-x-auto overflow-y-auto flex-1 border border-[#E4E8F8] rounded-2xl">
                        {filteredStudents.length === 0 ? (
                          <div className="py-12 text-center text-[#5A6478] space-y-1">
                            <span className="text-3xl block">📋</span>
                            <p className="text-xs font-bold text-[#0E1B3D]">
                              No student has used this coupon yet.
                            </p>
                            <p className="text-[11px] text-[#8A94A6]">
                              Records will automatically appear here as soon as a student applies this coupon during checkout.
                            </p>
                          </div>
                        ) : (
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#FAFBFD] sticky top-0 border-b border-[#E4E8F8] text-[#8A94A6] uppercase text-[10px]">
                              <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Student Name</th>
                                <th className="p-3">Mobile</th>
                                <th className="p-3">Purchased Course</th>
                                <th className="p-3">Discount (₹)</th>
                                <th className="p-3">Paid Fee (₹)</th>
                                <th className="p-3 text-right">Date & Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E8F8]">
                              {filteredStudents.map((r, idx) => (
                                <tr key={r.id} className="hover:bg-[#F9FAFF] transition-colors">
                                  <td className="p-3 text-[#8A94A6] font-semibold">{idx + 1}</td>
                                  <td className="p-3 font-bold text-[#0E1B3D]">
                                    {r.studentName || "Student"}
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
                                    {new Date(r.at).toLocaleDateString("en-IN", {
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
                    Close
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
                    Delete Coupon Code Permanently?
                  </h3>
                  <p className="text-xs text-[#5A6478] mt-1 leading-relaxed">
                    You are deleting <span className="font-mono font-bold text-[#0E1B3D]">"{deleteModalCoupon.code}"</span>. This action is reserved for main administrators and will be recorded in system audit logs.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E8F8]">
                  <button
                    onClick={() => setDeleteModalCoupon(null)}
                    className="px-4 py-2 rounded-full border border-[#E4E8F8] text-xs font-bold text-[#5A6478] hover:bg-[#F5F7FF] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
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
