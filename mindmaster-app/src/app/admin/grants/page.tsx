"use client";

import React, { useState, useEffect, useMemo } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { Course, StaffUser, StudentRecord, Book } from "@/lib/types";
import { getCurrentStaff, getStaffCourses, getStaffBooks, getStaffStudents } from "@/lib/staffStore";
import BulkGrantCustomizerModal from "@/components/admin/BulkGrantCustomizerModal";
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
  SubAdminCashSummary,
} from "@/lib/grantStore";
import { formatIST, calculateExpiryIST, isExpiredIST } from "@/lib/istTime";

const POPULAR_DISTRICTS = ["Pune", "Satara", "Kolhapur", "Solapur", "Sangli", "Ahmednagar", "Nashik", "Thane", "Mumbai"];

export default function GrantsManagerPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [grants, setGrants] = useState<Grant[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Grant[]>([]);
  const [cashSettlements, setCashSettlements] = useState<SubAdminCashSummary[]>([]);
  const [rejectModalGrant, setRejectModalGrant] = useState<Grant | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Edit Pending Grant Modal State
  const [editPendingGrant, setEditPendingGrant] = useState<Grant | null>(null);
  const [editCourseId, setEditCourseId] = useState("");
  const [editValidityMonths, setEditValidityMonths] = useState(6);
  const [editCustomDate, setEditCustomDate] = useState("");
  const [editAmountPaid, setEditAmountPaid] = useState(0);
  const [editRemarks, setEditRemarks] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending_approval" | "revoked" | "rejected">("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, scopeFilter, statusFilter, pageSize]);

  // Cash vs UPI Collection Tally Filter: Today, Last 7 Days, This Month, All Time
  const [tallyTimeframe, setTallyTimeframe] = useState<"today" | "week" | "month" | "all">("today");

  // Drawer Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulkCustomizerOpen, setIsBulkCustomizerOpen] = useState(false);
  const [grantItemType, setGrantItemType] = useState<"course" | "book">("course");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [scopeType, setScopeType] = useState<GrantScopeType>("district");
  const [scopeValue, setScopeValue] = useState("Pune");
  const [courseScope, setCourseScope] = useState<"one" | "all">("one");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [months, setMonths] = useState(3);
  const [grantValidityMode, setGrantValidityMode] = useState<"preset" | "custom_days" | "fixed_date">("preset");
  const [grantPresetDays, setGrantPresetDays] = useState<number>(90);
  const [grantCustomDays, setGrantCustomDays] = useState<number>(45);
  const [grantFixedDate, setGrantFixedDate] = useState<string>("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Revoke Confirmation Modal
  const [revokeTarget, setRevokeTarget] = useState<Grant | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const loadData = async () => {
    setStaff(getCurrentStaff());
    setGrants(getGrants());
    setPendingApprovals(getPendingGrantApprovals());
    setCashSettlements(getSubAdminCashSettlements());
    const cList = getStaffCourses();
    setCourses(cList);
    if (cList.length > 0 && !selectedCourseId) {
      setSelectedCourseId(cList[0].id);
    }
    const bList = getStaffBooks();
    setBooks(bList);
    if (bList.length > 0 && !selectedBookId) {
      setSelectedBookId(bList[0].id);
    }
    setStudents(getStaffStudents());

    try {
      const liveGrants = await fetchDbGrants();
      if (liveGrants && liveGrants.length > 0) {
        setGrants(liveGrants);
        setPendingApprovals(liveGrants.filter((g) => g.status === "pending_approval"));
      }
    } catch {}
  };

  const handleApprove = (grantId: string) => {
    try {
      approveGrant(grantId);
      setActionFeedback("Grant approved & student access activated!");
      setTimeout(() => setActionFeedback(null), 3500);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to approve grant.");
    }
  };

  const handleOpenRejectModal = (grant: Grant) => {
    setRejectModalGrant(grant);
    setRejectReason("");
  };

  const handleConfirmReject = () => {
    if (!rejectModalGrant) return;
    try {
      rejectGrant(rejectModalGrant.id, rejectReason.trim() || undefined);
      setRejectModalGrant(null);
      setActionFeedback("Grant rejected successfully.");
      setTimeout(() => setActionFeedback(null), 3500);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to reject grant.");
    }
  };

  const handleSavePendingGrantEdit = async () => {
    if (!editPendingGrant) return;
    setIsSavingEdit(true);
    try {
      const res = await updatePendingGrant({
        grantId: editPendingGrant.id,
        courseId: editCourseId,
        accessMonths: editCustomDate ? undefined : editValidityMonths,
        customExpiryDate: editCustomDate || undefined,
        amountPaid: editAmountPaid,
        remarks: editRemarks,
      });

      if (!res.success) {
        alert(res.error || "Failed to update pending grant.");
        setIsSavingEdit(false);
        return;
      }

      setEditPendingGrant(null);
      setActionFeedback("Pending grant details customized successfully!");
      setTimeout(() => setActionFeedback(null), 3500);
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to customize pending grant.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSettleSubAdmin = (staffId: string) => {
    if (!confirm(`Confirm cash handover settlement for Sub-Admin ${staffId}? This marks all collected cash as received at HQ.`)) return;
    try {
      const amount = settleSubAdminCash(staffId);
      setActionFeedback(`Settled ₹${amount.toLocaleString("en-IN")} cash handover successfully!`);
      setTimeout(() => setActionFeedback(null), 3500);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to settle cash.");
    }
  };

  const handleSettleSingle = (grantId: string) => {
    try {
      settleSingleGrant(grantId);
      setActionFeedback("Cash marked settled for this grant.");
      setTimeout(() => setActionFeedback(null), 3500);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to settle grant.");
    }
  };

  // Sub-admin view filter: "own" or "all"
  const [viewScope, setViewScope] = useState<"own" | "all">("all");

  // Server Count Query State
  const [serverCount, setServerCount] = useState<number | null>(null);
  const [serverWaivedRupees, setServerWaivedRupees] = useState<number>(0);
  const [isCounting, setIsCounting] = useState(false);

  useEffect(() => {
    loadData();
    const handleGrantsChange = () => setGrants(getGrants());
    window.addEventListener("mma_grants_changed", handleGrantsChange);
    return () => window.removeEventListener("mma_grants_changed", handleGrantsChange);
  }, []);

  const isMainAdmin = staff.role === "main_admin";

  // Server count query with debounce
  useEffect(() => {
    if (!isDrawerOpen) return;
    const timer = setTimeout(async () => {
      setIsCounting(true);
      try {
        const res = await fetch("/api/grants/count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scopeType,
            scopeValue,
            courseScope,
            courseId: selectedCourseId,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setServerCount(data.matchingCount);
          setServerWaivedRupees(data.waivedRevenueRupees);
        }
      } catch (err) {
        console.warn("Server count query failed, using local count:", err);
      } finally {
        setIsCounting(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isDrawerOpen, scopeType, scopeValue, courseScope, selectedCourseId]);

  // Local fallback matching count
  const liveMatchingCount = useMemo(() => {
    if (!isDrawerOpen) return 0;
    if (serverCount !== null) return serverCount;
    return getMatchingStudentCount(scopeType, scopeValue);
  }, [isDrawerOpen, scopeType, scopeValue, serverCount]);

  // Estimated waived value
  const estimatedWaivedRupees = useMemo(() => {
    if (serverWaivedRupees > 0) return serverWaivedRupees;
    if (liveMatchingCount === 0) return 0;
    if (grantItemType === "book") {
      const single = books.find((b) => b.id === selectedBookId);
      const pricePaise = single?.pricePaise || 0;
      return Math.round((pricePaise * liveMatchingCount) / 100);
    }
    if (courseScope === "all") {
      const sumPaise = courses.reduce((acc, c) => acc + (c.pricePaise || 0), 0);
      return Math.round((sumPaise * liveMatchingCount) / 100);
    } else {
      const single = courses.find((c) => c.id === selectedCourseId);
      const pricePaise = single?.pricePaise || 0;
      return Math.round((pricePaise * liveMatchingCount) / 100);
    }
  }, [liveMatchingCount, grantItemType, selectedBookId, books, courseScope, selectedCourseId, courses, serverWaivedRupees]);

  // Waived revenue metrics
  const revenueStats = useMemo(() => getWaivedRevenue(), [grants]);

  // Cash vs UPI Collection Tally for Main Admin
  const tallyReport = useMemo(() => getStaffCollectionTally(grants), [grants]);

  // 1-Click WhatsApp Receipt and Access Link trigger
  const handleSendGrantWhatsApp = (grant: Grant) => {
    const rawPhone = grant.student_phone || grant.studentPhone || grant.scope_value || grant.scopeValue || "";
    const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert("Invalid student phone number on grant.");
      return;
    }

    const studentName = grant.student_name || grant.studentName || `Student ${cleanPhone.slice(-4)}`;
    const courseTitle = grant.courseTitle || "MindMaster Course";
    const paymentMode =
      grant.payment_mode === "cash"
        ? "Cash"
        : grant.payment_mode === "upi"
        ? "Direct UPI (PhonePe/GPay)"
        : "Free Grant / Scholarship";
    const amt = grant.amount_paid !== undefined ? `₹${grant.amount_paid}` : "Free Admission";

    const msg = `Hello ${studentName}!\n\nYour admission to "${courseTitle}" at MindMaster Academy is confirmed. ✅\n\n💵 Fee: ${amt} (${paymentMode})\n📱 Login Mobile: ${cleanPhone}\n\n📲 Start learning in the app:\nhttps://mindmaster.academy/login\n\nAll the best for your studies! 🌟\n— Prashant Dhumal Sir, MindMaster Academy`;

    setGrantWhatsappSent(grant.id);
    loadData();

    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Open Drawer for creating new grant
  const handleOpenDrawer = () => {
    setScopeType("district");
    setScopeValue("Pune");
    setGrantItemType("course");
    setCourseScope("one");
    if (courses.length > 0) setSelectedCourseId(courses[0].id);
    if (books.length > 0) setSelectedBookId(books[0].id);
    setMonths(3);
    setReason("");
    setFormError(null);
    setServerCount(null);
    setIsDrawerOpen(true);
  };

  // Submit Grant
  const handleCreateGrant = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!scopeValue.trim()) {
      setFormError("Please provide a target scope value.");
      return;
    }
    if (!reason.trim()) {
      setFormError("Please enter an approval reason or note.");
      return;
    }

    try {
      createGrant({
        scopeType,
        scopeValue,
        itemType: grantItemType,
        bookId: grantItemType === "book" ? selectedBookId : undefined,
        courseScope: grantItemType === "course" ? courseScope : "one",
        courseId: grantItemType === "course" && courseScope === "one" ? selectedCourseId : undefined,
        months: grantValidityMode === "preset" ? Math.max(1, Math.round(grantPresetDays / 30)) : months,
        validityDays: grantValidityMode === "custom_days" ? grantCustomDays : grantValidityMode === "preset" ? grantPresetDays : undefined,
        customExpiryDate: grantValidityMode === "fixed_date" ? grantFixedDate : undefined,
        reason,
      });

      setIsDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to create grant.");
    }
  };

  // Handle Revoke
  const handleConfirmRevoke = () => {
    if (!revokeTarget) return;
    setRevokeError(null);
    try {
      revokeGrant(revokeTarget.id);
      setRevokeTarget(null);
      loadData();
    } catch (err: any) {
      setRevokeError(err.message || "Failed to revoke grant.");
    }
  };

  // Filtered grants list (Sub-admins see OWN grants by default or toggle; Main Admin sees all)
  const filteredGrants = grants.filter((g) => {
    const q = debouncedSearchQuery.toLowerCase();
    const matchesSearch =
      g.reason.toLowerCase().includes(q) ||
      (g.scope_value || g.scopeValue || "").toLowerCase().includes(q) ||
      (g.courseTitle && g.courseTitle.toLowerCase().includes(q)) ||
      g.createdByName.toLowerCase().includes(q);

    const sType = g.scope_type || g.scopeType;
    const matchesScope = scopeFilter === "all" || sType === scopeFilter;
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;

    const isOwn = (g.created_by || g.createdBy) === staff.id;
    const matchesOwner = isMainAdmin || viewScope === "all" || isOwn;

    return matchesSearch && matchesScope && matchesStatus && matchesOwner;
  });

  const totalPages = Math.max(1, Math.ceil(filteredGrants.length / pageSize));
  const paginatedGrants = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGrants.slice(start, start + pageSize);
  }, [filteredGrants, currentPage, pageSize]);

  return (
    <PermissionGuard permission="freegrant.manage">
      <AdminShell>
        <div className="space-y-6 max-w-6xl mx-auto font-sans pb-16">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#0E1B3D] font-heading">
                  Free Access Grants &amp; Offline Admissions
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF3FE] text-[#0B57D0]">
                  freegrant.manage
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Materialize course access, oversee Sub-Admin Maker-Checker offline admissions, and settle physical cash collection.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setIsBulkCustomizerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-full shadow-md transition cursor-pointer active:scale-95"
              >
                <span>📋</span> Bulk Excel / CSV Customizer
              </button>

              <button
                onClick={handleOpenDrawer}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-full shadow-md transition cursor-pointer active:scale-95"
              >
                <span>🎁</span> + New Grant
              </button>
            </div>
          </div>

          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
              <span className="flex items-center gap-2">
                <span>✅</span> {actionFeedback}
              </span>
              <button onClick={() => setActionFeedback(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">✕</button>
            </div>
          )}

          {/* PENDING SUB-ADMIN APPROVALS QUEUE (MAIN ADMIN ONLY) */}
          {isMainAdmin && pendingApprovals.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 border-2 border-amber-300 rounded-3xl p-6 shadow-md space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-xl font-bold">
                    ⏳
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-amber-950 font-heading">
                      Pending Sub-Admin Approvals Queue ({pendingApprovals.length} pending)
                    </h2>
                    <p className="text-xs text-amber-900">
                      Maker-Checker Governance: Review and activate offline course admissions submitted by Sub-Admins.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-200 text-amber-950 rounded-full text-xs font-black self-start sm:self-auto">
                  REQUIRES ACTION
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-amber-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-100/60 text-amber-950 border-b border-amber-200 font-bold">
                    <tr>
                      <th className="px-4 py-3">Student Recipient</th>
                      <th className="px-4 py-3">Item Requested</th>
                      <th className="px-4 py-3">Fee &amp; Payment Mode</th>
                      <th className="px-4 py-3">Submitted By (Sub-Admin)</th>
                      <th className="px-4 py-3 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {pendingApprovals.map((grant) => (
                      <tr key={grant.id} className="hover:bg-amber-50/50 transition">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-[#0E1B3D]">{grant.student_name || grant.scope_value}</p>
                          <p className="font-mono text-[11px] text-[#5A6478]">📱 +91 {grant.student_phone || grant.scope_value}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-[#0B57D0]">{grant.courseTitle || "Item"}</span>
                          <span className="block text-[10px] text-[#8A94A6]">{grant.months} Months Access</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-extrabold text-emerald-700">₹{grant.amount_paid || 0}</span>
                          <span className="block text-[10px] text-[#5A6478]">
                            {grant.payment_mode === "upi" ? `UPI (UTR: ${grant.upi_ref || "N/A"})` : "Cash Collected"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-[#0E1B3D]">{grant.createdByName}</span>
                          <span className="block text-[10px] text-[#8A94A6]">
                            {formatIST(grant.created_at || grant.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditPendingGrant(grant);
                                setEditCourseId(grant.course_id || grant.courseId || grant.book_id || grant.bookId || "");
                                setEditValidityMonths(grant.months || 6);
                                setEditCustomDate("");
                                setEditAmountPaid(grant.amount_paid || 0);
                                setEditRemarks(grant.reason || "");
                              }}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                              title="Customize course or validity before approving"
                            >
                              <span>✏️</span> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(grant.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <span>✅</span> Approve &amp; Activate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(grant)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              <span>❌</span> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5A6478]">Active Grants</span>
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                  🎁
                </span>
              </div>
              <div className="text-2xl font-extrabold text-[#0E1B3D] mt-2 font-heading">
                {revenueStats.activeGrantsCount}
              </div>
              <span className="text-[11px] text-[#8A94A6]">Running currently</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5A6478]">Students Covered</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                  👥
                </span>
              </div>
              <div className="text-2xl font-extrabold text-[#0E1B3D] mt-2 font-heading">
                {revenueStats.totalStudentsCovered}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">Active enrollments</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5A6478]">Total Waived Value</span>
                <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">
                  ₹
                </span>
              </div>
              <div className="text-2xl font-extrabold text-[#0B57D0] mt-2 font-heading">
                ₹{revenueStats.totalRupees.toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] text-[#8A94A6]">Curriculum fees sponsored</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5A6478]">Revoked Grants</span>
                <span className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">
                  🔒
                </span>
              </div>
              <div className="text-2xl font-extrabold text-[#0E1B3D] mt-2 font-heading">
                {grants.filter((g) => g.status === "revoked").length}
              </div>
              <span className="text-[11px] text-[#8A94A6]">Access terminated</span>
            </div>
          </div>

          {/* SUB-ADMIN CASH VS UPI COLLECTION TALLY CARD (MAIN ADMIN ONLY) */}
          {isMainAdmin && (
            <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E8F8]">
                <div>
                  <h2 className="text-base font-extrabold text-[#0E1B3D] flex items-center gap-2">
                    <span>💰</span> Sub-Admin Cash vs UPI Collection Tally
                  </h2>
                  <p className="text-xs text-[#5A6478]">
                    Real-time audit breakdown of offline fees collected by staff via Cash, UPI, and Scholarships.
                  </p>
                </div>

                {/* Timeframe Filter Pills */}
                <div className="flex items-center gap-1.5 bg-[#F5F7FF] p-1 rounded-full border border-[#E4E8F8] self-start sm:self-auto">
                  {(
                    [
                      { id: "today", label: "Today" },
                      { id: "week", label: "Last 7 Days" },
                      { id: "month", label: "This Month" },
                      { id: "all", label: "All Time" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTallyTimeframe(t.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                        tallyTimeframe === t.id
                          ? "bg-[#0B57D0] text-white shadow-xs"
                          : "text-[#5A6478] hover:text-[#0E1B3D]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aggregate Overview Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                      Total Cash Collected
                    </span>
                    <p className="text-xl font-extrabold text-emerald-900 font-heading mt-0.5">
                      ₹{(
                        tallyTimeframe === "today"
                          ? tallyReport.totals.todayCash
                          : tallyTimeframe === "week"
                          ? tallyReport.totals.weekCash
                          : tallyTimeframe === "month"
                          ? tallyReport.totals.monthCash
                          : tallyReport.totals.allTimeCash
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="text-2xl">💵</span>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">
                      Total Direct UPI Collected
                    </span>
                    <p className="text-xl font-extrabold text-[#0B57D0] font-heading mt-0.5">
                      ₹{(
                        tallyTimeframe === "today"
                          ? tallyReport.totals.todayUpi
                          : tallyTimeframe === "week"
                          ? tallyReport.totals.weekUpi
                          : tallyTimeframe === "month"
                          ? tallyReport.totals.monthUpi
                          : tallyReport.totals.allTimeUpi
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="text-2xl">📱</span>
                </div>

                <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wide">
                      Free / Scholarship Grants
                    </span>
                    <p className="text-xl font-extrabold text-purple-900 font-heading mt-0.5">
                      {(
                        tallyTimeframe === "today"
                          ? tallyReport.totals.todayGrants
                          : tallyTimeframe === "week"
                          ? tallyReport.totals.weekGrants
                          : tallyTimeframe === "month"
                          ? tallyReport.totals.monthGrants
                          : tallyReport.totals.allTimeGrants
                      )}{" "}
                      Grants
                    </p>
                  </div>
                  <span className="text-2xl">🎓</span>
                </div>
              </div>

              {/* Staff Breakdown Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#E4E8F8]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFBFD] text-[#5A6478] border-b border-[#E4E8F8]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Staff Member (granted_by)</th>
                      <th className="px-4 py-3 font-bold">Cash Collected</th>
                      <th className="px-4 py-3 font-bold">UPI Collected</th>
                      <th className="px-4 py-3 font-bold">Total Collection</th>
                      <th className="px-4 py-3 font-bold">Unsettled Cash</th>
                      <th className="px-4 py-3 font-bold text-right">Settlement Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E8F8]">
                    {tallyReport.byStaff.map((s) => {
                      const cash =
                        tallyTimeframe === "today"
                          ? s.todayCash
                          : tallyTimeframe === "week"
                          ? s.weekCash
                          : tallyTimeframe === "month"
                          ? s.monthCash
                          : s.allTimeCash;
                      const upi =
                        tallyTimeframe === "today"
                          ? s.todayUpi
                          : tallyTimeframe === "week"
                          ? s.weekUpi
                          : tallyTimeframe === "month"
                          ? s.monthUpi
                          : s.allTimeUpi;
                      const settlement = cashSettlements.find(
                        (cs) => cs.staffId === s.staffId || cs.staffName.toLowerCase() === s.staffName.toLowerCase()
                      );
                      const unsettled = settlement ? settlement.unsettledCash : 0;

                      return (
                        <tr key={s.staffId} className="hover:bg-[#F9FAFD]">
                          <td className="px-4 py-3 font-bold text-[#0E1B3D]">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-[#EBF3FE] text-[#0B57D0] flex items-center justify-center text-[10px] font-bold">
                                {s.staffName.slice(0, 1).toUpperCase()}
                              </span>
                              <div>
                                <span className="block font-bold">{s.staffName}</span>
                                <span className="text-[10px] text-[#8A94A6] font-mono">{s.staffId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-700">
                            ₹{cash.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#0B57D0]">
                            ₹{upi.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 font-extrabold text-[#0E1B3D]">
                            ₹{(cash + upi).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            {unsettled > 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                💰 ₹{unsettled.toLocaleString("en-IN")} Pending
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✅ All Settled
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {unsettled > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleSettleSubAdmin(s.staffId)}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
                              >
                                💰 Mark Cash Settled
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#8A94A6] italic">Handover Cleared</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search grants by reason, recipient, course, or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl focus:outline-none focus:border-[#0B57D0] text-[#0E1B3D]"
                />
              </div>

              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className="text-xs px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl focus:outline-none focus:border-[#0B57D0] text-[#0E1B3D] font-semibold"
              >
                <option value="all">All Scope Types</option>
                <option value="district">📍 District</option>
                <option value="taluka">🏘️ Taluka</option>
                <option value="school">🏫 School</option>
                <option value="student">👤 Single Student</option>
                <option value="all_students">🌐 All Students</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E8F8] pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#5A6478] font-bold">Status:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {(["all", "active", "pending_approval", "revoked", "rejected"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-full font-bold transition capitalize ${
                        statusFilter === st
                          ? "bg-[#0E1B3D] text-white"
                          : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EBF3FE]"
                      }`}
                    >
                      {st === "pending_approval" ? `⏳ Pending (${pendingApprovals.length})` : st}
                    </button>
                  ))}
                </div>
              </div>

              {!isMainAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-[#5A6478] font-bold">View:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewScope("own")}
                      className={`px-3 py-1 rounded-full font-bold transition text-xs ${
                        viewScope === "own"
                          ? "bg-[#0B57D0] text-white"
                          : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EBF3FE]"
                      }`}
                    >
                      My Grants (Can Revoke)
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewScope("all")}
                      className={`px-3 py-1 rounded-full font-bold transition text-xs ${
                        viewScope === "all"
                          ? "bg-[#0B57D0] text-white"
                          : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EBF3FE]"
                      }`}
                    >
                      All Academy Grants
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grants Table */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E4E8F8] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0E1B3D]">
                Grant Registry ({filteredGrants.length} records)
              </h3>
              <span className="text-xs text-[#8A94A6]">
                {isMainAdmin
                  ? "Main Admin: All academy grants visible • Full revoke authority"
                  : "Sub-Admin: Manage own grants • Revoke access restricted to created grants"}
              </span>
            </div>

            {filteredGrants.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-3xl mb-2 block">🎁</span>
                <p className="text-sm font-bold text-[#0E1B3D]">No grants found matching criteria</p>
                <p className="text-xs text-[#5A6478] mt-1">
                  Try adjusting your search filters or create a new grant above.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F7FF] text-[#5A6478] border-b border-[#E4E8F8]">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Scope & Recipient</th>
                      <th className="px-4 py-3.5 font-bold">Item Access</th>
                      <th className="px-4 py-3.5 font-bold">Duration & Validity</th>
                      <th className="px-4 py-3.5 font-bold">Coverage</th>
                      <th className="px-4 py-3.5 font-bold">Reason / Purpose</th>
                      <th className="px-4 py-3.5 font-bold">Status</th>
                      <th className="px-4 py-3.5 font-bold">Created By</th>
                      <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E8F8]">
                    {paginatedGrants.map((grant) => {
                      const canRevoke =
                        grant.status === "active" &&
                        (isMainAdmin || (grant.created_by || grant.createdBy) === staff.id);

                      const endsAtVal = grant.ends_at || grant.endsAt || new Date().toISOString();
                      const createdAtVal = grant.created_at || grant.createdAt || new Date().toISOString();
                      const isExpired = isExpiredIST(endsAtVal);
                      const sType = grant.scope_type || grant.scopeType || "district";
                      const sVal = grant.scope_value || grant.scopeValue || "All";

                      return (
                        <tr key={grant.id} className="hover:bg-[#F9FAFD] transition">
                          {/* Scope & Recipient */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-base">
                                {sType === "district" && "📍"}
                                {sType === "taluka" && "🏘️"}
                                {sType === "school" && "🏫"}
                                {sType === "student" && "👤"}
                                {sType === "all_students" && "🌐"}
                              </span>
                              <div>
                                <span className="font-bold text-[#0E1B3D] block">
                                  {sVal}
                                </span>
                                <span className="text-[10px] text-[#8A94A6] uppercase tracking-wide">
                                  {sType.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Item Access */}
                          <td className="px-4 py-4">
                            <span className="px-2.5 py-1 bg-[#F5F7FF] border border-[#E4E8F8] text-[#0E1B3D] font-bold rounded-lg inline-flex items-center gap-1.5">
                              {grant.itemType === "book" ? (
                                <>
                                  <span className="text-amber-600">📚</span>
                                  <span>{grant.bookTitle || "Digital Book"}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-blue-600">🎓</span>
                                  <span>{grant.courseTitle || "All Courses"}</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Duration & Validity */}
                          <td className="px-4 py-4">
                            <div className="font-semibold text-[#0E1B3D]">
                              {grant.months} Months
                            </div>
                            <div className="text-[10px] text-[#8A94A6]">
                              Ends {formatIST(endsAtVal)}
                            </div>
                            {grant.amount_paid !== undefined && grant.amount_paid > 0 && (
                              <div className="mt-1">
                                <span className="font-bold text-emerald-700">₹{grant.amount_paid}</span>
                                <span className="text-[10px] text-[#5A6478] ml-1 uppercase">({grant.payment_mode || "fee"})</span>
                              </div>
                            )}
                            {grant.payment_mode === "cash" && (
                              <div className="mt-1">
                                {grant.settlement_status === "settled" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ✅ Cash Settled
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                      💰 Unsettled Cash
                                    </span>
                                    {isMainAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => handleSettleSingle(grant.id)}
                                        className="text-[9px] font-bold text-[#0B57D0] hover:underline cursor-pointer"
                                      >
                                        Settle
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Coverage */}
                          <td className="px-4 py-4">
                            <span className="font-bold text-[#0B57D0]">
                              {grant.affectedStudentsCount} Students
                            </span>
                          </td>

                          {/* Reason */}
                          <td className="px-4 py-4 max-w-xs">
                            <p className="text-xs text-[#0E1B3D] line-clamp-2" title={grant.reason}>
                              {grant.reason}
                            </p>
                            {grant.rejection_reason && (
                              <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                Reason: {grant.rejection_reason}
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            {grant.status === "pending_approval" ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                                ⏳ Pending Approval
                              </span>
                            ) : grant.status === "rejected" ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                                ❌ Rejected
                              </span>
                            ) : grant.status === "active" && !isExpired ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Active
                              </span>
                            ) : grant.status === "revoked" ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                Revoked
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                                Expired
                              </span>
                            )}
                          </td>

                          {/* Created By */}
                          <td className="px-4 py-4">
                            <div className="text-xs text-[#0E1B3D] font-medium">
                              {grant.createdByName}
                            </div>
                            <div className="text-[10px] text-[#8A94A6]">
                              {formatIST(createdAtVal)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Pending Maker-Checker Actions */}
                              {grant.status === "pending_approval" && isMainAdmin && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(grant.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRejectModal(grant)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200 cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}

                              {/* 1-click WhatsApp Receipt & Access Link */}
                              {(grant.scope_type === "student" || grant.student_phone || grant.studentPhone || /^\d{10}$/.test(grant.scope_value || grant.scopeValue || "")) && (
                                <button
                                  type="button"
                                  onClick={() => handleSendGrantWhatsApp(grant)}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                                    grant.whatsapp_sent || grant.whatsappSent
                                      ? "bg-[#E8F8F2] text-[#0A8554] border-[#C6ECD9] hover:bg-[#D5F2E6]"
                                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs"
                                  }`}
                                  title={
                                    grant.whatsapp_sent || grant.whatsappSent
                                      ? "WhatsApp receipt dispatched (click to resend)"
                                      : "1-Click WhatsApp Receipt & Login Link"
                                  }
                                >
                                  <span>{grant.whatsapp_sent || grant.whatsappSent ? "✓💬" : "💬"}</span>
                                  <span>{grant.whatsapp_sent || grant.whatsappSent ? "Sent" : "Receipt"}</span>
                                </button>
                              )}

                              {grant.status === "active" ? (
                                canRevoke ? (
                                  <button
                                    onClick={() => setRevokeTarget(grant)}
                                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition border border-red-200 cursor-pointer"
                                  >
                                    Revoke
                                  </button>
                                ) : (
                                  <span
                                    className="text-[10px] text-[#8A94A6] cursor-help"
                                    title="Only grant creator or Main Admin can revoke"
                                  >
                                    Own only
                                  </span>
                                )
                              ) : (
                                grant.status !== "pending_approval" && <span className="text-[10px] text-[#8A94A6]">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredGrants.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#E4E8F8] text-xs text-[#5A6478]">
                  <div className="flex items-center gap-2">
                    <span>
                      Showing{" "}
                      <span className="font-bold text-[#0E1B3D]">
                        {(currentPage - 1) * pageSize + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-bold text-[#0E1B3D]">
                        {Math.min(currentPage * pageSize, filteredGrants.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-[#0E1B3D]">
                        {filteredGrants.length}
                      </span>{" "}
                      grants
                    </span>
                    <span className="text-[#A4B0C6]">|</span>
                    <label className="flex items-center gap-1.5 text-xs text-[#5A6478]">
                      <span>Page size:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="px-2 py-1 bg-[#F5F7FF] border border-[#E4E8F8] rounded-lg font-bold text-[#0E1B3D] cursor-pointer"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E4E8F8] bg-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FF] transition cursor-pointer"
                      title="First page"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-[#E4E8F8] bg-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FF] transition cursor-pointer"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1.5 font-bold text-[#0E1B3D]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-[#E4E8F8] bg-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FF] transition cursor-pointer"
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E4E8F8] bg-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FF] transition cursor-pointer"
                      title="Last page"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>

          {/* Create Grant Drawer */}
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
              <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
                <div className="space-y-6">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#E4E8F8]">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎁</span>
                      <div>
                        <h2 className="text-lg font-extrabold text-[#0E1B3D] font-heading">
                          Create Free Access Grant
                        </h2>
                        <p className="text-xs text-[#5A6478]">
                          Instantly unlocks full curriculum access at ₹0 for recipients.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="text-[#5A6478] hover:text-[#0E1B3D] text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form id="grant-form" onSubmit={handleCreateGrant} className="space-y-5 text-xs">
                    {/* Scope Type Selector */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-2">
                        Target Scope Type
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {(
                          [
                            { key: "district", label: "District", icon: "📍" },
                            { key: "taluka", label: "Taluka", icon: "🏘️" },
                            { key: "school", label: "School", icon: "🏫" },
                            { key: "student", label: "Student", icon: "👤" },
                            { key: "all_students", label: "All", icon: "🌐" },
                          ] as const
                        ).map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => {
                              setScopeType(s.key);
                              if (s.key === "district") setScopeValue("Pune");
                              else if (s.key === "all_students") setScopeValue("All Active Students");
                              else setScopeValue("");
                            }}
                            className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                              scopeType === s.key
                                ? "bg-[#0B57D0] text-white border-[#0B57D0] shadow-sm"
                                : "bg-[#F5F7FF] text-[#0E1B3D] border-[#E4E8F8] hover:bg-[#EBF3FE]"
                            }`}
                          >
                            <span className="text-base">{s.icon}</span>
                            <span className="font-bold text-[11px]">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scope Value Input with Suggestions */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">
                        Scope Value / Target Target
                      </label>

                      {scopeType === "student" ? (
                        <div className="space-y-2">
                          <select
                            value={scopeValue}
                            onChange={(e) => setScopeValue(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl font-medium text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                          >
                            <option value="">Select a student...</option>
                            {students.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name} ({s.phone}) — {s.district}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-[#8A94A6]">
                            Or type student name, phone number, or ID:
                          </p>
                          <input
                            type="text"
                            placeholder="e.g. Rahul Shinde or +91 98231..."
                            value={scopeValue}
                            onChange={(e) => setScopeValue(e.target.value)}
                            className="w-full px-4 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D]"
                          />
                        </div>
                      ) : scopeType === "district" ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="e.g. Pune, Satara, Kolhapur..."
                            value={scopeValue}
                            onChange={(e) => setScopeValue(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl font-medium text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {POPULAR_DISTRICTS.map((dist) => (
                              <button
                                key={dist}
                                type="button"
                                onClick={() => setScopeValue(dist)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                                  scopeValue.toLowerCase() === dist.toLowerCase()
                                    ? "bg-[#0B57D0] text-white border-[#0B57D0]"
                                    : "bg-white text-[#5A6478] border-[#E4E8F8] hover:border-gray-300"
                                }`}
                              >
                                {dist}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : scopeType === "school" ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="e.g. Enter School or Academic Wing Name..."
                            value={scopeValue}
                            onChange={(e) => setScopeValue(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl font-medium text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                          />
                        </div>
                      ) : scopeType === "taluka" ? (
                        <input
                          type="text"
                          placeholder="e.g. Haveli, Baramati, Karad..."
                          value={scopeValue}
                          onChange={(e) => setScopeValue(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl font-medium text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                        />
                      ) : (
                        <div className="p-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl font-bold text-[#0E1B3D]">
                          🌐 All Academy Students ({students.length} students)
                        </div>
                      )}
                    </div>

                    {/* Item Type & Scope */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">
                        Item Type to Grant
                      </label>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setGrantItemType("course")}
                          className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                            grantItemType === "course"
                              ? "bg-[#0E1B3D] text-white border-[#0E1B3D]"
                              : "bg-[#F5F7FF] text-[#5A6478] border-[#E4E8F8]"
                          }`}
                        >
                          <span>🎓</span> Course
                        </button>
                        <button
                          type="button"
                          onClick={() => setGrantItemType("book")}
                          className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                            grantItemType === "book"
                              ? "bg-[#0E1B3D] text-white border-[#0E1B3D]"
                              : "bg-[#F5F7FF] text-[#5A6478] border-[#E4E8F8]"
                          }`}
                        >
                          <span>📚</span> Digital Book
                        </button>
                      </div>

                      {grantItemType === "book" ? (
                        <div>
                          <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                            Select Paid / Standalone Book
                          </label>
                          <select
                            value={selectedBookId}
                            onChange={(e) => setSelectedBookId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl font-bold text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                          >
                            {books.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.code || "BOOK"} — {b.title} ({b.isFree ? "Free" : `₹${Math.round((b.pricePaise || 0) / 100)}`})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                            Course Scope
                          </label>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <button
                              type="button"
                              onClick={() => setCourseScope("one")}
                              className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                                courseScope === "one"
                                  ? "bg-[#0E1B3D] text-white border-[#0E1B3D]"
                                  : "bg-[#F5F7FF] text-[#5A6478] border-[#E4E8F8]"
                              }`}
                            >
                              Specific Course
                            </button>
                            <button
                              type="button"
                              onClick={() => setCourseScope("all")}
                              className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                                courseScope === "all"
                                  ? "bg-[#0E1B3D] text-white border-[#0E1B3D]"
                                  : "bg-[#F5F7FF] text-[#5A6478] border-[#E4E8F8]"
                              }`}
                            >
                              All Academy Courses
                            </button>
                          </div>

                          {courseScope === "one" && (
                            <select
                              value={selectedCourseId}
                              onChange={(e) => setSelectedCourseId(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl font-bold text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                            >
                              {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.code} — {c.title} (₹{Math.round((c.pricePaise || 0) / 100)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Full Custom Validity Configuration */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-[#0E1B3D]">Grant Validity Duration *</label>
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setGrantValidityMode("preset")}
                            className={`px-2 py-0.5 rounded-lg border transition ${
                              grantValidityMode === "preset"
                                ? "bg-[#0B57D0] text-white border-[#0B57D0]"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            Presets
                          </button>
                          <button
                            type="button"
                            onClick={() => setGrantValidityMode("custom_days")}
                            className={`px-2 py-0.5 rounded-lg border transition ${
                              grantValidityMode === "custom_days"
                                ? "bg-[#0B57D0] text-white border-[#0B57D0]"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            Custom Days
                          </button>
                          <button
                            type="button"
                            onClick={() => setGrantValidityMode("fixed_date")}
                            className={`px-2 py-0.5 rounded-lg border transition ${
                              grantValidityMode === "fixed_date"
                                ? "bg-[#0B57D0] text-white border-[#0B57D0]"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            Exam Date
                          </button>
                        </div>
                      </div>

                      {grantValidityMode === "preset" && (
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { label: "7 Days Demo", days: 7, months: 0 },
                            { label: "15 Days", days: 15, months: 0 },
                            { label: "1 Month", days: 30, months: 1 },
                            { label: "3 Months", days: 90, months: 3 },
                            { label: "6 Months", days: 180, months: 6 },
                            { label: "12M (1 Year)", days: 365, months: 12 },
                            { label: "24M (2 Years)", days: 730, months: 24 },
                            { label: "Lifetime", days: 3650, months: 120 },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setGrantPresetDays(preset.days);
                                setMonths(preset.months || 1);
                              }}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition cursor-pointer text-center ${
                                grantPresetDays === preset.days
                                  ? "bg-[#0B57D0] text-white border-[#0B57D0] shadow-xs"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:border-[#0B57D0]"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {grantValidityMode === "custom_days" && (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min={1}
                              max={3650}
                              value={grantCustomDays}
                              onChange={(e) => setGrantCustomDays(Math.max(1, Number(e.target.value)))}
                              placeholder="e.g. 45"
                              className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                            />
                            <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">Days</span>
                          </div>
                          <p className="text-[11px] text-[#5A6478]">Valid for {grantCustomDays} days</p>
                        </div>
                      )}

                      {grantValidityMode === "fixed_date" && (
                        <div>
                          <input
                            type="date"
                            required={grantValidityMode === "fixed_date"}
                            min={new Date().toISOString().slice(0, 10)}
                            value={grantFixedDate}
                            onChange={(e) => setGrantFixedDate(e.target.value)}
                            className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#0B57D0] rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Free access automatically terminates on this examination date</p>
                        </div>
                      )}
                    </div>

                    {/* Live Matching Count Preview Card (Server Query) */}
                    <div className="p-4 bg-[#EBF3FE] border border-[#DDEBFF] rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⚡</span>
                          <h4 className="font-bold text-[#0B57D0] text-xs">
                            Server Verified Audience Match
                          </h4>
                        </div>
                        {isCounting && (
                          <span className="text-[10px] text-[#0B57D0] font-semibold animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0B57D0] animate-ping" />
                            Querying server...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#0E1B3D]">
                        This grant immediately matches{" "}
                        <strong className="text-[#0B57D0] font-extrabold">
                          {liveMatchingCount} student{liveMatchingCount === 1 ? "" : "s"}
                        </strong>{" "}
                        based on profile segments.
                      </p>
                      <div className="text-[11px] text-[#5A6478]">
                        Estimated waived curriculum fees:{" "}
                        <strong className="text-emerald-700 font-bold">
                          ₹{estimatedWaivedRupees.toLocaleString("en-IN")}
                        </strong>{" "}
                        <span className="text-[10px] text-[#8A94A6]">
                          (Materialized as ₹0 purchase rows)
                        </span>
                      </div>
                    </div>

                    {/* Reason / Purpose Textarea */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">
                        Grant Reason & Approval Note <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="e.g. Pune ZP Merit Scholarship 2026 Batch — approved by Prashant Dhumal Sir"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                      />
                    </div>

                    {formError && (
                      <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                        {formError}
                      </p>
                    )}
                  </form>
                </div>

                {/* Drawer Footer */}
                <div className="pt-4 border-t border-[#E4E8F8] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#0E1B3D] font-bold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="grant-form"
                    disabled={liveMatchingCount === 0}
                    className="px-6 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                  >
                    Grant Free Access 🎁
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Revoke Confirmation Modal */}
          {revokeTarget && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E4E8F8] space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center text-2xl font-bold mx-auto">
                  ⚠️
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-[#0E1B3D] font-heading">
                    Revoke Free Access Grant?
                  </h3>
                  <p className="text-xs text-[#5A6478] mt-1">
                    This will immediately terminate free course access for{" "}
                    <strong>{revokeTarget.affectedStudentsCount} students</strong> under grant:{" "}
                    <em>"{revokeTarget.reason}"</em>.
                  </p>
                </div>

                {revokeError && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                    {revokeError}
                  </p>
                )}

                <div className="pt-3 border-t border-[#E4E8F8] flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRevokeTarget(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#0E1B3D] font-bold rounded-xl"
                  >
                    Keep Active
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRevoke}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow"
                  >
                    Yes, Revoke Grant
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject Pending Grant Modal */}
          {rejectModalGrant && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl font-bold mx-auto">
                  ❌
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-[#0E1B3D] font-heading">
                    Reject Sub-Admin Admission Grant?
                  </h3>
                  <p className="text-xs text-[#5A6478] mt-1">
                    Student: <strong>{rejectModalGrant.student_name || rejectModalGrant.scope_value}</strong> (+91 {rejectModalGrant.student_phone || rejectModalGrant.scope_value})
                    <br />
                    Item: <em>{rejectModalGrant.courseTitle}</em>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                    Rejection Reason (Optional note for Sub-Admin)
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. UTR mismatch / Duplicate offline entry"
                    className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-3 border-t border-[#E4E8F8] flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRejectModalGrant(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#0E1B3D] font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow transition"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit / Customize Pending Grant Modal */}
          {editPendingGrant && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-blue-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✏️</span>
                    <div>
                      <h3 className="text-base font-bold text-[#0E1B3D] font-heading">
                        Customize Pending Admission
                      </h3>
                      <p className="text-[11px] text-[#5A6478]">
                        Submitted by: <span className="font-bold">{editPendingGrant.createdByName}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditPendingGrant(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900">
                  Learner: <span className="font-bold">{editPendingGrant.student_name || editPendingGrant.scope_value}</span> (+91 {editPendingGrant.student_phone || editPendingGrant.scope_value})
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-[#0E1B3D] mb-1">
                      Assigned Course or Handbook:
                    </label>
                    <select
                      value={editCourseId}
                      onChange={(e) => setEditCourseId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F5F7FF] border border-slate-300 rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none focus:border-blue-600"
                    >
                      <optgroup label="🎓 Courses">
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code}: {c.title}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="📚 Handbooks">
                        {books.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code || "BK"}: {b.title}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">
                        Validity Duration:
                      </label>
                      <select
                        value={editValidityMonths}
                        onChange={(e) => setEditValidityMonths(Number(e.target.value))}
                        disabled={Boolean(editCustomDate)}
                        className="w-full px-3 py-2 bg-[#F5F7FF] border border-slate-300 rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none focus:border-blue-600 disabled:opacity-40"
                      >
                        <option value={1}>1 Month (30d)</option>
                        <option value={3}>3 Months (90d)</option>
                        <option value={6}>6 Months (180d)</option>
                        <option value={12}>1 Year (365d)</option>
                        <option value={120}>Lifetime</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">
                        Or Fixed Expiry Date:
                      </label>
                      <input
                        type="date"
                        value={editCustomDate}
                        onChange={(e) => setEditCustomDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#F5F7FF] border border-slate-300 rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0E1B3D] mb-1">
                      Fee Collected (₹):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editAmountPaid}
                      onChange={(e) => setEditAmountPaid(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#F5F7FF] border border-slate-300 rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0E1B3D] mb-1">
                      Notes / Remarks:
                    </label>
                    <input
                      type="text"
                      value={editRemarks}
                      onChange={(e) => setEditRemarks(e.target.value)}
                      placeholder="e.g. Adjusted course to Police Bharti by Prashant Sir"
                      className="w-full px-3 py-2 bg-[#F5F7FF] border border-slate-300 rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E4E8F8] flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    disabled={isSavingEdit}
                    onClick={() => setEditPendingGrant(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#0E1B3D] font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingEdit}
                    onClick={handleSavePendingGrantEdit}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition disabled:opacity-50"
                  >
                    {isSavingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Excel / CSV Customizer Modal */}
          <BulkGrantCustomizerModal
            isOpen={isBulkCustomizerOpen}
            onClose={() => setIsBulkCustomizerOpen(false)}
            courses={courses}
            books={books}
            onSuccess={(msg) => {
              setActionFeedback(msg);
              loadData();
            }}
          />
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
