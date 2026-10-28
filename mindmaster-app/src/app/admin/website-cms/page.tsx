"use client";

import React, { useState, useEffect } from "react";
import { getCurrentStaff } from "@/lib/staffStore";
import { StaffUser } from "@/lib/types";
import {
  WebsiteCmsData,
  DEFAULT_WEBSITE_CMS,
  LeadItem,
  TopperStory,
  FacultyMember,
  OfflineCentre,
  FAQItem,
} from "@/lib/websiteCmsStore";

export default function WebsiteCmsPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [cmsData, setCmsData] = useState<WebsiteCmsData>(DEFAULT_WEBSITE_CMS);
  const [activeTab, setActiveTab] = useState<
    | "announcement"
    | "hero"
    | "popup_leads"
    | "toppers"
    | "faculty_stats"
    | "centres"
    | "faqs_visibility"
    | "seo_footer"
  >("announcement");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Live Website Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Leads CRM filters
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("All");

  // Topper Form Modal
  const [topperModalOpen, setTopperModalOpen] = useState(false);
  const [editingTopper, setEditingTopper] = useState<TopperStory | null>(null);

  // Faculty Form Modal
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyMember | null>(null);

  // Centre Form Modal
  const [centreModalOpen, setCentreModalOpen] = useState(false);
  const [editingCentre, setEditingCentre] = useState<OfflineCentre | null>(null);

  // FAQ Form Modal
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);

  useEffect(() => {
    setStaff(getCurrentStaff());
    loadCmsData();
  }, []);

  const loadCmsData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/website-cms");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setCmsData(json.data);
        }
      }
    } catch (e) {
      console.warn("Failed loading CMS via API, using fallback", e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleSaveAll = async (overrideData?: WebsiteCmsData) => {
    const dataToPost = overrideData || cmsData;
    setSaving(true);
    try {
      const res = await fetch("/api/website-cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToPost }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCmsData(json.data);
          showToast("✅ Website CMS changes published live successfully!");
          return;
        }
      }
      showToast("⚠️ Could not sync to server, saved locally.");
    } catch {
      showToast("⚠️ Error saving changes to server.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("Are you sure you want to reset all Website CMS settings to clean English defaults?")) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/website-cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_defaults" }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCmsData(json.data);
          showToast("🔄 Reset to default English CMS settings!");
        }
      }
    } catch {
      setCmsData(DEFAULT_WEBSITE_CMS);
      showToast("🔄 Reset locally to defaults.");
    } finally {
      setSaving(false);
    }
  };

  // --- Leads CRM actions ---
  const handleLeadStatusChange = async (leadId: string, newStatus: LeadItem["status"]) => {
    try {
      const res = await fetch("/api/website-cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_lead_status",
          leadId,
          status: newStatus,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.leads) {
          setCmsData((prev) => ({ ...prev, leads: json.leads }));
          showToast(`Updated lead status to ${newStatus}`);
        }
      }
    } catch {}
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Delete this student inquiry?")) return;
    try {
      const res = await fetch(`/api/website-cms?leadId=${leadId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.leads) {
          setCmsData((prev) => ({ ...prev, leads: json.leads }));
          showToast("Inquiry deleted");
        }
      }
    } catch {}
  };

  const exportLeadsCsv = () => {
    const headers = ["ID,Date,Name,Phone,Email,Course Interest,Status,Source,Message"];
    const rows = cmsData.leads.map((l) =>
      [
        l.id,
        new Date(l.createdAt).toLocaleDateString(),
        `"${l.name.replace(/"/g, '""')}"`,
        `"${l.phone}"`,
        `"${l.email || ""}"`,
        `"${(l.courseInterest || "").replace(/"/g, '""')}"`,
        l.status,
        `"${l.source}"`,
        `"${(l.message || "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mindmaster-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Security Check: Main Admin Only
  if (staff.role !== "main_admin") {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
          🔒
        </div>
        <h2 className="text-xl font-extrabold text-[#0E1B3D]">
          Main Admin Access Only
        </h2>
        <p className="text-sm text-[#5A6478]">
          The Website CMS Studio controls the public marketing portal and requires Prashant Sir's Main Admin credentials.
        </p>
      </div>
    );
  }

  const filteredLeads = cmsData.leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.phone.includes(leadSearch) ||
      (l.courseInterest && l.courseInterest.toLowerCase().includes(leadSearch.toLowerCase()));
    const matchesStatus = leadStatusFilter === "All" || l.status === leadStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E1B3D] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 animate-fade-in text-sm font-semibold">
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🌐</span>
            <span className="text-[11px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#0B57D0]">
              Enterprise CMS Studio
            </span>
            <span className="text-xs text-[#5A6478]">Zero Developer Dependency</span>
          </div>
          <h1 className="text-2xl font-black text-[#0E1B3D] tracking-tight">
            Marketing Website CMS Studio
          </h1>
          <p className="text-xs text-[#5A6478] mt-1">
            Visual control centre for mindmasteracademy.in — edit banners, toppers, admission ticker, offline centres, and leads CRM.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 bg-white border border-[#0B57D0] text-[#0B57D0] hover:bg-[#F5F8FF] rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs"
          >
            <span>👁️</span>
            <span>Live Website Preview</span>
          </button>

          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="px-3.5 py-2.5 bg-white border border-[#D5D9EB] text-[#5A6478] hover:text-[#0E1B3D] hover:bg-[#F5F7FF] rounded-xl text-xs font-bold transition-all"
          >
            Reset Defaults
          </button>

          <button
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:shadow-md disabled:opacity-50"
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <span>💾</span>
                <span>Publish Changes Live</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 8 Management Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "announcement", label: "Announcement Bar", icon: "📢" },
          { id: "hero", label: "Hero & Banners", icon: "🚀" },
          { id: "popup_leads", label: "Popup & Leads CRM", icon: "🎯", badge: `${cmsData.leads.filter(l => l.status === "New").length} New` },
          { id: "toppers", label: "Hall of Fame", icon: "🏆", badge: `${cmsData.toppers.length}` },
          { id: "faculty_stats", label: "Faculty & Stats", icon: "👨‍🏫" },
          { id: "centres", label: "Offline Centres", icon: "📍", badge: `${cmsData.centres.length}` },
          { id: "faqs_visibility", label: "FAQs & Sections", icon: "⚙️" },
          { id: "seo_footer", label: "SEO & Footer", icon: "🔍" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === tab.id
                ? "bg-[#0B57D0] text-white shadow-xs"
                : "bg-white text-[#5A6478] border border-[#E4E8F8] hover:bg-[#F5F7FF] hover:text-[#0E1B3D]"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-[#E8F0FE] text-[#0B57D0]"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: TOP ANNOUNCEMENT BAR & TICKER */}
      {activeTab === "announcement" && (
        <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0E1B3D]">
                Top Announcement Bar & Offer Ticker
              </h2>
              <p className="text-xs text-[#5A6478] mt-0.5">
                Displays a high-visibility marketing announcement strip at the very top of the website.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-bold text-[#0E1B3D]">
                {cmsData.announcement.enabled ? "Active (ON)" : "Hidden (OFF)"}
              </span>
              <input
                type="checkbox"
                checked={cmsData.announcement.enabled}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    announcement: { ...cmsData.announcement, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-[#0B57D0] focus:ring-[#0B57D0]"
              />
            </label>
          </div>

          {/* Live Strip Visual Preview */}
          <div>
            <span className="text-[11px] font-bold text-[#5A6478] uppercase tracking-wider block mb-2">
              Live Strip Preview
            </span>
            <div className="w-full bg-[#0E1B3D] text-white px-4 py-2.5 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs border border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-full bg-[#FF453A] text-white font-extrabold text-[10px] uppercase">
                  Special Offer
                </span>
                <span className="truncate font-medium">
                  {cmsData.announcement.message || "Enter announcement text..."}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {cmsData.announcement.couponBadge && (
                  <span className="px-2 py-0.5 bg-yellow-400 text-black rounded font-mono font-black text-[11px] tracking-wider">
                    {cmsData.announcement.couponBadge}
                  </span>
                )}
                <span className="bg-[#0052FF] hover:bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-[11px]">
                  {cmsData.announcement.ctaText || "Enroll Now"}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Announcement Message (English)
              </label>
              <input
                type="text"
                value={cmsData.announcement.message}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    announcement: { ...cmsData.announcement, message: e.target.value },
                  })
                }
                placeholder="e.g. New Cognitive & Police Bharti Batches Starting This Monday at Satara & Pune Centres!"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Active Coupon Code Badge (Optional)
              </label>
              <input
                type="text"
                value={cmsData.announcement.couponBadge}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    announcement: { ...cmsData.announcement, couponBadge: e.target.value.toUpperCase() },
                  })
                }
                placeholder="e.g. PRASHANT20"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D] uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                value={cmsData.announcement.ctaText}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    announcement: { ...cmsData.announcement, ctaText: e.target.value },
                  })
                }
                placeholder="e.g. Enroll with 20% Off"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                CTA Button Target Link / Path
              </label>
              <input
                type="text"
                value={cmsData.announcement.ctaUrl}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    announcement: { ...cmsData.announcement, ctaUrl: e.target.value },
                  })
                }
                placeholder="e.g. /courses or https://app.mindmasteracademy.in/checkout"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HERO SECTION, BANNERS & INTRO VIDEO */}
      {activeTab === "hero" && (
        <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[#E4E8F8] pb-4">
            <h2 className="text-base font-extrabold text-[#0E1B3D]">
              Hero Section, Banners & Intro Video
            </h2>
            <p className="text-xs text-[#5A6478] mt-0.5">
              Customize the main headline, call-to-actions, hero showcase banners, and YouTube intro video.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Main Headline (Hero Title)
              </label>
              <input
                type="text"
                value={cmsData.hero.headline}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, headline: e.target.value },
                  })
                }
                placeholder="Train Your Mind. Master Your Memory. Succeed Anywhere."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D] font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Hero Subtitle (English Narrative)
              </label>
              <textarea
                rows={3}
                value={cmsData.hero.subtitle}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, subtitle: e.target.value },
                  })
                }
                placeholder="Practical memory, concentration and Vedic Maths techniques for students..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Trust Badge Text
              </label>
              <input
                type="text"
                value={cmsData.hero.trustBadge}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, trustBadge: e.target.value },
                  })
                }
                placeholder="Trusted by 5,000+ learners across Maharashtra"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                YouTube Intro Video URL
              </label>
              <input
                type="text"
                value={cmsData.hero.introVideoUrl}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, introVideoUrl: e.target.value },
                  })
                }
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Primary CTA Text
              </label>
              <input
                type="text"
                value={cmsData.hero.primaryCtaText}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, primaryCtaText: e.target.value },
                  })
                }
                placeholder="Explore & Enroll"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Primary CTA Target URL
              </label>
              <input
                type="text"
                value={cmsData.hero.primaryCtaUrl}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, primaryCtaUrl: e.target.value },
                  })
                }
                placeholder="/courses"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Secondary CTA Text
              </label>
              <input
                type="text"
                value={cmsData.hero.secondaryCtaText}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, secondaryCtaText: e.target.value },
                  })
                }
                placeholder="Free Demo Hub"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Secondary CTA Target URL
              </label>
              <input
                type="text"
                value={cmsData.hero.secondaryCtaUrl}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, secondaryCtaUrl: e.target.value },
                  })
                }
                placeholder="/demo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
              />
            </div>

            {/* Hero Banners Manager */}
            <div className="md:col-span-2 pt-2 border-t border-[#E4E8F8]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#0E1B3D]">
                  Hero Showcase Banners (Images displayed in Hero slider/card)
                </span>
                <span className="text-[11px] text-[#5A6478]">
                  {cmsData.hero.bannerImages.length} Banners Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {cmsData.hero.bannerImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-[#D5D9EB] bg-[#F5F7FF] aspect-[16/9]"
                  >
                    <img
                      src={img}
                      alt={`Banner ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/images/classroom_students_group.png";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = cmsData.hero.bannerImages.filter((_, i) => i !== idx);
                          setCmsData({
                            ...cmsData,
                            hero: { ...cmsData.hero, bannerImages: updated },
                          });
                        }}
                        className="px-2.5 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preset quick-add banners */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-[#5A6478] font-semibold">Quick Presets:</span>
                {[
                  { label: "Classroom Group", path: "/assets/images/classroom_students_group.png" },
                  { label: "Police Bharti 3D", path: "/assets/images/police_bharti_prep_3d.png" },
                  { label: "Brain Seminar 3D", path: "/assets/images/memory_seminar_brain_3d.png" },
                  { label: "Memory Drills", path: "/assets/images/classroom_memory_drills.png" },
                ].map((p) => (
                  <button
                    key={p.path}
                    type="button"
                    onClick={() => {
                      if (!cmsData.hero.bannerImages.includes(p.path)) {
                        setCmsData({
                          ...cmsData,
                          hero: {
                            ...cmsData.hero,
                            bannerImages: [...cmsData.hero.bannerImages, p.path],
                          },
                        });
                      }
                    }}
                    className="px-2.5 py-1 bg-[#F5F7FF] hover:bg-[#E8F0FE] text-[#0B57D0] border border-[#D5D9EB] rounded-lg text-xs font-bold transition-all"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROMOTIONAL POPUP & INQUIRIES CRM (LEADS) */}
      {activeTab === "popup_leads" && (
        <div className="space-y-6">
          {/* Promotional Popup Settings */}
          <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-4">
              <div>
                <h2 className="text-base font-extrabold text-[#0E1B3D]">
                  Entry &amp; Special Offer Promotional Popup
                </h2>
                <p className="text-xs text-[#5A6478] mt-0.5">
                  Appears for visitors with an interactive modal to capture admissions and webinar registrations.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-bold text-[#0E1B3D]">
                  {cmsData.promoPopup.enabled ? "Active (ON)" : "Disabled (OFF)"}
                </span>
                <input
                  type="checkbox"
                  checked={cmsData.promoPopup.enabled}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      promoPopup: { ...cmsData.promoPopup, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-[#0B57D0] focus:ring-[#0B57D0]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                  Popup Title
                </label>
                <input
                  type="text"
                  value={cmsData.promoPopup.title}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      promoPopup: { ...cmsData.promoPopup, title: e.target.value },
                    })
                  }
                  placeholder="Satara & Pune Offline Admissions Open"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D] font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                  Image Path / Asset URL
                </label>
                <input
                  type="text"
                  value={cmsData.promoPopup.imageUrl}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      promoPopup: { ...cmsData.promoPopup, imageUrl: e.target.value },
                    })
                  }
                  placeholder="/assets/images/police_bharti_prep_3d.png"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                  Popup Subtitle / Description
                </label>
                <textarea
                  rows={2}
                  value={cmsData.promoPopup.subtitle}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      promoPopup: { ...cmsData.promoPopup, subtitle: e.target.value },
                    })
                  }
                  placeholder="Reserve your seat for the upcoming interactive cognitive batch..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={cmsData.promoPopup.ctaText}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      promoPopup: { ...cmsData.promoPopup, ctaText: e.target.value },
                    })
                  }
                  placeholder="Reserve Seat on WhatsApp"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                  CTA Target URL / WhatsApp Link
                </label>
                <input
                  type="text"
                  value={cmsData.promoPopup.ctaUrl}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      promoPopup: { ...cmsData.promoPopup, ctaUrl: e.target.value },
                    })
                  }
                  placeholder="https://wa.me/918459344077?text=..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] text-sm text-[#0E1B3D]"
                />
              </div>
            </div>
          </div>

          {/* Website Inquiries & Leads CRM Table */}
          <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E8F8] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#0E1B3D]">
                    Student Inquiries &amp; Pre-Book Leads CRM
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#0B57D0] text-xs font-bold">
                    {cmsData.leads.length} Total Leads
                  </span>
                </div>
                <p className="text-xs text-[#5A6478] mt-0.5">
                  Real-time admissions inquiries received from the marketing website and contact forms.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportLeadsCsv}
                  className="px-3.5 py-2 bg-white border border-[#D5D9EB] hover:bg-[#F5F7FF] text-[#0E1B3D] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <span>📥</span>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:flex-1 relative">
                <input
                  type="text"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search by student name, phone, course..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#D5D9EB] text-xs text-[#0E1B3D] focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0]"
                />
                <span className="absolute left-3 top-2.5 text-xs text-[#5A6478]">🔍</span>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {["All", "New", "Contacted", "Enrolled"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setLeadStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      leadStatusFilter === status
                        ? "bg-[#0B57D0] text-white"
                        : "bg-[#F5F7FF] text-[#5A6478] hover:text-[#0E1B3D]"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto border border-[#E4E8F8] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFF] border-b border-[#E4E8F8] text-[#5A6478] font-bold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Course Interest</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E8F8]">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#5A6478]">
                        No student inquiries match the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-[#FAF8FF] transition-colors">
                        <td className="py-3 px-4 text-[#5A6478] whitespace-nowrap">
                          {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#0E1B3D] whitespace-nowrap">
                          {lead.name}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-[#0B57D0] font-semibold">
                            {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="text-[10px] text-[#5A6478]">{lead.email}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0052FF] font-medium text-[11px]">
                            {lead.courseInterest || "General"}
                          </span>
                          {lead.message && (
                            <p className="text-[11px] text-[#5A6478] mt-1 max-w-xs truncate">
                              "{lead.message}"
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              handleLeadStatusChange(lead.id, e.target.value as any)
                            }
                            className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                              lead.status === "New"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : lead.status === "Contacted"
                                ? "bg-sky-50 text-sky-800 border-sky-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            <option value="New">🟡 New</option>
                            <option value="Contacted">🔵 Contacted</option>
                            <option value="Enrolled">🟢 Enrolled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`https://wa.me/91${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                `Namaskar ${lead.name}, thank you for inquiring about MindMaster Academy! How may Prashant Sir assist you?`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs"
                            >
                              <span>💬</span> WhatsApp
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1 hover:bg-red-50 text-red-600 rounded"
                              title="Delete inquiry"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HALL OF FAME (TOPPERS & RESULTS MANAGER) */}
      {activeTab === "toppers" && (
        <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E8F8] pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0E1B3D]">
                Hall of Fame &amp; Toppers Showcase
              </h2>
              <p className="text-xs text-[#5A6478] mt-0.5">
                Manage student selection stories, Police Bharti ranks, and MPSC merit testimonials shown across the website.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingTopper({
                  id: `top-${Date.now()}`,
                  name: "",
                  examCategory: "Police Bharti",
                  scoreOrRank: "",
                  batchYear: "2024",
                  photoUrl: "/assets/images/akash_police_testimonial.png",
                  quote: "",
                  order: cmsData.toppers.length + 1,
                });
                setTopperModalOpen(true);
              }}
              className="px-4 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <span>+</span>
              <span>Add New Topper</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cmsData.toppers.map((topper, idx) => (
              <div
                key={topper.id}
                className="bg-[#F8FAFF] border border-[#E4E8F8] rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-[#0B57D0]/40 transition-all shadow-2xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-[#D5D9EB] shrink-0">
                    <img
                      src={topper.photoUrl}
                      alt={topper.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/images/akash_police_testimonial.png";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-[#0052FF] rounded text-[10px] font-extrabold uppercase tracking-wide">
                      {topper.examCategory}
                    </span>
                    <h3 className="font-extrabold text-sm text-[#0E1B3D] mt-1 truncate">
                      {topper.name}
                    </h3>
                    <p className="text-xs text-emerald-700 font-bold truncate">
                      {topper.scoreOrRank}
                    </p>
                    <p className="text-[10px] text-[#5A6478]">Batch: {topper.batchYear}</p>
                  </div>
                </div>

                {topper.quote && (
                  <p className="text-xs text-[#5A6478] italic line-clamp-2 bg-white p-2 rounded-lg border border-[#E4E8F8]">
                    "{topper.quote}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#E4E8F8] text-xs">
                  <span className="text-[10px] text-[#5A6478] font-bold">
                    Order #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTopper(topper);
                        setTopperModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white border border-[#D5D9EB] hover:bg-[#E8F0FE] text-[#0B57D0] rounded font-bold text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove topper "${topper.name}"?`)) {
                          const updated = cmsData.toppers.filter((t) => t.id !== topper.id);
                          setCmsData({ ...cmsData, toppers: updated });
                        }
                      }}
                      className="p-1 hover:bg-red-50 text-red-600 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FACULTY PROFILES & ACADEMY STATS COUNTERS */}
      {activeTab === "faculty_stats" && (
        <div className="space-y-6">
          {/* Academy Impact Counters */}
          <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-[#E4E8F8] pb-3">
              <h2 className="text-base font-extrabold text-[#0E1B3D]">
                Academy Impact Counters (Live Numbers)
              </h2>
              <p className="text-xs text-[#5A6478] mt-0.5">
                Key numerical metrics shown on the Home and About pages.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cmsData.counters.map((stat, idx) => (
                <div
                  key={stat.id}
                  className="p-4 bg-[#F8FAFF] border border-[#E4E8F8] rounded-xl space-y-2"
                >
                  <label className="text-[11px] font-bold text-[#5A6478] uppercase">
                    Stat #{idx + 1} Label
                  </label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => {
                      const updated = [...cmsData.counters];
                      updated[idx].label = e.target.value;
                      setCmsData({ ...cmsData, counters: updated });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#D5D9EB] text-xs font-semibold text-[#0E1B3D]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const updated = [...cmsData.counters];
                        updated[idx].value = e.target.value;
                        setCmsData({ ...cmsData, counters: updated });
                      }}
                      placeholder="5,000"
                      className="w-2/3 px-3 py-1.5 rounded-lg border border-[#D5D9EB] text-xs font-black text-[#0B57D0]"
                    />
                    <input
                      type="text"
                      value={stat.suffix}
                      onChange={(e) => {
                        const updated = [...cmsData.counters];
                        updated[idx].suffix = e.target.value;
                        setCmsData({ ...cmsData, counters: updated });
                      }}
                      placeholder="+"
                      className="w-1/3 px-2 py-1.5 rounded-lg border border-[#D5D9EB] text-xs font-bold text-[#5A6478] text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty Profiles */}
          <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E8F8] pb-4">
              <div>
                <h2 className="text-base font-extrabold text-[#0E1B3D]">
                  Faculty &amp; Mentor Profiles
                </h2>
                <p className="text-xs text-[#5A6478] mt-0.5">
                  Manage mentors, qualifications, and bios displayed on the website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingFaculty({
                    id: `fac-${Date.now()}`,
                    name: "",
                    role: "Mentor & Educator",
                    qualification: "M.Sc. / B.Ed",
                    bio: "",
                    photoUrl: "/assets/images/prashant_dhumal_studio_portrait.png",
                    order: cmsData.faculty.length + 1,
                  });
                  setFacultyModalOpen(true);
                }}
                className="px-4 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <span>+</span>
                <span>Add Faculty Member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cmsData.faculty.map((fac) => (
                <div
                  key={fac.id}
                  className="bg-[#F8FAFF] border border-[#E4E8F8] rounded-xl p-4 flex gap-4 hover:border-[#0B57D0]/40 transition-all"
                >
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-white border border-[#D5D9EB] shrink-0">
                    <img
                      src={fac.photoUrl}
                      alt={fac.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/images/prashant_dhumal_studio_portrait.png";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#0E1B3D]">
                        {fac.name}
                      </h3>
                      <p className="text-xs text-[#0B57D0] font-bold">
                        {fac.role}
                      </p>
                      <p className="text-[11px] text-[#5A6478]">
                        {fac.qualification}
                      </p>
                      <p className="text-xs text-[#5A6478] mt-1.5 line-clamp-2">
                        {fac.bio}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E8F8] mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFaculty(fac);
                          setFacultyModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-white border border-[#D5D9EB] text-[#0B57D0] rounded font-bold text-xs hover:bg-[#E8F0FE]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove faculty "${fac.name}"?`)) {
                            const updated = cmsData.faculty.filter((f) => f.id !== fac.id);
                            setCmsData({ ...cmsData, faculty: updated });
                          }
                        }}
                        className="p-1 hover:bg-red-50 text-red-600 rounded text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: OFFLINE CENTRES & BATCH SCHEDULE */}
      {activeTab === "centres" && (
        <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E8F8] pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0E1B3D]">
                Offline Academy Branches &amp; Batch Timings
              </h2>
              <p className="text-xs text-[#5A6478] mt-0.5">
                Manage physical training locations (Satara HQ, Pune Hub, future branches) and batch announcements.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingCentre({
                  id: `centre-${Date.now()}`,
                  name: "",
                  tag: "Branch Centre",
                  address: "",
                  phone: "+91 84593 44077",
                  mapsUrl: "",
                  timings: "Mon - Sat: 9:00 AM - 7:00 PM",
                  nextBatchDate: "Starting next Monday",
                  isHeadquarter: false,
                });
                setCentreModalOpen(true);
              }}
              className="px-4 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <span>+</span>
              <span>Add New Branch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cmsData.centres.map((centre) => (
              <div
                key={centre.id}
                className="bg-[#F8FAFF] border border-[#E4E8F8] rounded-xl p-5 flex flex-col justify-between gap-3 hover:border-[#0B57D0]/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0052FF]">
                      {centre.tag || "Branch"}
                    </span>
                    {centre.isHeadquarter && (
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ⭐ Main Flagship HQ
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-base text-[#0E1B3D]">
                    {centre.name}
                  </h3>
                  <p className="text-xs text-[#5A6478] mt-1 leading-relaxed">
                    📍 {centre.address}
                  </p>
                  <p className="text-xs text-[#0B57D0] font-bold mt-1">
                    📞 {centre.phone}
                  </p>
                  <div className="mt-2.5 p-2.5 bg-white rounded-lg border border-[#E4E8F8] space-y-1">
                    <div className="text-[11px] text-[#5A6478]">
                      <span className="font-bold text-[#0E1B3D]">Timings:</span> {centre.timings}
                    </div>
                    <div className="text-[11px] text-[#0052FF] font-bold">
                      <span>🚀 Next Batch:</span> {centre.nextBatchDate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E4E8F8]">
                  {centre.mapsUrl ? (
                    <a
                      href={centre.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#0B57D0] hover:underline font-bold"
                    >
                      View on Google Maps ↗
                    </a>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCentre(centre);
                        setCentreModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white border border-[#D5D9EB] text-[#0B57D0] rounded font-bold text-xs hover:bg-[#E8F0FE]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete branch "${centre.name}"?`)) {
                          const updated = cmsData.centres.filter((c) => c.id !== centre.id);
                          setCmsData({ ...cmsData, centres: updated });
                        }
                      }}
                      className="p-1 hover:bg-red-50 text-red-600 rounded text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: DYNAMIC FAQS & SECTION VISIBILITY TOGGLES */}
      {activeTab === "faqs_visibility" && (
        <div className="space-y-6">
          {/* Section Visibility Master Toggles */}
          <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-[#E4E8F8] pb-3">
              <h2 className="text-base font-extrabold text-[#0E1B3D]">
                Website Section Visibility Switches (Master Controls)
              </h2>
              <p className="text-xs text-[#5A6478] mt-0.5">
                Instantly turn sections ON or OFF across the public marketing website without touching code.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: "announcement", label: "Top Announcement Bar", icon: "📢" },
                { key: "heroStats", label: "Hero Impact Counters", icon: "📊" },
                { key: "featuredCourses", label: "Featured Courses Grid", icon: "📚" },
                { key: "resultsShowcase", label: "Toppers & Results Showcase", icon: "🏆" },
                { key: "facultySection", label: "Faculty & Mentor Section", icon: "👨‍🏫" },
                { key: "testimonials", label: "Student Testimonials", icon: "💬" },
                { key: "faqSection", label: "Frequently Asked Questions", icon: "❓" },
                { key: "floatingWhatsapp", label: "Floating WhatsApp Button", icon: "🟢" },
                { key: "promoPopup", label: "Admissions Entry Popup", icon: "🎯" },
              ].map((sec) => {
                const isEnabled = (cmsData.sectionVisibility as any)[sec.key];
                return (
                  <label
                    key={sec.key}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isEnabled
                        ? "bg-[#F5F8FF] border-[#0B57D0]/30 text-[#0E1B3D]"
                        : "bg-[#FAFAFA] border-[#E4E8F8] text-[#5A6478]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{sec.icon}</span>
                      <span className="text-xs font-bold">{sec.label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) =>
                        setCmsData({
                          ...cmsData,
                          sectionVisibility: {
                            ...cmsData.sectionVisibility,
                            [sec.key]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#0B57D0] focus:ring-[#0B57D0]"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* FAQ Manager */}
          <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E8F8] pb-4">
              <div>
                <h2 className="text-base font-extrabold text-[#0E1B3D]">
                  Frequently Asked Questions (FAQs)
                </h2>
                <p className="text-xs text-[#5A6478] mt-0.5">
                  Address common queries regarding admissions, memory coaching, and online/offline classes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingFaq({
                    id: `faq-${Date.now()}`,
                    question: "",
                    answer: "",
                    category: "General",
                    order: cmsData.faqs.length + 1,
                  });
                  setFaqModalOpen(true);
                }}
                className="px-4 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <span>+</span>
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-3">
              {cmsData.faqs.map((faq, idx) => (
                <div
                  key={faq.id}
                  className="bg-[#F8FAFF] border border-[#E4E8F8] rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-[#0B57D0]/30 transition-all"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-[#0B57D0] rounded text-[10px] font-bold">
                        {faq.category || "General"}
                      </span>
                      <h4 className="font-extrabold text-xs text-[#0E1B3D]">
                        Q{idx + 1}: {faq.question}
                      </h4>
                    </div>
                    <p className="text-xs text-[#5A6478] pl-2 border-l-2 border-[#D5D9EB] mt-1 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaq(faq);
                        setFaqModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white border border-[#D5D9EB] text-[#0B57D0] rounded font-bold text-xs hover:bg-[#E8F0FE]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete this FAQ?")) {
                          const updated = cmsData.faqs.filter((f) => f.id !== faq.id);
                          setCmsData({ ...cmsData, faqs: updated });
                        }
                      }}
                      className="p-1 hover:bg-red-50 text-red-600 rounded text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: SEO, SOCIAL LINKS & FOOTER CONTROL */}
      {activeTab === "seo_footer" && (
        <div className="bg-white border border-[#E4E8F8] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[#E4E8F8] pb-4">
            <h2 className="text-base font-extrabold text-[#0E1B3D]">
              SEO Meta Tags, Social Channels &amp; Footer Controls
            </h2>
            <p className="text-xs text-[#5A6478] mt-0.5">
              Control search engine indexing metadata, official social channels, and footer information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Website Meta Title (Google Search)
              </label>
              <input
                type="text"
                value={cmsData.seoAndSocial.metaTitle}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    seoAndSocial: { ...cmsData.seoAndSocial, metaTitle: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] text-xs text-[#0E1B3D] font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Meta Description
              </label>
              <textarea
                rows={2}
                value={cmsData.seoAndSocial.metaDescription}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    seoAndSocial: { ...cmsData.seoAndSocial, metaDescription: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] text-xs text-[#0E1B3D]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                SEO Keywords (Comma Separated)
              </label>
              <input
                type="text"
                value={cmsData.seoAndSocial.keywords}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    seoAndSocial: { ...cmsData.seoAndSocial, keywords: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] text-xs text-[#0E1B3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                YouTube Channel URL
              </label>
              <input
                type="text"
                value={cmsData.seoAndSocial.youtubeUrl}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    seoAndSocial: { ...cmsData.seoAndSocial, youtubeUrl: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] text-xs text-[#0E1B3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Instagram URL
              </label>
              <input
                type="text"
                value={cmsData.seoAndSocial.instagramUrl}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    seoAndSocial: { ...cmsData.seoAndSocial, instagramUrl: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] text-xs text-[#0E1B3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Telegram Channel / Group URL
              </label>
              <input
                type="text"
                value={cmsData.seoAndSocial.telegramUrl}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    seoAndSocial: { ...cmsData.seoAndSocial, telegramUrl: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] text-xs text-[#0E1B3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                WhatsApp Helpline Number
              </label>
              <input
                type="text"
                value={cmsData.seoAndSocial.whatsappNumber}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    seoAndSocial: { ...cmsData.seoAndSocial, whatsappNumber: e.target.value },
                  })
                }
                placeholder="918459344077"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] text-xs text-[#0E1B3D]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#0E1B3D] mb-1">
                Footer Copyright Text
              </label>
              <input
                type="text"
                value={cmsData.seoAndSocial.copyrightText}
                onChange={(e) =>
                  setCmsData({
                    ...cmsData,
                    seoAndSocial: { ...cmsData.seoAndSocial, copyrightText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D9EB] text-xs text-[#0E1B3D]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TOPPER EDIT/CREATE MODAL */}
      {topperModalOpen && editingTopper && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E4E8F8]">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-3">
              <h3 className="font-extrabold text-base text-[#0E1B3D]">
                {editingTopper.name ? "Edit Topper Story" : "Add New Topper / Result"}
              </h3>
              <button
                type="button"
                onClick={() => setTopperModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={editingTopper.name}
                  onChange={(e) => setEditingTopper({ ...editingTopper, name: e.target.value })}
                  placeholder="e.g. Akash Shinde"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0E1B3D] mb-1">Exam Category</label>
                  <input
                    type="text"
                    value={editingTopper.examCategory}
                    onChange={(e) => setEditingTopper({ ...editingTopper, examCategory: e.target.value })}
                    placeholder="Police Bharti / MPSC / Scholarship"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0E1B3D] mb-1">Batch Year</label>
                  <input
                    type="text"
                    value={editingTopper.batchYear}
                    onChange={(e) => setEditingTopper({ ...editingTopper, batchYear: e.target.value })}
                    placeholder="2024"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Rank or Score Achievement</label>
                <input
                  type="text"
                  value={editingTopper.scoreOrRank}
                  onChange={(e) => setEditingTopper({ ...editingTopper, scoreOrRank: e.target.value })}
                  placeholder="e.g. Rank 1 - Satara District / 96/100 Marks"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Student Photo URL / Preset</label>
                <input
                  type="text"
                  value={editingTopper.photoUrl}
                  onChange={(e) => setEditingTopper({ ...editingTopper, photoUrl: e.target.value })}
                  placeholder="/assets/images/akash_police_testimonial.png"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: "Akash Testimonial", path: "/assets/images/akash_police_testimonial.png" },
                    { label: "MPSC Merit Topper", path: "/assets/images/mpsc_merit_topper.jpg" },
                    { label: "Bharti Celebration", path: "/assets/images/police_bharti_celebration.jpg" },
                    { label: "Result Certificate", path: "/assets/images/student_result_certificate.png" },
                  ].map((p) => (
                    <button
                      key={p.path}
                      type="button"
                      onClick={() => setEditingTopper({ ...editingTopper, photoUrl: p.path })}
                      className="px-2 py-0.5 bg-[#F5F7FF] border border-[#D5D9EB] rounded text-[11px] text-[#0B57D0]"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Student Quote / Feedback</label>
                <textarea
                  rows={2}
                  value={editingTopper.quote || ""}
                  onChange={(e) => setEditingTopper({ ...editingTopper, quote: e.target.value })}
                  placeholder="How MindMaster Academy's memory methods helped them..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">YouTube Testimonial Video Link (Optional)</label>
                <input
                  type="text"
                  value={editingTopper.testimonialVideoUrl || ""}
                  onChange={(e) => setEditingTopper({ ...editingTopper, testimonialVideoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E8F8]">
              <button
                type="button"
                onClick={() => setTopperModalOpen(false)}
                className="px-3.5 py-2 bg-white border border-[#D5D9EB] rounded-xl text-xs font-bold text-[#5A6478]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingTopper.name) {
                    alert("Please enter student name");
                    return;
                  }
                  const existingIndex = cmsData.toppers.findIndex((t) => t.id === editingTopper.id);
                  let updatedToppers = [...cmsData.toppers];
                  if (existingIndex >= 0) {
                    updatedToppers[existingIndex] = editingTopper;
                  } else {
                    updatedToppers.push(editingTopper);
                  }
                  setCmsData({ ...cmsData, toppers: updatedToppers });
                  setTopperModalOpen(false);
                }}
                className="px-4 py-2 bg-[#0B57D0] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#0842A0]"
              >
                Save Topper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FACULTY EDIT/CREATE MODAL */}
      {facultyModalOpen && editingFaculty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E4E8F8]">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-3">
              <h3 className="font-extrabold text-base text-[#0E1B3D]">
                {editingFaculty.name ? "Edit Faculty Profile" : "Add New Faculty Profile"}
              </h3>
              <button
                type="button"
                onClick={() => setFacultyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={editingFaculty.name}
                  onChange={(e) => setEditingFaculty({ ...editingFaculty, name: e.target.value })}
                  placeholder="e.g. Prashant Dhumal Sir"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Role / Designation</label>
                <input
                  type="text"
                  value={editingFaculty.role}
                  onChange={(e) => setEditingFaculty({ ...editingFaculty, role: e.target.value })}
                  placeholder="e.g. Founder & Lead Cognitive Master"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Academic Qualification / Honours</label>
                <input
                  type="text"
                  value={editingFaculty.qualification}
                  onChange={(e) => setEditingFaculty({ ...editingFaculty, qualification: e.target.value })}
                  placeholder="e.g. B.Sc., World Memory Record Holder"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Photo URL / Preset</label>
                <input
                  type="text"
                  value={editingFaculty.photoUrl}
                  onChange={(e) => setEditingFaculty({ ...editingFaculty, photoUrl: e.target.value })}
                  placeholder="/assets/images/prashant_dhumal_studio_portrait.png"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditingFaculty({ ...editingFaculty, photoUrl: "/assets/images/prashant_dhumal_studio_portrait.png" })}
                    className="px-2 py-0.5 bg-[#F5F7FF] border border-[#D5D9EB] rounded text-[11px] text-[#0B57D0]"
                  >
                    Prashant Sir Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingFaculty({ ...editingFaculty, photoUrl: "/assets/images/prashant_dhumal_studio_portrait.png" })}
                    className="px-2 py-0.5 bg-[#F5F7FF] border border-[#D5D9EB] rounded text-[11px] text-[#0B57D0]"
                  >
                    Prashant Sir Educator
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Biography / About</label>
                <textarea
                  rows={3}
                  value={editingFaculty.bio}
                  onChange={(e) => setEditingFaculty({ ...editingFaculty, bio: e.target.value })}
                  placeholder="Describe teaching experience and specializations..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E8F8]">
              <button
                type="button"
                onClick={() => setFacultyModalOpen(false)}
                className="px-3.5 py-2 bg-white border border-[#D5D9EB] rounded-xl text-xs font-bold text-[#5A6478]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingFaculty.name) {
                    alert("Please enter faculty name");
                    return;
                  }
                  const existingIndex = cmsData.faculty.findIndex((f) => f.id === editingFaculty.id);
                  let updatedFaculty = [...cmsData.faculty];
                  if (existingIndex >= 0) {
                    updatedFaculty[existingIndex] = editingFaculty;
                  } else {
                    updatedFaculty.push(editingFaculty);
                  }
                  setCmsData({ ...cmsData, faculty: updatedFaculty });
                  setFacultyModalOpen(false);
                }}
                className="px-4 py-2 bg-[#0B57D0] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#0842A0]"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CENTRE EDIT/CREATE MODAL */}
      {centreModalOpen && editingCentre && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E4E8F8]">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-3">
              <h3 className="font-extrabold text-base text-[#0E1B3D]">
                {editingCentre.name ? "Edit Centre" : "Add New Branch Centre"}
              </h3>
              <button
                type="button"
                onClick={() => setCentreModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Branch Name</label>
                <input
                  type="text"
                  value={editingCentre.name}
                  onChange={(e) => setEditingCentre({ ...editingCentre, name: e.target.value })}
                  placeholder="e.g. Satara Flagship HQ or Pune Hub"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0E1B3D] mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={editingCentre.tag}
                    onChange={(e) => setEditingCentre({ ...editingCentre, tag: e.target.value })}
                    placeholder="e.g. Flagship HQ or Branch"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0E1B3D] mb-1">Helpline Phone</label>
                  <input
                    type="text"
                    value={editingCentre.phone}
                    onChange={(e) => setEditingCentre({ ...editingCentre, phone: e.target.value })}
                    placeholder="+91 84593 44077"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Full Physical Address</label>
                <textarea
                  rows={2}
                  value={editingCentre.address}
                  onChange={(e) => setEditingCentre({ ...editingCentre, address: e.target.value })}
                  placeholder="Near Powai Naka, Sadar Bazar, Satara, Maharashtra 415001"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Google Maps Link</label>
                <input
                  type="text"
                  value={editingCentre.mapsUrl}
                  onChange={(e) => setEditingCentre({ ...editingCentre, mapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0E1B3D] mb-1">Operating Timings</label>
                  <input
                    type="text"
                    value={editingCentre.timings}
                    onChange={(e) => setEditingCentre({ ...editingCentre, timings: e.target.value })}
                    placeholder="Mon - Sun: 8:00 AM - 8:30 PM"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0E1B3D] mb-1">Next Batch Starting</label>
                  <input
                    type="text"
                    value={editingCentre.nextBatchDate}
                    onChange={(e) => setEditingCentre({ ...editingCentre, nextBatchDate: e.target.value })}
                    placeholder="Every Monday • 8 AM & 5:30 PM"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingCentre.isHeadquarter}
                  onChange={(e) => setEditingCentre({ ...editingCentre, isHeadquarter: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0B57D0]"
                />
                <span className="font-bold text-[#0E1B3D]">Mark as Primary Flagship Headquarters</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E8F8]">
              <button
                type="button"
                onClick={() => setCentreModalOpen(false)}
                className="px-3.5 py-2 bg-white border border-[#D5D9EB] rounded-xl text-xs font-bold text-[#5A6478]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingCentre.name) {
                    alert("Please enter branch name");
                    return;
                  }
                  const existingIndex = cmsData.centres.findIndex((c) => c.id === editingCentre.id);
                  let updatedCentres = [...cmsData.centres];
                  if (existingIndex >= 0) {
                    updatedCentres[existingIndex] = editingCentre;
                  } else {
                    updatedCentres.push(editingCentre);
                  }
                  setCmsData({ ...cmsData, centres: updatedCentres });
                  setCentreModalOpen(false);
                }}
                className="px-4 py-2 bg-[#0B57D0] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#0842A0]"
              >
                Save Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ EDIT/CREATE MODAL */}
      {faqModalOpen && editingFaq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E4E8F8]">
            <div className="flex items-center justify-between border-b border-[#E4E8F8] pb-3">
              <h3 className="font-extrabold text-base text-[#0E1B3D]">
                {editingFaq.question ? "Edit FAQ" : "Add New FAQ"}
              </h3>
              <button
                type="button"
                onClick={() => setFaqModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Category</label>
                <input
                  type="text"
                  value={editingFaq.category}
                  onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                  placeholder="Admissions / Methodology / Online Access"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Question</label>
                <input
                  type="text"
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  placeholder="e.g. Who can join MindMaster Academy programs?"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB] font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0E1B3D] mb-1">Detailed Answer</label>
                <textarea
                  rows={4}
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  placeholder="Explain clearly in English..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D9EB]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E8F8]">
              <button
                type="button"
                onClick={() => setFaqModalOpen(false)}
                className="px-3.5 py-2 bg-white border border-[#D5D9EB] rounded-xl text-xs font-bold text-[#5A6478]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingFaq.question || !editingFaq.answer) {
                    alert("Please provide both question and answer");
                    return;
                  }
                  const existingIndex = cmsData.faqs.findIndex((f) => f.id === editingFaq.id);
                  let updatedFaqs = [...cmsData.faqs];
                  if (existingIndex >= 0) {
                    updatedFaqs[existingIndex] = editingFaq;
                  } else {
                    updatedFaqs.push(editingFaq);
                  }
                  setCmsData({ ...cmsData, faqs: updatedFaqs });
                  setFaqModalOpen(false);
                }}
                className="px-4 py-2 bg-[#0B57D0] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#0842A0]"
              >
                Save FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE WEBSITE PREVIEW MODAL / RESPONSIVE VIEWPORT */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col animate-fade-in">
          {/* Preview Navigation Header */}
          <div className="bg-[#0E1B3D] text-white px-6 py-3.5 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-lg">🌐</span>
              <div>
                <h3 className="text-sm font-extrabold text-white">Live Website Preview</h3>
                <p className="text-[10px] text-white/60">
                  Previewing MindMaster Academy public website with live CMS state
                </p>
              </div>
            </div>

            {/* Viewport switchers */}
            <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewViewport("desktop")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewViewport === "desktop" ? "bg-white text-[#0E1B3D]" : "text-white/70 hover:text-white"
                }`}
              >
                <span>🖥️</span> Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport("tablet")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewViewport === "tablet" ? "bg-white text-[#0E1B3D]" : "text-white/70 hover:text-white"
                }`}
              >
                <span>📱</span> Tablet
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport("mobile")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewViewport === "mobile" ? "bg-white text-[#0E1B3D]" : "text-white/70 hover:text-white"
                }`}
              >
                <span>📲</span> Mobile
              </button>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                Open in New Tab ↗
              </a>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Iframe Viewport Container */}
          <div className="flex-1 bg-slate-900 overflow-auto p-4 flex items-center justify-center">
            <div
              className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 h-full border border-white/20 flex flex-col ${
                previewViewport === "desktop"
                  ? "w-full max-w-6xl"
                  : previewViewport === "tablet"
                  ? "w-[768px]"
                  : "w-[390px]"
              }`}
            >
              <iframe
                src="http://localhost:5173"
                title="MindMaster Website Live Preview"
                className="w-full flex-1 border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
