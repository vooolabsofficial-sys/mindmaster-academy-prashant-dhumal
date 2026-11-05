"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import LocationCascadeSelect from "@/components/ui/LocationCascadeSelect";
import { Course, StaffUser, StudentRecord, Book } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffCourses,
  getStaffBooks,
  getStaffStudents,
  saveStaffStudent,
} from "@/lib/staffStore";
import {
  Grant,
  GrantScopeType,
  getGrants,
  createGrant,
  revokeGrant,
  getMatchingStudentCount,
  getMatchingStudents,
  getWaivedRevenue,
  fetchDbGrants,
  getStaffCollectionTally,
  setGrantWhatsappSent,
  getPendingGrantApprovals,
  approveGrant,
  rejectGrant,
  updatePendingGrant,
  getSubAdminCashSettlements,
  settleSubAdminCash,
  settleSingleGrant,
  grantMultiCourseAdmission,
  extendStudentAccess,
  revokeStudentAccess,
  getStudentActiveGrants,
  SubAdminCashSummary,
} from "@/lib/grantStore";
import { formatIST, calculateExpiryIST, isExpiredIST } from "@/lib/istTime";
import { normalizePhone } from "@/lib/phoneUtils";
import {
  Gift,
  Plus,
  Users,
  Search,
  CheckCircle2,
  X,
  Phone,
  AlertCircle,
  IndianRupee,
  Banknote,
  Smartphone,
  GraduationCap,
  BookOpen,
  Layers,
  ArrowLeft,
  Calendar,
  Building,
  Check,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Filter,
  DollarSign,
  Info,
} from "lucide-react";

export default function GrantsManagerPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [grants, setGrants] = useState<Grant[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Grant[]>([]);
  const [cashSettlements, setCashSettlements] = useState<SubAdminCashSummary[]>([]);

  // View Mode: 'list' | 'issue' | 'bulk'
  const [viewMode, setViewMode] = useState<"list" | "issue" | "bulk">("list");

  // Feedback Banner
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Search & Filter State in 'list' mode
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("maharashtra");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterTaluka, setFilterTaluka] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals inside page
  const [rejectModalGrant, setRejectModalGrant] = useState<Grant | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [extendModalGrant, setExtendModalGrant] = useState<Grant | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [revokeModalGrant, setRevokeModalGrant] = useState<Grant | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // ============================================================================
  // ISSUE NEW GRANT STATE (2-Column Inline Workspace)
  // ============================================================================
  const [studentMode, setStudentMode] = useState<"existing" | "new">("existing");
  const [studentSearchInput, setStudentSearchInput] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  // New Student Profile Fields
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentSchool, setNewStudentSchool] = useState("");
  const [newStudentStandard, setNewStudentStandard] = useState("10th Standard");
  const [newStudentState, setNewStudentState] = useState("maharashtra");
  const [newStudentDistrict, setNewStudentDistrict] = useState("Pune");
  const [newStudentTaluka, setNewStudentTaluka] = useState("Haveli");

  // Content Selection
  const [contentType, setContentType] = useState<"course" | "book">("course");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  // Grant Cart Configurations
  const [validityMode, setValidityMode] = useState<"preset" | "custom_days" | "fixed_date">("preset");
  const [validityPresetDays, setValidityPresetDays] = useState<number>(90);
  const [validityCustomDays, setValidityCustomDays] = useState<number>(45);
  const [validityFixedDate, setValidityFixedDate] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"scholarship" | "cash" | "upi" | "institutional">("scholarship");
  const [upiRef, setUpiRef] = useState("");
  const [customAmountCollected, setCustomAmountCollected] = useState<number | "">("");
  const [officialRemark, setOfficialRemark] = useState("");
  const [issueError, setIssueError] = useState<string | null>(null);
  const [isSubmittingGrant, setIsSubmittingGrant] = useState(false);

  // ============================================================================
  // BULK PROVISIONING ENGINE STATE
  // ============================================================================
  const [bulkScopeType, setBulkScopeType] = useState<GrantScopeType>("district");
  const [bulkState, setBulkState] = useState("maharashtra");
  const [bulkDistrict, setBulkDistrict] = useState("Pune");
  const [bulkTaluka, setBulkTaluka] = useState("Haveli");
  const [bulkSchoolName, setBulkSchoolName] = useState("");
  const [bulkManualPhones, setBulkManualPhones] = useState("");
  const [bulkCourseScope, setBulkCourseScope] = useState<"one" | "all">("one");
  const [bulkSelectedCourseId, setBulkSelectedCourseId] = useState("");
  const [bulkValidityDays, setBulkValidityDays] = useState(90);
  const [bulkSkipActive, setBulkSkipActive] = useState(true);
  const [bulkReason, setBulkReason] = useState("");
  const [isExecutingBulk, setIsExecutingBulk] = useState(false);

  // Load Data
  const loadData = async () => {
    setStaff(getCurrentStaff());
    setGrants(getGrants());
    setPendingApprovals(getPendingGrantApprovals());
    setCashSettlements(getSubAdminCashSettlements());
    const cList = getStaffCourses();
    setCourses(cList);
    if (cList.length > 0 && selectedCourseIds.length === 0) {
      setSelectedCourseIds([cList[0].id]);
    }
    if (cList.length > 0 && !bulkSelectedCourseId) {
      setBulkSelectedCourseId(cList[0].id);
    }
    const bList = getStaffBooks();
    setBooks(bList);
    setStudents(getStaffStudents());

    try {
      const liveGrants = await fetchDbGrants();
      if (liveGrants && liveGrants.length > 0) {
        setGrants(liveGrants);
        setPendingApprovals(liveGrants.filter((g) => g.status === "pending_approval"));
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
    const handleGrantsChange = () => setGrants(getGrants());
    window.addEventListener("mma_grants_changed", handleGrantsChange);
    return () => window.removeEventListener("mma_grants_changed", handleGrantsChange);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, filterDistrict, filterTaluka, courseFilter, paymentModeFilter, statusFilter, pageSize]);

  const isMainAdmin = staff.role === "main_admin";

  // Existing student search matching
  const matchingStudentResults = useMemo(() => {
    if (!studentSearchInput.trim()) return [];
    const q = studentSearchInput.trim().toLowerCase();
    const cleanNum = studentSearchInput.replace(/\D/g, "");
    return students
      .filter((s) => {
        const matchName = s.name.toLowerCase().includes(q);
        const matchPhone = cleanNum && s.phone.replace(/\D/g, "").includes(cleanNum);
        const matchSchool = s.school && s.school.toLowerCase().includes(q);
        const matchTaluka = s.taluka && s.taluka.toLowerCase().includes(q);
        return matchName || matchPhone || matchSchool || matchTaluka;
      })
      .slice(0, 8);
  }, [studentSearchInput, students]);

  // Active grants of the selected student
  const studentActiveAccess = useMemo(() => {
    if (!selectedStudent) return [];
    return getStudentActiveGrants(selectedStudent.phone);
  }, [selectedStudent]);

  // Cart financial calculations
  const cartSelectedCourses = useMemo(() => {
    return courses.filter((c) => selectedCourseIds.includes(c.id));
  }, [courses, selectedCourseIds]);

  const cartSelectedBooks = useMemo(() => {
    return books.filter((b) => selectedBookIds.includes(b.id));
  }, [books, selectedBookIds]);

  const cartSubtotalRupees = useMemo(() => {
    if (contentType === "course") {
      const paiseSum = cartSelectedCourses.reduce((sum, c) => sum + (c.pricePaise || 0), 0);
      return Math.round(paiseSum / 100);
    } else {
      const paiseSum = cartSelectedBooks.reduce((sum, b) => sum + (b.pricePaise || 0), 0);
      return Math.round(paiseSum / 100);
    }
  }, [contentType, cartSelectedCourses, cartSelectedBooks]);

  const effectiveValidityDays = useMemo(() => {
    if (validityMode === "preset") return validityPresetDays;
    if (validityMode === "custom_days") return validityCustomDays;
    if (validityMode === "fixed_date" && validityFixedDate) {
      const target = new Date(validityFixedDate).getTime();
      const diff = Math.ceil((target - Date.now()) / 86400000);
      return Math.max(1, diff);
    }
    return 90;
  }, [validityMode, validityPresetDays, validityCustomDays, validityFixedDate]);

  const previewExpiryIST = useMemo(() => {
    if (validityMode === "fixed_date" && validityFixedDate) {
      return `${validityFixedDate} 23:59:59 IST`;
    }
    return calculateExpiryIST(new Date(), { days: effectiveValidityDays });
  }, [validityMode, validityFixedDate, effectiveValidityDays]);

  const netCollectedRupees = useMemo(() => {
    if (paymentMode === "scholarship") return 0;
    if (customAmountCollected !== "") return Number(customAmountCollected);
    return cartSubtotalRupees;
  }, [paymentMode, customAmountCollected, cartSubtotalRupees]);

  const waivedScholarshipRupees = useMemo(() => {
    return Math.max(0, cartSubtotalRupees - netCollectedRupees);
  }, [cartSubtotalRupees, netCollectedRupees]);

  // Overall analytics metrics
  const revenueStats = useMemo(() => getWaivedRevenue(), [grants]);
  const collectionTally = useMemo(() => getStaffCollectionTally(grants), [grants]);

  // Bulk matching preview
  const bulkScopeValue = useMemo(() => {
    if (bulkScopeType === "district") return bulkDistrict;
    if (bulkScopeType === "taluka") return bulkTaluka;
    if (bulkScopeType === "school") return bulkSchoolName.trim();
    return "all";
  }, [bulkScopeType, bulkDistrict, bulkTaluka, bulkSchoolName]);

  const bulkMatchingCount = useMemo(() => {
    if (bulkScopeType === "student") {
      const nums = bulkManualPhones.split(/[\n,]+/).map((n) => n.trim().slice(-10)).filter((n) => n.length === 10);
      return nums.length;
    }
    return getMatchingStudentCount(bulkScopeType, bulkScopeValue);
  }, [bulkScopeType, bulkScopeValue, bulkManualPhones]);

  const bulkWaivedEstimateRupees = useMemo(() => {
    if (bulkMatchingCount === 0) return 0;
    if (bulkCourseScope === "all") {
      const sumPaise = courses.reduce((acc, c) => acc + (c.pricePaise || 0), 0);
      return Math.round((sumPaise * bulkMatchingCount) / 100);
    }
    const single = courses.find((c) => c.id === bulkSelectedCourseId);
    const singlePaise = single?.pricePaise || 0;
    return Math.round((singlePaise * bulkMatchingCount) / 100);
  }, [bulkMatchingCount, bulkCourseScope, bulkSelectedCourseId, courses]);

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  // Send WhatsApp Access Receipt
  const handleSendWhatsApp = (grant: Grant) => {
    const rawPhone = grant.student_phone || grant.studentPhone || grant.scope_value || grant.scopeValue || "";
    const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error("Invalid student mobile number.");
      return;
    }

    const studentName = grant.student_name || grant.studentName || `Student ${cleanPhone.slice(-4)}`;
    const courseTitle = grant.courseTitle || grant.bookTitle || "MindMaster Academy Curriculum";
    const mode =
      grant.payment_mode === "cash"
        ? "Offline Cash Payment"
        : grant.payment_mode === "upi"
        ? "Direct UPI Transfer"
        : "Free Merit Scholarship";
    const amt = grant.amount_paid !== undefined ? `₹${grant.amount_paid}` : "100% Free Grant";
    const expiry = grant.ends_at ? grant.ends_at.slice(0, 10) : "Active";

    const msg = `Dear ${studentName},\n\nYour admission to "${courseTitle}" at MindMaster Academy is confirmed! ✅\n\n📋 Enrollment Details:\n• Fee Status: ${amt} (${mode})\n• Valid Until: ${expiry}\n• Student Mobile: ${cleanPhone}\n\n📲 Access your lectures and study materials:\nhttps://mindmaster.academy/login\n\nWishing you all the very best in your academic journey!\n— Prashant Dhumal Sir, MindMaster Academy`;

    setGrantWhatsappSent(grant.id);
    loadData();
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Issue Course Grant / Cart Admission
  const handleConfirmIssueGrant = async () => {
    setIssueError(null);

    let targetStudentName = "";
    let targetStudentPhone = "";

    if (studentMode === "existing") {
      if (!selectedStudent) {
        setIssueError("Please search and select a student from the directory.");
        return;
      }
      targetStudentName = selectedStudent.name;
      targetStudentPhone = selectedStudent.phone;
    } else {
      // Register New Student Inline
      if (!newStudentName.trim()) {
        setIssueError("Please enter the student's full name.");
        return;
      }
      const clean = normalizePhone(newStudentPhone);
      if (!clean || clean.length !== 10) {
        setIssueError("Please enter a valid 10-digit mobile number.");
        return;
      }
      targetStudentName = newStudentName.trim();
      targetStudentPhone = clean;

      // Save Student Profile
      const newRecord: StudentRecord = {
        id: `std-${Date.now()}`,
        name: targetStudentName,
        phone: targetStudentPhone,
        email: newStudentEmail.trim() || undefined,
        district: newStudentDistrict,
        taluka: newStudentTaluka,
        school: newStudentSchool.trim() || undefined,
        totalPaidPaise: netCollectedRupees * 100,
        joinedDate: new Date().toISOString(),
        status: "active",
        coursesTaken: [],
      };
      saveStaffStudent(newRecord);
    }

    const itemIds = contentType === "course" ? selectedCourseIds : selectedBookIds;
    if (itemIds.length === 0) {
      setIssueError(`Please select at least one ${contentType} to grant.`);
      return;
    }

    // Sub-Admin security guardrail
    if (!isMainAdmin && paymentMode === "scholarship") {
      setIssueError("Sub-Admins cannot issue ₹0 Free Scholarships directly. Only Main Admin (Prashant Sir) has grant authority.");
      return;
    }

    if (paymentMode === "upi" && (!upiRef || !upiRef.trim())) {
      setIssueError("Mandatory UPI Reference (UTR) number is required for UPI admissions.");
      return;
    }

    setIsSubmittingGrant(true);

    try {
      const result = grantMultiCourseAdmission({
        studentPhone: targetStudentPhone,
        studentName: targetStudentName,
        itemIds,
        validityDays: effectiveValidityDays,
        customExpiryDate: validityMode === "fixed_date" ? validityFixedDate : undefined,
        paymentMode: paymentMode === "institutional" ? "scholarship" : paymentMode,
        upiRef: paymentMode === "upi" ? upiRef.trim() : undefined,
        totalAmountPaid: netCollectedRupees,
        remarks: officialRemark.trim() || `Course Grant [${paymentMode.toUpperCase()}] issued by ${staff.name}`,
      });

      if (!result.success) {
        setIssueError(result.error || "Failed to grant admission.");
        setIsSubmittingGrant(false);
        return;
      }

      toast.success(`Access successfully granted for ${targetStudentName}!`);
      setActionFeedback(`✅ Successfully issued access for ${targetStudentName} (${itemIds.length} items unlocked).`);
      setTimeout(() => setActionFeedback(null), 4000);

      // Offer instant WhatsApp link
      const primaryGrant = getGrants().find(
        (g) => normalizePhone(g.student_phone || g.scope_value || "") === normalizePhone(targetStudentPhone)
      );
      if (primaryGrant) {
        handleSendWhatsApp(primaryGrant);
      }

      // Reset and return to list
      setSelectedStudent(null);
      setStudentSearchInput("");
      setNewStudentName("");
      setNewStudentPhone("");
      setOfficialRemark("");
      setCustomAmountCollected("");
      setUpiRef("");
      setViewMode("list");
      await loadData();
    } catch (err: any) {
      setIssueError(err.message || "Failed to execute admission grant.");
    } finally {
      setIsSubmittingGrant(false);
    }
  };

  // Bulk Provisioning Execution
  const handleExecuteBulkGrant = async () => {
    if (!bulkReason.trim()) {
      toast.error("Please enter an official approval note or batch reason.");
      return;
    }
    if (bulkMatchingCount === 0) {
      toast.error("No matching students found for the selected scope.");
      return;
    }

    setIsExecutingBulk(true);
    try {
      createGrant({
        scopeType: bulkScopeType,
        scopeValue: bulkScopeValue,
        courseScope: bulkCourseScope,
        courseId: bulkCourseScope === "one" ? bulkSelectedCourseId : undefined,
        months: Math.max(1, Math.round(bulkValidityDays / 30)),
        validityDays: bulkValidityDays,
        reason: bulkReason.trim(),
      });

      toast.success(`Bulk grant successfully provisioned for ${bulkMatchingCount} students!`);
      setActionFeedback(`✅ Bulk grant provisioned for ${bulkMatchingCount} students.`);
      setTimeout(() => setActionFeedback(null), 4000);
      setViewMode("list");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to execute bulk grant.");
    } finally {
      setIsExecutingBulk(false);
    }
  };

  // Maker-Checker Approvals
  const handleApprove = (grantId: string) => {
    try {
      approveGrant(grantId);
      toast.success("Grant approved & student access activated!");
      loadData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve grant.");
    }
  };

  const handleConfirmReject = () => {
    if (!rejectModalGrant) return;
    try {
      rejectGrant(rejectModalGrant.id, rejectReason.trim() || undefined);
      setRejectModalGrant(null);
      toast.success("Grant rejected successfully.");
      loadData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject grant.");
    }
  };

  // Extend Validity
  const handleConfirmExtend = async () => {
    if (!extendModalGrant) return;
    setIsActionLoading(true);
    try {
      const res = await extendStudentAccess({
        studentPhone: extendModalGrant.student_phone || extendModalGrant.scope_value || "",
        studentName: extendModalGrant.student_name,
        itemId: extendModalGrant.course_id || extendModalGrant.book_id || "",
        itemType: extendModalGrant.item_type || "course",
        daysToAdd: extendDays,
        grantId: extendModalGrant.id,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to extend access.");
        return;
      }

      toast.success(`Access extended by ${extendDays} days!`);
      setExtendModalGrant(null);
      await loadData();
    } catch (e: any) {
      toast.error(e?.message || "Error extending access.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Revoke Access
  const handleConfirmRevoke = async () => {
    if (!revokeModalGrant) return;
    if (!revokeReason.trim()) {
      toast.error("Please enter a mandatory revocation reason.");
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await revokeStudentAccess({
        studentPhone: revokeModalGrant.student_phone || revokeModalGrant.scope_value || "",
        studentName: revokeModalGrant.student_name,
        itemId: revokeModalGrant.course_id || revokeModalGrant.book_id || "",
        itemType: revokeModalGrant.item_type || "course",
        reason: revokeReason.trim(),
        grantId: revokeModalGrant.id,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to revoke access.");
        return;
      }

      toast.success("Access successfully revoked.");
      setRevokeModalGrant(null);
      await loadData();
    } catch (e: any) {
      toast.error(e?.message || "Error revoking access.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Settle Cash
  const handleSettleSubAdmin = (staffId: string) => {
    if (!confirm(`Settle and mark cash collections as received from sub-admin (${staffId})?`)) return;
    try {
      const amount = settleSubAdminCash(staffId);
      toast.success(`Settled ₹${amount.toLocaleString("en-IN")} from ${staffId}.`);
      loadData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to settle cash.");
    }
  };

  // Filtered Table Data
  const filteredGrants = useMemo(() => {
    return grants.filter((g) => {
      const q = debouncedSearchQuery.toLowerCase();
      const matchSearch =
        !q ||
        g.student_name?.toLowerCase().includes(q) ||
        g.student_phone?.includes(q) ||
        g.scope_value?.toLowerCase().includes(q) ||
        g.courseTitle?.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q);

      const matchDistrict =
        filterDistrict === "all" ||
        (g.scope_type === "district" && g.scope_value?.toLowerCase() === filterDistrict.toLowerCase());

      const matchCourse =
        courseFilter === "all" ||
        g.course_id === courseFilter ||
        g.courseScope === "all";

      const matchPayment =
        paymentModeFilter === "all" ||
        g.payment_mode === paymentModeFilter;

      const matchStatus =
        statusFilter === "all" ||
        g.status === statusFilter;

      return matchSearch && matchDistrict && matchCourse && matchPayment && matchStatus;
    });
  }, [grants, debouncedSearchQuery, filterDistrict, courseFilter, paymentModeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredGrants.length / pageSize) || 1;
  const paginatedGrants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGrants.slice(start, start + pageSize);
  }, [filteredGrants, currentPage, pageSize]);

  return (
    <AdminShell currentSection="grants">
      <PermissionGuard requiredRole={["main_admin", "sub_admin"]}>
        <div className="space-y-6">

          {/* Feedback banner */}
          {actionFeedback && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
              <span className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {actionFeedback}
              </span>
              <button onClick={() => setActionFeedback(null)} className="text-emerald-600 hover:text-emerald-900 text-sm font-bold">
                ✕
              </button>
            </div>
          )}

          {/* ==================================================================== */}
          {/* VIEW: ISSUE NEW COURSE GRANT (INLINE 2-COLUMN WORKSPACE) */}
          {/* ==================================================================== */}
          {viewMode === "issue" && (
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
                    Back to Grants Directory
                  </button>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Gift className="w-6 h-6 text-blue-600" />
                    Issue Course Grant & Direct Admission
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Assign courses with immediate unlocking, custom validity duration, and payment reconciliation.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    Staff: {staff.name} ({staff.role === "main_admin" ? "Main Admin" : "Sub-Admin"})
                  </span>
                </div>
              </div>

              {/* 2-Column Responsive Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column (8 cols): Student Profile & Content Selection */}
                <div className="lg:col-span-7 space-y-6">

                  {/* Section 1: Student Provisioning */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                          Step 1: Student Profile
                        </h2>
                      </div>
                      <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setStudentMode("existing")}
                          className={`px-3 py-1 rounded-lg transition ${
                            studentMode === "existing"
                              ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Select Existing Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentMode("new")}
                          className={`px-3 py-1 rounded-lg transition ${
                            studentMode === "new"
                              ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Register New Student Inline
                        </button>
                      </div>
                    </div>

                    {/* Mode A: Existing Student Search */}
                    {studentMode === "existing" && (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={studentSearchInput}
                            onChange={(e) => setStudentSearchInput(e.target.value)}
                            placeholder="Search student by Name, Mobile Number (10 digits), or School..."
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-600 transition"
                          />
                        </div>

                        {/* Search Results Dropdown List */}
                        {matchingStudentResults.length > 0 && !selectedStudent && (
                          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-sm max-h-60 overflow-y-auto">
                            {matchingStudentResults.map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  setSelectedStudent(st);
                                  setStudentSearchInput(`${st.name} (${st.phone})`);
                                }}
                                className="w-full text-left p-3 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 flex items-center justify-between transition cursor-pointer"
                              >
                                <div>
                                  <p className="font-bold text-sm text-slate-900 dark:text-white">{st.name}</p>
                                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                    <Phone className="w-3 h-3" /> {st.phone} • {st.school || "School Not Set"} • {st.district}
                                  </p>
                                </div>
                                <span className="text-xs font-bold text-blue-600">Select →</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Selected Student Active Card */}
                        {selectedStudent && (
                          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {selectedStudent.name}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                  {selectedStudent.phone}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudent(null);
                                  setStudentSearchInput("");
                                }}
                                className="text-xs font-bold text-red-600 hover:underline"
                              >
                                Change Student
                              </button>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              🏫 {selectedStudent.school || "Individual Student"} • 📍 {selectedStudent.district}
                              {selectedStudent.taluka ? `, Taluka: ${selectedStudent.taluka}` : ""}
                            </p>

                            {/* Active enrollments warning */}
                            {studentActiveAccess.length > 0 && (
                              <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/60">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                  Currently Enrolled Curriculum ({studentActiveAccess.length}):
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {studentActiveAccess.map((acc) => (
                                    <span
                                      key={acc.id}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                                    >
                                      <span>{acc.itemTitle}</span>
                                      <span className="text-emerald-600 font-bold">({acc.daysLeft}d left)</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode B: Register New Student Inline */}
                    {studentMode === "new" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Student Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={newStudentName}
                              onChange={(e) => setNewStudentName(e.target.value)}
                              placeholder="e.g. Ramesh Vijay Patil"
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Mobile Number (10 Digits) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">+91</span>
                              <input
                                type="tel"
                                maxLength={10}
                                required
                                value={newStudentPhone}
                                onChange={(e) => setNewStudentPhone(e.target.value.replace(/\D/g, ""))}
                                placeholder="9876543210"
                                className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600 tabular-nums"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              School / College / Academy Name
                            </label>
                            <input
                              type="text"
                              value={newStudentSchool}
                              onChange={(e) => setNewStudentSchool(e.target.value)}
                              placeholder="e.g. ZP High School, Satara"
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Standard / Stream
                            </label>
                            <input
                              type="text"
                              value={newStudentStandard}
                              onChange={(e) => setNewStudentStandard(e.target.value)}
                              placeholder="e.g. 10th Standard / MPSC"
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>

                        {/* Standardized Cascading Location */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <LocationCascadeSelect
                            selectedState={newStudentState}
                            selectedDistrict={newStudentDistrict}
                            selectedTaluka={newStudentTaluka}
                            onStateChange={(id, name) => setNewStudentState(id)}
                            onDistrictChange={(id, name) => setNewStudentDistrict(name)}
                            onTalukaChange={(id, name) => setNewStudentTaluka(name)}
                            layout="grid"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 2: Course & Content Selection */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                          Step 2: Choose Curriculum
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setContentType("course")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            contentType === "course"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Courses ({courses.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setContentType("book")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            contentType === "book"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Digital Books ({books.length})
                        </button>
                      </div>
                    </div>

                    {/* Quick Selection Helpers */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Select one or multiple items to bundle into the cart:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (contentType === "course") setSelectedCourseIds(courses.map((c) => c.id));
                            else setSelectedBookIds(books.map((b) => b.id));
                          }}
                          className="font-bold text-blue-600 hover:underline"
                        >
                          Select All
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (contentType === "course") setSelectedCourseIds([]);
                            else setSelectedBookIds([]);
                          }}
                          className="font-bold text-slate-500 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Courses Checklist */}
                    {contentType === "course" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                        {courses.map((course) => {
                          const isSelected = selectedCourseIds.includes(course.id);
                          const isAlreadyEnrolled = studentActiveAccess.some((acc) => acc.itemId === course.id);
                          return (
                            <div
                              key={course.id}
                              onClick={() => {
                                if (isSelected) setSelectedCourseIds(selectedCourseIds.filter((id) => id !== course.id));
                                else setSelectedCourseIds([...selectedCourseIds, course.id]);
                              }}
                              className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer select-none ${
                                isSelected
                                  ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-xs"
                                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                                  isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600"
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {course.title}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                                      {course.category || "General"}
                                    </span>
                                    {isAlreadyEnrolled && (
                                      <span className="text-[10px] text-amber-600 font-bold">
                                        • Already Active
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                                ₹{Math.round((course.pricePaise || 0) / 100)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Books Checklist */}
                    {contentType === "book" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                        {books.map((book) => {
                          const isSelected = selectedBookIds.includes(book.id);
                          return (
                            <div
                              key={book.id}
                              onClick={() => {
                                if (isSelected) setSelectedBookIds(selectedBookIds.filter((id) => id !== book.id));
                                else setSelectedBookIds([...selectedBookIds, book.id]);
                              }}
                              className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer select-none ${
                                isSelected
                                  ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-xs"
                                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                                  isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600"
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {book.title}
                                  </p>
                                  <span className="text-[10px] text-slate-500">
                                    Digital PDF
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                                ₹{Math.round((book.pricePaise || 0) / 100)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (5 cols): Live Grant Cart Summary & Reconciliation */}
                <div className="lg:col-span-5 sticky top-20 space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-blue-600" />
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Grant Cart Summary
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {contentType === "course" ? selectedCourseIds.length : selectedBookIds.length} Item(s)
                      </span>
                    </div>

                    {/* Selected Items Roster */}
                    <div className="space-y-2 max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {contentType === "course" && cartSelectedCourses.map((c) => (
                        <div key={c.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                            {c.title}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                            ₹{Math.round((c.pricePaise || 0) / 100)}
                          </span>
                        </div>
                      ))}
                      {contentType === "book" && cartSelectedBooks.map((b) => (
                        <div key={b.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                            {b.title}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                            ₹{Math.round((b.pricePaise || 0) / 100)}
                          </span>
                        </div>
                      ))}
                      {((contentType === "course" && cartSelectedCourses.length === 0) ||
                        (contentType === "book" && cartSelectedBooks.length === 0)) && (
                        <p className="text-xs text-slate-400 py-2 text-center">
                          No curriculum items selected yet.
                        </p>
                      )}
                    </div>

                    {/* Validity Duration Selector */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Student Access Duration</span>
                        </label>
                        <span className="text-[11px] font-bold text-blue-600">
                          {effectiveValidityDays} Days ({Math.round(effectiveValidityDays / 30)} Months)
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: "15 Days", days: 15 },
                          { label: "1 Month", days: 30 },
                          { label: "3 Months", days: 90 },
                          { label: "6 Months", days: 180 },
                          { label: "1 Year", days: 365 },
                          { label: "2 Years", days: 730 },
                          { label: "Custom", days: -1 },
                          { label: "Exam Date", days: -2 },
                        ].map((btn) => {
                          const isActive =
                            (btn.days > 0 && validityMode === "preset" && validityPresetDays === btn.days) ||
                            (btn.days === -1 && validityMode === "custom_days") ||
                            (btn.days === -2 && validityMode === "fixed_date");

                          return (
                            <button
                              key={btn.label}
                              type="button"
                              onClick={() => {
                                if (btn.days > 0) {
                                  setValidityMode("preset");
                                  setValidityPresetDays(btn.days);
                                } else if (btn.days === -1) {
                                  setValidityMode("custom_days");
                                } else {
                                  setValidityMode("fixed_date");
                                }
                              }}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition text-center cursor-pointer ${
                                isActive
                                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-500"
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>

                      {validityMode === "custom_days" && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="number"
                            min={1}
                            max={3650}
                            value={validityCustomDays}
                            onChange={(e) => setValidityCustomDays(Math.max(1, Number(e.target.value)))}
                            placeholder="Enter days (e.g. 45)"
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Days from Grant</span>
                        </div>
                      )}

                      {validityMode === "fixed_date" && (
                        <div className="pt-1">
                          <input
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            value={validityFixedDate}
                            onChange={(e) => setValidityFixedDate(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500">
                        Access Expires: <strong className="text-slate-800 dark:text-slate-200">{previewExpiryIST}</strong>
                      </p>
                    </div>

                    {/* Grant Type / Payment Mode */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-blue-600" />
                        <span>Admission Type & Settlement</span>
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "scholarship", label: "100% Free Scholarship", icon: Gift },
                          { id: "cash", label: "Offline Cash Fee", icon: Banknote },
                          { id: "upi", label: "Direct UPI Transfer", icon: Smartphone },
                          { id: "institutional", label: "School Batch Grant", icon: Building },
                        ].map((m) => {
                          const IconComp = m.icon;
                          const isSel = paymentMode === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setPaymentMode(m.id as any);
                                if (m.id === "scholarship") setCustomAmountCollected(0);
                                else if (customAmountCollected === 0 || customAmountCollected === "") setCustomAmountCollected(cartSubtotalRupees);
                              }}
                              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                                isSel
                                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-900 dark:text-blue-100"
                                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <IconComp className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="text-[11px] font-bold leading-tight">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Sub-Admin Free Scholarship Alert */}
                      {!isMainAdmin && paymentMode === "scholarship" && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>
                            Notice: Sub-Admins cannot issue ₹0 Free Scholarships directly. Please record as Cash/UPI fee or route to Main Admin.
                          </span>
                        </div>
                      )}

                      {/* Cash / Partial Fee Collection Input */}
                      {paymentMode === "cash" && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Cash Fee Collected from Student (₹):
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              min={0}
                              value={customAmountCollected}
                              onChange={(e) => setCustomAmountCollected(e.target.value === "" ? "" : Number(e.target.value))}
                              placeholder={String(cartSubtotalRupees)}
                              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500">
                            This amount will be added to your unsettled cash tally until settled with Main Admin.
                          </p>
                        </div>
                      )}

                      {/* UPI Reference Input */}
                      {paymentMode === "upi" && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            UPI Reference Number / UTR (Required):
                          </label>
                          <input
                            type="text"
                            required
                            value={upiRef}
                            onChange={(e) => setUpiRef(e.target.value)}
                            placeholder="e.g. 429381749281 (Google Pay / PhonePe)"
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Cart Financial Summary */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Curriculum Subtotal:</span>
                        <span className="font-semibold tabular-nums">₹{cartSubtotalRupees.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Grant Waiver / Subsidy:</span>
                        <span className="tabular-nums">- ₹{waivedScholarshipRupees.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                        <span>Net Fee Collected:</span>
                        <span className="text-blue-600 tabular-nums">₹{netCollectedRupees.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Official Reason / Remark */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Administrative Note / Receipt Remarks <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={officialRemark}
                        onChange={(e) => setOfficialRemark(e.target.value)}
                        placeholder="e.g. Merit admission approved by Prashant Sir. Paid in Satara branch."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
                      />
                    </div>

                    {/* Error Notice */}
                    {issueError && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{issueError}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        disabled={isSubmittingGrant}
                        onClick={handleConfirmIssueGrant}
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmittingGrant ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Provisioning Access...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Confirm & Issue Access
                          </>
                        )}
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
                </div>

              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* VIEW: BULK PROVISIONING ENGINE (INLINE WORKSPACE) */}
          {/* ==================================================================== */}
          {viewMode === "bulk" && (
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
                    Back to Grants Directory
                  </button>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-6 h-6 text-blue-600" />
                    Bulk Curriculum Provisioning Engine
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mass-provision access across entire districts, talukas, schools, or custom cohorts with dry-run verification.
                  </p>
                </div>
              </div>

              {/* 2-Column Bulk Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    Target Cohort Definition
                  </h2>

                  {/* Scope Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Provisioning Scope
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "district", label: "District-Wide" },
                        { id: "taluka", label: "Taluka-Wide" },
                        { id: "school", label: "School Cohort" },
                        { id: "all_students", label: "All Students" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBulkScopeType(item.id as any)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                            bulkScopeType === item.id
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dependent Location Cascade */}
                  {(bulkScopeType === "district" || bulkScopeType === "taluka") && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Target Geography ({bulkScopeType === "district" ? "District" : "District & Taluka"}):
                      </label>
                      <LocationCascadeSelect
                        selectedState={bulkState}
                        selectedDistrict={bulkDistrict}
                        selectedTaluka={bulkTaluka}
                        onStateChange={(id, name) => setBulkState(id)}
                        onDistrictChange={(id, name) => setBulkDistrict(name)}
                        onTalukaChange={(id, name) => setBulkTaluka(name)}
                        layout="grid"
                      />
                    </div>
                  )}

                  {bulkScopeType === "school" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        School / College Name (Exact or Partial match):
                      </label>
                      <input
                        type="text"
                        value={bulkSchoolName}
                        onChange={(e) => setBulkSchoolName(e.target.value)}
                        placeholder="e.g. Shivaji High School, Satara"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  )}

                  {/* Course Scope */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Curriculum Scope
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkCourseScope("one")}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          bulkCourseScope === "one"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        Single Selected Course
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkCourseScope("all")}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          bulkCourseScope === "all"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        All Active Courses ({courses.length})
                      </button>
                    </div>

                    {bulkCourseScope === "one" && (
                      <select
                        value={bulkSelectedCourseId}
                        onChange={(e) => setBulkSelectedCourseId(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none mt-2"
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} (₹{Math.round((c.pricePaise || 0) / 100)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Validity Days */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Access Validity Duration (Days):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      value={bulkValidityDays}
                      onChange={(e) => setBulkValidityDays(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                    />
                  </div>

                  {/* Approval Note */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Approval Note & Administrative Justification <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={bulkReason}
                      onChange={(e) => setBulkReason(e.target.value)}
                      placeholder="e.g. Satara District CSR Free Education Drive sanctioned by Prashant Sir"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                {/* Right Column: Pre-Validation Dry-Run Card */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Pre-Validation Dry-Run Summary
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                      <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 block">
                        Matching Students
                      </span>
                      <span className="text-xl font-extrabold text-blue-900 dark:text-blue-100 tabular-nums">
                        {bulkMatchingCount}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block">
                        Waived Value (₹)
                      </span>
                      <span className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100 tabular-nums">
                        ₹{bulkWaivedEstimateRupees.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Conflict Policy Toggle */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Conflict Resolution Policy:
                    </span>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkSkipActive}
                        onChange={(e) => setBulkSkipActive(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Skip students who already have this course active</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={isExecutingBulk || bulkMatchingCount === 0}
                    onClick={handleExecuteBulkGrant}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isExecutingBulk ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Executing Bulk Grant...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Execute Bulk Provisioning
                      </>
                    )}
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
            </div>
          )}

          {/* ==================================================================== */}
          {/* VIEW: GRANTS DIRECTORY & ANALYTICS (MAIN WORKSPACE) */}
          {/* ==================================================================== */}
          {viewMode === "list" && (
            <div className="space-y-6">

              {/* Top Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Gift className="w-7 h-7 text-blue-600" />
                    Course Grants & Provisioning Studio
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage direct student admissions, scholarships, offline cash settlements, and cohort provisioning.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("bulk")}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-blue-600" />
                    Bulk Provisioning
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("issue");
                      setStudentMode("existing");
                      setSelectedStudent(null);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Issue New Grant
                  </button>
                </div>
              </div>

              {/* Architectural KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>Active Grants</span>
                    <Gift className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {grants.filter((g) => g.status === "active").length}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">100% Verified Access</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>Students Impacted</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {revenueStats.totalUniqueStudents}
                  </div>
                  <span className="text-[10px] text-slate-400">Across All Batches</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>Waived Scholarship</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 tabular-nums">
                    ₹{revenueStats.totalWaivedRupees.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-400">Academic Subsidies</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>Pending Approvals</span>
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 tabular-nums">
                    {pendingApprovals.length}
                  </div>
                  <span className="text-[10px] text-slate-400">Maker-Checker Queue</span>
                </div>
              </div>

              {/* Maker-Checker Pending Queue Banner (Main Admin) */}
              {isMainAdmin && pendingApprovals.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                      <h3 className="font-bold text-sm text-amber-900 dark:text-amber-100">
                        Maker-Checker Action Required ({pendingApprovals.length} Pending Grant Approval Requests)
                      </h3>
                    </div>
                  </div>
                  <div className="divide-y divide-amber-200/60 dark:divide-amber-800/60">
                    {pendingApprovals.map((grant) => (
                      <div key={grant.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            {grant.student_name || grant.scope_value} • Course: {grant.courseTitle || "All"}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            Submitted by: {grant.createdByName} • Mode: {grant.payment_mode || "Scholarship"} (₹{grant.amount_paid || 0}) • Note: {grant.reason}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(grant.id)}
                            className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                          >
                            Approve Access
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectModalGrant(grant);
                              setRejectReason("");
                            }}
                            className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-lg hover:bg-red-200 transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Admin Cash Settlements Banner (Main Admin) */}
              {isMainAdmin && cashSettlements.some((s) => s.unsettledCash > 0) && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                        Sub-Admin Cash Collections Awaiting Settlement
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {cashSettlements
                      .filter((s) => s.unsettledCash > 0)
                      .map((summary) => (
                        <div
                          key={summary.staffId}
                          className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-white">{summary.staffName}</p>
                            <p className="text-xs text-emerald-700 font-extrabold tabular-nums">
                              ₹{summary.unsettledCash.toLocaleString("en-IN")} Unsettled
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSettleSubAdmin(summary.staffId)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                          >
                            Settle Now
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Multi-Dimension Cascading Filter Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search student, mobile, grant ID..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-8 flex flex-wrap items-center gap-2">
                    <LocationCascadeSelect
                      selectedState={filterState}
                      selectedDistrict={filterDistrict}
                      selectedTaluka={filterTaluka}
                      onStateChange={(id, name) => setFilterState(id)}
                      onDistrictChange={(id, name) => setFilterDistrict(name)}
                      onTalukaChange={(id, name) => setFilterTaluka(name)}
                      allowAll
                      size="sm"
                      layout="inline"
                    />

                    {/* Course Filter */}
                    <select
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none"
                    >
                      <option value="all">All Courses</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>

                    {/* Payment Mode Filter */}
                    <select
                      value={paymentModeFilter}
                      onChange={(e) => setPaymentModeFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none"
                    >
                      <option value="all">All Payment Types</option>
                      <option value="scholarship">100% Scholarship</option>
                      <option value="cash">Offline Cash</option>
                      <option value="upi">Direct UPI</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="revoked">Revoked</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grants Data Table (YouTube Studio / Stripe Style) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                        <th className="py-3 px-4">Student & Scope</th>
                        <th className="py-3 px-4">Curriculum Assigned</th>
                        <th className="py-3 px-4">Commercial Mode</th>
                        <th className="py-3 px-4">Validity Window</th>
                        <th className="py-3 px-4">Granted By</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedGrants.map((grant) => {
                        const isExpired = isExpiredIST(grant.ends_at || grant.endsAt);
                        return (
                          <tr key={grant.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                            {/* Student / Scope Column */}
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {grant.student_name || grant.scope_value}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                {grant.student_phone && (
                                  <span className="tabular-nums flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {grant.student_phone}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium capitalize">
                                  {grant.scope_type}: {grant.scope_value}
                                </span>
                              </div>
                            </td>

                            {/* Curriculum Assigned */}
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-800 dark:text-slate-200">
                                {grant.courseTitle || grant.bookTitle || (grant.course_scope === "all" ? "All Courses" : "Curriculum")}
                              </p>
                              <span className="text-[10px] text-slate-400 capitalize">
                                {grant.item_type || "Course Batch"}
                              </span>
                            </td>

                            {/* Commercial Mode */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  grant.payment_mode === "cash"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                    : grant.payment_mode === "upi"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                }`}>
                                  {grant.payment_mode === "cash"
                                    ? `Cash (₹${grant.amount_paid || 0})`
                                    : grant.payment_mode === "upi"
                                    ? `UPI (₹${grant.amount_paid || 0})`
                                    : "100% Scholarship"}
                                </span>

                                {grant.payment_mode === "cash" && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    grant.settlement_status === "settled"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-red-50 text-red-600"
                                  }`}>
                                    {grant.settlement_status === "settled" ? "Settled" : "Unsettled"}
                                  </span>
                                )}
                              </div>
                              {grant.upi_ref && (
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  UTR: {grant.upi_ref}
                                </span>
                              )}
                            </td>

                            {/* Validity Window */}
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                {grant.ends_at ? grant.ends_at.slice(0, 10) : "Lifetime"}
                              </p>
                              <span className={`text-[10px] font-bold ${isExpired ? "text-red-500" : "text-emerald-600"}`}>
                                {isExpired ? "Expired" : "Active Access"}
                              </span>
                            </td>

                            {/* Granted By */}
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {grant.createdByName || "Admin"}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {grant.created_at ? grant.created_at.slice(0, 10) : ""}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                grant.status === "active"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                  : grant.status === "pending_approval"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                              }`}>
                                {grant.status.replace("_", " ")}
                              </span>
                            </td>

                            {/* Row Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* WhatsApp Trigger */}
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsApp(grant)}
                                  title="Send 1-Click WhatsApp Receipt"
                                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-600 transition cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>

                                {/* Extend Validity */}
                                {grant.status === "active" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExtendModalGrant(grant);
                                      setExtendDays(30);
                                    }}
                                    title="Extend Access Validity"
                                    className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-600 transition cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Revoke Access */}
                                {grant.status === "active" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRevokeModalGrant(grant);
                                      setRevokeReason("");
                                    }}
                                    title="Revoke Student Access"
                                    className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 hover:bg-red-100 text-red-600 transition cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {paginatedGrants.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400">
                            No grant or admission records matched your filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Showing {(currentPage - 1) * pageSize + 1} to{" "}
                      {Math.min(currentPage * pageSize, filteredGrants.length)} of {filteredGrants.length} grants
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="px-2 font-bold text-slate-900 dark:text-white">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* IN-PAGE EXTEND VALIDITY MODAL */}
          {/* ==================================================================== */}
          {extendModalGrant && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Extend Access Validity
                  </h3>
                  <button onClick={() => setExtendModalGrant(null)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Extending access for student <strong className="text-slate-900 dark:text-white">{extendModalGrant.student_name || extendModalGrant.scope_value}</strong> on curriculum: <strong className="text-blue-600">{extendModalGrant.courseTitle || "Course"}</strong>.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Days to Add to Expiry:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 60, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setExtendDays(d)}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition ${
                          extendDays === d
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        +{d} Days
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={extendDays}
                    onChange={(e) => setExtendDays(Math.max(1, Number(e.target.value)))}
                    className="w-full mt-2 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setExtendModalGrant(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleConfirmExtend}
                    className="px-4 py-2 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    Confirm Extension
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* IN-PAGE REVOKE ACCESS MODAL */}
          {/* ==================================================================== */}
          {revokeModalGrant && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Revoke Curriculum Access
                  </h3>
                  <button onClick={() => setRevokeModalGrant(null)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Are you sure you want to revoke access for <strong className="text-slate-900 dark:text-white">{revokeModalGrant.student_name || revokeModalGrant.scope_value}</strong>? The student will immediately lose access to this curriculum.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mandatory Reason for Revocation <span className="text-red-500">*</span>:
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="e.g. Fee refund requested / Course swap / Admission cancelled"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRevokeModalGrant(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isActionLoading || !revokeReason.trim()}
                    onClick={handleConfirmRevoke}
                    className="px-4 py-2 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    Confirm Revocation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* IN-PAGE REJECT PENDING GRANT MODAL */}
          {/* ==================================================================== */}
          {rejectModalGrant && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-red-600 flex items-center gap-2">
                    <X className="w-5 h-5 text-red-600" />
                    Reject Pending Grant
                  </h3>
                  <button onClick={() => setRejectModalGrant(null)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Rejecting grant request submitted by <strong className="text-slate-900 dark:text-white">{rejectModalGrant.createdByName}</strong> for student <strong className="text-blue-600">{rejectModalGrant.student_name || rejectModalGrant.scope_value}</strong>.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Rejection Reason / Note:
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Unverified payment receipt / Incomplete student details"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRejectModalGrant(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    className="px-4 py-2 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition"
                  >
                    Confirm Rejection
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
