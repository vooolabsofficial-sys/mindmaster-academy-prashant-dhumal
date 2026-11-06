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
  Smartphone,
  GraduationCap,
  BookOpen,
  Layers,
  ArrowLeft,
  Calendar,
  Building2,
  MapPin,
  School,
  UserCheck,
  Globe,
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
  Trash2,
  FileSpreadsheet,
  Download,
  CheckSquare,
  Square,
  HelpCircle,
  Tag,
} from "lucide-react";

export default function GrantsManagerPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [grants, setGrants] = useState<Grant[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Grant[]>([]);
  const [cashSettlements, setCashSettlements] = useState<SubAdminCashSummary[]>([]);

  // View Mode: 'list' | 'create' | 'bulk'
  const [viewMode, setViewMode] = useState<"list" | "create" | "bulk">("list");

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

  // In-line Action States (Zero heavy blurred overlays)
  const [actionModal, setActionModal] = useState<{
    type: "extend" | "revoke" | "reject" | null;
    grant: Grant | null;
  }>({ type: null, grant: null });
  const [actionExtendDays, setActionExtendDays] = useState(30);
  const [actionReason, setActionReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // ============================================================================
  // FULL-WIDTH 2-COLUMN INLINE STUDIO WORKSPACE STATE
  // ============================================================================
  // Step 1: Target Scope
  const [targetScopeType, setTargetScopeType] = useState<"student" | "district" | "taluka" | "school" | "all">("student");

  // When targetScopeType === 'student'
  const [studentSubMode, setStudentSubMode] = useState<"search" | "inline_create" | "bulk_paste">("search");
  const [studentSearchInput, setStudentSearchInput] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<StudentRecord[]>([]);

  // Inline Quick Student Registration
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentSchool, setNewStudentSchool] = useState("");
  const [newStudentStandard, setNewStudentStandard] = useState("10th Standard");
  const [newStudentState, setNewStudentState] = useState("maharashtra");
  const [newStudentDistrict, setNewStudentDistrict] = useState("Pune");
  const [newStudentTaluka, setNewStudentTaluka] = useState("Haveli");

  // Bulk Multi-Phone / CSV Paste
  const [bulkPasteInput, setBulkPasteInput] = useState("");
  const [duplicateEnrollmentPolicy, setDuplicateEnrollmentPolicy] = useState<"skip" | "extend">("skip");

  // Geography & School Target
  const [targetState, setTargetState] = useState("maharashtra");
  const [targetDistrict, setTargetDistrict] = useState("Pune");
  const [targetTaluka, setTargetTaluka] = useState("Haveli");
  const [targetSchoolName, setTargetSchoolName] = useState("");

  // Step 2: Multi-Item Curriculum Selection (Courses + Digital Books)
  const [curriculumSearch, setCurriculumSearch] = useState("");
  const [curriculumTab, setCurriculumTab] = useState<"all" | "courses" | "books">("all");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  // Right Column: Grant Cart & Pricing
  const [grantPricingMode, setGrantPricingMode] = useState<"scholarship" | "discounted" | "offline_fee">("scholarship");
  const [offlinePaymentType, setOfflinePaymentType] = useState<"cash" | "upi">("cash");
  const [customCollectedRupees, setCustomCollectedRupees] = useState<number | "">("");
  const [offlineUpiRef, setOfflineUpiRef] = useState("");
  const [grantRemarks, setGrantRemarks] = useState("");

  // Relative Validity Engine
  const [validityPreset, setValidityPreset] = useState<number>(90); // default 90 days / 3 months
  const [validityMode, setValidityMode] = useState<"preset" | "custom_days" | "exam_date">("preset");
  const [customDaysInput, setCustomDaysInput] = useState<number>(45);
  const [fixedExamDate, setFixedExamDate] = useState<string>("");

  const [isSubmittingGrant, setIsSubmittingGrant] = useState(false);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // ============================================================================
  // BULK PROVISIONING ENGINE STATE (Cohort Mode)
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

  // Autocomplete matching for existing students
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

  // Selected curriculum objects
  const cartSelectedCourses = useMemo(() => {
    return courses.filter((c) => selectedCourseIds.includes(c.id));
  }, [courses, selectedCourseIds]);

  const cartSelectedBooks = useMemo(() => {
    return books.filter((b) => selectedBookIds.includes(b.id));
  }, [books, selectedBookIds]);

  const totalCartItemsCount = cartSelectedCourses.length + cartSelectedBooks.length;

  // Financial calculations
  const cartSubtotalRupees = useMemo(() => {
    const coursePaise = cartSelectedCourses.reduce((sum, c) => sum + (c.pricePaise || 0), 0);
    const bookPaise = cartSelectedBooks.reduce((sum, b) => sum + (b.pricePaise || 0), 0);
    return Math.round((coursePaise + bookPaise) / 100);
  }, [cartSelectedCourses, cartSelectedBooks]);

  // Relative Validity Calculation
  const effectiveValidityDays = useMemo(() => {
    if (validityMode === "preset") return validityPreset;
    if (validityMode === "custom_days") return Math.max(1, customDaysInput);
    if (validityMode === "exam_date" && fixedExamDate) {
      const target = new Date(fixedExamDate).getTime();
      const diff = Math.ceil((target - Date.now()) / 86400000);
      return Math.max(1, diff);
    }
    return 90;
  }, [validityMode, validityPreset, customDaysInput, fixedExamDate]);

  // Live Relative Expiry Preview (Relative to enrollment timestamp)
  const relativeExpiryPreviewText = useMemo(() => {
    if (validityMode === "exam_date" && fixedExamDate) {
      return `${fixedExamDate} (Fixed Exam Date)`;
    }
    return calculateExpiryIST(new Date(), { days: effectiveValidityDays });
  }, [validityMode, fixedExamDate, effectiveValidityDays]);

  // Recipient Count Estimate
  const totalRecipientsCount = useMemo(() => {
    if (targetScopeType === "student") {
      if (studentSubMode === "search" || studentSubMode === "inline_create") {
        return Math.max(1, selectedStudents.length);
      }
      if (studentSubMode === "bulk_paste") {
        const nums = bulkPasteInput.split(/[\n,]+/).map((n) => n.trim().slice(-10)).filter((n) => n.length === 10);
        return Math.max(1, nums.length);
      }
      return 1;
    }
    if (targetScopeType === "district") return getMatchingStudentCount("district", targetDistrict);
    if (targetScopeType === "taluka") return getMatchingStudentCount("taluka", targetTaluka);
    if (targetScopeType === "school") return getMatchingStudentCount("school", targetSchoolName.trim());
    return students.length || 1;
  }, [targetScopeType, studentSubMode, selectedStudents, bulkPasteInput, targetDistrict, targetTaluka, targetSchoolName, students]);

  const netCollectedRupees = useMemo(() => {
    if (grantPricingMode === "scholarship") return 0;
    if (customCollectedRupees !== "") return Number(customCollectedRupees);
    return cartSubtotalRupees;
  }, [grantPricingMode, customCollectedRupees, cartSubtotalRupees]);

  const waiverScholarshipRupees = useMemo(() => {
    return Math.max(0, cartSubtotalRupees - netCollectedRupees);
  }, [cartSubtotalRupees, netCollectedRupees]);

  // Overall analytics metrics
  const revenueStats = useMemo(() => getWaivedRevenue(), [grants]);
  const collectionTally = useMemo(() => getStaffCollectionTally(grants), [grants]);

  // Filtered Grants List
  const filteredGrants = useMemo(() => {
    return grants.filter((g) => {
      if (debouncedSearchQuery) {
        const q = debouncedSearchQuery.toLowerCase();
        const sName = (g.student_name || g.studentName || "").toLowerCase();
        const sPhone = (g.student_phone || g.studentPhone || g.scope_value || g.scopeValue || "").toLowerCase();
        const cTitle = (g.courseTitle || g.bookTitle || "").toLowerCase();
        const reason = (g.reason || "").toLowerCase();
        if (!sName.includes(q) && !sPhone.includes(q) && !cTitle.includes(q) && !reason.includes(q)) {
          return false;
        }
      }
      if (filterDistrict !== "all") {
        const dist = (g.district || "").toLowerCase();
        if (dist !== filterDistrict.toLowerCase()) return false;
      }
      if (filterTaluka !== "all") {
        const tal = (g.taluka || "").toLowerCase();
        if (tal !== filterTaluka.toLowerCase()) return false;
      }
      if (courseFilter !== "all") {
        if (g.courseId !== courseFilter && g.itemId !== courseFilter) return false;
      }
      if (paymentModeFilter !== "all") {
        if (g.payment_mode !== paymentModeFilter) return false;
      }
      if (statusFilter !== "all") {
        if (g.status !== statusFilter) return false;
      }
      return true;
    });
  }, [grants, debouncedSearchQuery, filterDistrict, filterTaluka, courseFilter, paymentModeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredGrants.length / pageSize) || 1;
  const paginatedGrants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGrants.slice(start, start + pageSize);
  }, [filteredGrants, currentPage, pageSize]);

  // --------------------------------------------------------------------------
  // ACTIONS & HANDLERS
  // --------------------------------------------------------------------------
  const handleAddStudentToSelection = (st: StudentRecord) => {
    if (!selectedStudents.some((s) => s.phone === st.phone)) {
      setSelectedStudents((prev) => [...prev, st]);
    }
    setStudentSearchInput("");
  };

  const handleRemoveStudentFromSelection = (phone: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.phone !== phone));
  };

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

    const msg = `Dear ${studentName},\n\nYour admission to "${courseTitle}" at MindMaster Academy is confirmed! \n\n Enrollment Details:\n• Fee Status: ${amt} (${mode})\n• Valid Until: ${expiry}\n• Student Mobile: ${cleanPhone}\n\n Access your lectures and study materials:\nhttps://mindmaster.academy/login\n\nWishing you all the very best in your academic journey!\n— Prashant Dhumal Sir, MindMaster Academy`;

    setGrantWhatsappSent(grant.id);
    loadData();
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Issue Grant Submission
  const handleConfirmIssueGrant = async () => {
    setFormValidationError(null);

    const allItemIds = [...selectedCourseIds, ...selectedBookIds];
    if (allItemIds.length === 0) {
      setFormValidationError("Please select at least one Course or Digital Book in Step 2.");
      return;
    }

    // Role-based security validation
    if (!isMainAdmin && grantPricingMode === "scholarship") {
      setFormValidationError("Sub-Admins cannot issue ₹0 Free Scholarships directly. Only Main Admin (Prashant Sir) has grant authority.");
      return;
    }

    if (grantPricingMode === "offline_fee" && offlinePaymentType === "upi" && (!offlineUpiRef || !offlineUpiRef.trim())) {
      setFormValidationError("Mandatory UPI Reference (UTR) number is required for UPI admissions.");
      return;
    }

    setIsSubmittingGrant(true);

    try {
      // 1. SPECIFIC STUDENT TARGETING
      if (targetScopeType === "student") {
        let recipientList: { name: string; phone: string; school?: string; district?: string; taluka?: string }[] = [];

        if (studentSubMode === "search") {
          if (selectedStudents.length === 0) {
            setFormValidationError("Please search and select at least one student from the directory.");
            setIsSubmittingGrant(false);
            return;
          }
          recipientList = selectedStudents.map((s) => ({
            name: s.name,
            phone: s.phone,
            school: s.school,
            district: s.district,
            taluka: s.taluka,
          }));
        } else if (studentSubMode === "inline_create") {
          if (!newStudentName.trim()) {
            setFormValidationError("Please enter student's full name.");
            setIsSubmittingGrant(false);
            return;
          }
          const clean = normalizePhone(newStudentPhone);
          if (!clean || clean.length !== 10) {
            setFormValidationError("Please enter a valid 10-digit mobile number.");
            setIsSubmittingGrant(false);
            return;
          }

          const newRecord: StudentRecord = {
            id: `std-${Date.now()}`,
            name: newStudentName.trim(),
            phone: clean,
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

          recipientList = [{
            name: newStudentName.trim(),
            phone: clean,
            school: newStudentSchool.trim(),
            district: newStudentDistrict,
            taluka: newStudentTaluka,
          }];
        } else if (studentSubMode === "bulk_paste") {
          const rawPhones = bulkPasteInput.split(/[\n,]+/).map((n) => n.trim().slice(-10)).filter((n) => n.length === 10);
          if (rawPhones.length === 0) {
            setFormValidationError("Please enter at least one valid 10-digit mobile number.");
            setIsSubmittingGrant(false);
            return;
          }
          recipientList = rawPhones.map((ph, idx) => ({
            name: `Student ${ph.slice(-4)}`,
            phone: ph,
          }));
        }

        // Execute Multi-Course / Item Grant for each recipient
        let successCount = 0;
        for (const recipient of recipientList) {
          // Duplicate enrollment check
          if (duplicateEnrollmentPolicy === "skip") {
            const activeGrants = getStudentActiveGrants(recipient.phone);
            const alreadyHasAll = allItemIds.every((id) => activeGrants.some((ag) => ag.itemId === id));
            if (alreadyHasAll) continue;
          }

          const result = grantMultiCourseAdmission({
            studentPhone: recipient.phone,
            studentName: recipient.name,
            itemIds: allItemIds,
            validityDays: effectiveValidityDays,
            customExpiryDate: validityMode === "exam_date" ? fixedExamDate : undefined,
            paymentMode: grantPricingMode === "scholarship" ? "scholarship" : offlinePaymentType,
            upiRef: grantPricingMode === "offline_fee" && offlinePaymentType === "upi" ? offlineUpiRef.trim() : undefined,
            totalAmountPaid: netCollectedRupees,
            remarks: grantRemarks.trim() || `Grant issued by ${staff.name} [${grantPricingMode.toUpperCase()}]`,
          });

          if (result.success) successCount++;
        }

        toast.success(`Access successfully granted for ${successCount} student(s)!`);
        setActionFeedback(`Successfully provisioned curriculum access for ${successCount} student(s).`);
        setTimeout(() => setActionFeedback(null), 4000);

        // Reset and return to directory
        setSelectedStudents([]);
        setStudentSearchInput("");
        setNewStudentName("");
        setNewStudentPhone("");
        setBulkPasteInput("");
        setGrantRemarks("");
        setCustomCollectedRupees("");
        setOfflineUpiRef("");
        setViewMode("list");
        await loadData();
      } else {
        // 2. COHORT / GEOGRAPHY / ALL TARGETING
        let scopeVal = "all";
        if (targetScopeType === "district") scopeVal = targetDistrict;
        if (targetScopeType === "taluka") scopeVal = targetTaluka;
        if (targetScopeType === "school") scopeVal = targetSchoolName.trim();

        for (const courseId of selectedCourseIds) {
          createGrant({
            scopeType: targetScopeType === "all" ? "all" : targetScopeType,
            scopeValue: scopeVal,
            courseScope: "one",
            courseId,
            months: Math.max(1, Math.round(effectiveValidityDays / 30)),
            validityDays: effectiveValidityDays,
            reason: grantRemarks.trim() || `Cohort grant for ${targetScopeType}: ${scopeVal}`,
          });
        }

        toast.success(`Cohort grant successfully authorized for ${targetScopeType}!`);
        setActionFeedback(`Cohort grant activated for ${targetScopeType}: ${scopeVal}.`);
        setTimeout(() => setActionFeedback(null), 4000);
        setViewMode("list");
        await loadData();
      }
    } catch (err: any) {
      setFormValidationError(err.message || "Failed to execute admission grant.");
    } finally {
      setIsSubmittingGrant(false);
    }
  };

  // In-line action execution
  const handleExecuteActionModal = async () => {
    if (!actionModal.grant) return;
    setIsActionLoading(true);

    try {
      if (actionModal.type === "extend") {
        extendStudentAccess(actionModal.grant.id, actionExtendDays);
        toast.success(`Extended access by +${actionExtendDays} days!`);
      } else if (actionModal.type === "revoke") {
        if (!actionReason.trim()) {
          toast.error("Please enter a mandatory revocation reason.");
          setIsActionLoading(false);
          return;
        }
        revokeStudentAccess(actionModal.grant.id, actionReason.trim());
        toast.success("Curriculum access revoked.");
      } else if (actionModal.type === "reject") {
        rejectGrant(actionModal.grant.id, actionReason.trim() || undefined);
        toast.success("Grant request rejected.");
      }

      setActionModal({ type: null, grant: null });
      setActionReason("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete action.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AdminShell>
      <PermissionGuard permission="students.view">
        <div className="space-y-6 font-sans pb-12">

          {/* Action Feedback Toast Banner */}
          {actionFeedback && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{actionFeedback}</span>
              </div>
              <button onClick={() => setActionFeedback(null)} className="text-emerald-600 hover:text-emerald-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ==================================================================== */}
          {/* VIEW 1: FULL-WIDTH INLINE 2-COLUMN STUDIO WORKSPACE (NO DRAWERS) */}
          {/* ==================================================================== */}
          {viewMode === "create" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Bar with Breadcrumb */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mb-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Grants List</span>
                  </button>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 font-heading">
                    <Gift className="w-6 h-6 text-blue-600" />
                    <span>Grant Provisioning Studio</span>
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure curriculum access, select recipients with full location cascade, and reconcile fees inline.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Staff: {staff.name} ({isMainAdmin ? "Main Admin" : "Sub-Admin"})
                  </span>
                </div>
              </div>

              {/* 2-Column Full-Page Grid: Left 65% Steps | Right 35% Sticky Grant Cart */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* LEFT COLUMN (65%): Configuration Steps */}
                <div className="lg:col-span-8 space-y-6">

                  {/* STEP 1: Recipient & Target Scope Definition */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                          Step 1: Recipient &amp; Target Scope
                        </h2>
                      </div>
                      <span className="text-xs text-slate-400">Zero Hardcoded Districts</span>
                    </div>

                    {/* Scope Selector Pills with Vector SVG Icons */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: "student", label: "Specific Student(s)", icon: <UserCheck className="w-4 h-4" /> },
                        { id: "district", label: "District-Wide", icon: <MapPin className="w-4 h-4" /> },
                        { id: "taluka", label: "Taluka-Wide", icon: <Building2 className="w-4 h-4" /> },
                        { id: "school", label: "School Cohort", icon: <School className="w-4 h-4" /> },
                        { id: "all", label: "All Academy", icon: <Globe className="w-4 h-4" /> },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setTargetScopeType(s.id as any)}
                          className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            targetScopeType === s.id
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                          }`}
                        >
                          {s.icon}
                          <span className="text-center">{s.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* A. SPECIFIC STUDENTS MODE */}
                    {targetScopeType === "student" && (
                      <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {/* Sub-modes Toggle */}
                        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setStudentSubMode("search")}
                            className={`flex-1 py-1.5 px-3 rounded-lg transition ${
                              studentSubMode === "search"
                                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-extrabold"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            Search Directory ({selectedStudents.length} Selected)
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentSubMode("inline_create")}
                            className={`flex-1 py-1.5 px-3 rounded-lg transition ${
                              studentSubMode === "inline_create"
                                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-extrabold"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            Quick Student Registration
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentSubMode("bulk_paste")}
                            className={`flex-1 py-1.5 px-3 rounded-lg transition ${
                              studentSubMode === "bulk_paste"
                                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-extrabold"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            Multi-Phone CSV Paste
                          </button>
                        </div>

                        {/* Sub-Mode 1: Search Existing Students with Tag Badges */}
                        {studentSubMode === "search" && (
                          <div className="space-y-3">
                            <div className="relative">
                              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                              <input
                                type="text"
                                value={studentSearchInput}
                                onChange={(e) => setStudentSearchInput(e.target.value)}
                                placeholder="Search student by Name, Mobile Number (10 digits), School, or Taluka..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-600 transition"
                              />
                            </div>

                            {/* Dropdown Suggestions */}
                            {matchingStudentResults.length > 0 && (
                              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-md max-h-56 overflow-y-auto">
                                {matchingStudentResults.map((st) => (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => handleAddStudentToSelection(st)}
                                    className="w-full text-left p-2.5 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 flex items-center justify-between transition cursor-pointer text-xs"
                                  >
                                    <div>
                                      <span className="font-bold text-slate-900 dark:text-white">{st.name}</span>
                                      <span className="text-[11px] text-slate-500 font-mono ml-2">({st.phone})</span>
                                      <p className="text-[10px] text-slate-400 mt-0.5">
                                        {st.school || "School Not Set"} • {st.district || "Maharashtra"}
                                      </p>
                                    </div>
                                    <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add to Cart</span>
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Selected Students Chip Pills */}
                            {selectedStudents.length > 0 ? (
                              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                                  <span>Selected Recipients ({selectedStudents.length}):</span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedStudents([])}
                                    className="text-[10px] text-red-600 hover:underline cursor-pointer"
                                  >
                                    Clear All
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                                  {selectedStudents.map((s) => (
                                    <span
                                      key={s.phone}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-2xs"
                                    >
                                      <span>{s.name}</span>
                                      <span className="font-mono text-[10px] text-slate-500">({s.phone})</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveStudentFromSelection(s.phone)}
                                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No students selected yet. Search above or click Quick Registration.</p>
                            )}
                          </div>
                        )}

                        {/* Sub-Mode 2: Inline Quick Student Registration */}
                        {studentSubMode === "inline_create" && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                              Register &amp; Add Student Profile
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Student Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={newStudentName}
                                  onChange={(e) => setNewStudentName(e.target.value)}
                                  placeholder="e.g. Ramesh Vijay Patil"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Mobile Number (10 Digits) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="tel"
                                  maxLength={10}
                                  value={newStudentPhone}
                                  onChange={(e) => setNewStudentPhone(e.target.value.replace(/\D/g, ""))}
                                  placeholder="9876543210"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600 tabular-nums"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  School / College Name
                                </label>
                                <input
                                  type="text"
                                  value={newStudentSchool}
                                  onChange={(e) => setNewStudentSchool(e.target.value)}
                                  placeholder="e.g. Shivaji High School, Satara"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Standard / Class
                                </label>
                                <input
                                  type="text"
                                  value={newStudentStandard}
                                  onChange={(e) => setNewStudentStandard(e.target.value)}
                                  placeholder="e.g. 10th Standard"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                                />
                              </div>
                            </div>

                            {/* Cascading Location Selectors */}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
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

                        {/* Sub-Mode 3: Bulk Multi-Phone / CSV Paste */}
                        {studentSubMode === "bulk_paste" && (
                          <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                              Paste 10-Digit Mobile Numbers (one per line or comma-separated):
                            </label>
                            <textarea
                              rows={4}
                              value={bulkPasteInput}
                              onChange={(e) => setBulkPasteInput(e.target.value)}
                              placeholder="9823000001&#10;9823000002&#10;9823000003"
                              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                            />
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-500 tabular-nums">
                                Validated Numbers: {bulkPasteInput.split(/[\n,]+/).map((n) => n.trim().slice(-10)).filter((n) => n.length === 10).length}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">Duplicate Active Grant Policy:</span>
                                <select
                                  value={duplicateEnrollmentPolicy}
                                  onChange={(e) => setDuplicateEnrollmentPolicy(e.target.value as any)}
                                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                                >
                                  <option value="skip">Skip If Already Active</option>
                                  <option value="extend">Extend Access Validity</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* B. GEOGRAPHY (District / Taluka) & SCHOOL MODE */}
                    {(targetScopeType === "district" || targetScopeType === "taluka" || targetScopeType === "school") && (
                      <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Target Location Cascade (State &rarr; District &rarr; Taluka):
                        </label>
                        <LocationCascadeSelect
                          selectedState={targetState}
                          selectedDistrict={targetDistrict}
                          selectedTaluka={targetTaluka}
                          onStateChange={(id, name) => setTargetState(id)}
                          onDistrictChange={(id, name) => setTargetDistrict(name)}
                          onTalukaChange={(id, name) => setTargetTaluka(name)}
                          layout="grid"
                        />

                        {targetScopeType === "school" && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                              School / College Name (Exact or Partial Match):
                            </label>
                            <input
                              type="text"
                              value={targetSchoolName}
                              onChange={(e) => setTargetSchoolName(e.target.value)}
                              placeholder="e.g. Shivaji High School, Satara"
                              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none"
                            />
                          </div>
                        )}

                        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
                          <span>Matching active students in this cohort:</span>
                          <span className="font-extrabold tabular-nums">{totalRecipientsCount} Students</span>
                        </div>
                      </div>
                    )}

                    {/* C. ALL ACADEMY STUDENTS MODE */}
                    {targetScopeType === "all" && (
                      <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl text-xs text-purple-800 dark:text-purple-300 space-y-1">
                        <div className="flex items-center gap-2 font-bold">
                          <Globe className="w-4 h-4 text-purple-600" />
                          <span>Academy-Wide Blanket Grant</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          This will provision curriculum access to all {students.length} currently active registered students across all districts.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: Choose Curriculum (Multi-Item Selection) */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                          Step 2: Choose Curriculum Items ({totalCartItemsCount} Selected)
                        </h2>
                      </div>

                      {/* Tab Filters */}
                      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setCurriculumTab("all")}
                          className={`px-3 py-1 rounded-lg transition ${
                            curriculumTab === "all" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-extrabold" : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          All ({courses.length + books.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurriculumTab("courses")}
                          className={`px-3 py-1 rounded-lg transition ${
                            curriculumTab === "courses" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-extrabold" : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Courses ({courses.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurriculumTab("books")}
                          className={`px-3 py-1 rounded-lg transition ${
                            curriculumTab === "books" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-extrabold" : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Digital Books ({books.length})
                        </button>
                      </div>
                    </div>

                    {/* Search & Bulk Select Controls */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={curriculumSearch}
                          onChange={(e) => setCurriculumSearch(e.target.value)}
                          placeholder="Filter courses and digital books by title..."
                          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseIds(courses.map((c) => c.id));
                            setSelectedBookIds(books.map((b) => b.id));
                          }}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseIds([]);
                            setSelectedBookIds([]);
                          }}
                          className="text-slate-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Multi-Item Checklist Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                      {/* Courses */}
                      {(curriculumTab === "all" || curriculumTab === "courses") &&
                        courses
                          .filter((c) => !curriculumSearch.trim() || c.title.toLowerCase().includes(curriculumSearch.toLowerCase()))
                          .map((course) => {
                            const isSelected = selectedCourseIds.includes(course.id);
                            return (
                              <div
                                key={course.id}
                                onClick={() => {
                                  if (isSelected) setSelectedCourseIds(selectedCourseIds.filter((id) => id !== course.id));
                                  else setSelectedCourseIds([...selectedCourseIds, course.id]);
                                }}
                                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer select-none ${
                                  isSelected
                                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-2xs"
                                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
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
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                                        Course
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {course.lessonsCount || 0} lectures
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                                  ₹{Math.round((course.pricePaise || 0) / 100)}
                                </span>
                              </div>
                            );
                          })}

                      {/* Digital Books */}
                      {(curriculumTab === "all" || curriculumTab === "books") &&
                        books
                          .filter((b) => !curriculumSearch.trim() || b.title.toLowerCase().includes(curriculumSearch.toLowerCase()))
                          .map((book) => {
                            const isSelected = selectedBookIds.includes(book.id);
                            return (
                              <div
                                key={book.id}
                                onClick={() => {
                                  if (isSelected) setSelectedBookIds(selectedBookIds.filter((id) => id !== book.id));
                                  else setSelectedBookIds([...selectedBookIds, book.id]);
                                }}
                                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer select-none ${
                                  isSelected
                                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-2xs"
                                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                                    isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600"
                                  }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                      {book.title}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold">
                                        Digital PDF
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                                  ₹{Math.round((book.pricePaise || 0) / 100)}
                                </span>
                              </div>
                            );
                          })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (35%): Sticky Live Grant Cart Panel */}
                <div className="lg:col-span-4 sticky top-20 space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-blue-600" />
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white font-heading">
                          Grant Cart Summary
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 tabular-nums">
                        {totalCartItemsCount} Item(s)
                      </span>
                    </div>

                    {/* Selected Curriculum Items List with 1-Click Remove */}
                    <div className="space-y-2 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {cartSelectedCourses.map((c) => (
                        <div key={c.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{c.title}</p>
                            <span className="text-[10px] text-blue-600">Course</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                              ₹{Math.round((c.pricePaise || 0) / 100)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedCourseIds(selectedCourseIds.filter((id) => id !== c.id))}
                              className="text-slate-400 hover:text-red-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {cartSelectedBooks.map((b) => (
                        <div key={b.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{b.title}</p>
                            <span className="text-[10px] text-purple-600">Digital Book</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                              ₹{Math.round((b.pricePaise || 0) / 100)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedBookIds(selectedBookIds.filter((id) => id !== b.id))}
                              className="text-slate-400 hover:text-red-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {totalCartItemsCount === 0 && (
                        <p className="text-xs text-slate-400 py-3 text-center italic">
                          No curriculum items selected yet. Choose items in Step 2.
                        </p>
                      )}
                    </div>

                    {/* Grant Pricing & Fee Reconciliation Mode */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                        <span>Grant Pricing &amp; Fee Mode</span>
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGrantPricingMode("scholarship")}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition text-center cursor-pointer ${
                            grantPricingMode === "scholarship"
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          100% Free
                        </button>
                        <button
                          type="button"
                          onClick={() => setGrantPricingMode("discounted")}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition text-center cursor-pointer ${
                            grantPricingMode === "discounted"
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          Discounted
                        </button>
                        <button
                          type="button"
                          onClick={() => setGrantPricingMode("offline_fee")}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition text-center cursor-pointer ${
                            grantPricingMode === "offline_fee"
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          Offline Fee
                        </button>
                      </div>

                      {/* Offline Cash / UPI Options */}
                      {grantPricingMode === "offline_fee" && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 mt-2">
                          <div className="flex gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setOfflinePaymentType("cash")}
                              className={`flex-1 py-1 rounded-lg font-bold border text-center transition ${
                                offlinePaymentType === "cash"
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              Cash In Hand
                            </button>
                            <button
                              type="button"
                              onClick={() => setOfflinePaymentType("upi")}
                              className={`flex-1 py-1 rounded-lg font-bold border text-center transition ${
                                offlinePaymentType === "upi"
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              Direct UPI / QR
                            </button>
                          </div>
                          {offlinePaymentType === "upi" && (
                            <input
                              type="text"
                              value={offlineUpiRef}
                              onChange={(e) => setOfflineUpiRef(e.target.value)}
                              placeholder="Enter 12-digit UPI Reference (UTR)..."
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none"
                            />
                          )}
                        </div>
                      )}

                      {/* Custom Amount for Discounted Mode */}
                      {grantPricingMode === "discounted" && (
                        <div className="pt-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            Net Amount Collected (₹):
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={customCollectedRupees}
                            onChange={(e) => setCustomCollectedRupees(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="e.g. 500"
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Relative Validity Duration Selector */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Per-Student Relative Validity</span>
                        </label>
                        <span className="text-[11px] font-bold text-blue-600 tabular-nums">
                          {effectiveValidityDays} Days
                        </span>
                      </div>

                      {/* Presets Grid */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: "7 Days Demo", days: 7 },
                          { label: "15 Days", days: 15 },
                          { label: "1 Month", days: 30 },
                          { label: "3 Months", days: 90 },
                          { label: "6 Months", days: 180 },
                          { label: "12M (1 Year)", days: 365 },
                          { label: "24M (2 Years)", days: 730 },
                          { label: "Lifetime", days: 3650 },
                          { label: "Custom Days", days: -1 },
                          { label: "Exam Date", days: -2 },
                        ].map((btn) => {
                          const isActive =
                            (btn.days > 0 && validityMode === "preset" && validityPreset === btn.days) ||
                            (btn.days === -1 && validityMode === "custom_days") ||
                            (btn.days === -2 && validityMode === "exam_date");

                          return (
                            <button
                              key={btn.label}
                              type="button"
                              onClick={() => {
                                if (btn.days > 0) {
                                  setValidityMode("preset");
                                  setValidityPreset(btn.days);
                                } else if (btn.days === -1) {
                                  setValidityMode("custom_days");
                                } else {
                                  setValidityMode("exam_date");
                                }
                              }}
                              className={`py-1.5 px-1.5 rounded-xl text-[10px] font-bold border transition text-center cursor-pointer ${
                                isActive
                                  ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
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
                            value={customDaysInput}
                            onChange={(e) => setCustomDaysInput(Math.max(1, Number(e.target.value)))}
                            placeholder="Enter days (e.g. 45)"
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                          />
                          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Days from Grant</span>
                        </div>
                      )}

                      {validityMode === "exam_date" && (
                        <div className="pt-1">
                          <input
                            type="date"
                            value={fixedExamDate}
                            onChange={(e) => setFixedExamDate(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                      )}

                      {/* Live Relative Expiry Preview */}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Expiry Preview:</span>
                        <p className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                          {relativeExpiryPreviewText}
                        </p>
                        <p className="text-[9px] text-slate-400 leading-tight">
                          *Timer starts strictly from each student&apos;s individual grant timestamp.
                        </p>
                      </div>
                    </div>

                    {/* Official Administrative Remark */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Admin Remark &amp; Approval Justification:
                      </label>
                      <input
                        type="text"
                        value={grantRemarks}
                        onChange={(e) => setGrantRemarks(e.target.value)}
                        placeholder="e.g. Merit scholarship / Offline Satara Center admission"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    {/* Financial Summary & Receipt Box */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl space-y-2 border border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>Original Value:</span>
                        <span className="font-bold tabular-nums">₹{cartSubtotalRupees.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
                        <span>Grant Waiver / Subsidy:</span>
                        <span className="tabular-nums">- ₹{waiverScholarshipRupees.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200 dark:border-slate-700">
                        <span className="font-extrabold text-slate-900 dark:text-white">Net Amount Collected:</span>
                        <span className="font-black text-sm text-blue-600 dark:text-blue-400 tabular-nums">
                          ₹{netCollectedRupees.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Total Recipients:</span>
                        <span className="font-bold tabular-nums">{totalRecipientsCount} Student(s)</span>
                      </div>
                    </div>

                    {/* Validation Error Message */}
                    {formValidationError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formValidationError}</span>
                      </div>
                    )}

                    {/* Primary Issue Grant Button */}
                    <button
                      type="button"
                      disabled={isSubmittingGrant || totalCartItemsCount === 0}
                      onClick={handleConfirmIssueGrant}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-extrabold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmittingGrant ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Authorizing Grant...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm &amp; Issue Grant</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* VIEW 2: BULK PROVISIONING ENGINE (COHORT WORKSPACE) */}
          {/* ==================================================================== */}
          {viewMode === "bulk" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mb-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Grants List</span>
                  </button>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 font-heading">
                    <Layers className="w-6 h-6 text-blue-600" />
                    <span>Bulk Curriculum Provisioning Engine</span>
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mass-provision access across entire districts, talukas, or schools with pre-flight dry run checks.
                  </p>
                </div>
              </div>

              {/* 2-Column Bulk Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span>Target Cohort Definition</span>
                  </h2>

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
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {(bulkScopeType === "district" || bulkScopeType === "taluka") && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Target Geography ({bulkScopeType === "district" ? "District" : "District &amp; Taluka"}):
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
                        School / College Name (Exact or Partial Match):
                      </label>
                      <input
                        type="text"
                        value={bulkSchoolName}
                        onChange={(e) => setBulkSchoolName(e.target.value)}
                        placeholder="e.g. Shivaji High School, Satara"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  )}

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
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none mt-2"
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} (₹{Math.round((c.pricePaise || 0) / 100)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

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
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white tabular-nums outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Approval Note &amp; Administrative Justification <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={bulkReason}
                      onChange={(e) => setBulkReason(e.target.value)}
                      placeholder="e.g. CSR Free Education Drive sanctioned by Prashant Sir"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                {/* Right Column: Pre-Flight Verification */}
                <div className="lg:col-span-4 sticky top-20 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white font-heading border-b border-slate-100 dark:border-slate-800 pb-3">
                    Bulk Pre-Flight Summary
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Cohort:</span>
                      <span className="font-bold text-slate-900 dark:text-white capitalize">{bulkScopeType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Matching Students:</span>
                      <span className="font-bold text-blue-600 tabular-nums">{totalRecipientsCount} Students</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Validity Window:</span>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">{bulkValidityDays} Days</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isExecutingBulk || !bulkReason.trim()}
                    onClick={async () => {
                      setIsExecutingBulk(true);
                      try {
                        createGrant({
                          scopeType: bulkScopeType,
                          scopeValue: bulkScopeType === "district" ? bulkDistrict : bulkScopeType === "taluka" ? bulkTaluka : bulkScopeType === "school" ? bulkSchoolName : "all",
                          courseScope: bulkCourseScope,
                          courseId: bulkCourseScope === "one" ? bulkSelectedCourseId : undefined,
                          months: Math.max(1, Math.round(bulkValidityDays / 30)),
                          validityDays: bulkValidityDays,
                          reason: bulkReason.trim(),
                        });
                        toast.success("Bulk grant provisioned successfully!");
                        setViewMode("list");
                        await loadData();
                      } catch (err: any) {
                        toast.error(err.message || "Failed to execute bulk grant.");
                      } finally {
                        setIsExecutingBulk(false);
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    {isExecutingBulk ? "Executing Bulk Grant..." : "Authorize Bulk Provisioning"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* VIEW 3: GRANTS DIRECTORY & ANALYTICS (MAIN WORKSPACE) */}
          {/* ==================================================================== */}
          {viewMode === "list" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 font-heading">
                    <Gift className="w-7 h-7 text-blue-600" />
                    <span>Course Grants &amp; Provisioning Studio</span>
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage direct student admissions, scholarships, offline fee settlements, and cohort provisioning.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("bulk")}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer active:scale-95"
                  >
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Bulk Cohort</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("create");
                      setTargetScopeType("student");
                      setStudentSubMode("search");
                      setSelectedStudents([]);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Issue New Grant</span>
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span>Active Grants</span>
                    <Gift className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {grants.filter((g) => g.status === "active").length}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">100% Verified Access</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span>Students Impacted</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {revenueStats.totalUniqueStudents}
                  </div>
                  <span className="text-[10px] text-slate-400">Across All Batches</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span>Waived Scholarship</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums">
                    ₹{revenueStats.totalWaivedRupees.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-400">Academic Subsidies</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span>Pending Approvals</span>
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-600 tabular-nums">
                    {pendingApprovals.length}
                  </div>
                  <span className="text-[10px] text-amber-600 font-bold">Maker-Checker Queue</span>
                </div>
              </div>

              {/* Filter Bar with Standardized Cascading Location */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search grants by Student Name, Phone (10 digits), Course Title, or Reason..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={paymentModeFilter}
                      onChange={(e) => setPaymentModeFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                    >
                      <option value="all">All Payment Types</option>
                      <option value="scholarship">Free Scholarship</option>
                      <option value="cash">Offline Cash</option>
                      <option value="upi">Direct UPI</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Access</option>
                      <option value="expired">Expired</option>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="revoked">Revoked</option>
                    </select>
                  </div>
                </div>

                {/* Location Filter Cascade */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <LocationCascadeSelect
                    selectedState={filterState}
                    selectedDistrict={filterDistrict}
                    selectedTaluka={filterTaluka}
                    onStateChange={(id, name) => setFilterState(id)}
                    onDistrictChange={(id, name) => setFilterDistrict(name)}
                    onTalukaChange={(id, name) => setFilterTaluka(name)}
                    includeAllOption={true}
                    layout="inline"
                  />
                </div>
              </div>

              {/* Grants Data Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-bold">
                        <th className="py-3 px-4">Student &amp; Phone</th>
                        <th className="py-3 px-4">Curriculum</th>
                        <th className="py-3 px-4">Target Scope</th>
                        <th className="py-3 px-4">Fee Reconciliation</th>
                        <th className="py-3 px-4">Access Validity</th>
                        <th className="py-3 px-4">Granted By</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedGrants.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No grant records matching your search and filter criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedGrants.map((grant) => {
                          const phone = grant.student_phone || grant.studentPhone || grant.scope_value || grant.scopeValue || "-";
                          const name = grant.student_name || grant.studentName || `Student ${phone.slice(-4)}`;
                          const isExpired = grant.ends_at ? isExpiredIST(grant.ends_at) : false;

                          return (
                            <tr key={grant.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-900 dark:text-white">{name}</p>
                                <p className="text-[11px] text-slate-500 font-mono tabular-nums">{phone}</p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-800 dark:text-slate-200">
                                  {grant.courseTitle || grant.bookTitle || "Academy Curriculum"}
                                </p>
                                <span className="text-[10px] text-slate-400 capitalize">
                                  {grant.item_type || "Course"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                                  {grant.scope_type || grant.scopeType || "Individual"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 font-bold ${
                                  grant.payment_mode === "cash"
                                    ? "text-emerald-600"
                                    : grant.payment_mode === "upi"
                                    ? "text-blue-600"
                                    : "text-purple-600"
                                }`}>
                                  ₹{grant.amount_paid !== undefined ? grant.amount_paid : 0} ({grant.payment_mode || "Scholarship"})
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <p className={`font-bold tabular-nums ${isExpired ? "text-red-500" : "text-slate-900 dark:text-white"}`}>
                                  {grant.ends_at ? formatIST(grant.ends_at, { dateOnly: true }) : "Permanent"}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  {isExpired ? "Expired" : "Active"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500">
                                <p className="font-medium text-slate-700 dark:text-slate-300">{grant.granted_by || "Admin"}</p>
                                <span className="text-[10px]">{formatIST(grant.created_at, { dateOnly: true })}</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSendWhatsApp(grant)}
                                    title="Send WhatsApp Receipt"
                                    className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActionModal({ type: "extend", grant })}
                                    title="Extend Access Validity"
                                    className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>
                                  {isMainAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => setActionModal({ type: "revoke", grant })}
                                      title="Revoke Access"
                                      className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 border border-red-200 dark:border-red-800 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Bar */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 tabular-nums">
                      Page {currentPage} of {totalPages} ({filteredGrants.length} total records)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-bold"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-bold"
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
          {/* INLINE ACTION CONFIRMATION CARD (NO HEAVY BLURRED DRAWERS) */}
          {/* ==================================================================== */}
          {actionModal.type && actionModal.grant && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    {actionModal.type === "extend" && <Clock className="w-5 h-5 text-blue-600" />}
                    {actionModal.type === "revoke" && <AlertCircle className="w-5 h-5 text-red-600" />}
                    {actionModal.type === "reject" && <X className="w-5 h-5 text-red-600" />}
                    <span>
                      {actionModal.type === "extend" && "Extend Access Validity"}
                      {actionModal.type === "revoke" && "Revoke Student Access"}
                      {actionModal.type === "reject" && "Reject Grant Request"}
                    </span>
                  </h3>
                  <button onClick={() => setActionModal({ type: null, grant: null })} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Target Student: <strong className="text-slate-900 dark:text-white">{actionModal.grant.student_name || actionModal.grant.scope_value}</strong>
                  <br />Curriculum: <strong className="text-blue-600">{actionModal.grant.courseTitle || actionModal.grant.bookTitle || "Curriculum"}</strong>
                </p>

                {actionModal.type === "extend" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Days to add to access validity:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[15, 30, 60, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setActionExtendDays(d)}
                          className={`py-1.5 text-xs font-bold rounded-xl border transition ${
                            actionExtendDays === d
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          +{d} Days
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(actionModal.type === "revoke" || actionModal.type === "reject") && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mandatory Reason / Note <span className="text-red-500">*</span>:
                    </label>
                    <textarea
                      rows={2}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="e.g. Admission cancelled / Course swapped / Refund requested"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: null, grant: null })}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleExecuteActionModal}
                    className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition ${
                      actionModal.type === "extend" ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {isActionLoading ? "Processing..." : "Confirm Action"}
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
