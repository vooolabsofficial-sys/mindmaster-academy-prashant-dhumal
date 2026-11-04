"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Globe,
  LogOut,
  ChevronRight,
  BookOpen,
  Smartphone,
  ShieldCheck,
  PhoneCall,
  Lock,
  RefreshCw,
  Gauge,
  FileText,
  HelpCircle,
  X,
  LifeBuoy,
  CreditCard,
  Sparkles,
  Download,
  Check,
  Send,
  Plus,
  Trash2,
  AlertCircle,
  Receipt,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { generateFeeReceiptPdf } from "@/lib/pdfGenerator";
import { getStudentTransactionHistory, StudentTransactionItem } from "@/app/actions/studentAccess";
import { getStaffCourses } from "@/lib/staffStore";
import AppShell from "@/components/navigation/AppShell";
import { signOutAndClearCookie } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/LanguageContext";
import { useTheme } from "@/lib/ThemeContext";
import LanguageModal from "@/components/common/LanguageModal";
import { getAllOfflineBooks, clearAllOfflineVault, syncQueuedWatchHeartbeats, OfflineBookRecord } from "@/lib/offlineStorage";
import { MAHARASHTRA_DISTRICTS } from "@/lib/constants";
import { toast } from "sonner";
import {
  Conversation,
  Message,
  TicketCategory,
  getConversationsForStudent,
  createTicket,
  fetchDbConversations,
  fetchDbMessages,
  subscribeToSupportLiveUpdates,
  sendMessage,
} from "@/lib/messageStore";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { currentLanguage, languageInfo } = useLanguage();
  const isMarathi = currentLanguage === "mr";

  // Profile data
  const [fullName, setFullName] = useState("Student");
  const [phone, setPhone] = useState("");
  const [standard, setStandard] = useState("10th Standard / SSC");
  const [targetExam, setTargetExam] = useState("Vedic Maths & Speed Memory");
  const [school, setSchool] = useState("");
  const [village, setVillage] = useState("");
  const [taluka, setTaluka] = useState("");
  const [district, setDistrict] = useState("Satara");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Modals & Sheets
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPurchasesModalOpen, setIsPurchasesModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<StudentTransactionItem[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState("");

  // App & Video Preferences
  const [playbackSpeed, setPlaybackSpeed] = useState("1x");

  // Security & PIN state
  const [recoveryPin, setRecoveryPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
  const [isResettingDevice, setIsResettingDevice] = useState(false);

  // Offline Vault Storage State
  const [offlineBooks, setOfflineBooks] = useState<OfflineBookRecord[]>([]);
  const [isClearingCacheAndSyncing, setIsClearingCacheAndSyncing] = useState(false);

  // Support Tickets State
  const [tickets, setTickets] = useState<Conversation[]>([]);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>("Other");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Message[]>([]);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Platform helpdesk settings
  const [platformSettings, setPlatformSettings] = useState({
    supportPhone: "+91 84593 44077",
    centreAddress: "Powai Naka, Satara | Zeal Chowk, Narhe, Pune",
  });

  const refreshTickets = async () => {
    try {
      await fetchDbConversations();
      const studentPhone = phone || (typeof window !== "undefined" ? localStorage.getItem("mindmaster_verified_phone") : "") || "";
      if (studentPhone) {
        const studentId = `std-${studentPhone.replace(/\D/g, "").slice(-10)}`;
        const studentTickets = getConversationsForStudent(studentPhone || studentId);
        setTickets(studentTickets);
      } else {
        setTickets([]);
      }
    } catch {}
  };

  const refreshOfflineVault = async () => {
    try {
      const books = await getAllOfflineBooks();
      setOfflineBooks(books);
    } catch {}
  };

  const loadTransactions = async (studentPhone: string) => {
    setIsLoadingTransactions(true);
    try {
      const serverTxs = await getStudentTransactionHistory({ userPhone: studentPhone });
      const staffCourses = getStaffCourses();

      const localPurchases = JSON.parse(localStorage.getItem("mindmaster_active_purchases") || "{}");
      const localGrants = JSON.parse(localStorage.getItem("mma_grant_purchases") || "[]");

      const merged: StudentTransactionItem[] = [...serverTxs];

      // Merge local active purchases if not already present
      Object.keys(localPurchases).forEach((courseCode) => {
        const item = localPurchases[courseCode];
        const alreadyExists = merged.some(
          (m) => m.courseCode.toLowerCase() === courseCode.toLowerCase() || (item.orderId && m.id === item.orderId)
        );
        if (!alreadyExists && item) {
          const courseInfo = staffCourses.find(
            (c) => c.code.toLowerCase() === courseCode.toLowerCase() || c.id === courseCode
          );
          merged.push({
            id: item.orderId || `ord-${courseCode}-${Date.now()}`,
            receiptNo: `REC-${courseCode.toUpperCase()}-8492`,
            title: item.title || courseInfo?.title || `${courseCode.toUpperCase()} Masterclass`,
            courseCode: courseCode.toUpperCase(),
            itemType: "course",
            date: item.enrolledAt || new Date().toISOString(),
            amountPaise: item.price || (courseInfo?.pricePaise || 249900),
            paymentMode: "online",
            paymentId: item.paymentId || "pay_razorpay_verified",
            orderId: item.orderId,
            status: "active",
            expiresAt: item.expiresAt || new Date(Date.now() + 90 * 86400000).toISOString(),
          });
        }
      });

      // Merge local grant purchases
      if (Array.isArray(localGrants)) {
        localGrants.forEach((g: any) => {
          if (
            g.studentPhone &&
            studentPhone &&
            g.studentPhone.replace(/[^0-9]/g, "").endsWith(studentPhone.slice(-10))
          ) {
            const already = merged.some((m) => m.id === g.id);
            if (!already) {
              merged.push({
                id: g.id || `grnt-${Date.now()}`,
                receiptNo: `REC-GRNT-${(g.courseCode || "MM").toUpperCase()}-${(g.id || "").slice(-6).toUpperCase()}`,
                title: g.courseTitle || "MindMaster Academic Program",
                courseCode: (g.courseCode || "MM").toUpperCase(),
                itemType: "course",
                date: g.grantedAt || new Date().toISOString(),
                amountPaise: (Number(g.amountPaid) || 0) * 100,
                paymentMode: g.paymentMode || "cash",
                paymentId: g.paymentId || `PAY-${(g.id || "").slice(-8)}`,
                status: g.installmentDue && Number(g.installmentDue) > 0 ? "installment" : "active",
                expiresAt: g.expiresAt || g.validUntil || new Date(Date.now() + 90 * 86400000).toISOString(),
                installmentDue: Number(g.installmentDue) || 0,
                installmentDueDate: g.installmentDueDate,
                receiptText: g.receiptText,
              });
            }
          }
        });
      }

      setTransactions(merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) {
      console.warn("Could not load transactions:", e);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleDownloadReceipt = (tx: StudentTransactionItem) => {
    try {
      generateFeeReceiptPdf({
        receiptNo: tx.receiptNo,
        date: new Date(tx.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        studentName: fullName || "Student",
        studentPhone: phone || "",
        district: district || "Maharashtra",
        courseCode: tx.courseCode || "MM",
        courseTitle: tx.title,
        amountPaise: tx.amountPaise,
        paymentId: tx.paymentId,
        accessMonths: 3,
        expiryDate: new Date(tx.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      });
      toast.success(`Fee Receipt ${tx.receiptNo} downloaded!`);
    } catch (err: any) {
      toast.error("Could not generate PDF receipt.");
    }
  };

  const handleShareReceiptWhatsApp = (tx: StudentTransactionItem) => {
    const text = `MindMaster Academy Official Fee Receipt\n\nStudent: ${fullName}\nCourse: ${tx.title}\nReceipt No: ${tx.receiptNo}\nPayment ID: ${tx.paymentId}\nAmount: ₹${Math.round(tx.amountPaise / 100)}\nDate: ${new Date(tx.date).toLocaleDateString("en-IN")}\nValidity: Till ${new Date(tx.expiresAt).toLocaleDateString("en-IN")}\n\nAccess portal: https://mindmaster.academy/login`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setPlatformSettings({
            supportPhone: data.settings.support_phone || "+91 84593 44077",
            centreAddress: `${data.settings.centre_address || "Satara"} | ${data.settings.pune_address || "Narhe, Pune"}`,
          });
        }
      })
      .catch(() => {});

    try {
      const raw = localStorage.getItem("mindmaster_user_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.full_name) setFullName(p.full_name);
        if (p.phone) setPhone(p.phone);
        if (p.standard) setStandard(p.standard);
        if (p.target_exam) setTargetExam(p.target_exam);
        if (p.school_name || p.school) setSchool(p.school_name || p.school);
        if (p.village) setVillage(p.village);
        if (p.taluka) setTaluka(p.taluka);
        if (p.district) setDistrict(p.district);
        if (p.recovery_pin) setRecoveryPin(p.recovery_pin);
      }
      const savedPhone = localStorage.getItem("mindmaster_verified_phone");
      if (savedPhone && !phone) setPhone(savedPhone);

      const sp = localStorage.getItem("mindmaster_playback_speed");
      if (sp) setPlaybackSpeed(sp);
    } catch {}

    refreshOfflineVault();
    refreshTickets();
    const activePhone = phone || (typeof window !== "undefined" ? localStorage.getItem("mindmaster_verified_phone") : "") || "";
    if (activePhone) loadTransactions(activePhone);
  }, []);

  // Listen to live ticket updates
  useEffect(() => {
    const unsub = subscribeToSupportLiveUpdates(() => {
      refreshTickets();
      if (activeTicketId) {
        fetchDbMessages(activeTicketId).then((msgs) => setTicketMessages(msgs));
      }
    });
    return () => unsub();
  }, [phone, activeTicketId]);

  // Load ticket messages when expanded
  useEffect(() => {
    if (activeTicketId) {
      fetchDbMessages(activeTicketId).then((msgs) => setTicketMessages(msgs));
    }
  }, [activeTicketId]);

  const cyclePlaybackSpeed = () => {
    const speeds = ["1x", "1.25x", "1.5x", "2x"];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    localStorage.setItem("mindmaster_playback_speed", nextSpeed);
    toast.success(`Video speed set to ${nextSpeed}`);
  };

  const handleInstallApp = () => {
    const promptEvent = (window as any).__mma_deferred_install_prompt;
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then((choice: any) => {
        if (choice.outcome === "accepted") {
          toast.success("MindMaster Academy installed successfully!");
        }
      });
    } else {
      // Dispatch modal event
      window.dispatchEvent(new CustomEvent("mma_open_install_modal"));
    }
  };

  const handleSaveAcademicProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const payload = {
      action: "update-profile",
      phone,
      fullName: fullName.trim(),
      standard: standard.trim(),
      targetExam: targetExam.trim(),
      schoolName: school.trim(),
      village: village.trim(),
      taluka: taluka.trim(),
      district: district.trim(),
    };

    try {
      await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const current = JSON.parse(localStorage.getItem("mindmaster_user_profile") || "{}");
      const updated = {
        ...current,
        full_name: fullName.trim(),
        standard: standard.trim(),
        target_exam: targetExam.trim(),
        school_name: school.trim(),
        village: village.trim(),
        taluka: taluka.trim(),
        district: district.trim(),
      };
      localStorage.setItem("mindmaster_user_profile", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      toast.success("Academic Profile updated successfully!");
      setIsEditProfileOpen(false);
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleClearCacheAndSync = async () => {
    setIsClearingCacheAndSyncing(true);
    try {
      const syncedCount = await syncQueuedWatchHeartbeats();
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_ALL_CACHES" });
      }
      await clearAllOfflineVault();
      await refreshOfflineVault();
      toast.success(
        syncedCount > 0
          ? `Synced ${syncedCount} lesson heartbeats & purged offline cache!`
          : "Offline storage & cache cleared successfully!"
      );
      setIsStorageModalOpen(false);
    } catch {
      toast.error("Could not complete offline cache sync.");
    } finally {
      setIsClearingCacheAndSyncing(false);
    }
  };

  const handleDeviceSessionReset = async () => {
    if (!phone) {
      toast.error("No verified mobile number found to reset session.");
      return;
    }
    setIsResettingDevice(true);
    try {
      const res = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-device", phone }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to reset device session.");
      }
      toast.success("Device lock reset! You can now log in on a new device.");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset device session lock.");
    } finally {
      setIsResettingDevice(false);
    }
  };

  const handleUpdateRecoveryPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryPin || recoveryPin.length < 4) {
      toast.error("PIN must be at least 4 digits.");
      return;
    }
    setIsUpdatingSecurity(true);
    try {
      const current = JSON.parse(localStorage.getItem("mindmaster_user_profile") || "{}");
      localStorage.setItem(
        "mindmaster_user_profile",
        JSON.stringify({ ...current, recovery_pin: recoveryPin })
      );
      toast.success("Security PIN updated successfully!");
      setIsSecurityModalOpen(false);
    } catch {
      toast.error("Could not update PIN.");
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      toast.error("Please fill in subject and description.");
      return;
    }
    setIsSubmittingTicket(true);
    try {
      const studentId = phone ? `std-${phone.replace(/\D/g, "").slice(-10)}` : "std-learner";
      const created = await createTicket({
        studentId,
        studentName: fullName,
        studentPhone: phone,
        category: ticketCategory,
        subject: ticketSubject.trim(),
        description: ticketDescription.trim(),
      });
      if (created) {
        toast.success("Support ticket opened successfully!");
        setTicketSubject("");
        setTicketDescription("");
        setIsNewTicketOpen(false);
        refreshTickets();
      }
    } catch {
      toast.error("Failed to open ticket.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendTicketReply = async (convId: string) => {
    if (!ticketReplyText.trim()) return;
    setIsSendingReply(true);
    try {
      const studentId = phone ? `std-${phone.replace(/\D/g, "").slice(-10)}` : "std-learner";
      const newMsg = sendMessage({
        conversationId: convId,
        senderType: "student",
        senderId: studentId,
        senderName: fullName,
        body: ticketReplyText.trim(),
      });
      setTicketMessages((prev) => [...prev, newMsg]);
      setTicketReplyText("");
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const executeSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout", phone }),
      });
    } catch {}

    try {
      localStorage.removeItem("mindmaster_user_profile");
      localStorage.removeItem("mindmaster_verified_phone");
      localStorage.removeItem("mindmaster_active_purchases");
      localStorage.removeItem("mindmaster_session_token");
      localStorage.removeItem("mma_student_session");
      sessionStorage.clear();
    } catch {}

    await signOutAndClearCookie();
    setShowLogoutConfirm(false);
    setIsLoggingOut(false);
    router.replace("/login");
  };

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "ST";

  const totalOfflineMb = offlineBooks
    .reduce((acc, b) => acc + (b.fileSizeMb || 0), 0)
    .toFixed(1);

  return (
    <AppShell>
      <title>Settings | MindMaster Academy</title>
      <meta name="description" content="Manage your MindMaster Academy account, preferences, device & security." />

      <div className="max-w-xl mx-auto px-4 py-4 sm:py-6 pb-28 select-none font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
        
        {/* Page Title Header (iOS Large Title Style) */}
        <div className="mb-4 sm:mb-6 px-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isMarathi ? "सेटिंग्ज" : "Settings"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isMarathi ? "तुमचे खाते, भाषा व ॲप प्राधान्ये" : "Account, language and app preferences"}
          </p>
        </div>

        {/* =========================================================================
            1. APPLE ID STYLE PROFILE CARD
           ========================================================================= */}
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1E293B]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {fullName}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 shrink-0">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                {phone || "Mobile verified"}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {standard} • {district || "Satara"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-slate-200/80 dark:border-slate-700 text-xs font-bold transition shrink-0 active:scale-95"
          >
            {isMarathi ? "माहिती बदला" : "Edit"}
          </button>
        </div>

        {/* =========================================================================
            2. PHONE-STYLE VERTICAL INSET GROUPED LISTS
           ========================================================================= */}
        <div className="flex flex-col gap-5">
          
          {/* GROUP 1: ACCOUNT & LEARNING */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1.5">
              {isMarathi ? "विद्यार्थी खाते" : "Account & Learning"}
            </div>
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
              
              {/* Row: Academic Profile */}
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "अकादमिक प्रोफाइल" : "Academic Profile"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      {school ? `${school} • ${standard}` : standard}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-xs text-slate-500">{district}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              {/* Row: My Courses */}
              <Link
                href="/my-courses"
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "माझे ऍक्टिव्ह कोर्सेस" : "Enrolled Masterclasses"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      {isMarathi ? "प्रगती व प्रमाणपत्रे" : "Progress & certificates"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              {/* Row: My Purchases & Fee Receipts */}
              <button
                type="button"
                onClick={() => {
                  const p = phone || localStorage.getItem("mindmaster_verified_phone") || "";
                  if (p) loadTransactions(p);
                  setIsPurchasesModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "माझे कोर्सेस, व्यवहार व फी पावत्या" : "My Purchases & Fee Receipts"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      {isMarathi ? "पेमेंट इतिहास, ट्रान्झॅक्शन आयडी व PDF पावती" : "Payment history, orders & official PDF receipts"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                    {transactions.length > 0 ? `${transactions.length} Receipts` : "View"}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

          {/* GROUP 2: APP PREFERENCES */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1.5">
              {isMarathi ? "ॲप प्राधान्ये" : "Preferences"}
            </div>
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
              
              {/* Row: Language Selection */}
              <button
                type="button"
                onClick={() => setIsLangModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500 text-white flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "ॲप भाषा (Language)" : "App Language"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      {languageInfo.englishName} ({languageInfo.nativeName})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {languageInfo.nativeName}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>

              {/* Row: iOS Style Dark Mode Toggle Switch */}
              <div className="w-full flex items-center justify-between px-4 py-3 select-none">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "नाईट स्टडी मोड (Dark Mode)" : "Night Study Mode"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      {isDark ? "Dark theme active" : "Daylight mode active"}
                    </span>
                  </div>
                </div>
                {/* Native iOS-Style Green Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDark}
                  onClick={toggleTheme}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ease-in-out ${
                    isDark ? "bg-[#34C759]" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      isDark ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Row: Video Playback Speed */}
              <button
                type="button"
                onClick={cyclePlaybackSpeed}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "व्हिडिओ प्लेबॅक स्पीड" : "Video Playback Speed"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      {isMarathi ? "टॅप करून स्पीड बदला" : "Tap to cycle speed"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {playbackSpeed}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            </div>
          </div>

          {/* GROUP 3: APP & DEVICE */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1.5">
              {isMarathi ? "ॲप्लिकेशन व डिव्हाइस" : "Application & Device"}
            </div>
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
              
              {/* Row: Install App to Phone */}
              <button
                type="button"
                onClick={handleInstallApp}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "ॲप फोनमध्ये इन्स्टॉल करा" : "Install App to Phone"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      {isMarathi ? "होमस्क्रीनवर शॉर्टकट ॲड करा" : "Add to home screen for fast access"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Row: Offline Storage & Cache */}
              <button
                type="button"
                onClick={() => setIsStorageModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "ऑफलाइन स्टोरेज व कॅशे" : "Offline Storage & Vault"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      {totalOfflineMb} MB cached offline
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">{offlineBooks.length} books</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>

              {/* Row: Reset Device Lock */}
              <button
                type="button"
                onClick={handleDeviceSessionReset}
                disabled={isResettingDevice}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
                    <RefreshCw className={`w-4 h-4 ${isResettingDevice ? "animate-spin" : ""}`} />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "डिव्हाइस लॉक रिसेट करा" : "Reset Device Lock"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      {isMarathi ? "नवीन फोनवर लॉगिन करण्यासाठी" : "Allow login on a new device"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* GROUP 4: SECURITY */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1.5">
              {isMarathi ? "सुरक्षा व पासवर्ड" : "Security"}
            </div>
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
              
              {/* Row: Recovery PIN */}
              <button
                type="button"
                onClick={() => setIsSecurityModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "सुरक्षा पिन (Recovery PIN)" : "Recovery PIN & Password"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      {recoveryPin ? "4-digit PIN configured" : "Setup recovery PIN"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* GROUP 5: SUPPORT & HELPDESK */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1.5">
              {isMarathi ? "मदत व सपोर्ट" : "Support & Help"}
            </div>
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
              
              {/* Row: Support Tickets */}
              <button
                type="button"
                onClick={() => setIsTicketsModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <LifeBuoy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "सपोर्ट तिकिटे (Helpdesk)" : "Support Tickets & Helpdesk"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      {tickets.length > 0 ? `${tickets.length} active tickets` : "Direct helpdesk support"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {tickets.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      {tickets.length}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>

              {/* Row: Satara Helpline */}
              <a
                href={`tel:${platformSettings.supportPhone.replace(/\s+/g, "")}`}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "सातारा केंद्र हेल्पलाईन" : "Satara Campus Helpline"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-mono">
                      {platformSettings.supportPhone}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>

              {/* Row: Portal User Guide */}
              <Link
                href="/help"
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-500 text-white flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {isMarathi ? "ॲप वापरण्याची मार्गदर्शिका" : "How to Use Portal Guide"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block">
                      FAQs &amp; video tutorials
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* GROUP 6: ABOUT & LEGAL */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1.5">
              {isMarathi ? "माहिती व नियम" : "About & Legal"}
            </div>
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
              
              {/* Row: App Version */}
              <div className="w-full flex items-center justify-between px-4 py-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    App Version
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  MindMaster v2.4 Pro
                </span>
              </div>

              {/* Row: Terms */}
              <Link
                href="/terms"
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-400 text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {isMarathi ? "नियम व अटी" : "Terms & Conditions"}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              {/* Row: Privacy Policy */}
              <Link
                href="/privacy-policy"
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-400 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {isMarathi ? "गोपनीयता धोरण" : "Privacy Policy"}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              {/* Row: Refund Policy */}
              <Link
                href="/refund-policy"
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-400 text-white flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {isMarathi ? "परतावा धोरण" : "Refund Policy"}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* GROUP 7: SIGN OUT */}
          <div className="pt-2">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                    {isMarathi ? "खात्यातून बाहेर पडा (Sign Out)" : "Sign Out"}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODALS & DETAILS SHEETS
         ========================================================================= */}

      {/* 1. Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isMarathi ? "विद्यार्थी माहिती अपडेट करा" : "Edit Academic Profile"}
                </h3>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAcademicProfile} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Standard / Class
                </label>
                <input
                  type="text"
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g. Yashwantrao Chavan High School"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                  >
                    {MAHARASHTRA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Taluka
                  </label>
                  <input
                    type="text"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    placeholder="e.g. Satara"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Village / Area
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Powai Naka"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Offline Storage Modal */}
      {isStorageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Offline Storage &amp; Cache
                </h3>
              </div>
              <button
                onClick={() => setIsStorageModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white block font-mono">
                {totalOfflineMb} MB
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
                Total Offline Stored Books &amp; Cache
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Clearing offline cache will free storage on your device and sync any pending lesson progress heartbeats to the server.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsStorageModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearCacheAndSync}
                disabled={isClearingCacheAndSyncing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearingCacheAndSyncing ? "Purging..." : "Clear Cache"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Security & PIN Modal */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Security Recovery PIN
                </h3>
              </div>
              <button
                onClick={() => setIsSecurityModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRecoveryPin} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  4-Digit Recovery PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 5432"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center text-lg tracking-widest text-slate-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used to verify your identity during fast device recovery.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSecurity}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isUpdatingSecurity ? "Saving..." : "Update PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Support Tickets Modal */}
      {isTicketsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-none">
                    Support Helpdesk
                  </h3>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Direct academic support with Prashant Dhumal Academy
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsTicketsModalOpen(false);
                  setActiveTicketId(null);
                  setIsNewTicketOpen(false);
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If creating new ticket */}
            {isNewTicketOpen ? (
              <form onSubmit={handleRaiseTicket} className="flex flex-col gap-3 text-xs overflow-y-auto">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value as TicketCategory)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Course Access">Course Access Issue</option>
                    <option value="Video Playback">Video Playback &amp; Player</option>
                    <option value="Payment / Order">Payment &amp; Fees</option>
                    <option value="Certificate">Certificate Claim</option>
                    <option value="Notes / Books">Notes &amp; PDF Vault</option>
                    <option value="Other">Other Academic Query</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Brief summary of your question"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Describe your issue with full details..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewTicketOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingTicket ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </form>
            ) : activeTicketId ? (
              /* View single ticket thread */
              <div className="flex flex-col flex-1 min-h-0">
                <button
                  type="button"
                  onClick={() => setActiveTicketId(null)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1 self-start cursor-pointer hover:underline"
                >
                  ← Back to Tickets List
                </button>
                <div className="flex-1 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 mb-3 min-h-[220px] max-h-[320px]">
                  {ticketMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col text-xs p-2.5 rounded-xl max-w-[85%] ${
                        msg.senderType === "student"
                          ? "ml-auto bg-blue-600 text-white"
                          : "mr-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <span className="text-[10px] opacity-75 font-bold mb-0.5">
                        {msg.senderName}
                      </span>
                      <span>{msg.body}</span>
                      <span className="text-[9px] opacity-60 mt-1 self-end">{msg.at}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ticketReplyText}
                    onChange={(e) => setTicketReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendTicketReply(activeTicketId)}
                    placeholder="Type your reply to academy staff..."
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendTicketReply(activeTicketId)}
                    disabled={isSendingReply}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Tickets List */
              <div className="flex flex-col flex-1 min-h-0">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 mb-3 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Open New Support Ticket</span>
                </button>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {tickets.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400">
                      No support tickets opened yet.
                    </div>
                  ) : (
                    tickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setActiveTicketId(t.id)}
                        className="py-3 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                              {t.category || "Support"}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {t.subject || t.lastMessage || "Ticket"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                            Status: {t.status || "Active"} • Last: {t.lastAt || "Today"}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Apple-Style Cupertino Logout Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-xs rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isMarathi ? "खात्यातून बाहेर पडायचे का?" : "Sign Out of Academy?"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isMarathi
                ? "तुम्ही पुन्हा तुमच्या मोबाईल नंबरने कधीही लॉगिन करू शकता."
                : "You can sign back in anytime with your registered mobile number."}
            </p>

            <div className="flex flex-col gap-2 w-full mt-6">
              <button
                type="button"
                onClick={executeSignOut}
                disabled={isLoggingOut}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2.5 Purchases & Fee Receipts History Modal */}
      {isPurchasesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-xl rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {isMarathi ? "माझे व्यवहार व अधिकृत फी पावत्या" : "My Orders & Official Fee Receipts"}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    MindMaster Academy • Satara Flagship Campus • GST &amp; ISO Accredited
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPurchasesModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Metrics Banner */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-center">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">
                  {isMarathi ? "एकूण कोर्सेस" : "Active Programs"}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                  {transactions.length}
                </span>
              </div>
              <div className="border-x border-slate-200 dark:border-slate-700/60 px-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">
                  {isMarathi ? "एकूण फी भरली" : "Total Invested"}
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  ₹{transactions.reduce((acc, t) => acc + Math.round(t.amountPaise / 100), 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">
                  {isMarathi ? "पावती दर्जा" : "Receipt Format"}
                </span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                  Official PDF
                </span>
              </div>
            </div>

            {/* Search Box if transactions > 1 */}
            {transactions.length > 2 && (
              <div className="relative">
                <input
                  type="text"
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  placeholder={isMarathi ? "कोर्स नाव किंवा पावती नंबरने शोधा..." : "Filter by course name or receipt no..."}
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Transaction Cards List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[50vh]">
              {isLoadingTransactions ? (
                <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <span>Loading payment history &amp; verified receipts...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isMarathi ? "कोणतेही व्यवहार उपलब्ध नाहीत" : "No Transaction History Found"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {isMarathi
                      ? "तुम्ही अद्याप कोणत्याही कोर्सची खरेदी केलेली नाही किंवा ऑफलाइन ॲडमिशन प्रलंबित आहे."
                      : "You have not purchased any masterclass yet or offline admission is pending."}
                  </p>
                  <Link
                    href="/courses"
                    onClick={() => setIsPurchasesModalOpen(false)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                  >
                    <span>{isMarathi ? "कोर्सेस पहा" : "Explore Courses"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                transactions
                  .filter((t) => {
                    if (!receiptSearch.trim()) return true;
                    const q = receiptSearch.toLowerCase();
                    return (
                      t.title.toLowerCase().includes(q) ||
                      t.receiptNo.toLowerCase().includes(q) ||
                      t.paymentId.toLowerCase().includes(q)
                    );
                  })
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex flex-col gap-3"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                              {tx.itemType === "book" ? "E-Book & Notes" : "Masterclass"}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {tx.paymentMode === "cash"
                                ? "Cash at Satara Center"
                                : tx.paymentMode === "upi"
                                ? "Direct UPI"
                                : tx.paymentMode === "scholarship"
                                ? "Scholarship Grant"
                                : "Razorpay Online"}
                            </span>
                            {tx.status === "installment" && tx.installmentDue && tx.installmentDue > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">
                                Dues: ₹{tx.installmentDue}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                            {tx.title}
                          </h4>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            ₹{Math.round(tx.amountPaise / 100).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                            Fees Paid
                          </span>
                        </div>
                      </div>

                      {/* Transaction Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Receipt No</span>
                          <strong className="text-slate-800 dark:text-slate-200 font-mono">{tx.receiptNo}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Payment ID</span>
                          <strong className="text-slate-800 dark:text-slate-200 font-mono truncate block" title={tx.paymentId}>
                            {tx.paymentId}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Date &amp; Time</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {new Date(tx.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="col-span-2 sm:col-span-3 pt-1 border-t border-slate-200/50 dark:border-slate-700/30 flex items-center justify-between text-[10px] text-slate-500">
                          <span>
                            Validity: Valid till <strong>{new Date(tx.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                          </span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ISO 9001:2015 Accredited
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(tx)}
                          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isMarathi ? "अधिकृत PDF पावती डाउनलोड करा" : "Download Official PDF Receipt"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareReceiptWhatsApp(tx)}
                          className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Share Receipt on WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer Note */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>MindMaster Helpline: +91 84593 44077</span>
              <span>All receipts are computer generated &amp; digitally stamped</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Language Selection Modal */}
      <LanguageModal isOpen={isLangModalOpen} onClose={() => setIsLangModalOpen(false)} />
    </AppShell>
  );
}
