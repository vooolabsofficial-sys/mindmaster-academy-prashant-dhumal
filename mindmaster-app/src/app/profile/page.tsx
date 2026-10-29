"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  MapPin,
  School,
  CreditCard,
  Globe,
  LogOut,
  ChevronRight,
  Edit3,
  CheckCircle2,
  BookOpen,
  Award,
  Download,
  Smartphone,
  ShieldCheck,
  PhoneCall,
  Target,
  Lock,
  KeyRound,
  Trash2,
  RefreshCw,
  Gauge,
  FileText,
  AlertCircle,
  HelpCircle,
  X,
  Sparkles,
  LifeBuoy,
  MessageSquare,
  Send,
  Plus,
  Clock,
  RotateCcw,
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { signOutAndClearCookie } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageModal from "@/components/common/LanguageModal";
import { generateFeeReceiptPdf, generateCourseCertificatePdf } from "@/lib/pdfGenerator";
import { getAllOfflineBooks, clearAllOfflineVault, syncQueuedWatchHeartbeats, OfflineBookRecord } from "@/lib/offlineStorage";
import SubmitButton from "@/components/ui/SubmitButton";
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

  // Navigation active tab inside settings
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "security" | "storage" | "tickets" | "legal">("profile");

  // Profile data
  const [fullName, setFullName] = useState("Verified Student");
  const [phone, setPhone] = useState("+91 84593 44077");
  const [standard, setStandard] = useState("10th Standard / SSC");
  const [targetExam, setTargetExam] = useState("Maharashtra Police Bharti 2026");
  const [school, setSchool] = useState("Maharashtra State Board");
  const [village, setVillage] = useState("Powai Naka");
  const [taluka, setTaluka] = useState("Satara");
  const [district, setDistrict] = useState("Satara");
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // App & Video Preferences
  const [playbackSpeed, setPlaybackSpeed] = useState("1x");
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isClaimingCert, setIsClaimingCert] = useState(false);

  // Security & PIN state
  const [newPassword, setNewPassword] = useState("");
  const [recoveryPin, setRecoveryPin] = useState("1234");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
  const [isResettingDevice, setIsResettingDevice] = useState(false);

  // Offline Vault Storage State
  const [offlineBooks, setOfflineBooks] = useState<OfflineBookRecord[]>([]);
  const [isClearingStorage, setIsClearingStorage] = useState(false);
  const [isClearingCacheAndSyncing, setIsClearingCacheAndSyncing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Support Tickets State
  const [tickets, setTickets] = useState<Conversation[]>([]);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>("Other");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketErrors, setTicketErrors] = useState<{ subject?: string; description?: string }>({});
  const [shakeField, setShakeField] = useState<string | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, Message[]>>({});
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Logout state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Platform dynamic helpdesk info
  const [platformSettings, setPlatformSettings] = useState({
    supportPhone: "+91 84593 44077",
    whatsappNumber: "+91 84593 44077",
    centreAddress: "Powai Naka, Satara | Zeal Chowk, Narhe, Pune",
    supportHours: "9:00 AM - 7:00 PM IST (Mon - Sat)",
    ticketNotice: "Tickets are directly routed to our academic administration team.",
  });

  const { currentLanguage, setLanguage, languageInfo, t } = useLanguage();

  const refreshTickets = async () => {
    try {
      await fetchDbConversations();
      const studentPhone = phone || (typeof window !== "undefined" ? localStorage.getItem("mindmaster_verified_phone") : "") || "";
      const studentId = studentPhone ? `std-${studentPhone.replace(/\D/g, "").slice(-10)}` : "std-learner";
      const studentTickets = getConversationsForStudent(studentPhone || studentId);
      setTickets(studentTickets);
    } catch {}
  };

  // Load profile, settings & offline storage on mount
  useEffect(() => {
    // 1. Fetch system helpdesk settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setPlatformSettings({
            supportPhone: data.settings.support_phone || "+91 84593 44077",
            whatsappNumber: data.settings.whatsapp_number || data.settings.support_phone || "+91 84593 44077",
            centreAddress: `${data.settings.centre_address || "Satara"} | ${data.settings.pune_address || "Narhe, Pune"}`,
            supportHours: data.settings.support_hours || "9:00 AM - 7:00 PM IST (Mon - Sat)",
            ticketNotice: data.settings.ticket_assignment_notice || "Tickets are directly routed to our academic administration team.",
          });
        }
      })
      .catch(() => {});

    // 2. Load stored user profile
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
      if (savedPhone) setPhone(savedPhone);

      const savedSpeed = localStorage.getItem("mma_default_playback_speed");
      if (savedSpeed) setPlaybackSpeed(savedSpeed);
    } catch {}

    // 3. Load offline books vault count
    refreshOfflineVault();

    // 4. Capture PWA beforeinstallprompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Subscribe to live ticket updates
  useEffect(() => {
    refreshTickets();
    const unsub = subscribeToSupportLiveUpdates(() => {
      refreshTickets();
      if (expandedTicketId) {
        fetchDbMessages(expandedTicketId).then((msgs) => {
          setExpandedMessages((prev) => ({ ...prev, [expandedTicketId]: msgs }));
        });
      }
    });
    return () => unsub();
  }, [phone, expandedTicketId]);

  const refreshOfflineVault = async () => {
    try {
      const books = await getAllOfflineBooks();
      setOfflineBooks(books);
    } catch {}
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

      // Update local storage
      const current = JSON.parse(localStorage.getItem("mindmaster_user_profile") || "{}");
      localStorage.setItem(
        "mindmaster_user_profile",
        JSON.stringify({
          ...current,
          full_name: fullName.trim(),
          standard: standard.trim(),
          target_exam: targetExam.trim(),
          school_name: school.trim(),
          school: school.trim(),
          village: village.trim(),
          taluka: taluka.trim(),
          district: district.trim(),
        })
      );

      toast.success("Academic Profile saved successfully!");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to save profile. Please check connection.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (recoveryPin && recoveryPin.length !== 4) {
      toast.error("Recovery PIN must be exactly 4 digits.");
      return;
    }

    setIsUpdatingSecurity(true);
    try {
      const res = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-profile",
          phone,
          ...(newPassword ? { newPassword } : {}),
          recoveryPin,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update security credentials.");

      const current = JSON.parse(localStorage.getItem("mindmaster_user_profile") || "{}");
      localStorage.setItem(
        "mindmaster_user_profile",
        JSON.stringify({
          ...current,
          recovery_pin: recoveryPin,
        })
      );

      toast.success("Security credentials updated! Your 4-digit PIN is saved.");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update security credentials.");
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  const handlePlaybackSpeedChange = (speed: string) => {
    setPlaybackSpeed(speed);
    try {
      localStorage.setItem("mma_default_playback_speed", speed);
      toast.success(`Default video speed set to ${speed}`);
    } catch {}
  };

  const handleClearCache = async () => {
    if (confirm("Are you sure you want to clear all offline cached books and playback progress?")) {
      setIsClearingStorage(true);
      try {
        await clearAllOfflineVault();
        await refreshOfflineVault();
        toast.success("Offline storage cleared successfully!");
      } catch {
        toast.error("Could not clear offline cache.");
      } finally {
        setIsClearingStorage(false);
      }
    }
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        toast.success("MindMaster Academy installed to device!");
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        "To install MindMaster Academy on your phone:\n\n1. In Chrome/Safari, tap the menu (⋮ or Share icon).\n2. Tap 'Add to Home Screen' or 'Install App'.\n3. Launch directly from your home screen for ultra-fast offline access!"
      );
    }
  };

  const handleClearCacheAndSync = async () => {
    setIsClearingCacheAndSyncing(true);
    try {
      // 1. Sync pending watch heartbeats to server first
      const syncedCount = await syncQueuedWatchHeartbeats();

      // 2. Clear Service Worker cache API
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // 3. Inform service worker to clear its caches
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_ALL_CACHES" });
      }

      // 4. Clear in-app offline books & playback vault
      await clearAllOfflineVault();
      await refreshOfflineVault();

      toast.success(
        syncedCount > 0
          ? `Synced ${syncedCount} lesson heartbeats & purged all offline app cache!`
          : "Offline cache and Service Worker storage purged successfully!"
      );
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
      toast.success("Active device session lock reset! You can now log in on a new device.");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset device session lock.");
    } finally {
      setIsResettingDevice(false);
    }
  };

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { subject?: string; description?: string } = {};

    if (!ticketSubject.trim()) {
      errors.subject = "Subject is required.";
      setShakeField("subject");
      setTimeout(() => setShakeField(null), 600);
    }
    if (!ticketDescription.trim()) {
      errors.description = "Description of your issue is required.";
      if (!errors.subject) {
        setShakeField("description");
        setTimeout(() => setShakeField(null), 600);
      }
    }

    if (Object.keys(errors).length > 0) {
      setTicketErrors(errors);
      return;
    }
    setTicketErrors({});
    setIsSubmittingTicket(true);

    try {
      const studentPhone = phone || (typeof window !== "undefined" ? localStorage.getItem("mindmaster_verified_phone") : "") || "";
      const studentId = studentPhone ? `std-${studentPhone.replace(/\D/g, "").slice(-10)}` : "std-learner";

      createTicket({
        studentId,
        studentName: fullName || "Student",
        studentPhone: studentPhone || undefined,
        courseTitle: targetExam || "MindMaster Course",
        category: ticketCategory,
        subject: ticketSubject.trim(),
        description: ticketDescription.trim(),
        district,
      });

      toast.success("Support ticket created! Our academic staff will review it shortly.");
      setIsTicketModalOpen(false);
      setTicketSubject("");
      setTicketDescription("");
      setTicketCategory("Other");
      await refreshTickets();
      setActiveTab("tickets");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit ticket.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const toggleTicketExpand = async (ticketId: string) => {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
    } else {
      setExpandedTicketId(ticketId);
      const msgs = await fetchDbMessages(ticketId);
      setExpandedMessages((prev) => ({ ...prev, [ticketId]: msgs }));
    }
  };

  const handleSendStudentReply = async (ticketId: string) => {
    if (!ticketReplyText.trim()) return;
    setIsSendingReply(true);
    try {
      const studentPhone = phone || (typeof window !== "undefined" ? localStorage.getItem("mindmaster_verified_phone") : "") || "";
      const studentId = studentPhone ? `std-${studentPhone.replace(/\D/g, "").slice(-10)}` : "std-learner";
      sendMessage({
        conversationId: ticketId,
        senderType: "student",
        senderId: studentId,
        senderName: fullName || "Student",
        body: ticketReplyText.trim(),
      });
      setTicketReplyText("");
      const msgs = await fetchDbMessages(ticketId);
      setExpandedMessages((prev) => ({ ...prev, [ticketId]: msgs }));
      await refreshTickets();
      toast.success("Reply sent to staff.");
    } catch {
      toast.error("Failed to send reply.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const getCategoryBadgeClass = (cat?: string) => {
    switch (cat) {
      case "Device Reset Request":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Video / Playback Issue":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "Payment / Course Access":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Notes / PDF Issue":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const handleSignOut = () => {
    setShowLogoutConfirm(true);
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
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
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
    router.refresh();
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
      <title>Student Settings & Academic Profile | MindMaster Academy</title>
      <meta
        name="description"
        content="Personalize your learning profile, playback preferences, security credentials, and manage offline cached books."
      />

      <div className="flex flex-col gap-6 max-w-4xl mx-auto font-sans pb-16 select-none">
        {/* =========================================================================
            1. PHONE-STYLE STUDENT HERO CARD
           ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E4E8F8] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#E8F1FD] text-[#0B57D0] flex items-center justify-center text-xl font-black ring-4 ring-white shadow-xs shrink-0">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-[#0E1B3D] tracking-tight">
                  {fullName}
                </h1>
                <span className="bg-blue-50 text-[#0B57D0] border border-blue-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  VERIFIED STUDENT
                </span>
              </div>
              <p className="text-xs text-[#5A6478] font-medium mt-1">
                {standard} • {district} ({taluka})
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                <span>{phone}</span>
                <span>•</span>
                <span>{school}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => {
                setTicketCategory("Other");
                setTicketSubject("");
                setTicketDescription("");
                setTicketErrors({});
                setIsTicketModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-[#0B57D0] text-xs font-bold hover:bg-blue-100 transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Raise In-App Support Ticket"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-[#0B57D0]" />
              <span>Raise Support Ticket</span>
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-white border border-[#E4E8F8] text-[#0E1B3D] text-xs font-bold hover:border-[#0B57D0] hover:bg-[#F5F7FF] transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#0B57D0]" />
              <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Segment Navigation Pills (Phone Settings Style) */}
        <div className="flex items-center gap-2 p-1.5 bg-[#F5F7FF] rounded-2xl border border-[#E4E8F8] overflow-x-auto text-xs font-bold text-[#5A6478]">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "profile" ? "bg-white text-[#0B57D0] shadow-xs font-extrabold" : "hover:text-[#0E1B3D]"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Academic Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "preferences" ? "bg-white text-[#0B57D0] shadow-xs font-extrabold" : "hover:text-[#0E1B3D]"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Language & Video</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "security" ? "bg-white text-[#0B57D0] shadow-xs font-extrabold" : "hover:text-[#0E1B3D]"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Password & Device</span>
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "tickets" ? "bg-white text-[#0B57D0] shadow-xs font-extrabold" : "hover:text-[#0E1B3D]"
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Support Tickets</span>
            {tickets.filter((t) => t.unreadStudent > 0).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "storage" ? "bg-white text-[#0B57D0] shadow-xs font-extrabold" : "hover:text-[#0E1B3D]"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Offline Vault</span>
          </button>
          <button
            onClick={() => setActiveTab("legal")}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "legal" ? "bg-white text-[#0B57D0] shadow-xs font-extrabold" : "hover:text-[#0E1B3D]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Receipts & Legal</span>
          </button>
        </div>

        {/* =========================================================================
            SECTION 1: EDIT ACADEMIC PROFILE
           ========================================================================= */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl p-6 border border-[#E4E8F8] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B57D0] flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0E1B3D]">Academic Student Details</h2>
                  <p className="text-xs text-[#5A6478]">
                    Your verified credentials registered with MindMaster Academy Satara & Pune centers.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled Learner
              </span>
            </div>

            <form onSubmit={handleSaveAcademicProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#0E1B3D] block mb-1.5">Student Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-[#E4E8F8] text-[#0E1B3D] font-medium focus:bg-white focus:border-[#0B57D0] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0E1B3D] block mb-1.5">Standard / Class / Year</label>
                  <select
                    value={standard}
                    onChange={(e) => setStandard(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-[#E4E8F8] text-[#0E1B3D] font-medium focus:bg-white focus:border-[#0B57D0] focus:outline-hidden"
                  >
                    <option value="5th - 8th Standard (Scholarship)">5th - 8th Standard (Scholarship)</option>
                    <option value="9th - 10th Standard (SSC / CBSE)">9th - 10th Standard (SSC / CBSE)</option>
                    <option value="11th - 12th Science / Commerce">11th - 12th Science / Commerce</option>
                    <option value="College Degree / Graduate">College Degree / Graduate</option>
                    <option value="Competitive Exam Aspirant">Competitive Exam Aspirant</option>
                    <option value="Working Professional / Teacher">Working Professional / Teacher</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0E1B3D] block mb-1.5">Target Exam / Goal</label>
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-[#E4E8F8] text-[#0E1B3D] font-medium focus:bg-white focus:border-[#0B57D0] focus:outline-hidden"
                  >
                    <option value="Maharashtra Police Bharti 2026">Maharashtra Police Bharti 2026</option>
                    <option value="MPSC / Civil Services Foundation">MPSC / Civil Services Foundation</option>
                    <option value="10th SSC Board Maths Special">10th SSC Board Maths Special</option>
                    <option value="Vedic Maths & Speed Memory">Vedic Maths & Speed Memory</option>
                    <option value="Scholarship Exam (5th / 8th Std)">Scholarship Exam (5th / 8th Std)</option>
                    <option value="General Speed Calculation & Memory">General Speed Calculation & Memory</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0E1B3D] block mb-1.5">School / College / Institute Name</label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. Yashwantrao Chavan College, Satara"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-[#E4E8F8] text-[#0E1B3D] font-medium focus:bg-white focus:border-[#0B57D0] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0E1B3D] block mb-1.5">Village / City</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Narhe / Powai Naka"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-[#E4E8F8] text-[#0E1B3D] font-medium focus:bg-white focus:border-[#0B57D0] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0E1B3D] block mb-1.5">Taluka</label>
                  <input
                    type="text"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    placeholder="e.g. Satara / Haveli"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-[#E4E8F8] text-[#0E1B3D] font-medium focus:bg-white focus:border-[#0B57D0] focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-[#0E1B3D] block mb-1.5">District (Maharashtra)</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-[#E4E8F8] text-[#0E1B3D] font-medium focus:bg-white focus:border-[#0B57D0] focus:outline-hidden"
                  >
                    <option value="Satara">Satara (Head Office)</option>
                    <option value="Pune">Pune (Campus Center)</option>
                    <option value="Kolhapur">Kolhapur</option>
                    <option value="Sangli">Sangli</option>
                    <option value="Solapur">Solapur</option>
                    <option value="Ahmednagar">Ahmednagar</option>
                    <option value="Chhatrapati Sambhajinagar">Chhatrapati Sambhajinagar</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Thane">Thane</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 rounded-xl bg-[#0B57D0] hover:bg-[#0052FF] text-white text-xs font-bold transition shadow-xs flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Academic Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            SECTION 2: APP LANGUAGE & VIDEO PLAYBACK PREFERENCES
           ========================================================================= */}
        {activeTab === "preferences" && (
          <div className="bg-white rounded-3xl p-6 border border-[#E4E8F8] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0E1B3D]">Language & Video Preferences</h2>
                  <p className="text-xs text-[#5A6478]">
                    Personalize default display language and player playback speed for Vedic lectures.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Language Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-[#E4E8F8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-extrabold text-[#0E1B3D]">
                    Language / भाषा: {languageInfo.nativeName} ({languageInfo.englishName})
                  </h3>
                  <p className="text-[11px] text-[#5A6478]">
                    Active: <strong className="text-[#0B57D0]">{languageInfo.nativeName}</strong> • English is the strict primary default.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {currentLanguage !== "en" && (
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage("en");
                        toast.success("Language reset to English (Default)");
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#0B57D0] text-white hover:bg-[#0052FF] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Switch to English</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("en");
                      toast.success("App language set to English (Default)");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      currentLanguage === "en"
                        ? "bg-[#0B57D0] text-white shadow-xs"
                        : "bg-white border border-[#E4E8F8] text-[#5A6478] hover:text-[#0E1B3D]"
                    }`}
                  >
                    English (Default)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("mr");
                      toast.success("App language set to Marathi (मराठी)");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      currentLanguage === "mr"
                        ? "bg-[#0B57D0] text-white shadow-xs"
                        : "bg-white border border-[#E4E8F8] text-[#5A6478] hover:text-[#0E1B3D]"
                    }`}
                  >
                    मराठी (Marathi)
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLangModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#E4E8F8] text-[#0B57D0] hover:bg-blue-50 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>All 8 Languages</span>
                  </button>
                </div>
              </div>

              {/* Default Playback Speed */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-[#E4E8F8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-extrabold text-[#0E1B3D] flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-[#0B57D0]" />
                    <span>Default Video Playback Speed</span>
                  </h3>
                  <p className="text-[11px] text-[#5A6478]">
                    Sets initial playback tempo when watching Prashant Sir&apos;s speed calculation videos.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {["1x", "1.25x", "1.5x", "2x"].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handlePlaybackSpeedChange(speed)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        playbackSpeed === speed
                          ? "bg-[#0B57D0] text-white shadow-xs"
                          : "bg-white border border-[#E4E8F8] text-[#5A6478] hover:text-[#0E1B3D]"
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3: PASSWORD & 4-DIGIT RECOVERY PIN & DEVICE LOCK
           ========================================================================= */}
        {activeTab === "security" && (
          <div className="bg-white rounded-3xl p-6 border border-[#E4E8F8] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0E1B3D]">Password & 4-Digit Security PIN</h2>
                  <p className="text-xs text-[#5A6478]">
                    Manage your single-device login password and quick 4-digit PIN for instant offline recovery.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Single-Device Protected
              </span>
            </div>

            <form onSubmit={handleUpdateSecurity} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                  Update Account Password (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave empty to keep current password..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-[#E4E8F8] text-xs font-medium text-[#0E1B3D] pr-10 focus:bg-white focus:border-[#0B57D0] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <X className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#5A6478] mt-1">Minimum 6 characters required if updating.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                  4-Digit Offline Recovery PIN
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="1234"
                  className="w-36 p-2.5 rounded-xl bg-slate-50 border border-[#E4E8F8] text-center text-sm font-mono font-bold tracking-widest text-[#0E1B3D] focus:bg-white focus:border-[#0B57D0] focus:outline-hidden"
                />
                <p className="text-[11px] text-[#5A6478] mt-1">
                  Use this 4-digit PIN to reset your password without waiting for SMS or OTP.
                </p>
              </div>

              <SubmitButton
                type="submit"
                loading={isUpdatingSecurity}
                loadingText="Updating Security..."
                className="px-6 py-2.5 rounded-xl bg-[#0B57D0] hover:bg-[#0052FF] text-white text-xs font-bold transition shadow-xs flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Update Security Credentials</span>
              </SubmitButton>
            </form>

            {/* Active Device Session Management & Reset */}
            <div className="border-t border-[#E4E8F8] pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B57D0] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0E1B3D]">
                    Active Device Session & Single-Device Protection
                  </h3>
                  <p className="text-xs text-[#5A6478]">
                    MindMaster Academy enforces single-device DRM to protect course videos. Only 1 device can stream at any time.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-[#E4E8F8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-[#0E1B3D]">Current Device Active</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      1 Device Locked
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A6478]">
                    Bound to Mobile Number: <strong className="text-[#0E1B3D] font-mono">{phone}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    If you changed your mobile phone or get a &quot;Session already active on another device&quot; prompt, release your session lock or raise a support ticket below.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <SubmitButton
                    type="button"
                    onClick={handleDeviceSessionReset}
                    loading={isResettingDevice}
                    loadingText="Resetting Device..."
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-[#0B57D0]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    <span>Request Device Reset</span>
                  </SubmitButton>

                  <button
                    type="button"
                    onClick={() => {
                      setTicketCategory("Device Reset Request");
                      setTicketSubject(`Device Reset Request for ${phone}`);
                      setTicketDescription(
                        `Hello Academic Team, I have switched my mobile device. Kindly verify and reset my active device lock for mobile number ${phone} so I can resume streaming.`
                      );
                      setIsTicketModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0B57D0] flex items-center gap-1.5 cursor-pointer"
                  >
                    <LifeBuoy className="w-3.5 h-3.5" />
                    <span>Raise Ticket for Device Reset</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 4: IN-APP SUPPORT TICKETS & HELPDESK
           ========================================================================= */}
        {activeTab === "tickets" && (
          <div className="bg-white rounded-3xl p-6 border border-[#E4E8F8] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E4E8F8] pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B57D0] flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0E1B3D]">In-App Support Tickets & Helpdesk</h2>
                  <p className="text-xs text-[#5A6478]">
                    Direct academic and technical assistance. No external WhatsApp required.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTicketCategory("Other");
                  setTicketSubject("");
                  setTicketDescription("");
                  setTicketErrors({});
                  setIsTicketModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0B57D0] hover:bg-[#0052FF] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Raise New Ticket</span>
              </button>
            </div>

            {/* Support Info & SLA Banner */}
            <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#0E1B3D]">
                <Clock className="w-4 h-4 text-[#0B57D0] shrink-0" />
                <span><strong>Support Hours:</strong> {platformSettings.supportHours}</span>
              </div>
              <p className="text-[11px] text-[#5A6478]">
                {platformSettings.ticketNotice}
              </p>
            </div>

            {/* My Tickets List */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-[#0E1B3D]">My Support Tickets ({tickets.length})</h3>

              {tickets.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-[#E4E8F8] bg-slate-50/50 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0B57D0] flex items-center justify-center mx-auto">
                    <LifeBuoy className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#0E1B3D]">No Support Tickets Yet</h4>
                    <p className="text-[11px] text-[#5A6478] max-w-sm mx-auto mt-1">
                      Facing an issue with video playback, device reset, or notes? Tap &quot;Raise New Ticket&quot; above to contact our staff.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((t) => {
                    const isExpanded = expandedTicketId === t.id;
                    const msgs = expandedMessages[t.id] || [];
                    return (
                      <div
                        key={t.id}
                        className="rounded-2xl border border-[#E4E8F8] bg-white p-4.5 space-y-3 hover:border-blue-200 transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(
                                t.category
                              )}`}
                            >
                              {t.category || "General Inquiry"}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${getStatusBadgeClass(
                                t.status
                              )}`}
                            >
                              ● {t.status || "Open"}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-400">
                            {new Date(t.lastAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-extrabold text-[#0E1B3D]">
                            {t.subject || "Support Query"}
                          </h4>
                          <p className="text-xs text-[#5A6478] mt-1 leading-relaxed whitespace-pre-wrap">
                            {t.lastMessage}
                          </p>
                        </div>

                        {t.resolutionNote && (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Official Resolution Note</span>
                            </div>
                            <p className="text-[11px] text-emerald-900 leading-relaxed">
                              {t.resolutionNote}
                            </p>
                          </div>
                        )}

                        <div className="border-t border-[#E4E8F8] pt-3 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleTicketExpand(t.id)}
                            className="text-xs font-bold text-[#0B57D0] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{isExpanded ? "Hide Conversation" : "View Thread & Reply"}</span>
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="pt-2 space-y-3 border-t border-slate-100">
                            <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-xl">
                              {msgs.length === 0 ? (
                                <p className="text-[11px] text-slate-400 text-center py-2">
                                  No additional messages in this thread.
                                </p>
                              ) : (
                                msgs.map((m) => {
                                  const isStudent = m.senderType === "student";
                                  return (
                                    <div
                                      key={m.id}
                                      className={`flex ${isStudent ? "justify-end" : "justify-start"}`}
                                    >
                                      <div
                                        className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                                          isStudent
                                            ? "bg-[#0B57D0] text-white"
                                            : "bg-white border border-[#E4E8F8] text-[#0E1B3D]"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-2 text-[10px] mb-0.5 opacity-80">
                                          <span>{m.senderName}</span>
                                          <span>
                                            {new Date(m.at).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        </div>
                                        <p>{m.body}</p>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {t.status !== "Resolved" && (
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={ticketReplyText}
                                  onChange={(e) => setTicketReplyText(e.target.value)}
                                  placeholder="Type your reply to staff..."
                                  className="flex-1 p-2 rounded-xl border border-[#E4E8F8] text-xs font-medium text-[#0E1B3D] focus:bg-white focus:border-[#0B57D0] focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSendStudentReply(t.id)}
                                  disabled={isSendingReply || !ticketReplyText.trim()}
                                  className="px-3.5 py-2 rounded-xl bg-[#0B57D0] hover:bg-[#0052FF] disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 5: OFFLINE VAULT STORAGE & PWA APP INSTALL
           ========================================================================= */}
        {activeTab === "storage" && (
          <div className="bg-white rounded-3xl p-6 border border-[#E4E8F8] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0E1B3D]">Offline Storage Vault & PWA App</h2>
                  <p className="text-xs text-[#5A6478]">
                    In-app encrypted digital books stored in your phone&apos;s browser memory for offline bus and train travel.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> {offlineBooks.length} Books Cached
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-[#E4E8F8] space-y-1">
                <p className="text-xs font-bold text-[#5A6478]">Saved Offline Books</p>
                <p className="text-2xl font-black text-[#0E1B3D]">{offlineBooks.length}</p>
                <p className="text-[11px] text-[#5A6478]">
                  Total storage used: <span className="font-bold text-[#0B57D0]">{totalOfflineMb} MB</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-[#E4E8F8] flex flex-col justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#0E1B3D]">Clear In-App Books</p>
                  <p className="text-[11px] text-[#5A6478]">
                    Frees storage by removing encrypted PDF notes from device memory.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  disabled={isClearingStorage || offlineBooks.length === 0}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  {isClearingStorage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Clear Vault Books</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 flex flex-col justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#0E1B3D]">Clear Cache & Sync</p>
                  <p className="text-[11px] text-[#5A6478]">
                    Flushes Service Worker caches & syncs queued watch telemetry to server.
                  </p>
                </div>
                <SubmitButton
                  type="button"
                  onClick={handleClearCacheAndSync}
                  loading={isClearingCacheAndSyncing}
                  loadingText="Syncing..."
                  className="w-full py-2 text-xs font-bold rounded-xl bg-white hover:bg-blue-100 border border-blue-300 text-[#0B57D0]"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  <span>Sync & Clear Cache</span>
                </SubmitButton>
              </div>
            </div>

            {/* PWA Home Screen Installation */}
            <div className="p-5 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-[#0E1B3D] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#0B57D0]" />
                  <span>Install MindMaster App on Device</span>
                </h3>
                <p className="text-[11px] text-[#5A6478]">
                  Install MindMaster directly to your home screen for instant fullscreen launch without URL bars.
                </p>
              </div>

              <button
                type="button"
                onClick={handleInstallApp}
                className="px-5 py-2.5 rounded-xl bg-[#0B57D0] hover:bg-[#0052FF] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalled ? "App Installed (Launch)" : "Install App on Device"}</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 6: OFFICIAL RECEIPTS, CERTIFICATES & LEGAL CENTER
           ========================================================================= */}
        {activeTab === "legal" && (
          <div className="bg-white rounded-3xl p-6 border border-[#E4E8F8] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B57D0] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0E1B3D]">Official Receipts & Legal Center</h2>
                  <p className="text-xs text-[#5A6478]">
                    Verified institutional documentation signed by Director Prashant Dhumal Sir.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <Link
                href="/my-courses"
                className="p-4 rounded-2xl bg-slate-50 border border-[#E4E8F8] hover:border-[#0B57D0] hover:bg-blue-50/30 transition flex flex-col justify-between gap-3"
              >
                <div>
                  <CreditCard className="w-5 h-5 text-[#0B57D0]" />
                  <h4 className="font-extrabold text-xs text-[#0E1B3D] mt-2">My Enrolled Courses</h4>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">View active admissions &amp; validity</p>
                </div>
                <span className="text-[11px] font-bold text-[#0B57D0] flex items-center gap-1">
                  <span>Go to My Courses</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setActiveTab("tickets")}
                className="p-4 rounded-2xl bg-slate-50 border border-[#E4E8F8] hover:border-emerald-500 hover:bg-emerald-50/30 transition flex flex-col justify-between gap-3 text-left cursor-pointer"
              >
                <div>
                  <LifeBuoy className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-extrabold text-xs text-[#0E1B3D] mt-2">In-App Support Desk</h4>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">Raise &amp; track support queries directly</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <span>Open Ticket Desk</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              <Link
                href="/help"
                className="p-4 rounded-2xl bg-slate-50 border border-[#E4E8F8] hover:border-blue-500 hover:bg-blue-50/30 transition flex flex-col justify-between gap-3 group"
              >
                <div>
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h4 className="font-extrabold text-xs text-[#0E1B3D] mt-2 group-hover:text-blue-600 transition-colors">
                    How to Use App Guide
                  </h4>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">
                    ६ सोप्या पायऱ्या, DRM नियम व FAQs
                  </p>
                </div>
                <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                  <span>Open Help Guide</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>

              <Link
                href="/legal"
                className="p-4 rounded-2xl bg-slate-50 border border-[#E4E8F8] hover:border-purple-500 hover:bg-purple-50/30 transition flex flex-col justify-between gap-3"
              >
                <div>
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  <h4 className="font-extrabold text-xs text-[#0E1B3D] mt-2">Legal &amp; Policies Hub</h4>
                  <p className="text-[11px] text-[#5A6478] mt-0.5">Terms, privacy &amp; refund policy</p>
                </div>
                <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
                  <span>Open Legal Hub</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>

            {/* Dedicated Legal & Compliance Cards */}
            <div className="border-t border-[#E4E8F8] pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-[#0E1B3D]">Official Policies &amp; Legal Compliance</h3>
                <span className="text-[10px] font-bold text-slate-400">Bilingual • 2026 Edition</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href="/privacy-policy"
                  className="p-3.5 rounded-2xl bg-slate-50 border border-[#E4E8F8] hover:border-blue-500 hover:bg-blue-50/40 transition flex flex-col justify-between gap-2.5 group"
                >
                  <div className="flex items-center justify-between">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-[#0E1B3D] group-hover:text-blue-600 transition-colors">Privacy Policy</h4>
                    <p className="text-[11px] text-[#5A6478] mt-0.5">Data encryption &amp; RLS</p>
                  </div>
                </Link>

                <Link
                  href="/terms"
                  className="p-3.5 rounded-2xl bg-slate-50 border border-[#E4E8F8] hover:border-amber-500 hover:bg-amber-50/40 transition flex flex-col justify-between gap-2.5 group"
                >
                  <div className="flex items-center justify-between">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-amber-600 transition" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-[#0E1B3D] group-hover:text-amber-600 transition-colors">Terms &amp; Anti-Piracy</h4>
                    <p className="text-[11px] text-[#5A6478] mt-0.5">Single-Device DRM lock</p>
                  </div>
                </Link>

                <Link
                  href="/refund-policy"
                  className="p-3.5 rounded-2xl bg-slate-50 border border-[#E4E8F8] hover:border-emerald-500 hover:bg-emerald-50/40 transition flex flex-col justify-between gap-2.5 group"
                >
                  <div className="flex items-center justify-between">
                    <RotateCcw className="w-4 h-4 text-emerald-600" />
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-emerald-600 transition" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-[#0E1B3D] group-hover:text-emerald-600 transition-colors">Refund Policy</h4>
                    <p className="text-[11px] text-[#5A6478] mt-0.5">100% duplicate charge refunds</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Instant Document Download Demo */}
            <div className="border-t border-[#E4E8F8] pt-4 space-y-3">
              <h3 className="text-xs font-extrabold text-[#0E1B3D]">Instant Sample Document Generation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#F9FAFF] border border-[#E4E8F8] flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ● OFFICIAL RECEIPT
                    </span>
                    <h4 className="font-extrabold text-xs text-[#0E1B3D] mt-1.5">Official Fee Pavati (Receipt)</h4>
                    <p className="text-[11px] text-[#5A6478]">Computer-generated admission payment proof.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      generateFeeReceiptPdf({
                        receiptNo: "MMA-PAVATI-2026",
                        date: new Date().toLocaleDateString("en-IN"),
                        studentName: fullName,
                        studentPhone: phone,
                        district,
                        courseCode: "VM-SPEED-01",
                        courseTitle: targetExam,
                        amountPaise: 249900,
                        paymentId: "pay_rzp_official_gateway",
                        accessMonths: 12,
                        expiryDate: "October 2027",
                      })
                    }
                    className="w-full py-2 bg-white hover:bg-[#EEF4FF] border border-[#D0E2FF] text-[#0B57D0] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Fee Receipt (PDF)</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFFDF5] border border-amber-200 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      ★ ISO CERTIFIED
                    </span>
                    <h4 className="font-extrabold text-xs text-[#0E1B3D] mt-1.5">Course Completion Certificate</h4>
                    <p className="text-[11px] text-[#5A6478]">Signed credential with verifiable serial number.</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={isClaimingCert}
                      onClick={async () => {
                        try {
                          setIsClaimingCert(true);
                          const res = await fetch("/api/certificates/claim", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              studentId: phone ? `std-${phone.replace(/\D/g, "").slice(-6)}` : "std-learner",
                              studentName: fullName || "Verified Student",
                              studentPhone: phone || "9876500001",
                              courseId: "c-mm-01",
                            }),
                          });
                          const data = await res.json();
                          if (data.success && data.certificate) {
                            generateCourseCertificatePdf({
                              certificateNo: data.certificate.certificate_no,
                              studentName: data.certificate.student_name,
                              courseTitle: data.certificate.course_title,
                              completionDate: data.certificate.issued_at_ist,
                            });
                          }
                        } catch {
                          toast.error("Failed to generate certificate.");
                        } finally {
                          setIsClaimingCert(false);
                        }
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{isClaimingCert ? "Issuing..." : "Download Certificate (PDF)"}</span>
                    </button>
                    <Link
                      href="/verify-certificate"
                      className="text-[11px] font-bold text-[#0B57D0] hover:underline flex items-center justify-center gap-1 pt-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Certificate Online →</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campus Office Footer */}
        <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-xs text-[#5A6478] flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-medium">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0B57D0] shrink-0" />
            <span>{platformSettings.centreAddress}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Support: {platformSettings.supportPhone}</span>
            <span className="text-[10px] uppercase font-bold text-[#0B57D0] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              OFFICIAL DESK
            </span>
          </div>
        </div>
      </div>

      {/* Language Selection Modal */}
      <LanguageModal isOpen={isLangModalOpen} onClose={() => setIsLangModalOpen(false)} />

      {/* Raise Support Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0B57D0] flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0E1B3D]">Raise a Support Ticket</h3>
                  <p className="text-[11px] text-[#5A6478]">Direct academic helpdesk assistance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Auto-filled details banner */}
            <div className="p-3 rounded-xl bg-slate-50 border border-[#E4E8F8] text-[11px] text-[#5A6478] space-y-1">
              <div className="flex items-center justify-between">
                <span>Student: <strong className="text-[#0E1B3D]">{fullName}</strong></span>
                <span>Phone: <strong className="text-[#0E1B3D] font-mono">{phone}</strong></span>
              </div>
              <div>Course / Target: <strong className="text-[#0B57D0]">{targetExam}</strong></div>
            </div>

            <form onSubmit={handleRaiseTicket} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0E1B3D] block mb-1">Issue Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value as TicketCategory)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-[#E4E8F8] text-[#0E1B3D] font-medium focus:bg-white focus:border-[#0B57D0] focus:outline-hidden"
                >
                  <option value="Device Reset Request">Device Reset Request</option>
                  <option value="Video / Playback Issue">Video / Playback Issue</option>
                  <option value="Payment / Course Access">Payment / Course Access</option>
                  <option value="Notes / PDF Issue">Notes / PDF Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0E1B3D] block mb-1">Subject</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => {
                    setTicketSubject(e.target.value);
                    if (ticketErrors.subject) {
                      setTicketErrors((prev) => ({ ...prev, subject: undefined }));
                    }
                  }}
                  placeholder="e.g. Device reset request after upgrading phone"
                  className={`w-full p-2.5 rounded-xl border font-medium transition focus:outline-hidden ${
                    ticketErrors.subject
                      ? "border-red-500 bg-red-50/30 text-red-900 focus:ring-red-500"
                      : "border-[#E4E8F8] bg-slate-50 text-[#0E1B3D] focus:bg-white focus:border-[#0B57D0]"
                  } ${shakeField === "subject" ? "animate-shake" : ""}`}
                />
                {ticketErrors.subject && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{ticketErrors.subject}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#0E1B3D] block mb-1">Description / Problem Details</label>
                <textarea
                  rows={4}
                  value={ticketDescription}
                  onChange={(e) => {
                    setTicketDescription(e.target.value);
                    if (ticketErrors.description) {
                      setTicketErrors((prev) => ({ ...prev, description: undefined }));
                    }
                  }}
                  placeholder="Provide clear details so our academic support team can assist you immediately..."
                  className={`w-full p-2.5 rounded-xl border font-medium transition focus:outline-hidden ${
                    ticketErrors.description
                      ? "border-red-500 bg-red-50/30 text-red-900 focus:ring-red-500"
                      : "border-[#E4E8F8] bg-slate-50 text-[#0E1B3D] focus:bg-white focus:border-[#0B57D0]"
                  } ${shakeField === "description" ? "animate-shake" : ""}`}
                />
                {ticketErrors.description && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{ticketErrors.description}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E8F8]">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  disabled={isSubmittingTicket}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <SubmitButton
                  type="submit"
                  loading={isSubmittingTicket}
                  loadingText="Submitting Ticket..."
                  className="px-5 py-2 rounded-xl bg-[#0B57D0] hover:bg-[#0052FF] text-white font-bold"
                >
                  <LifeBuoy className="w-3.5 h-3.5 mr-1.5" />
                  <span>Submit Ticket</span>
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Sign Out of MindMaster?</h3>
                <p className="text-xs text-slate-500">
                  Your active device session lock will be freed, allowing you to safely sign in from any other phone or PC.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSignOut}
                disabled={isLoggingOut}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? "Signing out..." : "Confirm Sign Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
