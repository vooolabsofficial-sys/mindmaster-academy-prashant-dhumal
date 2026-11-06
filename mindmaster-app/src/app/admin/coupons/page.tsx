"use client";

import React, { useState, useEffect, useMemo } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import LocationCascadeSelect from "@/components/ui/LocationCascadeSelect";
import { Coupon, StaffUser, CouponRedemptionRecord, Course, Book } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffCoupons,
  saveStaffCoupon,
  deleteStaffCoupon,
  toggleStaffCouponStatus,
  getStaffCourses,
  getStaffBooks,
  getStaffUsers,
  getStaffStudents,
} from "@/lib/staffStore";
import { getRedemptions, getRedemptionsByCoupon } from "@/lib/couponRedemptionStore";
import {
  exportCouponRedemptionsToExcel,
  exportCouponsMasterToExcel,
} from "@/lib/excelExporter";
import { toast } from "sonner";
import {
  Tag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  Percent,
  Banknote,
  DollarSign,
  Building,
  MapPin,
  Smartphone,
  GraduationCap,
  Download,
  Trash2,
  Edit,
  Eye,
  CheckSquare,
  Square,
  Play,
  RotateCcw,
} from "lucide-react";

export default function CouponManagerPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  // View Mode: 'list' | 'builder' | 'ledger'
  const [viewMode, setViewMode] = useState<"list" | "builder" | "ledger">("list");
  const [selectedCouponForLedger, setSelectedCouponForLedger] = useState<string>("all");

  // Search & Filter in list mode
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalCoupon, setDeleteModalCoupon] = useState<Coupon | null>(null);

  // ============================================================================
  // COUPON BUILDER WORKSPACE STATE
  // ============================================================================
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIsPublicChip, setFormIsPublicChip] = useState(true);

  // Discount Mechanics
  const [formDiscountType, setFormDiscountType] = useState<"percentage" | "flat" | "fixed_price">("percentage");
  const [formValue, setFormValue] = useState<number>(25);
  const [formMaxDiscountCap, setFormMaxDiscountCap] = useState<number | "">(300);
  const [formFixedPrice, setFormFixedPrice] = useState<number | "">(299);

  // Targeting & Scope
  const [formAudience, setFormAudience] = useState<"all" | "new_users_only" | "private_phone">("all");
  const [formAssignedPhone, setFormAssignedPhone] = useState("");
  const [formAppliesAll, setFormAppliesAll] = useState(true);
  const [formSelectedCourses, setFormSelectedCourses] = useState<string[]>([]);
  const [formSelectedBooks, setFormSelectedBooks] = useState<string[]>([]);
  const [formSchool, setFormSchool] = useState("");

  // Geographic Targeting (LocationCascadeSelect)
  const [formGeoEnabled, setFormGeoEnabled] = useState(false);
  const [formTargetState, setFormTargetState] = useState("maharashtra");
  const [formTargetDistrict, setFormTargetDistrict] = useState("");
  const [formTargetTaluka, setFormTargetTaluka] = useState("");

  // Anti-Abuse & Guardrails
  const [formMinOrder, setFormMinOrder] = useState<number>(499);
  const [formPerUserUsage, setFormPerUserUsage] = useState<"once" | "multiple">("once");
  const [formUsageLimit, setFormUsageLimit] = useState<number>(100);
  const [formPromoterStaffId, setFormPromoterStaffId] = useState("");

  // Validity
  const [formValidityType, setFormValidityType] = useState<"days" | "date_range">("date_range");
  const [formValidDays, setFormValidDays] = useState(30);
  const [formStartsAt, setFormStartsAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [formEndsAt, setFormEndsAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [formIsActive, setFormIsActive] = useState(true);

  // Sandbox Simulator State
  const [sandboxCartValue, setSandboxCartValue] = useState<number>(999);
  const [sandboxPhone, setSandboxPhone] = useState<string>("9876543210");
  const [sandboxDistrict, setSandboxDistrict] = useState<string>("Pune");
  const [sandboxResult, setSandboxResult] = useState<{
    valid: boolean;
    discountRupees: number;
    finalPriceRupees: number;
    reason: string;
  } | null>(null);

  // Ledger Filter State
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState("all");

  const isMainAdmin = staff.role === "main_admin";

  const reload = () => {
    setCoupons(getStaffCoupons());
    setStaff(getCurrentStaff());
    setStaffList(getStaffUsers());
    setCourses(getStaffCourses());
    setBooks(getStaffBooks());
  };

  useEffect(() => {
    reload();
    window.addEventListener("mma_staff_changed", reload);
    return () => window.removeEventListener("mma_staff_changed", reload);
  }, []);

  // Generate random promo code
  const handleGenerateCode = () => {
    const prefixes = ["PROMO", "DIWALI", "MIND", "ACADEMY", "SPECIAL", "SUPER", "MAHA"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setFormCode(`${prefix}${num}`);
  };

  // Open Builder for Create
  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormDesc("");
    setFormIsPublicChip(true);
    setFormDiscountType("percentage");
    setFormValue(25);
    setFormMaxDiscountCap(300);
    setFormFixedPrice(299);
    setFormAudience("all");
    setFormAssignedPhone("");
    setFormAppliesAll(true);
    setFormSelectedCourses([]);
    setFormSelectedBooks([]);
    setFormSchool("");
    setFormGeoEnabled(false);
    setFormTargetState("maharashtra");
    setFormTargetDistrict("");
    setFormTargetTaluka("");
    setFormMinOrder(499);
    setFormPerUserUsage("once");
    setFormUsageLimit(100);
    setFormPromoterStaffId("");
    setFormValidityType("date_range");
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    setFormStartsAt(today);
    setFormEndsAt(thirtyDays);
    setFormIsActive(true);
    setSandboxResult(null);
    setViewMode("builder");
  };

  // Open Builder for Edit
  const handleOpenEdit = (cpn: Coupon) => {
    setEditingCoupon(cpn);
    setFormCode(cpn.code);
    setFormDesc(cpn.description || "");
    setFormIsPublicChip(cpn.is_public_chip !== undefined ? cpn.is_public_chip : true);
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
    setFormMaxDiscountCap(
      cpn.max_discount_paise ? Math.round(cpn.max_discount_paise / 100) : ""
    );
    setFormAudience(cpn.target_audience || (cpn.assigned_phone ? "private_phone" : "all"));
    setFormAssignedPhone(cpn.assigned_phone || cpn.assignedPhone || "");
    setFormAppliesAll(cpn.applies_all !== undefined ? cpn.applies_all : cpn.appliesTo === "all");
    setFormSelectedCourses(cpn.selectedCourseIds || []);
    setFormSelectedBooks(cpn.selectedBookIds || []);
    setFormSchool(cpn.school || "");
    setFormGeoEnabled(Boolean(cpn.target_district));
    setFormTargetState(cpn.target_state || "maharashtra");
    setFormTargetDistrict(cpn.target_district || "");
    setFormTargetTaluka(cpn.target_taluka || "");
    setFormMinOrder(cpn.minOrderValuePaise ? Math.round(cpn.minOrderValuePaise / 100) : 499);
    setFormPerUserUsage(cpn.per_user_usage || cpn.usageLimitPerUser || "once");
    setFormUsageLimit(cpn.usage_limit || cpn.maxTotalUses || 100);
    setFormPromoterStaffId(cpn.promoter_staff_id || cpn.promoterStaffId || "");
    setFormValidityType(cpn.validityType || "date_range");
    setFormStartsAt(cpn.starts_at ? cpn.starts_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setFormEndsAt(cpn.ends_at ? cpn.ends_at.slice(0, 10) : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setFormIsActive(cpn.is_active !== undefined ? cpn.is_active : cpn.status === "active");
    setSandboxResult(null);
    setViewMode("builder");
  };

  // Plain-English Human Readable Summary Generator
  const humanReadableSummary = useMemo(() => {
    const parts: string[] = [];

    // Audience
    if (formAudience === "new_users_only") {
      parts.push("First-time new students only");
    } else if (formAudience === "private_phone" && formAssignedPhone) {
      parts.push(`Exclusive student with mobile ending in ...${formAssignedPhone.slice(-4)}`);
    } else {
      parts.push("All eligible students");
    }

    // Geographic
    if (formGeoEnabled && formTargetDistrict) {
      parts.push(`residing in ${formTargetDistrict} district${formTargetTaluka ? ` (${formTargetTaluka} taluka)` : ""}`);
    }

    // School
    if (formSchool.trim()) {
      parts.push(`from "${formSchool.trim()}"`);
    }

    // Items
    if (!formAppliesAll && formSelectedCourses.length > 0) {
      parts.push(`purchasing selected course(s) (${formSelectedCourses.length} selected)`);
    } else {
      parts.push("purchasing any catalog curriculum");
    }

    // Min Order
    if (formMinOrder > 0) {
      parts.push(`with a minimum cart total of ₹${formMinOrder}`);
    }

    // Discount
    let discountStr = "";
    if (formDiscountType === "percentage") {
      discountStr = `will receive a ${formValue}% discount`;
      if (formMaxDiscountCap && Number(formMaxDiscountCap) > 0) {
        discountStr += ` (capped at maximum ₹${formMaxDiscountCap})`;
      }
    } else if (formDiscountType === "flat") {
      discountStr = `will receive a flat ₹${formValue} discount`;
    } else {
      discountStr = `can enroll at a fixed price of ₹${formFixedPrice}`;
    }

    // Limits
    const limitStr = `Limited to ${formPerUserUsage === "once" ? "1 redemption per student" : "multiple uses per student"} across a total quota of ${formUsageLimit} redemptions.`;

    return `${parts.join(" ")} ${discountStr}. ${limitStr}`;
  }, [
    formAudience,
    formAssignedPhone,
    formGeoEnabled,
    formTargetDistrict,
    formTargetTaluka,
    formSchool,
    formAppliesAll,
    formSelectedCourses,
    formMinOrder,
    formDiscountType,
    formValue,
    formMaxDiscountCap,
    formFixedPrice,
    formPerUserUsage,
    formUsageLimit,
  ]);

  // Sandbox Voucher Simulator Run
  const handleRunSandbox = () => {
    // 1. Min order check
    if (sandboxCartValue < formMinOrder) {
      setSandboxResult({
        valid: false,
        discountRupees: 0,
        finalPriceRupees: sandboxCartValue,
        reason: `Cart total (₹${sandboxCartValue}) is less than minimum required order value (₹${formMinOrder}).`,
      });
      return;
    }

    // 2. Geographic check
    if (formGeoEnabled && formTargetDistrict) {
      if (sandboxDistrict.toLowerCase() !== formTargetDistrict.toLowerCase()) {
        setSandboxResult({
          valid: false,
          discountRupees: 0,
          finalPriceRupees: sandboxCartValue,
          reason: `Student district (${sandboxDistrict}) does not match coupon target district (${formTargetDistrict}).`,
        });
        return;
      }
    }

    // 3. Discount calculation
    let calculatedDiscount = 0;
    if (formDiscountType === "percentage") {
      calculatedDiscount = Math.round((sandboxCartValue * formValue) / 100);
      if (formMaxDiscountCap && Number(formMaxDiscountCap) > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, Number(formMaxDiscountCap));
      }
    } else if (formDiscountType === "flat") {
      calculatedDiscount = formValue;
    } else if (formDiscountType === "fixed_price" && formFixedPrice !== "") {
      calculatedDiscount = Math.max(0, sandboxCartValue - Number(formFixedPrice));
    }

    calculatedDiscount = Math.min(sandboxCartValue, calculatedDiscount);
    const finalPrice = Math.max(0, sandboxCartValue - calculatedDiscount);

    setSandboxResult({
      valid: true,
      discountRupees: calculatedDiscount,
      finalPriceRupees: finalPrice,
      reason: `Coupon is 100% valid! Student saves ₹${calculatedDiscount} on this order.`,
    });
  };

  // Save Coupon
  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode) {
      toast.error("Please enter a valid coupon code.");
      return;
    }

    // Status calculation
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

    const maxCapPaise =
      formMaxDiscountCap && Number(formMaxDiscountCap) > 0
        ? Number(formMaxDiscountCap) * 100
        : undefined;

    const couponData: Coupon = {
      id: editingCoupon ? editingCoupon.id : `cpn-${Date.now()}`,
      code: cleanCode,
      description: formDesc.trim() || `Special Promo ${cleanCode}`,
      is_public_chip: formIsPublicChip,
      isPublicChip: formIsPublicChip,
      discountType: formDiscountType === "percentage" ? "percentage" : "flat",
      discountValue: formDiscountType === "percentage" ? formValue : formValue * 100,
      max_discount_paise: maxCapPaise,
      maxDiscountPaise: maxCapPaise,
      target_audience: formAudience,
      targetAudience: formAudience,
      assigned_phone: formAudience === "private_phone" ? formAssignedPhone.trim() : undefined,
      assignedPhone: formAudience === "private_phone" ? formAssignedPhone.trim() : undefined,
      school: formSchool.trim() || undefined,
      target_state: formGeoEnabled ? formTargetState : undefined,
      target_district: formGeoEnabled && formTargetDistrict ? formTargetDistrict : undefined,
      target_taluka: formGeoEnabled && formTargetTaluka ? formTargetTaluka : undefined,
      minOrderValuePaise: formMinOrder > 0 ? formMinOrder * 100 : undefined,
      appliesTo: formAppliesAll ? "all" : "selected",
      applies_all: formAppliesAll,
      selectedCourseIds: formAppliesAll ? [] : formSelectedCourses,
      selectedBookIds: formAppliesAll ? [] : formSelectedBooks,
      usageLimitPerUser: formPerUserUsage,
      per_user_usage: formPerUserUsage,
      validityType: formValidityType,
      validDays: formValidityType === "days" ? formValidDays : undefined,
      starts_at: formValidityType === "date_range" ? `${formStartsAt}T00:00:00.000Z` : undefined,
      ends_at: formValidityType === "date_range" ? `${formEndsAt}T23:59:59.000Z` : undefined,
      maxTotalUses: formUsageLimit,
      usage_limit: formUsageLimit,
      totalUsed: editingCoupon ? editingCoupon.totalUsed || 0 : 0,
      used_count: editingCoupon ? editingCoupon.used_count || 0 : 0,
      status,
      is_active: formIsActive,
      promoter_staff_id: formPromoterStaffId || undefined,
      promoterStaffId: formPromoterStaffId || undefined,
      createdAt: editingCoupon ? editingCoupon.createdAt : new Date().toISOString(),
    };

    saveStaffCoupon(couponData);
    toast.success(`Coupon campaign ${couponData.code} saved successfully!`);
    reload();
    setViewMode("list");
  };

  // Toggle status
  const handleToggleStatus = (id: string) => {
    toggleStaffCouponStatus(id);
    reload();
  };

  // Delete
  const handleConfirmDelete = () => {
    if (!deleteModalCoupon) return;
    deleteStaffCoupon(deleteModalCoupon.id);
    setDeleteModalCoupon(null);
    toast.success(`Coupon ${deleteModalCoupon.code} deleted.`);
    reload();
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Filtered campaigns
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.school?.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchScope =
        scopeFilter === "all" ||
        (scopeFilter === "all_courses" && (c.applies_all || c.appliesTo === "all")) ||
        (scopeFilter === "selected" && (!c.applies_all && c.appliesTo !== "all"));

      return matchSearch && matchStatus && matchScope;
    });
  }, [coupons, searchQuery, statusFilter, scopeFilter]);

  // Redemptions Ledger Data
  const allRedemptions: CouponRedemptionRecord[] = useMemo(() => {
    if (selectedCouponForLedger === "all") return getRedemptions();
    return getRedemptionsByCoupon(selectedCouponForLedger);
  }, [selectedCouponForLedger]);

  const filteredRedemptions = useMemo(() => {
    return allRedemptions.filter((r) => {
      const q = ledgerSearch.toLowerCase();
      const matchSearch =
        !q ||
        r.couponCode?.toLowerCase().includes(q) ||
        r.studentName?.toLowerCase().includes(q) ||
        r.studentMobile?.includes(q) ||
        r.courseTitle?.toLowerCase().includes(q);

      const matchStatus = ledgerStatusFilter === "all" || (r.status || "success") === ledgerStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [allRedemptions, ledgerSearch, ledgerStatusFilter]);

  // Overall KPI numbers
  const totalRedemptionsCount = useMemo(() => {
    return coupons.reduce((sum, c) => sum + (c.used_count || c.totalUsed || 0), 0);
  }, [coupons]);

  const totalDiscountGrantedRupees = useMemo(() => {
    const redemptions = getRedemptions();
    const paise = redemptions.reduce((sum, r) => sum + (r.discountPaise || 0), 0);
    return Math.round(paise / 100);
  }, [coupons]);

  const totalNetRevenueGeneratedRupees = useMemo(() => {
    const redemptions = getRedemptions();
    const paise = redemptions.reduce((sum, r) => sum + (r.paidPaise || 0), 0);
    return Math.round(paise / 100);
  }, [coupons]);

  return (
    <AdminShell currentSection="coupons">
      <PermissionGuard requiredRole={["main_admin", "sub_admin"]}>
        <div className="space-y-6">

          {/* ==================================================================== */}
          {/* VIEW: CAMPAIGN BUILDER (INLINE 2-COLUMN WORKSPACE) */}
          {/* ==================================================================== */}
          {viewMode === "builder" && (
            <div className="space-y-6">
              {/* Header with Breadcrumb */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mb-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Coupons Directory
                  </button>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-6 h-6 text-blue-600" />
                    {editingCoupon ? `Edit Coupon Rules: ${editingCoupon.code}` : "Create New Coupon Campaign"}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure Amazon/Flipkart-grade discount rules, targeting parameters, anti-abuse limits, and live simulation.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    Staff: {staff.name}
                  </span>
                </div>
              </div>

              {/* 2-Column Responsive Workspace */}
              <form onSubmit={handleSaveCoupon} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column (7 cols): Campaign Rules Configuration */}
                <div className="lg:col-span-7 space-y-5">

                  {/* Section 1: Coupon Identity */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-600" />
                      1. Coupon Identity & Display
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Promo Code <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleGenerateCode}
                            className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" /> Auto-Generate
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={formCode}
                          onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                          placeholder="e.g. DIWALI50"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Campaign Title / Description
                        </label>
                        <input
                          type="text"
                          value={formDesc}
                          onChange={(e) => setFormDesc(e.target.value)}
                          placeholder="e.g. Satara Students Special 25% Off"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsPublicChip}
                          onChange={(e) => setFormIsPublicChip(e.target.checked)}
                          className="rounded text-blue-600 w-4 h-4"
                        />
                        <span>Display as 1-Click Chip on Public Checkout Storefront</span>
                      </label>
                    </div>
                  </div>

                  {/* Section 2: Discount Mechanics */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-blue-600" />
                      2. Discount Calculation Mechanics
                    </h2>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "percentage", label: "Percentage (%) Off", icon: Percent },
                        { id: "flat", label: "Flat Amount (₹) Off", icon: Banknote },
                        { id: "fixed_price", label: "Fixed Checkout Price", icon: Tag },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormDiscountType(item.id as any)}
                          className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                            formDiscountType === item.id
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <span className="text-xs font-bold block">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {formDiscountType === "percentage" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Discount Percentage (%) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              required
                              value={formValue}
                              onChange={(e) => setFormValue(Math.min(100, Math.max(1, Number(e.target.value))))}
                              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                            />
                            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Maximum Discount Cap (₹) <span className="text-slate-400 font-normal">(Anti-Abuse)</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              min={1}
                              value={formMaxDiscountCap}
                              onChange={(e) => setFormMaxDiscountCap(e.target.value === "" ? "" : Number(e.target.value))}
                              placeholder="e.g. 300 (Optional max limit)"
                              className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formDiscountType === "flat" && (
                      <div className="space-y-1 pt-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Flat Discount Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min={1}
                            required
                            value={formValue}
                            onChange={(e) => setFormValue(Math.max(1, Number(e.target.value)))}
                            placeholder="e.g. 200"
                            className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {formDiscountType === "fixed_price" && (
                      <div className="space-y-1 pt-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Fixed Checkout Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min={0}
                            required
                            value={formFixedPrice}
                            onChange={(e) => setFormFixedPrice(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="e.g. 299"
                            className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Eligibility & Geographic Targeting */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      3. Eligibility, Audience & Location Targeting
                    </h2>

                    {/* Audience Segment */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Target Audience:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "all", label: "All Students" },
                          { id: "new_users_only", label: "New Students Only" },
                          { id: "private_phone", label: "Private Phone" },
                        ].map((aud) => (
                          <button
                            key={aud.id}
                            type="button"
                            onClick={() => setFormAudience(aud.id as any)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                              formAudience === aud.id
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {aud.label}
                          </button>
                        ))}
                      </div>

                      {formAudience === "private_phone" && (
                        <div className="pt-2">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Specific Student Mobile Number (10 Digits):
                          </label>
                          <input
                            type="tel"
                            maxLength={10}
                            value={formAssignedPhone}
                            onChange={(e) => setFormAssignedPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder="9876543210"
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Geographic Targeting Toggle & Cascade */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formGeoEnabled}
                          onChange={(e) => setFormGeoEnabled(e.target.checked)}
                          className="rounded text-blue-600 w-4 h-4"
                        />
                        <span>Restrict Coupon to Specific Geographic Location (State / District / Taluka)</span>
                      </label>

                      {formGeoEnabled && (
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                          <LocationCascadeSelect
                            selectedState={formTargetState}
                            selectedDistrict={formTargetDistrict}
                            selectedTaluka={formTargetTaluka}
                            onStateChange={(id, name) => setFormTargetState(id)}
                            onDistrictChange={(id, name) => setFormTargetDistrict(name)}
                            onTalukaChange={(id, name) => setFormTargetTaluka(name)}
                            layout="grid"
                          />
                        </div>
                      )}
                    </div>

                    {/* School Restriction */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        School / College Restriction (Optional):
                      </label>
                      <input
                        type="text"
                        value={formSchool}
                        onChange={(e) => setFormSchool(e.target.value)}
                        placeholder="Leave blank for all schools, or enter exact school name"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    {/* Curriculum Scope */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Curriculum Scope:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormAppliesAll(true)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                            formAppliesAll
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          All Courses & Books
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormAppliesAll(false)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                            !formAppliesAll
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          Selected Courses Only
                        </button>
                      </div>

                      {!formAppliesAll && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pt-2">
                          {courses.map((course) => {
                            const isSelected = formSelectedCourses.includes(course.id);
                            return (
                              <div
                                key={course.id}
                                onClick={() => {
                                  if (isSelected) setFormSelectedCourses(formSelectedCourses.filter((id) => id !== course.id));
                                  else setFormSelectedCourses([...formSelectedCourses, course.id]);
                                }}
                                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer transition select-none ${
                                  isSelected
                                    ? "bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-900 dark:text-blue-100"
                                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                                <span className="truncate">{course.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 4: Anti-Abuse & Guardrails */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      4. Anti-Abuse Guardrails & Limits
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Min Cart Order Value (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formMinOrder}
                          onChange={(e) => setFormMinOrder(Math.max(0, Number(e.target.value)))}
                          placeholder="499"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Total Usage Quota (Global Cap)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={formUsageLimit}
                          onChange={(e) => setFormUsageLimit(Math.max(1, Number(e.target.value)))}
                          placeholder="100"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Per-Student Usage Limit
                        </label>
                        <select
                          value={formPerUserUsage}
                          onChange={(e) => setFormPerUserUsage(e.target.value as any)}
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                        >
                          <option value="once">1 Use Per Student (Recommended)</option>
                          <option value="multiple">Unlimited Repeat Uses</option>
                        </select>
                      </div>
                    </div>

                    {/* Validity Window */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Starts At (Date)
                          </label>
                          <input
                            type="date"
                            value={formStartsAt}
                            onChange={(e) => setFormStartsAt(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Ends At (Date)
                          </label>
                          <input
                            type="date"
                            value={formEndsAt}
                            onChange={(e) => setFormEndsAt(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Active Status Toggle */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Campaign Active Status
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Inactive or paused coupons cannot be redeemed at checkout.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsActive}
                          onChange={(e) => setFormIsActive(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                    </div>
                  </div>

                </div>

                {/* Right Column (5 cols): Live Human-Readable Rule Preview & Sandbox Simulator */}
                <div className="lg:col-span-5 sticky top-20 space-y-4">

                  {/* Human-Readable Rule Preview Card */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Live Plain-English Rule Preview
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase">
                        {formCode || "CODE"}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-800/60 font-medium">
                      {humanReadableSummary}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                      <div>
                        <span>Validity Window:</span>
                        <p className="font-bold text-slate-900 dark:text-white">{formStartsAt} to {formEndsAt}</p>
                      </div>
                      <div>
                        <span>Storefront Chip:</span>
                        <p className="font-bold text-slate-900 dark:text-white">{formIsPublicChip ? "Visible" : "Hidden / Private"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Sandbox Simulator */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Sandbox Voucher Simulator
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">Pre-Publish Test</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Test Order Cart Value (₹):
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={sandboxCartValue}
                          onChange={(e) => setSandboxCartValue(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                        />
                      </div>

                      {formGeoEnabled && (
                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Simulated Student District:
                          </label>
                          <input
                            type="text"
                            value={sandboxDistrict}
                            onChange={(e) => setSandboxDistrict(e.target.value)}
                            placeholder="Pune"
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleRunSandbox}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Simulate Voucher Redemption
                      </button>

                      {sandboxResult && (
                        <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          sandboxResult.valid
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                            : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold">
                            {sandboxResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                            <span>{sandboxResult.reason}</span>
                          </div>
                          {sandboxResult.valid && (
                            <div className="pt-1 border-t border-emerald-200 dark:border-emerald-800 flex justify-between font-extrabold">
                              <span>Final Price to Pay:</span>
                              <span className="tabular-nums">₹{sandboxResult.finalPriceRupees} (Saved ₹{sandboxResult.discountRupees})</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Save Action Button */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Save & Publish Campaign Rules
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition text-center"
                    >
                      Cancel & Return
                    </button>
                  </div>

                </div>

              </form>
            </div>
          )}

          {/* ==================================================================== */}
          {/* VIEW: REDEMPTION AUDIT LEDGER (INLINE WORKSPACE) */}
          {/* ==================================================================== */}
          {viewMode === "ledger" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mb-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Campaigns Directory
                  </button>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    Live Coupon Redemption Audit Ledger
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time transactional audit trail of every student discount applied, coupon locks, and order revenue.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      exportCouponRedemptionsToExcel(
                        filteredRedemptions.map((r) => ({
                          couponCode: r.couponCode,
                          studentName: r.studentName || "Anonymous Student",
                          studentMobile: r.studentMobile || "N/A",
                          courseTitle: r.courseTitle || r.bookTitle || "Curriculum",
                          originalPrice: Math.round((r.originalPricePaise || 0) / 100),
                          discountReceived: Math.round((r.discountPaise || 0) / 100),
                          finalPaid: Math.round((r.paidPaise || 0) / 100),
                          redeemedAt: r.at || new Date().toISOString(),
                        })),
                        selectedCouponForLedger
                      );
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Export Ledger (.xlsx)
                  </button>
                </div>
              </div>

              {/* Ledger Filter Toolbar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      placeholder="Search student, mobile, coupon..."
                      className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none w-64"
                    />
                  </div>

                  <select
                    value={selectedCouponForLedger}
                    onChange={(e) => setSelectedCouponForLedger(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="all">All Coupon Codes ({coupons.length})</option>
                    {coupons.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} ({c.totalUsed || c.used_count || 0} uses)
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs font-bold text-slate-500">
                  Total Records: {filteredRedemptions.length}
                </span>
              </div>

              {/* Ledger Data Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                        <th className="py-3 px-4">Coupon Code</th>
                        <th className="py-3 px-4">Student & Mobile</th>
                        <th className="py-3 px-4">Curriculum Enrolled</th>
                        <th className="py-3 px-4">List Price (₹)</th>
                        <th className="py-3 px-4">Discount Given (₹)</th>
                        <th className="py-3 px-4">Final Paid (₹)</th>
                        <th className="py-3 px-4">Timestamp (IST)</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredRedemptions.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-wider">
                              {record.couponCode}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {record.studentName || "Student"}
                            </p>
                            <span className="text-[11px] text-slate-500 tabular-nums">
                              {record.studentMobile || record.userId}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {record.courseTitle || record.bookTitle || "Curriculum Item"}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                            ₹{Math.round((record.originalPricePaise || 0) / 100)}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-600 tabular-nums">
                            - ₹{Math.round((record.discountPaise || 0) / 100)}
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900 dark:text-white tabular-nums">
                            ₹{Math.round((record.paidPaise || 0) / 100)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 tabular-nums">
                            {record.at ? record.at.slice(0, 19).replace("T", " ") : "Just now"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                              Redeemed
                            </span>
                          </td>
                        </tr>
                      ))}

                      {filteredRedemptions.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400">
                            No coupon redemptions recorded yet for this criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* VIEW: CAMPAIGNS DIRECTORY (MAIN WORKSPACE) */}
          {/* ==================================================================== */}
          {viewMode === "list" && (
            <div className="space-y-6">

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-7 h-7 text-blue-600" />
                    Coupon & Promotional Campaign Engine
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Create targeted discount vouchers, location-locked offers, and audit student redemptions.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCouponForLedger("all");
                      setViewMode("ledger");
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Redemption Ledger
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Coupon
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>Active Campaigns</span>
                    <Tag className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {coupons.filter((c) => c.status === "active").length}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">Of {coupons.length} Total Campaigns</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>Total Redemptions</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {totalRedemptionsCount}
                  </div>
                  <span className="text-[10px] text-slate-400">Orders Benefitted</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>Total Discounts Given</span>
                    <Percent className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 tabular-nums">
                    ₹{totalDiscountGrantedRupees.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-400">Student Savings</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>Net Order Revenue</span>
                    <Banknote className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-blue-600 tabular-nums">
                    ₹{totalNetRevenueGeneratedRupees.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-400">Coupon Driven Sales</span>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search coupon code or school..."
                      className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none w-64 focus:border-blue-600"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="expired">Expired</option>
                    <option value="scheduled">Scheduled</option>
                  </select>

                  <select
                    value={scopeFilter}
                    onChange={(e) => setScopeFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="all">All Curriculum Scopes</option>
                    <option value="all_courses">Store-Wide (All Courses)</option>
                    <option value="selected">Targeted Batches Only</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    exportCouponsMasterToExcel(
                      filteredCoupons.map((c) => ({
                        code: c.code,
                        description: c.description || "",
                        school: c.school || "",
                        discount: c.discountType === "percentage" ? `${c.discountValue}%` : `₹${Math.round(c.discountValue / 100)}`,
                        scope: c.applies_all ? "All Courses" : `${c.selectedCourseIds?.length || 0} Courses`,
                        validity: c.ends_at ? c.ends_at.slice(0, 10) : "Open",
                        quotaLimit: c.usage_limit || c.maxTotalUses || 0,
                        usedCount: c.used_count || c.totalUsed || 0,
                        remainingQuota: (c.usage_limit || c.maxTotalUses || 0) - (c.used_count || c.totalUsed || 0),
                        status: c.status,
                      }))
                    );
                  }}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Export Master
                </button>
              </div>

              {/* Coupons Data Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                        <th className="py-3 px-4">Coupon Code & Description</th>
                        <th className="py-3 px-4">Discount Value</th>
                        <th className="py-3 px-4">Targeting & Scope</th>
                        <th className="py-3 px-4">Usage Quota</th>
                        <th className="py-3 px-4">Validity Window</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredCoupons.map((coupon) => {
                        const used = coupon.used_count || coupon.totalUsed || 0;
                        const limit = coupon.usage_limit || coupon.maxTotalUses || 100;
                        const pct = Math.min(100, Math.round((used / limit) * 100));

                        return (
                          <tr key={coupon.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                            {/* Code Column */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono tracking-wider">
                                  {coupon.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(coupon.code)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer"
                                  title="Copy Code"
                                >
                                  {copiedCode === coupon.code ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{coupon.description}</p>
                            </td>

                            {/* Discount Value */}
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                                {coupon.discountType === "percentage" || coupon.discountType === "percent"
                                  ? `${coupon.discountValue}% OFF`
                                  : `₹${coupon.discountValue >= 1000 ? Math.round(coupon.discountValue / 100) : coupon.discountValue} FLAT`}
                              </span>
                              {coupon.max_discount_paise && (
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Cap: ₹{Math.round(coupon.max_discount_paise / 100)}
                                </span>
                              )}
                            </td>

                            {/* Targeting & Scope */}
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {coupon.target_district && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                     {coupon.target_district}
                                  </span>
                                )}
                                {coupon.school && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                                     {coupon.school}
                                  </span>
                                )}
                                {coupon.applies_all ? (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    All Courses
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                    {coupon.selectedCourseIds?.length || 0} Courses
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Usage Quota */}
                            <td className="py-3 px-4">
                              <div className="w-28 space-y-1">
                                <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                  <span>{used} / {limit}</span>
                                  <span>{pct}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-blue-600"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Validity Window */}
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                                {coupon.ends_at ? coupon.ends_at.slice(0, 10) : coupon.validUntil ? coupon.validUntil.slice(0, 10) : "Open"}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                Starts: {coupon.starts_at ? coupon.starts_at.slice(0, 10) : "Immediate"}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(coupon.id)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition uppercase ${
                                  coupon.status === "active"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                    : coupon.status === "paused"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                                }`}
                              >
                                {coupon.status}
                              </button>
                            </td>

                            {/* Row Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCouponForLedger(coupon.code);
                                    setViewMode("ledger");
                                  }}
                                  title="View Redemptions"
                                  className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-600 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(coupon)}
                                  title="Edit Campaign Rules"
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteModalCoupon(coupon)}
                                  title="Delete Coupon"
                                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 hover:bg-red-100 text-red-600 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredCoupons.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400">
                            No coupon campaigns matched your filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==================================================================== */}
          {/* IN-PAGE DELETE CONFIRMATION MODAL */}
          {/* ==================================================================== */}
          {deleteModalCoupon && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 max-w-sm w-full p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                  <Trash2 className="w-5 h-5" />
                  <h3>Delete Coupon Campaign</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Are you sure you want to permanently delete coupon{" "}
                  <strong className="text-slate-900 dark:text-white font-mono">{deleteModalCoupon.code}</strong>? Students will no longer be able to redeem this code.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDeleteModalCoupon(null)}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-1.5 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </PermissionGuard>
    </AdminShell>
  );
}
