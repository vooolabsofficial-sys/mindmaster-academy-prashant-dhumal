"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { StaffUser, StaffPermission, AuditLogEntry } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffUsers,
  saveStaffUser,
  toggleStaffStatus,
  freezeAllSubAdmins,
  unfreezeAllSubAdmins,
  deleteStaffUser,
  getAuditLogs,
  getPlatformSettings,
  PlatformSettings,
} from "@/lib/staffStore";
import { getSubAdminCashSettlements, settleSubAdminCash, SubAdminCashSummary } from "@/lib/grantStore";

const MAHARASHTRA_DISTRICTS = [
  "Pune",
  "Satara",
  "Kolhapur",
  "Solapur",
  "Sangli",
  "Ahmednagar",
  "Nashik",
  "Thane",
  "Mumbai",
  "Chhatrapati Sambhajinagar",
  "Nagpur",
  "Amravati",
  "Nanded",
  "Jalgaon",
  "Latur",
  "Dhule",
  "Beed",
  "Raigad",
  "Ratnagiri",
  "Sindhudurg",
];

const ALL_PERMISSIONS: { key: StaffPermission; label: string; desc: string; icon: string }[] = [
  {
    key: "students.view",
    label: "Student Finder & 360° Profile",
    desc: "Search students, view admission history, and inspect profiles (telemetry watch drilldown locked to Main Admin)",
    icon: "🎓",
  },
  {
    key: "messages.manage",
    label: "Student Support Messages",
    desc: "Reply to student queries and send in-app support messages",
    icon: "💬",
  },
];

export default function SubAdminManagerPage() {
  const [currentStaff, setCurrentStaff] = useState<StaffUser>(getCurrentStaff());
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(getPlatformSettings());
  const [cashSettlements, setCashSettlements] = useState<SubAdminCashSummary[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Filters State for Sub-Admins
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "has_cash">("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [permissionFilter, setPermissionFilter] = useState<string>("all");

  // Slide-over Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

  // Drawer Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDistrict, setFormDistrict] = useState("Pune");
  const [formCentre, setFormCentre] = useState("");
  const [formApprovalMode, setFormApprovalMode] = useState(false);
  const [formPermissions, setFormPermissions] = useState<StaffPermission[]>([]);
  const [formMustReset, setFormMustReset] = useState(true);

  // Newly Created Credentials Modal State (Shown Once)
  const [createdCredentials, setCreatedCredentials] = useState<{
    staffId: string;
    name: string;
    tempPassword: string;
    phone: string;
    email: string;
  } | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Delete Modal State
  const [deleteModalStaff, setDeleteModalStaff] = useState<StaffUser | null>(null);

  // Audit Log Filters
  const [auditStaffFilter, setAuditStaffFilter] = useState<string>("all");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("all");
  const [auditDateFilter, setAuditDateFilter] = useState<"all" | "today" | "7days" | "month">("all");

  const reloadData = () => {
    setCurrentStaff(getCurrentStaff());
    setStaffList(getStaffUsers());
    setAuditLogs(getAuditLogs());
    setSettings(getPlatformSettings());
    setCashSettlements(getSubAdminCashSettlements());
  };

  useEffect(() => {
    reloadData();
    window.addEventListener("mma_staff_changed", reloadData);
    window.addEventListener("mma_settings_changed", reloadData);
    window.addEventListener("mma_grants_changed", reloadData);
    return () => {
      window.removeEventListener("mma_staff_changed", reloadData);
      window.removeEventListener("mma_settings_changed", reloadData);
      window.removeEventListener("mma_grants_changed", reloadData);
    };
  }, []);

  const isMainAdmin = currentStaff.role === "main_admin";
  const subAdminsOnly = staffList.filter((s) => s.role !== "main_admin");
  const subAdminCount = subAdminsOnly.length;
  const maxSubAdmins = settings.max_sub_admins || 50;
  const quotaReached = subAdminCount >= maxSubAdmins;

  // Generate Next Staff ID helper (e.g. MMA-005)
  const getNextStaffId = (): string => {
    let maxNum = 0;
    staffList.forEach((s) => {
      const match = (s.staffId || "").match(/MMA-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `MMA-${String(maxNum + 1).padStart(3, "0")}`;
  };

  // Generate random temporary password
  const generateTempPassword = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const special = "@#$!";
    const p1 = chars.charAt(Math.floor(Math.random() * chars.length));
    const p2 = chars.charAt(Math.floor(Math.random() * chars.length)).toLowerCase();
    const p3 = special.charAt(Math.floor(Math.random() * special.length));
    const num = Math.floor(1000 + Math.random() * 9000);
    return `Temp${p1}${p2}${p3}${num}`;
  };

  const handleOpenAdd = () => {
    if (quotaReached) {
      alert(`Provisioning limit reached (${maxSubAdmins} sub-admins). Upgrade limit in Platform Settings.`);
      return;
    }
    setEditingStaff(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("+91 ");
    setFormDistrict("Pune");
    setFormCentre("");
    setFormApprovalMode(false);
    setFormPermissions(["messages.manage", "students.view"]);
    setFormMustReset(true);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (staff: StaffUser) => {
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormEmail(staff.email);
    setFormPhone(staff.phone);
    setFormDistrict(staff.district || "Pune");
    setFormCentre(staff.centre || "");
    setFormApprovalMode(staff.approvalMode || false);
    setFormPermissions(staff.permissions);
    setFormMustReset(staff.mustChangePassword || false);
    setIsDrawerOpen(true);
  };

  const togglePermission = (perm: StaffPermission) => {
    if (formPermissions.includes(perm)) {
      setFormPermissions(formPermissions.filter((p) => p !== perm));
    } else {
      setFormPermissions([...formPermissions, perm]);
    }
  };

  const handleSaveSubAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingStaff) {
      // Edit existing sub-admin
      const updated: StaffUser = {
        ...editingStaff,
        name: formName.trim(),
        email: formEmail.trim() || `${formName.trim().toLowerCase().replace(/\s+/g, ".")}@mindmasteracademy.in`,
        phone: formPhone.trim(),
        district: formDistrict,
        centre: formCentre.trim() || undefined,
        approvalMode: formApprovalMode,
        permissions: formPermissions,
        mustChangePassword: formMustReset,
      };
      saveStaffUser(updated);
      reloadData();
      setIsDrawerOpen(false);
    } else {
      // Create new sub-admin with generated staff_id and random temp password
      const newStaffId = getNextStaffId();
      const tempPass = generateTempPassword();

      const newStaff: StaffUser = {
        id: `staff-${Date.now()}`,
        staffId: newStaffId,
        name: formName.trim(),
        email: formEmail.trim() || `${formName.trim().toLowerCase().replace(/\s+/g, ".")}@mindmasteracademy.in`,
        phone: formPhone.trim(),
        district: formDistrict,
        centre: formCentre.trim() || undefined,
        approvalMode: formApprovalMode,
        role: "sub_admin",
        permissions: formPermissions,
        status: "active",
        lastLoginAt: "Never (Pending First Login)",
        mustChangePassword: true,
        password: tempPass,
      };

      saveStaffUser(newStaff);
      reloadData();
      setIsDrawerOpen(false);

      // Show temporary credentials modal once
      setCreatedCredentials({
        staffId: newStaffId,
        name: newStaff.name,
        tempPassword: tempPass,
        phone: newStaff.phone,
        email: newStaff.email,
      });
    }
  };

  const handleToggleSuspend = (staffId: string) => {
    toggleStaffStatus(staffId);
    reloadData();
  };

  const handleFreezeAll = () => {
    if (!confirm("⚠️ Emergency Bulk Freeze: Are you sure you want to suspend ALL Sub-Admins immediately? This will instantly terminate their active sessions.")) {
      return;
    }
    const count = freezeAllSubAdmins();
    setActionFeedback(`Froze all ${count} Sub-Admin accounts successfully.`);
    setTimeout(() => setActionFeedback(null), 3500);
    reloadData();
  };

  const handleUnfreezeAll = () => {
    if (!confirm("▶️ Bulk Unfreeze: Re-activate all Sub-Admin accounts?")) {
      return;
    }
    const count = unfreezeAllSubAdmins();
    setActionFeedback(`Re-activated all ${count} Sub-Admin accounts successfully.`);
    setTimeout(() => setActionFeedback(null), 3500);
    reloadData();
  };

  const handleSettleCash = (staffId: string) => {
    if (!confirm(`Settle cash collected by Sub-Admin ${staffId}? This marks physical cash as received at HQ.`)) {
      return;
    }
    const amt = settleSubAdminCash(staffId);
    setActionFeedback(`Settled ₹${amt.toLocaleString("en-IN")} cash handover successfully!`);
    setTimeout(() => setActionFeedback(null), 3500);
    reloadData();
  };

  const handleConfirmDelete = () => {
    if (!deleteModalStaff) return;
    deleteStaffUser(deleteModalStaff.id);
    reloadData();
    setDeleteModalStaff(null);
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `MindMaster Academy Staff Login Credentials:\nStaff ID: ${createdCredentials.staffId}\nFull Name: ${createdCredentials.name}\nTemporary Password: ${createdCredentials.tempPassword}\nPortal: http://localhost:3001/staff/login\n\nNote: You will be required to change your password on first login.`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  // Filter Sub-Admins
  const filteredStaff = staffList.filter((s) => {
    // We display all staff or sub-admins
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === "" ||
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.phone.includes(query) ||
      (s.staffId && s.staffId.toLowerCase().includes(query)) ||
      (s.district && s.district.toLowerCase().includes(query)) ||
      (s.centre && s.centre.toLowerCase().includes(query));

    // District Filter
    const matchesDistrict =
      districtFilter === "all" || (s.district && s.district.toLowerCase() === districtFilter.toLowerCase());

    // Status Filter
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = s.status === "active";
    } else if (statusFilter === "suspended") {
      matchesStatus = s.status === "suspended" || s.status === "inactive";
    } else if (statusFilter === "has_cash") {
      const settlement = cashSettlements.find(
        (cs) => cs.staffId === (s.staffId || s.id) || cs.staffName.toLowerCase() === s.name.toLowerCase()
      );
      matchesStatus = Boolean(settlement && settlement.unsettledCash > 0);
    }

    // Permission Filter
    let matchesPermission = true;
    if (permissionFilter !== "all") {
      if (s.role === "main_admin") {
        matchesPermission = true; // Main Admin has all permissions
      } else {
        matchesPermission = s.permissions.includes(permissionFilter as StaffPermission);
      }
    }

    return matchesSearch && matchesDistrict && matchesStatus && matchesPermission;
  });

  // Filter Audit Logs
  const filteredAuditLogs = auditLogs.filter((entry) => {
    // Staff filter
    if (auditStaffFilter !== "all" && entry.staffId !== auditStaffFilter && entry.staffName !== auditStaffFilter) {
      return false;
    }
    // Action filter
    if (auditActionFilter !== "all" && entry.action !== auditActionFilter) {
      return false;
    }
    // Date filter
    if (auditDateFilter !== "all") {
      const entryDate = new Date(entry.timestamp.replace(" ", "T"));
      const now = new Date();
      if (auditDateFilter === "today") {
        if (entryDate.toDateString() !== now.toDateString()) return false;
      } else if (auditDateFilter === "7days") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
        if (entryDate < sevenDaysAgo) return false;
      } else if (auditDateFilter === "month") {
        if (entryDate.getMonth() !== now.getMonth() || entryDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  // Distinct action types in audit logs
  const distinctActions = Array.from(new Set(auditLogs.map((l) => l.action)));

  return (
    <PermissionGuard adminOnly={true}>
      <AdminShell>
        <div className="space-y-6">
          {/* Header Bar with Counter Chip x / max_sub_admins */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading tracking-tight">
                  Sub-Admin Manager
                </h1>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  MAIN ADMIN ONLY
                </span>

                {/* Counter Chip: x / max_sub_admins from settings */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEF4FF] border border-[#D0E2FF] rounded-full text-xs font-bold text-[#0B57D0]">
                  <span className="text-xs">👥</span>
                  <span>{subAdminCount} / {maxSubAdmins} Sub-Admins Provisioned</span>
                </div>
              </div>
              <p className="text-xs text-[#5A6478] mt-1.5">
                Scale 50-60+ centre heads &amp; sub-admins, configure district assignment, Maker-Checker admissions, and track physical cash settlements.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              {/* Emergency Bulk Freeze / Unfreeze */}
              <button
                type="button"
                onClick={handleFreezeAll}
                className="px-3.5 py-2 rounded-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Emergency Freeze: Immediately suspend all Sub-Admins and kill active sessions"
              >
                <span>❄️</span> Freeze All
              </button>
              <button
                type="button"
                onClick={handleUnfreezeAll}
                className="px-3.5 py-2 rounded-full text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Bulk Unfreeze: Re-activate all Sub-Admin accounts"
              >
                <span>▶️</span> Unfreeze All
              </button>
              <button
                onClick={handleOpenAdd}
                id="add-subadmin-btn"
                disabled={quotaReached}
                className={`px-5 py-2.5 rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-2 ${
                  quotaReached
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-[#0B57D0] hover:bg-[#0842A0] text-white hover:shadow-lg cursor-pointer"
                }`}
              >
                <span className="text-base leading-none">➕</span> Add New Sub-Admin
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

          {/* Filters Bar: Search + District + Status + Permission Chips */}
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
                  placeholder="Search name, MMA ID, phone, district, centre..."
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

              {/* District Filter Dropdown */}
              <div className="w-full md:w-56">
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-full text-xs font-bold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">📍 All Districts ({MAHARASHTRA_DISTRICTS.length})</option>
                  {MAHARASHTRA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                  Status:
                </span>
                {[
                  { key: "all", label: "All Status" },
                  { key: "active", label: "Active" },
                  { key: "suspended", label: "Suspended" },
                  {
                    key: "has_cash",
                    label: `💰 Has Cash (${cashSettlements.filter((cs) => cs.unsettledCash > 0).length})`,
                  },
                ].map((chip) => {
                  const isActive = statusFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      onClick={() => setStatusFilter(chip.key as any)}
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
            </div>

            {/* Permission Chips Row */}
            <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[#E4E8F8]">
              <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                Permission:
              </span>
              <button
                onClick={() => setPermissionFilter("all")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  permissionFilter === "all"
                    ? "bg-[#0B57D0] text-white shadow-xs"
                    : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EEF4FF] hover:text-[#0B57D0] border border-[#E4E8F8]"
                }`}
              >
                All Permissions
              </button>
              {ALL_PERMISSIONS.map((perm) => {
                const isActive = permissionFilter === perm.key;
                return (
                  <button
                    key={perm.key}
                    onClick={() => setPermissionFilter(perm.key)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? "bg-[#0B57D0] text-white shadow-xs"
                        : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EEF4FF] hover:text-[#0B57D0] border border-[#E4E8F8]"
                    }`}
                  >
                    <span className="font-mono text-[10px]">{perm.key}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-Admins Table */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E8F8] text-[#8A94A6] uppercase tracking-wider font-semibold">
                    <th className="pb-3.5 pl-3">Staff ID</th>
                    <th className="pb-3.5">Staff Member &amp; Location</th>
                    <th className="pb-3.5">Assigned Permissions</th>
                    <th className="pb-3.5">Mode</th>
                    <th className="pb-3.5">Cash in Hand</th>
                    <th className="pb-3.5">Status</th>
                    <th className="pb-3.5">Suspend</th>
                    <th className="pb-3.5 text-right pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E8F8]">
                  {filteredStaff.map((staff) => {
                    const isRoot = staff.role === "main_admin";
                    const isSuspended = staff.status === "suspended" || staff.status === "inactive";

                    const settlement = cashSettlements.find(
                      (cs) => cs.staffId === (staff.staffId || staff.id) || cs.staffName.toLowerCase() === staff.name.toLowerCase()
                    );
                    const unsettledCash = settlement ? settlement.unsettledCash : 0;

                    return (
                      <tr key={staff.id} className="hover:bg-[#F9FAFF] transition-colors group">
                        {/* 1. Staff ID Mono Chip */}
                        <td className="py-4 pl-3">
                          <span className="font-mono font-black text-xs tracking-wider text-[#0B57D0] px-2.5 py-1 bg-[#EEF4FF] border border-[#D0E2FF] rounded-md shadow-xs whitespace-nowrap">
                            {staff.staffId || "MMA-000"}
                          </span>
                        </td>

                        {/* 2. Staff Member Details & District/Centre */}
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-xs ${
                              isRoot ? "bg-[#0E1B3D] text-white" : "bg-[#E6F0FF] text-[#0B57D0]"
                            }`}>
                              {staff.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-[#0E1B3D] text-xs">
                                  {staff.name}
                                </p>
                                {isRoot && (
                                  <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-[#0E1B3D] text-white">
                                    FOUNDER
                                  </span>
                                )}
                              </div>
                              <p className="text-[#5A6478] text-[11px] mt-0.5">
                                {staff.phone} • {staff.email}
                              </p>
                              {!isRoot && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                    📍 {staff.district || "Pune"}
                                  </span>
                                  {staff.centre && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                      🏢 {staff.centre}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Assigned Permission Chips */}
                        <td className="py-4 max-w-sm">
                          {isRoot ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold">
                              <span>⚡</span> Full Unrestricted Permissions
                            </span>
                          ) : staff.permissions.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">No permissions assigned</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {staff.permissions.map((p) => (
                                <span
                                  key={p}
                                  className="px-2 py-0.5 bg-[#FAFBFD] border border-[#E4E8F8] rounded-md text-[10px] text-[#0B57D0] font-mono font-semibold"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 4. Maker-Checker Governance Mode */}
                        <td className="py-4 whitespace-nowrap">
                          {isRoot ? (
                            <span className="text-[10px] text-[#8A94A6]">—</span>
                          ) : staff.approvalMode ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300">
                              ⏳ Approval Mode
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ⚡ Direct Mode
                            </span>
                          )}
                        </td>

                        {/* 5. Cash in Hand & 1-Click Settle */}
                        <td className="py-4 whitespace-nowrap">
                          {isRoot ? (
                            <span className="text-[10px] text-[#8A94A6]">—</span>
                          ) : unsettledCash > 0 ? (
                            <div>
                              <span className="font-extrabold text-amber-950 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full text-[10px]">
                                💰 ₹{unsettledCash.toLocaleString("en-IN")}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSettleCash(staff.staffId || staff.id)}
                                className="block mt-1 text-[10px] font-bold text-[#0B57D0] hover:underline cursor-pointer"
                              >
                                Settle Cash
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✅ Settled
                            </span>
                          )}
                        </td>

                        {/* 6. Status Badge */}
                        <td className="py-4 whitespace-nowrap">
                          {isSuspended ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                              ● Suspended
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ● Active
                            </span>
                          )}
                        </td>

                        {/* 7. Suspend Toggle (Instant Session Kill) */}
                        <td className="py-4">
                          {isRoot ? (
                            <span className="text-[11px] text-slate-400 italic">Protected</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!isSuspended}
                                  onChange={() => handleToggleSuspend(staff.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-rose-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                              </label>
                              <span className="text-[10px] font-bold text-[#5A6478]">
                                {!isSuspended ? "Live" : "Killed"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 8. Edit & Admin-only Delete */}
                        <td className="py-4 text-right pr-3 whitespace-nowrap">
                          {isRoot ? (
                            <span className="text-[11px] text-[#8A94A6] italic pr-2">Root Account</span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(staff)}
                                className="px-3 py-1.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#0B57D0] border border-[#E4E8F8] rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Edit
                              </button>

                              {/* Admin-Only Delete Action */}
                              {isMainAdmin && (
                                <button
                                  onClick={() => setDeleteModalStaff(staff)}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Admin-only permanent deletion"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* AUDIT LOG CARD BELOW WITH DROPDOWN & DATE CHIP FILTERS */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E8F8]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📜</span>
                  <h2 className="text-lg font-bold text-[#0E1B3D] font-heading">
                    System Audit Trail (`audit_log`)
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F5F7FF] text-[#0E1B3D] text-[11px] font-bold border border-[#E4E8F8]">
                    {filteredAuditLogs.length} events
                  </span>
                </div>
                <p className="text-xs text-[#5A6478] mt-0.5">
                  Immutable record of every mutating action executed across courses, videos, coupons, and staff accounts.
                </p>
              </div>

              {/* Date Range Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mr-1">
                  Range:
                </span>
                {[
                  { key: "all", label: "All Time" },
                  { key: "today", label: "Today" },
                  { key: "7days", label: "Last 7 Days" },
                  { key: "month", label: "This Month" },
                ].map((range) => {
                  const isActive = auditDateFilter === range.key;
                  return (
                    <button
                      key={range.key}
                      onClick={() => setAuditDateFilter(range.key as any)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#0E1B3D] text-white shadow-xs"
                          : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EEF4FF] hover:text-[#0B57D0] border border-[#E4E8F8]"
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audit Log Dropdown Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Staff Dropdown */}
              <div className="w-full sm:w-64">
                <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                  Filter by Staff Member:
                </label>
                <select
                  value={auditStaffFilter}
                  onChange={(e) => setAuditStaffFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Staff Members</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.staffId || "MMA-000"} • {s.name} ({s.role === "main_admin" ? "Admin" : "Sub-Admin"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Dropdown */}
              <div className="w-full sm:w-64">
                <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                  Filter by Action Type:
                </label>
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Action Types</option>
                  {distinctActions.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E8F8] text-[#8A94A6] uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2">Timestamp</th>
                    <th className="pb-3">Staff Operator</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Target Entity</th>
                    <th className="pb-3">Operation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E8F8]">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F9FAFF] transition-colors">
                      <td className="py-3 pl-2 font-mono text-[11px] text-[#5A6478] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#0E1B3D]">{log.staffName}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            log.staffRole === "main_admin" ? "bg-[#0E1B3D] text-white" : "bg-blue-50 text-[#0B57D0]"
                          }`}>
                            {log.staffRole === "main_admin" ? "ADMIN" : "SUB"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-md bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-[#0E1B3D] capitalize">
                        {log.entityType}: {log.entityName}
                      </td>
                      <td className="py-3 text-[#5A6478] text-[11px] max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                        <span className="text-xl">👥</span>
                        <h2 className="text-lg font-bold text-[#0E1B3D] font-heading">
                          {editingStaff ? `Edit Sub-Admin: ${editingStaff.staffId || editingStaff.name}` : "Provision New Sub-Admin"}
                        </h2>
                      </div>
                      <p className="text-xs text-[#5A6478] mt-0.5">
                        {editingStaff
                          ? "Modify account contact info and assign granular permissions"
                          : `Generates ${getNextStaffId()} with temporary credentials and auto password reset`}
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
                  <form onSubmit={handleSaveSubAdmin} id="subadmin-drawer-form" className="p-6 space-y-5 flex-1">
                    {/* Next Staff ID Banner for new additions */}
                    {!editingStaff && (
                      <div className="p-3 bg-[#EEF4FF] border border-[#D0E2FF] rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#0B57D0]">Assigned Staff ID</p>
                          <p className="text-[11px] text-[#5A6478]">Sequential ID auto-generated for MMA staff directory</p>
                        </div>
                        <span className="font-mono font-black text-sm text-[#0B57D0] px-3 py-1 bg-white rounded-xl border border-[#D0E2FF]">
                          {getNextStaffId()}
                        </span>
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Anand Satpute"
                        className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                          Phone Number (OTP Verification) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="+91 98..."
                          className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                          Work Email
                        </label>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="e.g. anand@mindmasteracademy.in"
                          className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                        />
                      </div>
                    </div>

                    {/* District & Centre / Branch */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                          📍 Assigned District *
                        </label>
                        <select
                          value={formDistrict}
                          onChange={(e) => setFormDistrict(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                        >
                          {MAHARASHTRA_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                          🏢 Centre / Branch Name
                        </label>
                        <input
                          type="text"
                          value={formCentre}
                          onChange={(e) => setFormCentre(e.target.value)}
                          placeholder="e.g. Swargate Centre / Main Branch"
                          className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                        />
                      </div>
                    </div>

                    {/* Maker-Checker Admission Governance Toggle */}
                    <div className="p-3.5 bg-[#EEF4FF] border border-[#D0E2FF] rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#0B57D0] flex items-center gap-1.5">
                          <span>⏳</span> Maker-Checker Approval Mode
                        </p>
                        <p className="text-[11px] text-[#5A6478] mt-0.5">
                          {formApprovalMode
                            ? "Approval Mode: Offline admissions by this sub-admin require Prashant Sir's approval before activating."
                            : "Direct Mode: Offline admissions activate student course access immediately."}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formApprovalMode}
                          onChange={(e) => setFormApprovalMode(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B57D0]"></div>
                      </label>
                    </div>

                    {/* Permissions Checkboxes */}
                    <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#0E1B3D]">
                          🔑 Permission Checkboxes ({formPermissions.length} selected) *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (formPermissions.length === ALL_PERMISSIONS.length) {
                              setFormPermissions([]);
                            } else {
                              setFormPermissions(ALL_PERMISSIONS.map((p) => p.key));
                            }
                          }}
                          className="text-[11px] font-bold text-[#0B57D0] hover:underline"
                        >
                          {formPermissions.length === ALL_PERMISSIONS.length ? "Deselect All" : "Select All"}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {ALL_PERMISSIONS.map((p) => {
                          const isChecked = formPermissions.includes(p.key);
                          return (
                            <div
                              key={p.key}
                              onClick={() => togglePermission(p.key)}
                              className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                                isChecked
                                  ? "bg-white border-[#0B57D0] shadow-xs"
                                  : "bg-white/60 border-[#E4E8F8] hover:bg-white"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="mt-0.5 rounded text-[#0B57D0] focus:ring-[#0B57D0] h-4 w-4"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[#0E1B3D] text-xs flex items-center gap-1.5">
                                    <span>{p.icon}</span>
                                    <span>{p.label}</span>
                                  </span>
                                  <span className="font-mono text-[10px] text-[#0B57D0] bg-[#EEF4FF] px-2 py-0.5 rounded-md font-semibold">
                                    {p.key}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#5A6478] mt-0.5">
                                  {p.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Strict Admin Security Notice */}
                      <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                        <span className="text-sm">🔒</span>
                        <div>
                          <p className="font-bold">Strict Main Admin Security Locks:</p>
                          <p className="text-[10px] text-amber-800 mt-0.5 leading-relaxed">
                            Master Settings, Sub-Admin management, System Audit Trail, Financial/Watch Telemetry Reports, and Deletion actions cannot be assigned to Sub-Admins. They are permanently locked to Main Admin (Prashant Sir).
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Force Password Change Option */}
                    <div className="p-3.5 bg-[#FAFBFD] border border-[#E4E8F8] rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#0E1B3D]">Force Password Change on Next Login</p>
                        <p className="text-[11px] text-[#5A6478]">
                          Staff will be mandated to set an Argon2id password before accessing dashboard.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formMustReset}
                        onChange={(e) => setFormMustReset(e.target.checked)}
                        className="rounded text-[#0B57D0] focus:ring-[#0B57D0] h-4 w-4"
                      />
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
                        {editingStaff ? "Save Sub-Admin Changes" : "Provision Sub-Admin →"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CREDENTIALS GENERATED MODAL (SHOWN ONCE ON CREATE) */}
          {/* ========================================================= */}
          {createdCredentials && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-3xl border border-[#D0E2FF] max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-[#E4E8F8]">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] text-[#0B57D0] flex items-center justify-center text-2xl font-bold">
                    🔑
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#0E1B3D] font-heading">
                      Sub-Admin Provisioned Successfully
                    </h3>
                    <p className="text-xs text-[#5A6478]">
                      These credentials will only be shown once. Copy and share securely.
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAFBFD] border border-[#E4E8F8] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="text-[#5A6478] font-semibold">Staff ID:</span>
                    <span className="font-mono font-black text-[#0B57D0] bg-[#EEF4FF] px-2.5 py-1 rounded-md text-xs">
                      {createdCredentials.staffId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="text-[#5A6478] font-semibold">Staff Name:</span>
                    <span className="font-bold text-[#0E1B3D]">
                      {createdCredentials.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="text-[#5A6478] font-semibold">Phone / SMS:</span>
                    <span className="font-mono font-bold text-[#0E1B3D]">
                      {createdCredentials.phone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5A6478] font-semibold">One-Time Temp Password:</span>
                    <span className="font-mono font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md text-xs border border-rose-200">
                      {createdCredentials.tempPassword}
                    </span>
                  </div>
                </div>

                {/* Security Warning Alert */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <span className="text-sm">⚠️</span>
                  <p className="text-[11px] leading-relaxed">
                    The staff member will be prompted to set a permanent private password on their first login via SMS OTP verification.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E4E8F8]">
                  <button
                    onClick={handleCopyCredentials}
                    className="px-4 py-2 bg-[#EEF4FF] hover:bg-[#DDEBFF] text-[#0B57D0] rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#D0E2FF]"
                  >
                    <span>{copiedNotification ? "✅ Copied!" : "📋 Copy All Credentials"}</span>
                  </button>

                  <button
                    onClick={() => setCreatedCredentials(null)}
                    className="px-5 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-full text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DELETE CONFIRMATION MODAL (ADMIN ONLY) */}
          {/* ========================================================= */}
          {deleteModalStaff && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-[#E4E8F8] max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
                  🗑️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0E1B3D]">
                    Permanently Remove Sub-Admin?
                  </h3>
                  <p className="text-xs text-[#5A6478] mt-1 leading-relaxed">
                    Are you sure you want to delete <span className="font-bold text-[#0E1B3D]">{deleteModalStaff.name} ({deleteModalStaff.staffId || deleteModalStaff.id})</span>?
                    This will permanently revoke all permissions and kill active login sessions.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E8F8]">
                  <button
                    onClick={() => setDeleteModalStaff(null)}
                    className="px-4 py-2 rounded-full border border-[#E4E8F8] text-xs font-bold text-[#5A6478] hover:bg-[#F5F7FF]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                  >
                    Yes, Delete Sub-Admin
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
