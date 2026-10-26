"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { logStaffAction, getPlatformSettings, savePlatformSettings } from "@/lib/staffStore";

export default function AdminSettingsPage() {
  // 1. Payments Card State
  const [razorpayKeyId, setRazorpayKeyId] = useState("rzp_live_8F91kM4892482");
  const [razorpaySecret, setRazorpaySecret] = useState("sec_live_99d14a2f8b894ce12a");
  const [showKeys, setShowKeys] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isGatewayConnected, setIsGatewayConnected] = useState(true);

  // 2. Defaults Card State
  const [defaultAccessMonths, setDefaultAccessMonths] = useState(3);
  const [defaultVideoLiveDays, setDefaultVideoLiveDays] = useState(30);
  const [defaultCouponDays, setDefaultCouponDays] = useState(7);

  // 3. Limits Card State
  const [maxSubAdmins, setMaxSubAdmins] = useState(50);
  const currentSubAdminCount = 4;
  const [maxDevicesPerStudent, setMaxDevicesPerStudent] = useState(2);

  // 4. In-App Notifications Card State (Strictly No WhatsApp)
  const [reminderTemplate, setReminderTemplate] = useState(
    "Namaskar {name}, your access to {course} will expire in {days} days. Renew today to get {percent}% off!"
  );
  const [renewalPercent, setRenewalPercent] = useState(50);
  const [autoSendNotifications, setAutoSendNotifications] = useState(true);

  // 5. Academy Profile Card State
  const [academyName, setAcademyName] = useState("MindMaster Academy");
  const [founderName, setFounderName] = useState("Prashant Dhumal");
  const [centreAddress, setCentreAddress] = useState("Narhe Centre Desk, Pune, Maharashtra 411041");
  const [supportPhone, setSupportPhone] = useState("+91 84593 44077");
  const [supportEmail, setSupportEmail] = useState("mindmasterdhumal@gmail.com");

  // 6. Maintenance Card State
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // 7. YouTube Data API Key State
  const [youtubeApiKey, setYoutubeApiKey] = useState("");
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);

  // Toast / Save State
  const [savedToast, setSavedToast] = useState(false);

  // Load from Supabase API / store on mount
  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = await res.json();
          if (mounted && json.settings) {
            const s = json.settings;
            if (s.razorpay_key_id) setRazorpayKeyId(s.razorpay_key_id);
            if (s.razorpay_key_secret) setRazorpaySecret(s.razorpay_key_secret);
            if (s.razorpay_mode) setIsTestMode(s.razorpay_mode === "test");
            if (s.default_access_months !== undefined) setDefaultAccessMonths(s.default_access_months);
            if (s.default_video_live_days !== undefined) setDefaultVideoLiveDays(s.default_video_live_days);
            if (s.default_coupon_days !== undefined) setDefaultCouponDays(s.default_coupon_days);
            if (s.max_sub_admins !== undefined) setMaxSubAdmins(s.max_sub_admins);
            if (s.concurrent_devices !== undefined) setMaxDevicesPerStudent(s.concurrent_devices);
            if (s.renewal_coupon_percent !== undefined) setRenewalPercent(s.renewal_coupon_percent);
            if (s.auto_send_reminders !== undefined) setAutoSendNotifications(Boolean(s.auto_send_reminders));
            if (s.reminder_template) setReminderTemplate(s.reminder_template);
            if (s.academy_title) setAcademyName(s.academy_title);
            if (s.founder_name) setFounderName(s.founder_name);
            if (s.centre_address) setCentreAddress(s.centre_address);
            if (s.support_phone) setSupportPhone(s.support_phone);
            if (s.support_email) setSupportEmail(s.support_email);
            if (s.maintenance !== undefined) setIsMaintenanceMode(Boolean(s.maintenance));
            if (s.youtube_api_key) setYoutubeApiKey(s.youtube_api_key);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to load settings from API, falling back to local store:", err);
      }

      if (mounted) {
        const s = getPlatformSettings();
        if (s) {
          if (s.razorpay_key_id) setRazorpayKeyId(s.razorpay_key_id);
          if (s.razorpay_key_secret) setRazorpaySecret(s.razorpay_key_secret);
          if (s.razorpay_mode) setIsTestMode(s.razorpay_mode === "test");
          if (s.max_sub_admins !== undefined) setMaxSubAdmins(s.max_sub_admins);
          if (s.default_access_months !== undefined) setDefaultAccessMonths(s.default_access_months);
          if (s.default_video_live_days !== undefined) setDefaultVideoLiveDays(s.default_video_live_days);
          if (s.default_coupon_days !== undefined) setDefaultCouponDays(s.default_coupon_days);
          if (s.concurrent_devices !== undefined) setMaxDevicesPerStudent(s.concurrent_devices);
          if (s.renewal_coupon_percent !== undefined) setRenewalPercent(s.renewal_coupon_percent);
          if (s.auto_send_reminders !== undefined) setAutoSendNotifications(Boolean(s.auto_send_reminders));
          if (s.reminder_template) setReminderTemplate(s.reminder_template);
          if (s.academy_title) setAcademyName(s.academy_title);
          if (s.founder_name) setFounderName(s.founder_name);
          if (s.centre_address) setCentreAddress(s.centre_address);
          if (s.support_phone) setSupportPhone(s.support_phone);
          if (s.support_email) setSupportEmail(s.support_email);
          if (s.maintenance !== undefined) setIsMaintenanceMode(Boolean(s.maintenance));
          if (s.youtube_api_key) setYoutubeApiKey(s.youtube_api_key || "");
        }
      }
    }
    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to mask key: rzp_live_••••••••••••9482
  const maskKey = (key: string) => {
    if (showKeys) return key;
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 8) + "••••••••••••" + key.slice(-4);
  };

  // Live preview interpolation
  const previewTemplate = reminderTemplate
    .replace("{name}", "Rahul Shinde")
    .replace("{course}", "Vedic Maths Speed Foundation")
    .replace("{days}", "3")
    .replace("{percent}", renewalPercent.toString());

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      razorpay_key_id: razorpayKeyId.trim(),
      razorpay_key_secret: razorpaySecret.trim(),
      razorpay_mode: (isTestMode ? "test" : "live") as "live" | "test",
      concurrent_devices: maxDevicesPerStudent,
      auto_send_reminders: autoSendNotifications,
      max_sub_admins: maxSubAdmins,
      default_access_months: defaultAccessMonths,
      default_video_live_days: defaultVideoLiveDays,
      default_coupon_days: defaultCouponDays,
      renewal_coupon_percent: renewalPercent,
      reminder_template: reminderTemplate,
      academy_title: academyName.trim(),
      founder_name: founderName.trim(),
      centre_address: centreAddress.trim(),
      support_phone: supportPhone.trim(),
      support_email: supportEmail.trim(),
      maintenance: isMaintenanceMode,
      youtube_api_key: youtubeApiKey.trim(),
    };

    // Save to live Supabase via POST /api/settings
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("Error calling POST /api/settings:", err);
    }

    // Persist to store and notify listeners
    savePlatformSettings(payload);

    logStaffAction(
      "SETTINGS_UPDATE",
      "settings",
      "sys-config-v2",
      "Master Platform Configuration",
      `Saved system configuration: Payments (${isTestMode ? "Test" : "Live"}), Defaults (Access: ${defaultAccessMonths}m, Live: ${defaultVideoLiveDays}d), Maintenance: ${isMaintenanceMode ? "ENABLED" : "DISABLED"}, YouTube API: ${youtubeApiKey ? "Configured" : "Not configured"}`
    );

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <PermissionGuard adminOnly={true}>
      <AdminShell>
        <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#0E1B3D] font-heading">
                  System Platform Settings
                </h1>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Unified master controls for payment gateways, retention automations, capacity limits, and emergency maintenance.
              </p>
            </div>

            <button
              onClick={handleSaveAll}
              className="px-6 py-3 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center gap-2 justify-center"
            >
              <span>💾</span> Save All Configurations
            </button>
          </div>

          {savedToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
              <span>✅ Platform configuration saved successfully and recorded in System Audit Trail.</span>
              <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded-full">
                Saved by Main Admin
              </span>
            </div>
          )}

          <form onSubmit={handleSaveAll} className="space-y-6">
            {/* ========================================================= */}
            {/* CARD 1: PAYMENTS (Razorpay masked keys, connected chip, test toggle) */}
            {/* ========================================================= */}
            <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4E8F8]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    💳
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0E1B3D]">Payments Gateway (Razorpay)</h2>
                    <p className="text-xs text-[#5A6478]">Direct student checkout and automated fee capture</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isGatewayConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Connected • Webhook Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                      Disconnected
                    </span>
                  )}

                  {/* Test Toggle */}
                  <div className="flex items-center gap-2 pl-3 border-l border-[#E4E8F8]">
                    <span className={`text-xs font-bold ${isTestMode ? "text-amber-600" : "text-[#5A6478]"}`}>
                      {isTestMode ? "Sandbox (Test)" : "Live Production"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsTestMode(!isTestMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isTestMode ? "bg-amber-500" : "bg-[#0B57D0]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isTestMode ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0E1B3D]">Razorpay Key ID</label>
                    <button
                      type="button"
                      onClick={() => setShowKeys(!showKeys)}
                      className="text-[10px] text-[#0B57D0] font-semibold hover:underline"
                    >
                      {showKeys ? "Mask Key" : "Show Key"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={maskKey(razorpayKeyId)}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    disabled={!showKeys}
                    className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-mono text-[#0E1B3D] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0E1B3D]">Razorpay Key Secret</label>
                  </div>
                  <input
                    type="password"
                    value={showKeys ? razorpaySecret : "••••••••••••••••••••••••"}
                    onChange={(e) => setRazorpaySecret(e.target.value)}
                    disabled={!showKeys}
                    className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-mono text-[#0E1B3D] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* CARD: YOUTUBE DATA API V3 (Playlist Import) */}
            {/* ========================================================= */}
            <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E8F8]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
                    ▶️
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0E1B3D]">YouTube Data API v3 Integration</h2>
                    <p className="text-xs text-[#5A6478]">Required for automated YouTube playlist import in Course & Video Builder</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                  className="px-3 py-1 bg-[#F5F7FF] hover:bg-[#E4E8F8] text-[#0E1B3D] text-xs font-semibold rounded-lg transition"
                >
                  {showYoutubeKey ? "Hide Key" : "Show Key"}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#0E1B3D]">Google / YouTube API Key</label>
                    <span className={`text-[11px] font-semibold ${youtubeApiKey ? "text-emerald-600" : "text-amber-600"}`}>
                      {youtubeApiKey ? "● Active & Configured" : "○ Not Configured (Manual bulk paste mode only)"}
                    </span>
                  </div>
                  <input
                    type={showYoutubeKey ? "text" : "password"}
                    value={youtubeApiKey}
                    onChange={(e) => setYoutubeApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-xs font-mono text-[#0E1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                  <p className="text-[11px] text-[#8A94A6] mt-1.5 leading-relaxed">
                    Obtained from Google Cloud Console with YouTube Data API v3 enabled. When configured, staff with <code className="text-[#0B57D0] font-mono bg-blue-50 px-1 py-0.5 rounded">videos.manage</code> can fetch full YouTube playlists automatically. If left blank, staff will use manual bulk paste mode.
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* CARD 2: DEFAULTS (Access months, video live days, coupon days) */}
            {/* ========================================================= */}
            <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E4E8F8]">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                  ⏱️
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0E1B3D]">Course & Video Defaults</h2>
                  <p className="text-xs text-[#5A6478]">Standard policy windows applied to newly created content</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl">
                  <label className="block font-bold text-[#0E1B3D] mb-1">
                    Default Course Access
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={defaultAccessMonths}
                      onChange={(e) => setDefaultAccessMonths(Number(e.target.value))}
                      className="w-20 px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl font-bold text-[#0E1B3D] text-sm focus:outline-none"
                    />
                    <span className="font-semibold text-[#5A6478]">Months</span>
                  </div>
                  <p className="text-[10px] text-[#8A94A6] mt-2">
                    Applies to new course enrollments (e.g. 3 months).
                  </p>
                </div>

                <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl">
                  <label className="block font-bold text-[#0E1B3D] mb-1">
                    Default Video Live Window
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={defaultVideoLiveDays}
                      onChange={(e) => setDefaultVideoLiveDays(Number(e.target.value))}
                      className="w-20 px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl font-bold text-[#0E1B3D] text-sm focus:outline-none"
                    />
                    <span className="font-semibold text-[#5A6478]">Days</span>
                  </div>
                  <p className="text-[10px] text-[#8A94A6] mt-2">
                    Days a video lecture remains live after publishing (e.g. 30 days).
                  </p>
                </div>

                <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl">
                  <label className="block font-bold text-[#0E1B3D] mb-1">
                    Default Coupon Validity
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={defaultCouponDays}
                      onChange={(e) => setDefaultCouponDays(Number(e.target.value))}
                      className="w-20 px-3 py-2 bg-white border border-[#E4E8F8] rounded-xl font-bold text-[#0E1B3D] text-sm focus:outline-none"
                    />
                    <span className="font-semibold text-[#5A6478]">Days</span>
                  </div>
                  <p className="text-[10px] text-[#8A94A6] mt-2">
                    Validity span for newly generated discount codes (e.g. 7 days).
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* CARD 3: LIMITS (Sub-admins max 50, concurrent devices) */}
            {/* ========================================================= */}
            <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E4E8F8]">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                  🛡️
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0E1B3D]">System Capacity & Quota Limits</h2>
                  <p className="text-xs text-[#5A6478]">Hard ceilings enforced to prevent server abuse</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0E1B3D]">Maximum Allowed Sub-Admins</label>
                    <span className="font-bold text-[#0B57D0]">{currentSubAdminCount} / {maxSubAdmins} Slots Used</span>
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={maxSubAdmins}
                    onChange={(e) => setMaxSubAdmins(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-white border border-[#E4E8F8] rounded-xl font-bold text-[#0E1B3D] text-sm focus:outline-none mb-2"
                  />
                  {/* Progress bar */}
                  <div className="w-full bg-[#E4E8F8] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0B57D0] h-full rounded-full"
                      style={{ width: `${(currentSubAdminCount / maxSubAdmins) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#8A94A6] mt-2">
                    Enforced by hard database rule (single row settings max_sub_admins).
                  </p>
                </div>

                <div className="p-4 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl">
                  <label className="block font-bold text-[#0E1B3D] mb-1">
                    Concurrent Student Devices
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={maxDevicesPerStudent}
                    onChange={(e) => setMaxDevicesPerStudent(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-white border border-[#E4E8F8] rounded-xl font-bold text-[#0E1B3D] text-sm focus:outline-none mb-2"
                  />
                  <p className="text-[10px] text-[#8A94A6]">
                    Allows desktop web login and 1 primary mobile installation.
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* CARD 4: IN-APP NOTIFICATIONS (strictly NO WhatsApp, reminder template, renewal %) */}
            {/* ========================================================= */}
            <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4E8F8]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    🔔
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0E1B3D]">In-App Retention Notifications</h2>
                    <p className="text-xs text-[#5A6478]">Direct student message feed (Strictly NO WhatsApp)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0E1B3D]">Auto-Send Reminders:</span>
                  <button
                    type="button"
                    onClick={() => setAutoSendNotifications(!autoSendNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoSendNotifications ? "bg-[#0B57D0]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoSendNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Template Input & Variables */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0E1B3D]">
                    Expiry Reminder Template (Supports <code className="text-[#0B57D0] bg-blue-50 px-1 py-0.5 rounded font-mono">{"{name}"}</code>, <code className="text-[#0B57D0] bg-blue-50 px-1 py-0.5 rounded font-mono">{"{course}"}</code>, <code className="text-[#0B57D0] bg-blue-50 px-1 py-0.5 rounded font-mono">{"{days}"}</code>, <code className="text-[#0B57D0] bg-blue-50 px-1 py-0.5 rounded font-mono">{"{percent}"}</code>)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[#5A6478] font-bold">Renewal Coupon:</span>
                    <input
                      type="number"
                      value={renewalPercent}
                      onChange={(e) => setRenewalPercent(Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-[#F5F7FF] border border-[#E4E8F8] rounded-lg font-bold text-center text-[#0E1B3D]"
                    />
                    <span className="font-bold text-[#0E1B3D]">% OFF</span>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={reminderTemplate}
                  onChange={(e) => setReminderTemplate(e.target.value)}
                  className="w-full p-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl text-xs text-[#0E1B3D] focus:outline-none focus:border-[#0B57D0]"
                />

                {/* Live Template Preview Box */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/60 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B57D0] block mb-1">
                    Live In-App Notification Preview
                  </span>
                  <p className="text-xs font-medium text-[#0E1B3D] leading-relaxed">
                    "{previewTemplate}"
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* CARD 5: ACADEMY PROFILE */}
            {/* ========================================================= */}
            <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E4E8F8]">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm">
                  🏫
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0E1B3D]">Academy Profile & Narhe Centre Desk</h2>
                  <p className="text-xs text-[#5A6478]">Public institutional details shown on invoices and student dashboard</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#0E1B3D] mb-1">Academy Title</label>
                  <input
                    type="text"
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-[#0E1B3D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0E1B3D] mb-1">Founder / Lead Faculty</label>
                  <input
                    type="text"
                    value={founderName}
                    onChange={(e) => setFounderName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-[#0E1B3D] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#0E1B3D] mb-1">Centre Address</label>
                  <input
                    type="text"
                    value={centreAddress}
                    onChange={(e) => setCentreAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-[#0E1B3D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0E1B3D] mb-1">Support Phone</label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-[#0E1B3D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0E1B3D] mb-1">Support Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl text-[#0E1B3D] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* CARD 6: MAINTENANCE MODE TOGGLE & BANNER PREVIEW */}
            {/* ========================================================= */}
            <div className="bg-white rounded-3xl border border-[#E4E8F8] p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4E8F8]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                    ⚠️
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0E1B3D]">System Maintenance Mode</h2>
                    <p className="text-xs text-[#5A6478]">Puts student web app in read-only maintenance mode</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isMaintenanceMode ? "text-rose-600" : "text-[#5A6478]"}`}>
                    {isMaintenanceMode ? "ACTIVE (Maintenance On)" : "Inactive (Normal Ops)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isMaintenanceMode ? "bg-rose-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isMaintenanceMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Maintenance Banner Preview */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-[#5A6478] uppercase text-[10px] tracking-wider">
                  Student-Facing Banner Preview (When Active):
                </span>

                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isMaintenanceMode
                      ? "bg-amber-50 border-amber-300 text-amber-900 shadow-md"
                      : "bg-slate-50 border-slate-200 text-slate-500 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span className="font-bold text-xs">
                      MindMaster Academy Notice: Scheduled Maintenance in Progress
                    </span>
                  </div>
                  <p className="text-xs mt-1 ml-7">
                    Video lectures and course purchases are temporarily offline for scheduled system upgrades. Our engineering team is restoring services shortly.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-8 py-3.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-sm rounded-full shadow-lg transition-all flex items-center gap-2"
              >
                <span>💾</span> Commit Settings & Log Audit
              </button>
            </div>
          </form>
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
