"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { StudentRecord, StaffUser } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffStudents,
  sendInAppNotification,
  getStaffCourses,
  getStaffBooks,
  logStaffAction,
  fetchDbStudents,
  updateStudentProfileCascading,
  getPlatformSettings,
} from "@/lib/staffStore";
import { exportStudentsToExcel } from "@/lib/excelExporter";
import { createStudentFuzzySearch } from "@/lib/fuzzySearch";
import { grantCashAdmission, extendStudentAccess, revokeStudentAccess } from "@/lib/grantStore";
import { resetStudentDeviceSessionLock, adminResetStudentPassword } from "@/lib/studentAuthService";
import { hasStaffPermission } from "@/lib/types";

export default function StudentFinderPage() {
  const [currentStaff, setCurrentStaff] = useState<StaffUser>(getCurrentStaff());
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [talukaFilter, setTalukaFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState<"all" | "0-25" | "26-75" | "76-99" | "100">("all");
  const [expiring7DaysOnly, setExpiring7DaysOnly] = useState(false);
  const [recentSignupsOnly, setRecentSignupsOnly] = useState(false);

  // 360 Drawer State
  const [drawerStudent, setDrawerStudent] = useState<StudentRecord | null>(null);

  // Power Actions: Extend Validity Modal State
  const [extendModalItem, setExtendModalItem] = useState<{
    student: StudentRecord;
    itemType: "course" | "book";
    itemId: string;
    itemTitle: string;
    currentExpiry?: string;
    purchaseId?: string;
    grantId?: string;
  } | null>(null);
  const [extendOption, setExtendOption] = useState<"7" | "15" | "30" | "90" | "custom">("15");
  const [extendCustomDate, setExtendCustomDate] = useState("");
  const [isExtending, setIsExtending] = useState(false);

  // Power Actions: Revoke Access Modal State
  const [revokeModalItem, setRevokeModalItem] = useState<{
    student: StudentRecord;
    itemType: "course" | "book";
    itemId: string;
    itemTitle: string;
    purchaseId?: string;
    grantId?: string;
  } | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState("");

  // Power Actions: Reset Password Modal State
  const [resetPasswordModalStudent, setResetPasswordModalStudent] = useState<StudentRecord | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<{
    phone: string;
    studentName: string;
    newPass: string;
    whatsappUrl: string;
  } | null>(null);
  const [passwordResetError, setPasswordResetError] = useState("");

  // Power Actions: Edit Student Profile Modal State
  const [editStudentModal, setEditStudentModal] = useState<StudentRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editTaluka, setEditTaluka] = useState("");
  const [editSchool, setEditSchool] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editProfileError, setEditProfileError] = useState("");

  // Action Feedback Toast
  const [actionFeedbackToast, setActionFeedbackToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setActionFeedbackToast({ message, type });
    setTimeout(() => setActionFeedbackToast(null), 3500);
  };

  // In-App Notification Modal State (Strictly In-App, NO WhatsApp)
  const [notifyStudent, setNotifyStudent] = useState<StudentRecord | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifySuccess, setNotifySuccess] = useState(false);

  // Offline Cash Admission / Direct Course Grant Modal State
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashPhone, setCashPhone] = useState("");
  const [cashName, setCashName] = useState("");
  const [cashCourseId, setCashCourseId] = useState("");
  const [cashValidityMode, setCashValidityMode] = useState<"preset" | "custom_days" | "fixed_date">("preset");
  const [cashPresetDays, setCashPresetDays] = useState<number>(180);
  const [cashCustomDays, setCashCustomDays] = useState<number>(45);
  const [cashFixedDate, setCashFixedDate] = useState<string>("");
  const [cashAccessMonths, setCashAccessMonths] = useState(6);
  const [cashPaymentMode, setCashPaymentMode] = useState<"cash" | "upi" | "scholarship">("cash");
  const [cashAmount, setCashAmount] = useState(199);
  const [cashRemarks, setCashRemarks] = useState("");
  const [cashSuccessReceipt, setCashSuccessReceipt] = useState<{
    grantId: string;
    studentName: string;
    studentPhone: string;
    courseTitle: string;
    amount: number;
    paymentMode: string;
    expiresAt: string;
    whatsappUrl?: string;
  } | null>(null);
  const [cashError, setCashError] = useState("");

  const courses = getStaffCourses();

  const reload = async () => {
    setCurrentStaff(getCurrentStaff());
    setIsLoading(true);
    const dbStudents = await fetchDbStudents();
    setStudents(dbStudents);
    setIsLoading(false);
  };

  useEffect(() => {
    reload();
    window.addEventListener("mma_staff_changed", reload);
    return () => window.removeEventListener("mma_staff_changed", reload);
  }, []);

  const isMainAdmin = currentStaff.role === "main_admin";

  // Distinct Filter Options
  const distinctDistricts = Array.from(new Set(students.map((s) => s.district).filter(Boolean)));
  const distinctTalukas = Array.from(new Set(students.map((s) => s.taluka).filter(Boolean))) as string[];
  const distinctSchools = Array.from(new Set(students.map((s) => s.school).filter(Boolean))) as string[];

  // Open 360 Drawer and Log to audit_log
  const handleOpen360Drawer = (student: StudentRecord) => {
    setDrawerStudent(student);
    // Mandatory requirement: log every 360 view to audit_log
    logStaffAction(
      "STUDENT_360_VIEW",
      "student",
      student.id,
      student.name,
      `Staff (${currentStaff.role}) viewed 360 profile of ${student.name} (${student.phone}, ${student.district})`
    );
  };

  // Open Notification Modal
  const handleOpenNotify = (student: StudentRecord) => {
    setNotifyStudent(student);
    setNotifTitle("Study Routine Reminder");
    setNotifMessage(`Namaskar ${student.name.split(" ")[0]}, your next video lesson is waiting in your MindMaster library!`);
    setNotifySuccess(false);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyStudent || !notifTitle.trim() || !notifMessage.trim()) return;

    sendInAppNotification(notifyStudent.id, notifTitle.trim(), notifMessage.trim());
    setNotifySuccess(true);
    setTimeout(() => {
      setNotifyStudent(null);
      setNotifySuccess(false);
    }, 1400);
  };

  // Open Offline Cash Admission Modal
  const handleOpenCashModal = (student?: StudentRecord) => {
    const courseList = getStaffCourses();
    const defaultCourse = courseList[0];
    const defaultPrice = defaultCourse ? Math.round(defaultCourse.pricePaise / 100) : 199;

    setCashPhone(student ? student.phone.replace(/\D/g, "").slice(-10) : "");
    setCashName(student ? student.name : "");
    setCashCourseId(defaultCourse?.id || "all");
    setCashValidityMode("preset");
    setCashPresetDays(180);
    setCashCustomDays(45);
    setCashFixedDate("");
    setCashAccessMonths(defaultCourse?.accessMonths || 6);
    setCashPaymentMode("cash");
    setCashAmount(defaultPrice);
    setCashRemarks("");
    setCashError("");
    setCashSuccessReceipt(null);
    setIsCashModalOpen(true);
  };

  // Handle Save Offline Cash Admission
  const handleSaveCashGrant = (e: React.FormEvent) => {
    e.preventDefault();
    setCashError("");

    const clean = cashPhone.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) {
      setCashError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!cashCourseId) {
      setCashError("Please select a course or digital book.");
      return;
    }

    const isAllCourses = cashCourseId === "all";
    const courseList = getStaffCourses();
    const bookList = getStaffBooks();
    const selectedCourse = !isAllCourses ? courseList.find((c) => c.id === cashCourseId || c.code === cashCourseId) : null;
    const selectedBook = !isAllCourses && !selectedCourse ? bookList.find((b) => b.id === cashCourseId || b.code === cashCourseId) : null;
    const itemTitle = isAllCourses ? "All Academy Courses (सर्व कोर्सेस)" : selectedCourse?.title || selectedBook?.title || "MindMaster Item";

    const result = grantCashAdmission({
      studentPhone: clean,
      studentName: cashName.trim() || undefined,
      courseId: cashCourseId,
      itemType: isAllCourses ? "all_courses" : selectedBook ? "book" : "course",
      validityDays: cashValidityMode === "custom_days" ? cashCustomDays : cashValidityMode === "preset" ? cashPresetDays : undefined,
      customExpiryDate: cashValidityMode === "fixed_date" ? cashFixedDate : undefined,
      accessMonths: cashAccessMonths,
      paymentMode: cashPaymentMode,
      amountPaid: cashAmount,
      remarks: cashRemarks.trim() || undefined,
    });

    if (!result.success) {
      setCashError(result.error || "Failed to grant admission.");
      return;
    }

    setCashSuccessReceipt({
      grantId: result.grantId,
      studentName: cashName.trim() || `Student ${clean.slice(-4)}`,
      studentPhone: clean,
      courseTitle: itemTitle,
      amount: cashAmount,
      paymentMode:
        cashPaymentMode === "cash"
          ? "Cash"
          : cashPaymentMode === "upi"
          ? "Direct UPI (PhonePe/GPay)"
          : "Free Grant / Scholarship",
      expiresAt: result.expiresAt,
      whatsappUrl: result.whatsappUrl,
    });

    reload();
  };

  // 1-Click Excel Export
  const handleExportExcel = () => {
    exportStudentsToExcel(
      filteredStudents.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        district: s.district || "Maharashtra",
        school: s.school || "N/A",
        enrolledCourses: s.enrolledCourseCodes.join(", ") || "None",
        totalPaid: (s as any).totalPaidPaise
          ? `₹${Math.round((s as any).totalPaidPaise / 100)}`
          : s.enrolledCourseCodes.length > 0
          ? "Paid Enrolled"
          : "₹0",
        joinedDate: s.joinedAt || "Recent",
        status: s.status || "Active",
      }))
    );
  };

  const canManageGrants = isMainAdmin || hasStaffPermission(currentStaff, "freegrant.manage");

  // WhatsApp Renewal Reminder
  const handleSendWhatsAppRenewalReminder = (student: StudentRecord, courseOrBookTitle: string, daysLeft: number) => {
    const clean = student.phone.replace(/\D/g, "").slice(-10);
    const settings = getPlatformSettings();
    const template =
      settings.reminder_template ||
      "Namaskar {name}, your access to {course} will expire in {days} days. Renew today to get {percent}% off!";
    const percent = settings.renewal_coupon_percent || 50;
    const msg = template
      .replace("{name}", student.name.split(" ")[0])
      .replace("{course}", courseOrBookTitle)
      .replace("{days}", String(daysLeft))
      .replace("{percent}", String(percent));

    const waUrl = `https://wa.me/91${clean}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");

    logStaffAction(
      "WHATSAPP_RENEWAL_REMINDER_SENT",
      "student",
      student.id,
      student.name,
      `Triggered 1-click WhatsApp renewal reminder to ${student.name} (${clean}) for "${courseOrBookTitle}" (${daysLeft}d left).`
    );
    showToast(`WhatsApp reminder dispatched for ${student.name}!`);
  };

  // Reset Device Session Lock
  const handleResetSessionLock = (student: StudentRecord) => {
    resetStudentDeviceSessionLock(student.phone);
    logStaffAction(
      "STUDENT_SESSION_RESET",
      "student",
      student.phone,
      student.name,
      `Staff (${currentStaff.role} - ${currentStaff.name}) reset device session lock for ${student.name} (${student.phone}).`
    );
    showToast(`Device session lock cleared for ${student.name}! Learner can now login from a new phone.`);
  };

  // Open Reset Password Modal
  const handleOpenResetPassword = (student: StudentRecord) => {
    setResetPasswordModalStudent(student);
    setNewPasswordInput("");
    setPasswordResetError("");
    setPasswordResetSuccess(null);
  };

  // Confirm Reset Password
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModalStudent) return;
    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      setPasswordResetError("Password must be at least 6 characters long.");
      return;
    }
    setIsResettingPassword(true);
    setPasswordResetError("");

    const clean = resetPasswordModalStudent.phone.replace(/\D/g, "").slice(-10);
    const pass = newPasswordInput.trim();
    const res = await adminResetStudentPassword(clean, pass);

    if (!res.success) {
      setPasswordResetError(res.error || "Failed to reset password.");
      setIsResettingPassword(false);
      return;
    }

    logStaffAction(
      "STUDENT_PASSWORD_RESET",
      "student",
      clean,
      resetPasswordModalStudent.name,
      `Staff (${currentStaff.role} - ${currentStaff.name}) reset password for ${resetPasswordModalStudent.name} (${clean}).`
    );

    const waMsg = `Namaskar ${resetPasswordModalStudent.name.split(" ")[0]}!\n\nYour MindMaster Academy login password has been reset by Admin.\n\n📱 Mobile: ${clean}\n🔑 New Password: ${pass}\n\n📲 Login now:\nhttps://mindmaster.academy/login\n\n— Prashant Dhumal Sir, MindMaster Academy`;
    const waUrl = `https://wa.me/91${clean}?text=${encodeURIComponent(waMsg)}`;

    setPasswordResetSuccess({
      phone: clean,
      studentName: resetPasswordModalStudent.name,
      newPass: pass,
      whatsappUrl: waUrl,
    });
    showToast(`Password successfully reset for ${resetPasswordModalStudent.name}!`);
    setIsResettingPassword(false);
  };

  // Open Edit Profile Modal
  const handleOpenEditProfile = (student: StudentRecord) => {
    setEditStudentModal(student);
    setEditName(student.name);
    setEditPhone(student.phone.replace(/\D/g, "").slice(-10));
    setEditDistrict(student.district || "Maharashtra");
    setEditTaluka(student.taluka || "");
    setEditSchool(student.school || "");
    setEditProfileError("");
  };

  // Save Edit Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentModal) return;
    setEditProfileError("");
    setIsSavingProfile(true);

    const clean = editPhone.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) {
      setEditProfileError("Please enter a valid 10-digit mobile number.");
      setIsSavingProfile(false);
      return;
    }

    try {
      const result = await updateStudentProfileCascading(editStudentModal.phone, {
        name: editName.trim(),
        phone: clean,
        district: editDistrict.trim(),
        taluka: editTaluka.trim(),
        school: editSchool.trim(),
      });

      if (!result.success) {
        setEditProfileError(result.error || "Failed to update profile.");
        setIsSavingProfile(false);
        return;
      }

      showToast(`Profile updated successfully for ${editName.trim()}!`);
      setEditStudentModal(null);
      await reload();

      // Update drawerStudent if open
      if (drawerStudent && (drawerStudent.id === editStudentModal.id || drawerStudent.phone === editStudentModal.phone)) {
        setDrawerStudent((prev) =>
          prev
            ? {
                ...prev,
                name: editName.trim(),
                phone: clean,
                district: editDistrict.trim(),
                taluka: editTaluka.trim(),
                school: editSchool.trim(),
              }
            : null
        );
      }
    } catch (err: any) {
      setEditProfileError(err?.message || "Error updating profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Submit Extend Validity
  const handleConfirmExtend = async () => {
    if (!extendModalItem) return;
    setIsExtending(true);
    try {
      let daysToAdd: number | undefined;
      let customDate: string | undefined;

      if (extendOption === "custom") {
        if (!extendCustomDate) {
          showToast("Please choose a custom expiry date.", "error");
          setIsExtending(false);
          return;
        }
        customDate = new Date(extendCustomDate).toISOString();
      } else {
        daysToAdd = Number(extendOption);
      }

      const res = await extendStudentAccess({
        studentPhone: extendModalItem.student.phone,
        studentName: extendModalItem.student.name,
        itemType: extendModalItem.itemType,
        itemId: extendModalItem.itemId,
        itemTitle: extendModalItem.itemTitle,
        daysToAdd,
        customExpiryIso: customDate,
        purchaseId: extendModalItem.purchaseId,
        grantId: extendModalItem.grantId,
      });

      if (!res.success) {
        showToast(res.error || "Failed to extend validity.", "error");
        setIsExtending(false);
        return;
      }

      showToast(`Extended access for ${extendModalItem.itemTitle} until ${res.newExpiry.slice(0, 10)}!`);
      setExtendModalItem(null);
      await reload();

      // Refresh drawerStudent
      if (drawerStudent) {
        const dbStudents = await fetchDbStudents();
        const updatedTarget = dbStudents.find(
          (s) => s.id === drawerStudent.id || s.phone === drawerStudent.phone
        );
        if (updatedTarget) setDrawerStudent(updatedTarget);
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to extend access.", "error");
    } finally {
      setIsExtending(false);
    }
  };

  // Submit Revoke Access
  const handleConfirmRevokeAccess = async () => {
    if (!revokeModalItem) return;
    if (!revokeReason.trim()) {
      setRevokeError("Mandatory reason is required to revoke access.");
      return;
    }
    setRevokeError("");
    setIsRevoking(true);

    try {
      const res = await revokeStudentAccess({
        studentPhone: revokeModalItem.student.phone,
        studentName: revokeModalItem.student.name,
        itemType: revokeModalItem.itemType,
        itemId: revokeModalItem.itemId,
        itemTitle: revokeModalItem.itemTitle,
        reason: revokeReason.trim(),
        purchaseId: revokeModalItem.purchaseId,
        grantId: revokeModalItem.grantId,
      });

      if (!res.success) {
        setRevokeError(res.error || "Failed to revoke access.");
        setIsRevoking(false);
        return;
      }

      showToast(`Terminated access to ${revokeModalItem.itemTitle}. Logged to audit trail.`);
      setRevokeModalItem(null);
      setRevokeReason("");
      await reload();

      // Refresh drawerStudent
      if (drawerStudent) {
        const dbStudents = await fetchDbStudents();
        const updatedTarget = dbStudents.find(
          (s) => s.id === drawerStudent.id || s.phone === drawerStudent.phone
        );
        if (updatedTarget) setDrawerStudent(updatedTarget);
      }
    } catch (err: any) {
      setRevokeError(err?.message || "Failed to revoke access.");
    } finally {
      setIsRevoking(false);
    }
  };

  // Filter students with Typo-Tolerant Fuzzy Search (Fuse.js)
  const searchMatchedStudents = React.useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return students;
    const fuse = createStudentFuzzySearch(students);
    const results = fuse.search(q);
    if (results.length > 0) {
      return results.map((r) => r.item);
    }
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.phone.includes(q) ||
        s.email.toLowerCase().includes(q.toLowerCase()) ||
        (s.school && s.school.toLowerCase().includes(q.toLowerCase()))
    );
  }, [students, searchQuery]);

  const expiring7DaysCount = React.useMemo(() => {
    return students.filter((s) => {
      const hasExpiringCourse = (s.coursesTaken || []).some(
        (c) => !c.isExpired && c.daysLeft !== undefined && c.daysLeft <= 7 && c.daysLeft > 0
      );
      const hasExpiringBook = (s.enrolledBooks || []).some(
        (b) => !b.isExpired && b.daysLeft !== undefined && b.daysLeft <= 7 && b.daysLeft > 0
      );
      return hasExpiringCourse || hasExpiringBook;
    }).length;
  }, [students]);

  const filteredStudents = searchMatchedStudents
    .filter((s) => {
      if (recentSignupsOnly) {
        const regTime = new Date(
          s.registeredAt || (s as any).joinedAt || (s as any).created_at || 0
        ).getTime();
        const sevenDaysAgo = Date.now() - 7 * 86400000;
        if (regTime < sevenDaysAgo) return false;
      }

      if (expiring7DaysOnly) {
        const hasExpiringCourse = (s.coursesTaken || []).some(
          (c) => !c.isExpired && c.daysLeft !== undefined && c.daysLeft <= 7 && c.daysLeft > 0
        );
        const hasExpiringBook = (s.enrolledBooks || []).some(
          (b) => !b.isExpired && b.daysLeft !== undefined && b.daysLeft <= 7 && b.daysLeft > 0
        );
        if (!hasExpiringCourse && !hasExpiringBook) return false;
      }

      const matchesDistrict =
        districtFilter === "all" || s.district.toLowerCase() === districtFilter.toLowerCase();

      const matchesTaluka =
        talukaFilter === "all" || (s.taluka && s.taluka.toLowerCase() === talukaFilter.toLowerCase());

      const matchesSchool =
        schoolFilter === "all" || (s.school && s.school.toLowerCase() === schoolFilter.toLowerCase());

      const matchesCourse =
        courseFilter === "all" ||
        s.enrolledCourseCodes.includes(courseFilter) ||
        s.enrolledCourseCodes.some((c) => c.includes(courseFilter));

      // Progress Filter
      let matchesProgress = true;
      const totalLessons = s.totalLessonsCount || 20;
      const pct = Math.round((s.completedLessonsCount / totalLessons) * 100);
      if (progressFilter === "0-25") matchesProgress = pct >= 0 && pct <= 25;
      else if (progressFilter === "26-75") matchesProgress = pct > 25 && pct <= 75;
      else if (progressFilter === "76-99") matchesProgress = pct > 75 && pct < 100;
      else if (progressFilter === "100") matchesProgress = pct >= 100;

      return matchesDistrict && matchesTaluka && matchesSchool && matchesCourse && matchesProgress;
    })
    .sort((a, b) => {
      // Sort newly registered students to the top
      const timeA = new Date(
        a.registeredAt || (a as any).joinedAt || (a as any).created_at || 0
      ).getTime();
      const timeB = new Date(
        b.registeredAt || (b as any).joinedAt || (b as any).created_at || 0
      ).getTime();
      return timeB - timeA;
    });

  return (
    <PermissionGuard permission="students.view">
      <AdminShell>
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading tracking-tight">
                  Student Finder & 360 Telemetrics
                </h1>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF]">
                  students.view
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Lookup enrolled learners across Maharashtra, inspect watch duration, open 360 profile, and trigger direct In-App notifications.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              {/* Cash Grant Admission Button */}
              <button
                type="button"
                onClick={() => handleOpenCashModal()}
                className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>💵</span>
                <span>Grant Admission / Offline Access</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>📊</span>
                <span>Export Excel (.xlsx)</span>
              </button>

              <div className="flex items-center gap-2 bg-[#F5F7FF] border border-[#E4E8F8] px-3.5 py-2 rounded-full text-xs">
                <span>🔔</span>
                <span className="font-bold text-[#0E1B3D]">Direct In-App & WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Filters Bar: Search, District, Taluka, School, Course, Progress */}
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
                  placeholder="Search name, phone, school, email..."
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

              {/* Counter */}
              <div className="text-xs font-semibold text-[#5A6478] flex items-center gap-2 self-start md:self-auto">
                <span>Showing</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F5F7FF] text-[#0E1B3D] font-bold border border-[#E4E8F8]">
                  {filteredStudents.length} of {students.length} students
                </span>
              </div>
            </div>

            {/* Dropdown Selectors: District, Taluka, School, Course */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E4E8F8]">
              {/* District Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                  District:
                </label>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Districts ({distinctDistricts.length})</option>
                  {distinctDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Taluka Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                  Taluka:
                </label>
                <select
                  value={talukaFilter}
                  onChange={(e) => setTalukaFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Talukas ({distinctTalukas.length})</option>
                  {distinctTalukas.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* School Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                  School / College:
                </label>
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Schools ({distinctSchools.length})</option>
                  {distinctSchools.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#5A6478] mb-1">
                  Enrolled Course:
                </label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-semibold text-[#0E1B3D] focus:outline-none"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Chips: Expiring in 7 Days & Progress */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#E4E8F8]">
              {/* Recent Signups Filter Chip */}
              <button
                type="button"
                onClick={() => setRecentSignupsOnly((prev) => !prev)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  recentSignupsOnly
                    ? "bg-[#0B57D0] text-white shadow-xs"
                    : "bg-[#EEF4FF] text-[#0B57D0] hover:bg-[#DDEBFF] border border-[#D0E2FF]"
                }`}
              >
                <span>🆕</span>
                <span>Recent Signups / New Students</span>
              </button>

              {/* Expiring in 7 Days Filter Chip */}
              <button
                type="button"
                onClick={() => setExpiring7DaysOnly((prev) => !prev)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  expiring7DaysOnly
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                }`}
              >
                <span>⚠️</span>
                <span>Expiring in 7 Days</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200/80 font-black">
                  {expiring7DaysCount}
                </span>
              </button>

              {isMainAdmin && (
                <>
                  <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider ml-2 mr-1">
                    Progress:
                  </span>
                  {[
                    { key: "all", label: "All Progress" },
                    { key: "0-25", label: "0-25% Starter" },
                    { key: "26-75", label: "26-75% In Progress" },
                    { key: "76-99", label: "76-99% Advanced" },
                    { key: "100", label: "🏆 100% Completed" },
                  ].map((chip) => {
                    const isActive = progressFilter === chip.key;
                    return (
                      <button
                        key={chip.key}
                        onClick={() => setProgressFilter(chip.key as any)}
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
                </>
              )}
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="space-y-4 py-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#E4E8F8]">
                    <div className="space-y-2 w-1/3">
                      <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                      <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                    </div>
                    <div className="space-y-2 w-1/4">
                      <div className="h-3.5 bg-slate-200 rounded-md w-2/3" />
                      <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                    </div>
                    <div className="h-6 bg-slate-200 rounded-full w-20" />
                  </div>
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-14 text-center">
                <span className="text-4xl">🎓</span>
                <h3 className="text-base font-bold text-[#0E1B3D] mt-2">No students match your criteria</h3>
                <p className="text-xs text-[#5A6478] mt-1">
                  Try adjusting the district, taluka, school, or progress filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E8F8] text-[#8A94A6] uppercase tracking-wider font-semibold">
                      <th className="pb-3.5 pl-3">Student Name</th>
                      <th className="pb-3.5">Region & School</th>
                      <th className="pb-3.5">Enrolled Courses</th>
                      {isMainAdmin && <th className="pb-3.5">Watch Telemetrics</th>}
                      <th className="pb-3.5">Status</th>
                      <th className="pb-3.5 text-right pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E8F8]">
                    {filteredStudents.map((s) => {
                      const totalLessons = s.totalLessonsCount || 20;
                      const progressPct = Math.min(100, Math.round((s.completedLessonsCount / totalLessons) * 100));

                      return (
                        <tr key={s.id} className="hover:bg-[#F9FAFF] transition-colors group">
                          {/* Student Name */}
                          <td className="py-4 pl-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#E6F0FF] text-[#0B57D0] font-bold flex items-center justify-center text-xs">
                                {s.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[#0E1B3D] text-xs">
                                  {s.name}
                                </p>
                                <p className="text-[#5A6478] font-mono text-[11px] mt-0.5">
                                  {s.phone}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Region & School */}
                          <td className="py-4">
                            <p className="font-bold text-[#0E1B3D] text-xs">
                              {s.district} {s.taluka ? `• ${s.taluka}` : ""}
                            </p>
                            <p className="text-[#5A6478] text-[11px] truncate max-w-xs mt-0.5">
                              {s.school || "School Not Specified"}
                            </p>
                          </td>

                          {/* Enrolled Courses */}
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {s.enrolledCourseCodes.map((code) => (
                                <span
                                  key={code}
                                  className="px-2 py-0.5 bg-[#EEF4FF] text-[#0B57D0] border border-[#D0E2FF] rounded-md font-mono text-[10px] font-bold"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Watch Progress (Main Admin Only) */}
                          {isMainAdmin && (
                            <td className="py-4">
                              <div className="w-36 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-[#0E1B3D]">{s.completedLessonsCount} / {totalLessons} done</span>
                                  <span className="text-[#0B57D0]">{progressPct}%</span>
                                </div>
                                <div className="w-full bg-[#E4E8F8] h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#0B57D0] rounded-full transition-all"
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-[#8A94A6]">
                                  {Math.floor(s.totalWatchSec / 3600)}h {Math.floor((s.totalWatchSec % 3600) / 60)}m watch time
                                </p>
                              </div>
                            </td>
                          )}

                          {/* Status */}
                          <td className="py-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ● Active
                            </span>
                          </td>

                          {/* Actions: 360 Profile + Send Alert */}
                          <td className="py-4 text-right pr-3">
                            <div className="flex items-center justify-end gap-2">
                              {/* 1-Click WhatsApp Renewal Reminder if expiring in <= 7 days */}
                              {(() => {
                                const expiringItem = [
                                  ...(s.coursesTaken || []),
                                  ...(s.enrolledBooks || []),
                                ].find(
                                  (item: any) =>
                                    !item.isExpired &&
                                    item.daysLeft !== undefined &&
                                    item.daysLeft <= 7 &&
                                    item.daysLeft > 0
                                );
                                if (!expiringItem) return null;
                                return (
                                  <button
                                    onClick={() =>
                                      handleSendWhatsAppRenewalReminder(
                                        s,
                                        (expiringItem as any).courseTitle || (expiringItem as any).title,
                                        expiringItem.daysLeft
                                      )
                                    }
                                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs animate-pulse"
                                    title="1-Click WhatsApp Renewal Reminder using Platform Settings Template"
                                  >
                                    <span>⚠️</span>
                                    <span>{expiringItem.daysLeft}d: Remind</span>
                                  </button>
                                );
                              })()}

                              {/* Direct WhatsApp Button */}
                              <a
                                href={`https://wa.me/91${s.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(`Namaskar ${s.name}, Prashant Dhumal Sir / MindMaster Academy kadun sandesh:`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 bg-[#E8F8F2] hover:bg-[#D5F2E6] border border-[#C6ECD9] text-[#0A8554] rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Chat on WhatsApp"
                              >
                                <span>💬</span> WhatsApp
                              </a>

                              {/* 360 Profile Drawer Button */}
                              <button
                                onClick={() => handleOpen360Drawer(s)}
                                className="px-3 py-1.5 bg-[#EEF4FF] hover:bg-[#DDEBFF] border border-[#D0E2FF] text-[#0B57D0] rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>🔍</span> 360 View
                              </button>

                              {/* Direct Alert */}
                              <button
                                onClick={() => handleOpenNotify(s)}
                                className="px-3 py-1.5 bg-[#F5F7FF] hover:bg-[#EEF4FF] border border-[#E4E8F8] text-[#5A6478] hover:text-[#0E1B3D] rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                                title="Send in-app notification"
                              >
                                <span>🔔</span> Alert
                              </button>

                              {/* Grant Course to this Student */}
                              <button
                                onClick={() => handleOpenCashModal(s)}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="Grant course to this student"
                              >
                                <span>💵</span> Grant Access
                              </button>
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
          {/* 360 STUDENT TELEMETRICS DRAWER */}
          {/* ========================================================= */}
          {drawerStudent && (
            <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                onClick={() => setDrawerStudent(null)}
              />

              <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
                <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-[#E4E8F8] flex items-center justify-between bg-[#FAFBFD]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] text-[#0B57D0] font-black flex items-center justify-center text-base border border-[#D0E2FF]">
                        {drawerStudent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-[#0E1B3D] font-heading">
                            {drawerStudent.name}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ● Active
                          </span>
                        </div>
                        <p className="text-xs text-[#5A6478] mt-0.5">
                          Enrolled on {drawerStudent.joinedAt} • Active {drawerStudent.lastActiveAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* WHATSAPP CHIP */}
                      <a
                        href={`https://wa.me/91${drawerStudent.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(`Namaskar ${drawerStudent.name}, Prashant Dhumal Sir / MindMaster Academy kadun sandesh:`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-[#E8F8F2] hover:bg-[#D5F2E6] border border-[#C6ECD9] text-[#0A8554] rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>💬</span> WhatsApp
                      </a>

                      {/* CALL CHIP */}
                      <a
                        href={`tel:${drawerStudent.phone}`}
                        className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>📞</span> Call Student
                      </a>

                      {/* EDIT PROFILE */}
                      {(isMainAdmin || canManageGrants) && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditProfile(drawerStudent)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                          title="Edit Student Profile & Phone"
                        >
                          <span>✏️</span> Edit Profile
                        </button>
                      )}

                      {/* RESET PASSWORD */}
                      {(isMainAdmin || canManageGrants) && (
                        <button
                          type="button"
                          onClick={() => handleOpenResetPassword(drawerStudent)}
                          className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                          title="Reset student password / PIN"
                        >
                          <span>🔑</span> Reset Password
                        </button>
                      )}

                      {/* RESET DEVICE LOCK */}
                      {(isMainAdmin || canManageGrants) && (
                        <button
                          type="button"
                          onClick={() => handleResetSessionLock(drawerStudent)}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                          title="Clear active device session token"
                        >
                          <span>🔓</span> Reset Device Lock
                        </button>
                      )}

                      <button
                        onClick={() => setDrawerStudent(null)}
                        className="w-8 h-8 rounded-full bg-white border border-[#E4E8F8] flex items-center justify-center text-sm text-[#5A6478] hover:bg-slate-100 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Drawer Body Content */}
                  <div className="p-6 space-y-6 flex-1">
                    {/* 1. Registration Details Card */}
                    <div className="bg-[#FAFBFD] border border-[#E4E8F8] rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0E1B3D] flex items-center gap-1.5">
                        <span>📋</span> Registration & Institutional Profile
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-bold">Mobile Phone</span>
                          <p className="font-mono font-bold text-[#0E1B3D] mt-0.5">{drawerStudent.phone}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-bold">Email Address</span>
                          <p className="font-semibold text-[#0E1B3D] mt-0.5 truncate">{drawerStudent.email}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-bold">District & Taluka</span>
                          <p className="font-semibold text-[#0E1B3D] mt-0.5">{drawerStudent.district}, {drawerStudent.taluka || "N/A"}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-[#8A94A6] uppercase font-bold">School / Academic Wing</span>
                          <p className="font-semibold text-[#0E1B3D] mt-0.5">{drawerStudent.school || "MindMaster Open Cohort"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-bold">Standard / Segment</span>
                          <p className="font-semibold text-[#0B57D0] mt-0.5">{drawerStudent.standard || "General Learner"}</p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Courses Taken with Expiry Chips & Progress Bars */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0E1B3D] flex items-center gap-1.5">
                        <span>📚</span> Enrolled Courses & 3-Month Access Status
                      </h3>

                      {(!drawerStudent.coursesTaken || drawerStudent.coursesTaken.length === 0) ? (
                        <div className="p-3 bg-[#F5F7FF] rounded-xl text-xs text-[#5A6478]">
                          {drawerStudent.enrolledCourseTitles.join(", ")}
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {drawerStudent.coursesTaken.map((course) => (
                            <div
                              key={course.courseId}
                              className="p-4 bg-white border border-[#E4E8F8] rounded-2xl shadow-xs space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs bg-[#EEF4FF] text-[#0B57D0] px-2 py-0.5 rounded border border-[#D0E2FF]">
                                    {course.courseCode}
                                  </span>
                                  <span className="font-bold text-xs text-[#0E1B3D]">
                                    {course.courseTitle}
                                  </span>
                                </div>

                                {/* Expiry Chip & Action Buttons */}
                                <div className="flex flex-wrap items-center gap-1.5 justify-end">
                                  {course.isExpired ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                      ❌ Access Expired
                                    </span>
                                  ) : course.daysLeft <= 7 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                      ⚠️ Expires in {course.daysLeft} days
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      ⏳ {course.daysLeft} days left
                                    </span>
                                  )}

                                  {/* WhatsApp Renewal Reminder for expiring/expired */}
                                  {(course.isExpired || course.daysLeft <= 7) && (
                                    <button
                                      type="button"
                                      onClick={() => handleSendWhatsAppRenewalReminder(drawerStudent, course.courseTitle, course.daysLeft)}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E8F8F2] text-[#0A8554] border border-[#C6ECD9] hover:bg-[#D5F2E6] transition cursor-pointer"
                                      title="Send WhatsApp renewal reminder"
                                    >
                                      💬 WA
                                    </button>
                                  )}

                                  {/* Extend Validity */}
                                  {(canManageGrants || isMainAdmin) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setExtendModalItem({
                                          student: drawerStudent,
                                          itemType: "course",
                                          itemId: course.courseId,
                                          itemTitle: course.courseTitle,
                                        });
                                        setExtendOption("30");
                                        setExtendCustomDate("");
                                      }}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                                      title="Extend Course Validity"
                                    >
                                      ⏳ Extend
                                    </button>
                                  )}

                                  {/* Revoke Access */}
                                  {(canManageGrants || isMainAdmin) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRevokeModalItem({
                                          student: drawerStudent,
                                          itemType: "course",
                                          itemId: course.courseId,
                                          itemTitle: course.courseTitle,
                                        });
                                        setRevokeReason("");
                                        setRevokeError("");
                                      }}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                                      title="Revoke Course Access"
                                    >
                                      🚫 Revoke
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-[#5A6478]">Course Completion:</span>
                                  <span className="font-bold text-[#0E1B3D]">
                                    {course.completedLessons} / {course.totalLessons} lessons ({course.progressPct}%)
                                  </span>
                                </div>
                                <div className="w-full bg-[#E4E8F8] h-2 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#0B57D0] rounded-full transition-all"
                                    style={{ width: `${course.progressPct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2B. Enrolled Paid / Course-Linked Books */}
                    <div className="space-y-3 pt-2 border-t border-[#E4E8F8]">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0E1B3D] flex items-center gap-1.5">
                        <span>📖</span> Enrolled Paid & Course-Linked Books
                      </h3>

                      {(!drawerStudent.enrolledBooks || drawerStudent.enrolledBooks.length === 0) ? (
                        <div className="p-3.5 bg-[#F5F7FF] rounded-2xl text-xs text-[#5A6478]">
                          No independent digital books currently granted or purchased.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {drawerStudent.enrolledBooks.map((book) => (
                            <div
                              key={book.id}
                              className="p-3.5 bg-white border border-[#E4E8F8] rounded-2xl shadow-xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                                      BOOK
                                    </span>
                                    <span className="font-bold text-xs text-[#0E1B3D]">
                                      {book.title}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-[#5A6478]">
                                    {book.code ? `Linked to ${book.code}` : "Standalone Edition"} • Expires: {book.expiresAt ? book.expiresAt.slice(0, 10) : "Active"}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 justify-end">
                                  {book.isExpired ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                      ❌ Expired
                                    </span>
                                  ) : book.daysLeft <= 7 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                      ⚠️ {book.daysLeft}d left
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      ⏳ {book.daysLeft}d left
                                    </span>
                                  )}

                                  {(book.isExpired || book.daysLeft <= 7) && (
                                    <button
                                      type="button"
                                      onClick={() => handleSendWhatsAppRenewalReminder(drawerStudent, book.title, book.daysLeft)}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E8F8F2] text-[#0A8554] border border-[#C6ECD9] hover:bg-[#D5F2E6] transition cursor-pointer"
                                      title="Send WhatsApp renewal reminder"
                                    >
                                      💬 WA
                                    </button>
                                  )}

                                  {(canManageGrants || isMainAdmin) && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setExtendModalItem({
                                            student: drawerStudent,
                                            itemType: "book",
                                            itemId: book.id,
                                            itemTitle: book.title,
                                            currentExpiry: book.expiresAt,
                                            purchaseId: book.purchaseId,
                                            grantId: book.grantId,
                                          });
                                          setExtendOption("30");
                                          setExtendCustomDate("");
                                        }}
                                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                                        title="Extend Book Validity"
                                      >
                                        ⏳ Extend
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRevokeModalItem({
                                            student: drawerStudent,
                                            itemType: "book",
                                            itemId: book.id,
                                            itemTitle: book.title,
                                            purchaseId: book.purchaseId,
                                            grantId: book.grantId,
                                          });
                                          setRevokeReason("");
                                          setRevokeError("");
                                        }}
                                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                                        title="Revoke Book Access"
                                      >
                                        🚫 Revoke
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. ADMIN-ONLY PER-LESSON WATCH TRACKING SECTION */}
                    {isMainAdmin ? (
                      <div className="space-y-3 pt-2 border-t border-[#E4E8F8]">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0E1B3D] flex items-center gap-1.5">
                            <span>⏱️</span> Per-Lesson Watch Telemetry (Admin Only)
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            ⚡ Founder Clearance
                          </span>
                        </div>

                        {(!drawerStudent.lessonWatches || drawerStudent.lessonWatches.length === 0) ? (
                          <div className="p-4 bg-[#F5F7FF] rounded-2xl text-xs text-[#5A6478] text-center">
                            No individual lecture watch events recorded for this learner yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {drawerStudent.lessonWatches.map((w) => (
                              <div
                                key={w.lessonId}
                                className="p-3 bg-white border border-[#E4E8F8] rounded-xl flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] font-bold text-[#0B57D0]">
                                      {w.courseCode}
                                    </span>
                                    <span className="font-semibold text-[#0E1B3D]">{w.lessonTitle}</span>
                                  </div>
                                  <p className="text-[10px] text-[#5A6478] mt-0.5">
                                    Watched {Math.floor(w.watchedSec / 60)}m of {Math.floor(w.durationSec / 60)}m • {w.lastWatchedAt}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    w.isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {w.completionPct}% {w.isCompleted ? "Completed" : "Partial"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                        <span>🔒</span>
                        <span>Individual lecture-level telemetric playback history is restricted to Main Admin.</span>
                      </div>
                    )}

                    {/* 4. Activity Rows */}
                    <div className="space-y-3 pt-2 border-t border-[#E4E8F8]">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0E1B3D] flex items-center gap-1.5">
                        <span>⚡</span> Recent Learning & Portal Activity
                      </h3>

                      {(!drawerStudent.recentActivity || drawerStudent.recentActivity.length === 0) ? (
                        <div className="p-4 bg-[#F5F7FF] rounded-2xl text-xs text-[#5A6478] text-center">
                          Student has been actively enrolled. No custom activity triggers recorded.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {drawerStudent.recentActivity.map((act) => (
                            <div
                              key={act.id}
                              className="p-3 bg-[#FAFBFD] border border-[#E4E8F8] rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-[#0B57D0]"></span>
                                <div>
                                  <p className="font-bold text-[#0E1B3D] text-[11px]">{act.action}</p>
                                  <p className="text-[10px] text-[#5A6478]">{act.description}</p>
                                </div>
                              </div>
                              <span className="font-mono text-[10px] text-[#8A94A6]">{act.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-4 border-t border-[#E4E8F8] bg-[#FAFBFD] flex items-center justify-between">
                    <span className="text-[11px] text-[#8A94A6]">
                      Audit Logged: <code className="text-[#0B57D0]">STUDENT_360_VIEW</code>
                    </span>
                    <button
                      onClick={() => setDrawerStudent(null)}
                      className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Close 360 View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SEND IN-APP NOTIFICATION MODAL (NO WHATSAPP) */}
          {/* ========================================================= */}
          {notifyStudent && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-[#E4E8F8] max-w-lg w-full p-6 md:p-8 shadow-2xl animate-fadeIn space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E8F8]">
                  <div>
                    <h3 className="text-lg font-bold text-[#0E1B3D] font-heading flex items-center gap-2">
                      <span>🔔</span> Send In-App Notification
                    </h3>
                    <p className="text-xs text-[#5A6478] mt-0.5">
                      Target: <span className="font-bold text-[#0E1B3D]">{notifyStudent.name}</span> ({notifyStudent.phone})
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifyStudent(null)}
                    className="w-8 h-8 rounded-full bg-[#F5F7FF] hover:bg-[#EEF4FF] text-[#5A6478] flex items-center justify-center text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {notifySuccess ? (
                  <div className="py-8 text-center space-y-2 animate-fadeIn">
                    <span className="text-4xl">✅</span>
                    <h4 className="text-base font-bold text-[#0E1B3D]">Notification Dispatched!</h4>
                    <p className="text-xs text-[#5A6478]">
                      Delivered directly to {notifyStudent.name}'s in-app notification center.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendNotification} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                        Notification Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="e.g. Keep Going! Lesson Drill Ready"
                        className="w-full px-3.5 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                        Notification Message *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        placeholder="Type personalized student alert..."
                        className="w-full px-3.5 py-2 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                    </div>

                    <div className="p-3 bg-[#FAFBFD] border border-[#E4E8F8] rounded-xl text-[11px] text-[#5A6478]">
                      🔒 In-App push notifications deliver directly to the student portal on next app open without WhatsApp or third-party SMS costs.
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E8F8]">
                      <button
                        type="button"
                        onClick={() => setNotifyStudent(null)}
                        className="px-4 py-2 rounded-full border border-[#E4E8F8] text-xs font-bold text-[#5A6478] hover:bg-[#F5F7FF] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Send In-App Alert →
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* OFFLINE CASH ADMISSION / DIRECT COURSE GRANT MODAL */}
          {/* ========================================================= */}
          {isCashModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl border border-amber-200 max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-4 my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg border border-amber-200">
                      💵
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[#0E1B3D] font-heading">
                        Grant Offline Admission / Course Access
                      </h3>
                      <p className="text-[11px] text-[#5A6478]">
                        Provide direct course access via Cash, UPI, or Free Scholarship grant
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCashModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Success Receipt State */}
                {cashSuccessReceipt ? (
                  <div className="py-4 space-y-4 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                      ✅
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">
                        Course Admission Successfully Granted!
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Student has received an in-app notification and course lectures are unlocked instantly.
                      </p>
                    </div>

                    {/* Receipt Details Box */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Student Name:</span>
                        <span className="font-bold text-slate-900">{cashSuccessReceipt.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mobile Number:</span>
                        <span className="font-mono font-bold text-slate-900">+91 {cashSuccessReceipt.studentPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Course:</span>
                        <span className="font-bold text-blue-700">{cashSuccessReceipt.courseTitle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payment Mode:</span>
                        <span className="font-bold text-emerald-700">{cashSuccessReceipt.paymentMode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount Collected:</span>
                        <span className="font-extrabold text-slate-900">₹{cashSuccessReceipt.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Access Expiry:</span>
                        <span className="font-bold text-amber-800">
                          {new Date(cashSuccessReceipt.expiresAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {cashSuccessReceipt.whatsappUrl && (
                      <a
                        href={cashSuccessReceipt.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-full shadow flex items-center justify-center gap-2 transition"
                      >
                        <span>📲 Share Receipt on WhatsApp</span>
                      </a>
                    )}

                    <button
                      onClick={() => setIsCashModalOpen(false)}
                      className="w-full py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-xs rounded-full shadow transition"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  /* Form */
                  <form onSubmit={handleSaveCashGrant} className="space-y-4 text-xs">
                    {cashError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold text-xs">
                        {cashError}
                      </div>
                    )}

                    {/* Student Phone & Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1">
                          Mobile Number (10 digits) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            value={cashPhone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setCashPhone(val);
                              // Auto lookup student name if matches existing
                              if (val.length === 10) {
                                const found = students.find((s) => s.phone.replace(/\D/g, "").slice(-10) === val);
                                if (found) setCashName(found.name);
                              }
                            }}
                            placeholder="8459344077"
                            className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1">
                          Student Full Name
                        </label>
                        <input
                          type="text"
                          value={cashName}
                          onChange={(e) => setCashName(e.target.value)}
                          placeholder="e.g. Rohan Kulkarni"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                        />
                      </div>
                    </div>

                    {/* Course or Book Selection */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">
                        Select Course or Digital Book *
                      </label>
                      <select
                        required
                        value={cashCourseId}
                        onChange={(e) => {
                          const cId = e.target.value;
                          setCashCourseId(cId);
                          if (cId === "all") {
                            setCashAmount(cashPaymentMode === "scholarship" ? 0 : 999);
                            setCashAccessMonths(12);
                            return;
                          }
                          const sel = courses.find((c) => c.id === cId || c.code === cId);
                          if (sel) {
                            setCashAmount(cashPaymentMode === "scholarship" ? 0 : Math.round(sel.pricePaise / 100));
                            setCashAccessMonths(sel.accessMonths || 6);
                            return;
                          }
                          const staffBooks = getStaffBooks();
                          const selB = staffBooks.find((b) => b.id === cId || b.code === cId);
                          if (selB) {
                            setCashAmount(cashPaymentMode === "scholarship" ? 0 : Math.round((selB.pricePaise || 49900) / 100));
                            setCashAccessMonths(12);
                          }
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                      >
                        <option value="all">🌟 All Academy Courses (सर्व कोर्सेस - Full Bundle)</option>
                        <optgroup label="🎓 Academy Courses">
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code}: {c.title} (₹{Math.round(c.pricePaise / 100)})
                            </option>
                          ))}
                        </optgroup>
                        {getStaffBooks().length > 0 && (
                          <optgroup label="📚 Digital Books & Worksheets">
                            {getStaffBooks().map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.code || "BOOK"}: {b.title} (₹{Math.round((b.pricePaise || 49900) / 100)})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {/* Validity Duration & Payment Mode */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block font-bold text-[#0E1B3D]">
                            Access Validity Duration *
                          </label>
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => setCashValidityMode("preset")}
                              className={`px-2 py-0.5 rounded-lg border transition ${
                                cashValidityMode === "preset"
                                  ? "bg-[#0B57D0] text-white border-[#0B57D0]"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              Presets
                            </button>
                            <button
                              type="button"
                              onClick={() => setCashValidityMode("custom_days")}
                              className={`px-2 py-0.5 rounded-lg border transition ${
                                cashValidityMode === "custom_days"
                                  ? "bg-[#0B57D0] text-white border-[#0B57D0]"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              Custom Days
                            </button>
                            <button
                              type="button"
                              onClick={() => setCashValidityMode("fixed_date")}
                              className={`px-2 py-0.5 rounded-lg border transition ${
                                cashValidityMode === "fixed_date"
                                  ? "bg-[#0B57D0] text-white border-[#0B57D0]"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              Exam Date
                            </button>
                          </div>
                        </div>

                        {cashValidityMode === "preset" && (
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
                                  setCashPresetDays(preset.days);
                                  setCashAccessMonths(preset.months || 1);
                                }}
                                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition cursor-pointer text-center ${
                                  cashPresetDays === preset.days
                                    ? "bg-[#0B57D0] text-white border-[#0B57D0] shadow-xs"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-[#0B57D0]"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {cashValidityMode === "custom_days" && (
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                min={1}
                                max={3650}
                                value={cashCustomDays}
                                onChange={(e) => setCashCustomDays(Math.max(1, Number(e.target.value)))}
                                placeholder="e.g. 45"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                              />
                              <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">Days</span>
                            </div>
                            <p className="text-[11px] text-[#5A6478]">Valid for {cashCustomDays} days</p>
                          </div>
                        )}

                        {cashValidityMode === "fixed_date" && (
                          <div>
                            <input
                              type="date"
                              required={cashValidityMode === "fixed_date"}
                              min={new Date().toISOString().slice(0, 10)}
                              value={cashFixedDate}
                              onChange={(e) => setCashFixedDate(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-[#0B57D0] rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Access automatically expires on this examination date</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-[#0E1B3D] mb-1">
                          Payment Mode *
                        </label>
                        <select
                          value={cashPaymentMode}
                          onChange={(e) => setCashPaymentMode(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none"
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">Direct UPI (PhonePe/GPay)</option>
                          <option value="scholarship">Free Grant / Scholarship</option>
                        </select>
                      </div>
                    </div>

                    {/* Cash Amount Collected */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-[#0E1B3D]">
                          Amount Collected (in ₹)
                        </label>
                        <span className="text-[10px] text-slate-500 font-semibold">Cash or UPI Amount</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={cashAmount}
                          onChange={(e) => setCashAmount(Number(e.target.value))}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none"
                        />
                      </div>

                      {/* Quick presets */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {[0, 99, 149, 199, 299, 499].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCashAmount(amt)}
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                              cashAmount === amt
                                ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold"
                                : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block font-bold text-[#0E1B3D] mb-1">
                        Remarks / Notes
                      </label>
                      <input
                        type="text"
                        value={cashRemarks}
                        onChange={(e) => setCashRemarks(e.target.value)}
                        placeholder="e.g. Cash fee collected during Satara seminar / Scholarship"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0E1B3D] focus:outline-none"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsCashModalOpen(false)}
                        className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-sm transition"
                      >
                        Confirm Admission →
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* POWER ACTION: EXTEND VALIDITY MODAL */}
          {/* ========================================================= */}
          {extendModalItem && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-amber-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏳</span>
                    <div>
                      <h3 className="text-base font-bold text-[#0E1B3D]">Extend Access Validity</h3>
                      <p className="text-[11px] text-[#5A6478]">
                        {extendModalItem.itemType === "course" ? "Course" : "Handbook"}:{" "}
                        <span className="font-bold text-[#0E1B3D]">{extendModalItem.itemTitle}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExtendModalItem(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                  Learner: <span className="font-bold">{extendModalItem.student.name}</span> ({extendModalItem.student.phone})
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#0E1B3D]">
                    Choose Extension Duration:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "+7 Days", val: "7" },
                      { label: "+15 Days", val: "15" },
                      { label: "+30 Days", val: "30" },
                      { label: "+90 Days", val: "90" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setExtendOption(opt.val as any)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                          extendOption === opt.val
                            ? "bg-[#0B57D0] text-white border-[#0B57D0] shadow-xs"
                            : "bg-[#F5F7FF] text-[#0E1B3D] border-[#E4E8F8] hover:border-[#0B57D0]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExtendOption("custom")}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold border text-left transition cursor-pointer flex items-center justify-between ${
                        extendOption === "custom"
                          ? "bg-[#EEF4FF] text-[#0B57D0] border-[#0B57D0]"
                          : "bg-[#FAFBFD] text-[#5A6478] border-[#E4E8F8] hover:border-slate-300"
                      }`}
                    >
                      <span>📅 Or Select Custom Expiry Date</span>
                      <span className="text-[10px] uppercase font-bold">{extendOption === "custom" ? "Selected" : "Pick"}</span>
                    </button>

                    {extendOption === "custom" && (
                      <div className="mt-2.5">
                        <input
                          type="date"
                          value={extendCustomDate}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setExtendCustomDate(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F5F7FF] border border-[#0B57D0] rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isExtending}
                    onClick={() => setExtendModalItem(null)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isExtending}
                    onClick={handleConfirmExtend}
                    className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {isExtending ? "Extending..." : "Confirm Extension →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* POWER ACTION: REVOKE ACCESS MODAL */}
          {/* ========================================================= */}
          {revokeModalItem && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-rose-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚫</span>
                    <div>
                      <h3 className="text-base font-bold text-rose-800">Revoke Student Access</h3>
                      <p className="text-[11px] text-slate-500">
                        {revokeModalItem.itemType === "course" ? "Course" : "Book"}:{" "}
                        <span className="font-bold text-[#0E1B3D]">{revokeModalItem.itemTitle}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRevokeModalItem(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                  <p className="font-bold">⚠️ Irreversible Access Termination</p>
                  <p className="text-[11px] text-rose-700">
                    This will immediately revoke access for <span className="font-bold">{revokeModalItem.student.name}</span> ({revokeModalItem.student.phone}). All revocation events are logged in the security audit trail.
                  </p>
                </div>

                {revokeError && (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {revokeError}
                  </p>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0E1B3D]">
                    Mandatory Reason for Revocation *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="e.g. Student requested full refund, fee dispute, or misconduct..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isRevoking}
                    onClick={() => setRevokeModalItem(null)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isRevoking}
                    onClick={handleConfirmRevokeAccess}
                    className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {isRevoking ? "Revoking..." : "Revoke Access Now 🚫"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* POWER ACTION: EDIT STUDENT PROFILE MODAL */}
          {/* ========================================================= */}
          {editStudentModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✏️</span>
                    <div>
                      <h3 className="text-base font-bold text-[#0E1B3D]">Edit Student Profile & Phone</h3>
                      <p className="text-[11px] text-[#5A6478]">
                        Cascades phone & name across profiles, grants, and video likes
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditStudentModal(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {editProfileError && (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    {editProfileError}
                  </p>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                      10-Digit Mobile Phone *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        value={editDistrict}
                        onChange={(e) => setEditDistrict(e.target.value)}
                        placeholder="e.g. Satara"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0E1B3D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                        Taluka
                      </label>
                      <input
                        type="text"
                        value={editTaluka}
                        onChange={(e) => setEditTaluka(e.target.value)}
                        placeholder="e.g. Karad"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0E1B3D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                      School / Academic Institution
                    </label>
                    <input
                      type="text"
                      value={editSchool}
                      onChange={(e) => setEditSchool(e.target.value)}
                      placeholder="e.g. Shivaji High School"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0E1B3D] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSavingProfile}
                      onClick={() => setEditStudentModal(null)}
                      className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile ? "Saving Updates..." : "Save & Cascade Updates →"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* POWER ACTION: RESET PASSWORD MODAL */}
          {/* ========================================================= */}
          {resetPasswordModalStudent && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-amber-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔑</span>
                    <div>
                      <h3 className="text-base font-bold text-[#0E1B3D]">Reset Student Password</h3>
                      <p className="text-[11px] text-[#5A6478]">
                        Instantly update password with Argon2id hash & generate WhatsApp credentials receipt
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setResetPasswordModalStudent(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900">
                  Student: <span className="font-bold">{resetPasswordModalStudent.name}</span> (
                  <span className="font-mono font-bold">{resetPasswordModalStudent.phone}</span>)
                </div>

                {passwordResetSuccess ? (
                  <div className="py-3 space-y-3 text-center">
                    <span className="text-3xl">✅</span>
                    <h4 className="text-sm font-bold text-slate-900">Password Updated Successfully!</h4>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs font-mono space-y-1">
                      <p><span className="text-slate-500 font-sans">Mobile:</span> +91 {passwordResetSuccess.phone}</p>
                      <p><span className="text-slate-500 font-sans">New Password:</span> <span className="font-bold text-[#0B57D0]">{passwordResetSuccess.newPass}</span></p>
                    </div>
                    <a
                      href={passwordResetSuccess.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-full shadow flex items-center justify-center gap-2 transition"
                    >
                      <span>📲 Send New Password on WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setResetPasswordModalStudent(null)}
                      className="w-full py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmResetPassword} className="space-y-3.5">
                    {passwordResetError && (
                      <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        {passwordResetError}
                      </p>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-[#0E1B3D]">
                          New Password / PIN *
                        </label>
                        <button
                          type="button"
                          onClick={() => setNewPasswordInput(`Mind@${Math.floor(1000 + Math.random() * 9000)}`)}
                          className="text-[10px] font-bold text-[#0B57D0] hover:underline cursor-pointer"
                        >
                          ⚡ Generate Easy Password
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        minLength={6}
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="e.g. Mind@1234 or Student@2026"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Minimum 6 characters. Immediately replaces previous password.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isResettingPassword}
                        onClick={() => setResetPasswordModalStudent(null)}
                        className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isResettingPassword}
                        className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {isResettingPassword ? "Updating Hash..." : "Set New Password 🔑"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
          {actionFeedbackToast && (
            <div
              className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 animate-fadeIn text-xs font-bold ${
                actionFeedbackToast.type === "success"
                  ? "bg-slate-900 text-white border-slate-700"
                  : "bg-rose-900 text-white border-rose-700"
              }`}
            >
              <span>{actionFeedbackToast.type === "success" ? "✅" : "⚠️"}</span>
              <span>{actionFeedbackToast.message}</span>
            </div>
          )}
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
