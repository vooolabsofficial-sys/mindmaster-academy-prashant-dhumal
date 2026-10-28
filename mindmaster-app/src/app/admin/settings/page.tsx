"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import {
  Building2,
  ShieldCheck,
  CreditCard,
  Lock,
  AlertTriangle,
  Download,
  Save,
  Check,
  Eye,
  EyeOff,
  Smartphone,
  Share2,
  FileText,
  RefreshCw,
  Bell,
  HelpCircle,
  Percent,
  CheckCircle2,
  KeyRound,
  FileCheck,
} from "lucide-react";
import {
  PlatformSettings,
  DEFAULT_PLATFORM_SETTINGS,
  getPlatformSettings,
  savePlatformSettings,
  logStaffAction,
} from "@/lib/staffStore";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"branding" | "channels" | "payments" | "security" | "maintenance">("branding");

  // Section 1: Academy Identity & Certificate Branding
  const [academyTitle, setAcademyTitle] = useState(DEFAULT_PLATFORM_SETTINGS.academy_title || "MindMaster Academy");
  const [founderName, setFounderName] = useState(DEFAULT_PLATFORM_SETTINGS.founder_name || "Prashant Dhumal Sir");
  const [centreAddress, setCentreAddress] = useState(DEFAULT_PLATFORM_SETTINGS.centre_address || "Powai Naka, Satara, Maharashtra 415001");
  const [puneAddress, setPuneAddress] = useState(DEFAULT_PLATFORM_SETTINGS.pune_address || "Zeal Chowk, Narhe, Pune, Maharashtra 411041");
  const [signatureUrl, setSignatureUrl] = useState(DEFAULT_PLATFORM_SETTINGS.signature_url || "/branding/prashant_sir_signature.png");
  const [stampUrl, setStampUrl] = useState(DEFAULT_PLATFORM_SETTINGS.stamp_url || "/branding/mindmaster_seal.png");

  // Section 2: Global Helpdesk & Social Channels
  const [supportPhone, setSupportPhone] = useState(DEFAULT_PLATFORM_SETTINGS.support_phone || "+91 84593 44077");
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_PLATFORM_SETTINGS.whatsapp_number || "+91 84593 44077");
  const [supportEmail, setSupportEmail] = useState(DEFAULT_PLATFORM_SETTINGS.support_email || "mindmasterdhumal@gmail.com");
  const [socialYoutube, setSocialYoutube] = useState(DEFAULT_PLATFORM_SETTINGS.social_youtube || "https://www.youtube.com/@prashantdhumalmindmaster");
  const [socialInstagram, setSocialInstagram] = useState(DEFAULT_PLATFORM_SETTINGS.social_instagram || "https://www.instagram.com/mindmaster_academy_official");
  const [socialTelegram, setSocialTelegram] = useState(DEFAULT_PLATFORM_SETTINGS.social_telegram || "https://t.me/mindmasteracademy");
  const [youtubeApiKey, setYoutubeApiKey] = useState(DEFAULT_PLATFORM_SETTINGS.youtube_api_key || "");
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);

  // Section 3: Payment Gateway & UPI Rules (Non-GST Academy)
  const [razorpayMode, setRazorpayMode] = useState<"live" | "test">(DEFAULT_PLATFORM_SETTINGS.razorpay_mode || "live");
  const [razorpayKeyId, setRazorpayKeyId] = useState(DEFAULT_PLATFORM_SETTINGS.razorpay_key_id || "rzp_live_8F91kM4892482");
  const [razorpaySecret, setRazorpaySecret] = useState(DEFAULT_PLATFORM_SETTINGS.razorpay_key_secret || "sec_live_99d14a2f8b894ce12a");
  const [showKeys, setShowKeys] = useState(false);
  const [upiSupportId, setUpiSupportId] = useState(DEFAULT_PLATFORM_SETTINGS.upi_support_id || "mindmaster@okaxis");

  // Section 4: Security, Anti-Piracy & Sub-Admin Governance
  const [singleDeviceLock, setSingleDeviceLock] = useState(DEFAULT_PLATFORM_SETTINGS.single_device_lock ?? true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(DEFAULT_PLATFORM_SETTINGS.watermark_enabled ?? true);
  const [subAdminApprovalMode, setSubAdminApprovalMode] = useState(Boolean(DEFAULT_PLATFORM_SETTINGS.sub_admin_approval_mode));
  const [maxSubAdmins, setMaxSubAdmins] = useState(DEFAULT_PLATFORM_SETTINGS.max_sub_admins ?? 50);
  const [defaultAccessMonths, setDefaultAccessMonths] = useState(DEFAULT_PLATFORM_SETTINGS.default_access_months ?? 3);
  const [defaultCouponDays, setDefaultCouponDays] = useState(DEFAULT_PLATFORM_SETTINGS.default_coupon_days ?? 7);
  const [renewalCouponPercent, setRenewalCouponPercent] = useState(DEFAULT_PLATFORM_SETTINGS.renewal_coupon_percent ?? 50);
  const [reminderTemplate, setReminderTemplate] = useState(DEFAULT_PLATFORM_SETTINGS.reminder_template);

  // Section 5: Maintenance Mode & Backup
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(Boolean(DEFAULT_PLATFORM_SETTINGS.maintenance));
  const [maintenanceMessage, setMaintenanceMessage] = useState(DEFAULT_PLATFORM_SETTINGS.maintenance_message || "");
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from API on mount
  useEffect(() => {
    let mounted = true;
    async function loadConfig() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = await res.json();
          if (mounted && json.settings) {
            const s = json.settings;
            if (s.academy_title) setAcademyTitle(s.academy_title);
            if (s.founder_name) setFounderName(s.founder_name);
            if (s.centre_address) setCentreAddress(s.centre_address);
            if (s.pune_address) setPuneAddress(s.pune_address);
            if (s.signature_url) setSignatureUrl(s.signature_url);
            if (s.stamp_url) setStampUrl(s.stamp_url);
            if (s.support_phone) setSupportPhone(s.support_phone);
            if (s.whatsapp_number) setWhatsappNumber(s.whatsapp_number);
            if (s.support_email) setSupportEmail(s.support_email);
            if (s.social_youtube) setSocialYoutube(s.social_youtube);
            if (s.social_instagram) setSocialInstagram(s.social_instagram);
            if (s.social_telegram) setSocialTelegram(s.social_telegram);
            if (s.youtube_api_key) setYoutubeApiKey(s.youtube_api_key);
            if (s.razorpay_mode) setRazorpayMode(s.razorpay_mode);
            if (s.razorpay_key_id) setRazorpayKeyId(s.razorpay_key_id);
            if (s.razorpay_key_secret) setRazorpaySecret(s.razorpay_key_secret);
            if (s.upi_support_id) setUpiSupportId(s.upi_support_id);
            if (s.single_device_lock !== undefined) setSingleDeviceLock(Boolean(s.single_device_lock));
            if (s.watermark_enabled !== undefined) setWatermarkEnabled(Boolean(s.watermark_enabled));
            if (s.sub_admin_approval_mode !== undefined) setSubAdminApprovalMode(Boolean(s.sub_admin_approval_mode));
            if (s.max_sub_admins !== undefined) setMaxSubAdmins(s.max_sub_admins);
            if (s.default_access_months !== undefined) setDefaultAccessMonths(s.default_access_months);
            if (s.default_coupon_days !== undefined) setDefaultCouponDays(s.default_coupon_days);
            if (s.renewal_coupon_percent !== undefined) setRenewalCouponPercent(s.renewal_coupon_percent);
            if (s.reminder_template) setReminderTemplate(s.reminder_template);
            if (s.maintenance !== undefined) setIsMaintenanceMode(Boolean(s.maintenance));
            if (s.maintenance_message) setMaintenanceMessage(s.maintenance_message);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch settings from API:", err);
      }

      if (mounted) {
        const s = getPlatformSettings();
        if (s) {
          if (s.academy_title) setAcademyTitle(s.academy_title);
          if (s.founder_name) setFounderName(s.founder_name);
          if (s.centre_address) setCentreAddress(s.centre_address);
          if (s.pune_address) setPuneAddress(s.pune_address);
          if (s.signature_url) setSignatureUrl(s.signature_url);
          if (s.stamp_url) setStampUrl(s.stamp_url);
          if (s.support_phone) setSupportPhone(s.support_phone);
          if (s.whatsapp_number) setWhatsappNumber(s.whatsapp_number);
          if (s.support_email) setSupportEmail(s.support_email);
          if (s.social_youtube) setSocialYoutube(s.social_youtube);
          if (s.social_instagram) setSocialInstagram(s.social_instagram);
          if (s.social_telegram) setSocialTelegram(s.social_telegram);
          if (s.youtube_api_key) setYoutubeApiKey(s.youtube_api_key);
          if (s.razorpay_mode) setRazorpayMode(s.razorpay_mode);
          if (s.razorpay_key_id) setRazorpayKeyId(s.razorpay_key_id);
          if (s.razorpay_key_secret) setRazorpaySecret(s.razorpay_key_secret);
          if (s.upi_support_id) setUpiSupportId(s.upi_support_id);
          if (s.single_device_lock !== undefined) setSingleDeviceLock(Boolean(s.single_device_lock));
          if (s.watermark_enabled !== undefined) setWatermarkEnabled(Boolean(s.watermark_enabled));
          if (s.sub_admin_approval_mode !== undefined) setSubAdminApprovalMode(Boolean(s.sub_admin_approval_mode));
          if (s.max_sub_admins !== undefined) setMaxSubAdmins(s.max_sub_admins);
          if (s.default_access_months !== undefined) setDefaultAccessMonths(s.default_access_months);
          if (s.default_coupon_days !== undefined) setDefaultCouponDays(s.default_coupon_days);
          if (s.renewal_coupon_percent !== undefined) setRenewalCouponPercent(s.renewal_coupon_percent);
          if (s.reminder_template) setReminderTemplate(s.reminder_template);
          if (s.maintenance !== undefined) setIsMaintenanceMode(Boolean(s.maintenance));
          if (s.maintenance_message) setMaintenanceMessage(s.maintenance_message);
        }
      }
    }
    loadConfig();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const payload: PlatformSettings = {
      academy_title: academyTitle.trim(),
      founder_name: founderName.trim(),
      centre_address: centreAddress.trim(),
      pune_address: puneAddress.trim(),
      signature_url: signatureUrl.trim(),
      stamp_url: stampUrl.trim(),
      support_phone: supportPhone.trim(),
      whatsapp_number: whatsappNumber.trim(),
      support_email: supportEmail.trim(),
      social_youtube: socialYoutube.trim(),
      social_instagram: socialInstagram.trim(),
      social_telegram: socialTelegram.trim(),
      youtube_api_key: youtubeApiKey.trim(),
      razorpay_mode: razorpayMode,
      razorpay_key_id: razorpayKeyId.trim(),
      razorpay_key_secret: razorpaySecret.trim(),
      upi_support_id: upiSupportId.trim(),
      gstin: "",
      gst_enabled: false,
      gst_percent: 0,
      single_device_lock: singleDeviceLock,
      watermark_enabled: watermarkEnabled,
      sub_admin_approval_mode: subAdminApprovalMode,
      max_sub_admins: Number(maxSubAdmins),
      default_access_months: Number(defaultAccessMonths),
      default_video_live_days: 30,
      default_coupon_days: Number(defaultCouponDays),
      renewal_coupon_percent: Number(renewalCouponPercent),
      reminder_template: reminderTemplate,
      maintenance: isMaintenanceMode,
      maintenance_message: maintenanceMessage.trim(),
      concurrent_devices: singleDeviceLock ? 1 : 2,
    };

    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("POST /api/settings error:", err);
    }

    savePlatformSettings(payload);

    logStaffAction(
      "SETTINGS_UPDATE",
      "settings",
      "sys-master-config",
      "Master Platform Configuration",
      `Saved Master Settings: Academy=${academyTitle}, Gateway=${razorpayMode}, SingleDeviceLock=${singleDeviceLock}, ApprovalMode=${subAdminApprovalMode}`
    );

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadBackup = async () => {
    try {
      setIsExportingBackup(true);
      const res = await fetch("/api/settings?backup=true");
      if (!res.ok) throw new Error("Backup generation failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `mindmaster-academy-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export full system backup. Ensure you have active admin authority.");
    } finally {
      setIsExportingBackup(false);
    }
  };

  return (
    <PermissionGuard adminOnly={true}>
      <AdminShell>
        <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
          {/* Top Hero Banner */}
          <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0B57D0]/10 flex items-center justify-center text-[#0B57D0] shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[#0E1B3D] tracking-tight">
                    Academy Master Control
                  </h1>
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0B57D0] border border-blue-200">
                    MAIN ADMIN
                  </span>
                </div>
                <p className="text-xs text-[#5A6478] mt-1">
                  Master configuration for institutional branding, certificate seals, payment gateways, anti-piracy, and academy data backups.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isExportingBackup}
                className="px-4 py-2.5 text-xs font-bold rounded-xl border border-[#E4E8F8] bg-slate-50 hover:bg-slate-100 text-[#0E1B3D] flex items-center gap-2 transition"
                title="Download full JSON backup of all students, courses, books, and grants"
              >
                {isExportingBackup ? <RefreshCw className="w-4 h-4 animate-spin text-[#0B57D0]" /> : <Download className="w-4 h-4 text-[#0B57D0]" />}
                <span>Backup (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveAll()}
                disabled={isSaving}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#0B57D0] hover:bg-[#0052FF] text-white flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Phone-Style Section Segment Control */}
          <div className="flex items-center gap-2 p-1.5 bg-[#F5F7FF] rounded-2xl border border-[#E4E8F8] overflow-x-auto text-xs font-bold text-[#5A6478]">
            <button
              onClick={() => setActiveTab("branding")}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === "branding" ? "bg-white text-[#0B57D0] shadow-sm font-extrabold" : "hover:text-[#0E1B3D]"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>1. Academy & Certificates</span>
            </button>
            <button
              onClick={() => setActiveTab("channels")}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === "channels" ? "bg-white text-[#0B57D0] shadow-sm font-extrabold" : "hover:text-[#0E1B3D]"
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>2. Helpdesk & Social</span>
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === "payments" ? "bg-white text-[#0B57D0] shadow-sm font-extrabold" : "hover:text-[#0E1B3D]"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>3. Payments & UPI</span>
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === "security" ? "bg-white text-[#0B57D0] shadow-sm font-extrabold" : "hover:text-[#0E1B3D]"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>4. Security & Sub-Admins</span>
            </button>
            <button
              onClick={() => setActiveTab("maintenance")}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === "maintenance" ? "bg-white text-[#0B57D0] shadow-sm font-extrabold" : "hover:text-[#0E1B3D]"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>5. Maintenance & Backup</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSaveAll} className="space-y-6">
            {/* =========================================================================
                SECTION 1: ACADEMY IDENTITY & CERTIFICATE BRANDING
               ========================================================================= */}
            {activeTab === "branding" && (
              <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B57D0] flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#0E1B3D]">
                        Academy Identity & Certificate Branding
                      </h2>
                      <p className="text-xs text-[#5A6478]">
                        Configures institutional details stamped on all generated PDF receipts and course completion certificates.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PDF Engine Sync
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Academy Title (Legal Name)
                    </label>
                    <input
                      type="text"
                      value={academyTitle}
                      onChange={(e) => setAcademyTitle(e.target.value)}
                      placeholder="MindMaster Academy"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">Appears at the top of receipts and certificates.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Authorized Signatory & Founder Name
                    </label>
                    <input
                      type="text"
                      value={founderName}
                      onChange={(e) => setFounderName(e.target.value)}
                      placeholder="Prashant Dhumal Sir"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">Printed in the signature block on certificates and fee receipts.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Satara Head Office Address
                    </label>
                    <input
                      type="text"
                      value={centreAddress}
                      onChange={(e) => setCentreAddress(e.target.value)}
                      placeholder="Powai Naka, Satara, Maharashtra 415001"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">Official headquarters address printed on receipts.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Pune Campus Address
                    </label>
                    <input
                      type="text"
                      value={puneAddress}
                      onChange={(e) => setPuneAddress(e.target.value)}
                      placeholder="Zeal Chowk, Narhe, Pune, Maharashtra 411041"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">Secondary offline branch campus address.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Official Signature Image URL
                    </label>
                    <input
                      type="text"
                      value={signatureUrl}
                      onChange={(e) => setSignatureUrl(e.target.value)}
                      placeholder="/branding/prashant_sir_signature.png"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">Path or public URL to transparent PNG signature.</p>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                SECTION 2: GLOBAL HELPDESK & SOCIAL CHANNELS
               ========================================================================= */}
            {activeTab === "channels" && (
              <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#0E1B3D]">
                        Global Helpdesk & Official Social Channels
                      </h2>
                      <p className="text-xs text-[#5A6478]">
                        Dynamically synchronized across student /support, checkout guarantees, and the mobile app navigation.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5" /> Live Student Sync
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Primary Support Phone Number
                    </label>
                    <input
                      type="text"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      placeholder="+91 84593 44077"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">Toll-free / official calling desk for student questions.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Official WhatsApp Helpline Number
                    </label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+91 84593 44077"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">1-click WhatsApp chat link used in student support.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Official Support Email
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="mindmasterdhumal@gmail.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">Email address for admissions and technical queries.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      YouTube Data API v3 Key
                    </label>
                    <div className="relative">
                      <input
                        type={showYoutubeKey ? "text" : "password"}
                        value={youtubeApiKey}
                        onChange={(e) => setYoutubeApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showYoutubeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#5A6478] mt-1">Used to auto-fetch video and playlist titles in Course Builder.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Official YouTube Channel Link
                    </label>
                    <input
                      type="url"
                      value={socialYoutube}
                      onChange={(e) => setSocialYoutube(e.target.value)}
                      placeholder="https://www.youtube.com/@prashantdhumalmindmaster"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Official Instagram Page Link
                    </label>
                    <input
                      type="url"
                      value={socialInstagram}
                      onChange={(e) => setSocialInstagram(e.target.value)}
                      placeholder="https://www.instagram.com/mindmaster_academy_official"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Official Telegram Channel Link
                    </label>
                    <input
                      type="url"
                      value={socialTelegram}
                      onChange={(e) => setSocialTelegram(e.target.value)}
                      placeholder="https://t.me/mindmasteracademy"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                SECTION 3: PAYMENT GATEWAY & TAX RULES
               ========================================================================= */}
            {activeTab === "payments" && (
              <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#0E1B3D]">
                        Payment Gateway & UPI Collection Rules
                      </h2>
                      <p className="text-xs text-[#5A6478]">
                        Manage Razorpay live credentials, sandbox testing mode, and student UPI fee collection receivers.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                      razorpayMode === "live"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {razorpayMode === "live" ? "🟢 LIVE GATEWAY" : "🟡 TEST SANDBOX"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-[#E4E8F8] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#0E1B3D]">Razorpay Environment Mode</p>
                      <p className="text-[11px] text-[#5A6478]">
                        Toggle between production live settlement mode and test sandbox mode for mock verification.
                      </p>
                    </div>
                    <div className="flex items-center bg-white p-1 rounded-xl border border-[#E4E8F8]">
                      <button
                        type="button"
                        onClick={() => setRazorpayMode("test")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                          razorpayMode === "test" ? "bg-amber-500 text-white" : "text-[#5A6478]"
                        }`}
                      >
                        Test Sandbox
                      </button>
                      <button
                        type="button"
                        onClick={() => setRazorpayMode("live")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                          razorpayMode === "live" ? "bg-emerald-600 text-white" : "text-[#5A6478]"
                        }`}
                      >
                        Live Production
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Razorpay Key ID
                    </label>
                    <input
                      type="text"
                      value={razorpayKeyId}
                      onChange={(e) => setRazorpayKeyId(e.target.value)}
                      placeholder="rzp_live_..."
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Razorpay Key Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys ? "text" : "password"}
                        value={razorpaySecret}
                        onChange={(e) => setRazorpaySecret(e.target.value)}
                        placeholder="sec_live_..."
                        className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys(!showKeys)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      UPI Support ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={upiSupportId}
                      onChange={(e) => setUpiSupportId(e.target.value)}
                      placeholder="mindmaster@okaxis"
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">Displayed during offline admission QR collections.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-950">Tax Status: Non-GST Educational Academy</p>
                      <p className="text-[11px] text-emerald-800/80">Flat transparent pricing with zero tax addition at checkout.</p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Non-GST Exempt
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                SECTION 4: SECURITY, ANTI-PIRACY & SUB-ADMIN GOVERNANCE
               ========================================================================= */}
            {activeTab === "security" && (
              <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#0E1B3D]">
                        Security, Anti-Piracy & Sub-Admin Governance
                      </h2>
                      <p className="text-xs text-[#5A6478]">
                        Guard against account sharing, video screen recording, and configure the maker-checker sub-admin admission rules.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> High Enforcement
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Strict Single-Device Lock */}
                  <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#0B57D0]" />
                        <h3 className="text-xs font-extrabold text-[#0E1B3D]">
                          Strict Single-Device Concurrent Lock
                        </h3>
                      </div>
                      <p className="text-[11px] text-[#5A6478]">
                        When enabled, each student can only stream from 1 phone/computer at a time. A new login immediately terminates the older active session.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={singleDeviceLock}
                        onChange={(e) => setSingleDeviceLock(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B57D0]"></div>
                    </label>
                  </div>

                  {/* Anti-Piracy Watermarking */}
                  <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#0B57D0]" />
                        <h3 className="text-xs font-extrabold text-[#0E1B3D]">
                          Dynamic Video & PDF Anti-Piracy Watermark
                        </h3>
                      </div>
                      <p className="text-[11px] text-[#5A6478]">
                        Overlays the student&apos;s registered phone number and timestamp randomly across videos and notes to stop illegal screen recording.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={watermarkEnabled}
                        onChange={(e) => setWatermarkEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B57D0]"></div>
                    </label>
                  </div>

                  {/* Sub-Admin Grant Maker-Checker Approval Mode */}
                  <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[#0B57D0]" />
                        <h3 className="text-xs font-extrabold text-[#0E1B3D]">
                          Sub-Admin Admissions Maker-Checker Approval
                        </h3>
                      </div>
                      <p className="text-[11px] text-[#5A6478]">
                        When enabled, offline admissions granted by Sub-Admins require Main Admin 1-click verification before courses unlock for the student.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={subAdminApprovalMode}
                        onChange={(e) => setSubAdminApprovalMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B57D0]"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Maximum Allowed Sub-Admins
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={maxSubAdmins}
                      onChange={(e) => setMaxSubAdmins(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">Enterprise capacity (supports 50-60 Sub-Admins).</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Default Course Validity (Months)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={defaultAccessMonths}
                      onChange={(e) => setDefaultAccessMonths(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">Auto-applied when building new courses.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Default Coupon Validity (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={defaultCouponDays}
                      onChange={(e) => setDefaultCouponDays(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">Expiry window for generated discount promo codes.</p>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                SECTION 5: MAINTENANCE MODE & FULL SYSTEM BACKUP
               ========================================================================= */}
            {activeTab === "maintenance" && (
              <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#0E1B3D]">
                        Maintenance Mode & 1-Click System Backup
                      </h2>
                      <p className="text-xs text-[#5A6478]">
                        Safeguard academy records and manage scheduled server maintenance outages gracefully.
                      </p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                    isMaintenanceMode ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {isMaintenanceMode ? "⚠️ MAINTENANCE ACTIVE" : "🟢 SYSTEM NORMAL"}
                  </span>
                </div>

                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xs font-extrabold text-amber-950">
                        Platform Maintenance Mode Toggle
                      </h3>
                      <p className="text-[11px] text-amber-900/80">
                        When enabled, non-admin students see a scheduled upgrade notice. Admin and Sub-Admin logins remain fully functional.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={isMaintenanceMode}
                        onChange={(e) => setIsMaintenanceMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Custom Maintenance Message Shown to Students
                    </label>
                    <textarea
                      rows={2}
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="MindMaster Academy is currently undergoing scheduled platform upgrades. We will be back online shortly."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-[#E4E8F8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-extrabold text-[#0E1B3D] flex items-center gap-2">
                        <Download className="w-4 h-4 text-[#0B57D0]" />
                        <span>Institutional Disaster Recovery & Full Academy Backup</span>
                      </h3>
                      <p className="text-[11px] text-[#5A6478] mt-1">
                        Exports complete registered student accounts, course syllabi, digital books, offline grants, and discount coupons as a verified JSON file.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      disabled={isExportingBackup}
                      className="px-5 py-2.5 text-xs font-bold rounded-xl bg-white border border-[#E4E8F8] hover:bg-slate-100 text-[#0B57D0] flex items-center gap-2 shadow-xs transition shrink-0 active:scale-95"
                    >
                      {isExportingBackup ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Backup...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download Full Academy Backup (.json)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="border-t border-[#E4E8F8] pt-4">
                    <label className="block text-xs font-bold text-[#0E1B3D] mb-1.5">
                      Retention & Expiry Notice Reminder Template
                    </label>
                    <textarea
                      rows={2}
                      value={reminderTemplate}
                      onChange={(e) => setReminderTemplate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E8F8] bg-slate-50/50 text-[#0E1B3D] focus:outline-hidden focus:border-[#0B57D0] focus:bg-white font-medium"
                    />
                    <p className="text-[11px] text-[#5A6478] mt-1">
                      Variables available: &#123;name&#125;, &#123;course&#125;, &#123;days&#125;, &#123;percent&#125;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Floating Save Action Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E4E8F8] shadow-sm flex items-center justify-between">
              <span className="text-xs text-[#5A6478]">
                Changes are written to live database and backed up to disk storage.
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-[#0B57D0] hover:bg-[#0052FF] text-white flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved Successfully</span>
                  </>
                ) : isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}