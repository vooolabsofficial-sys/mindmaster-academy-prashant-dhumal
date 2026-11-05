"use client";

import React, { useState, useEffect, useRef } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { StaffUser } from "@/lib/types";
import { getCurrentStaff, getStaffCourses, logStaffAction } from "@/lib/staffStore";
import BroadcastNotificationModal from "@/components/admin/BroadcastNotificationModal";
import {
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  User,
  Send,
  MessageSquare,
  Search,
  Filter,
  Check,
  ChevronRight,
  ShieldCheck,
  Radio,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Conversation,
  Message,
  getConversationsForStaff,
  getConversationMessages,
  sendMessage,
  markConversationReadByStaff,
  getUnreadCountForStaff,
  fetchDbConversations,
  fetchDbMessages,
  subscribeToSupportLiveUpdates,
  updateTicketStatus,
} from "@/lib/messageStore";

type StatusTab = "all" | "Open" | "In Progress" | "Resolved";

export default function StaffMessagesPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [composerText, setComposerText] = useState("");
  const [totalUnread, setTotalUnread] = useState(0);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");
  const [resettingPhone, setResettingPhone] = useState<string | null>(null);

  // Filters & Pagination
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, statusTab, categoryFilter]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const reload = async () => {
    setStaff(getCurrentStaff());
    await fetchDbConversations();
    const all = getConversationsForStaff();
    setConversations(all);
    setTotalUnread(getUnreadCountForStaff());
  };

  useEffect(() => {
    reload();
    const unsubscribe = subscribeToSupportLiveUpdates(() => {
      reload();
      if (activeConvId) {
        fetchDbMessages(activeConvId).then((msgs) => setMessages(msgs));
      }
    });
    window.addEventListener("mma_staff_changed", reload);
    window.addEventListener("mma_messages_changed", reload);
    return () => {
      unsubscribe();
      window.removeEventListener("mma_staff_changed", reload);
      window.removeEventListener("mma_messages_changed", reload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

  useEffect(() => {
    if (activeConvId) {
      fetchDbMessages(activeConvId).then((msgs) => setMessages(msgs));
      markConversationReadByStaff(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Direct 1-Click Quick Reset Device Lock
  const handleQuickResetDevice = async (phone: string, studentName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
    if (!cleanPhone) {
      toast.error("Valid student phone number required");
      return;
    }

    setResettingPhone(cleanPhone);
    try {
      const res = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-device", phone: cleanPhone }),
      });

      if (!res.ok) {
        throw new Error("Device lock reset failed");
      }

      logStaffAction(
        "STUDENT_DEVICE_RESET",
        "student",
        cleanPhone,
        studentName,
        `Staff ${staff.name} quick-reset DRM device lock for student phone ${cleanPhone}`
      );

      toast.success(`DRM lock released for ${studentName} (${cleanPhone})! Student can now log in.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset device lock.");
    } finally {
      setResettingPhone(null);
    }
  };

  const handleSend = () => {
    if (!composerText.trim() || !activeConvId) return;
    sendMessage({
      conversationId: activeConvId,
      senderType: "staff",
      senderId: staff.id,
      senderName: staff.name,
      body: composerText.trim(),
    });
    setComposerText("");
    setMessages(getConversationMessages(activeConvId));
    reload();
  };

  const handleMarkInProgress = (conv: Conversation) => {
    updateTicketStatus({
      conversationId: conv.id,
      status: "In Progress",
      staffId: staff.staffId || staff.id,
      staffName: staff.name,
    });
    logStaffAction(
      "TICKET_STATUS_IN_PROGRESS",
      "student",
      conv.studentId,
      conv.studentName,
      `Staff ${staff.name} marked ticket ${conv.id} as In Progress`
    );
    toast.success("Ticket marked as In Progress");
    reload();
  };

  const handleMarkResolved = () => {
    if (!activeConv) return;
    const note = resolutionNoteInput.trim() || "Resolved by support desk.";
    updateTicketStatus({
      conversationId: activeConv.id,
      status: "Resolved",
      resolutionNote: note,
      staffId: staff.staffId || staff.id,
      staffName: staff.name,
    });
    logStaffAction(
      "TICKET_STATUS_RESOLVED",
      "student",
      activeConv.studentId,
      activeConv.studentName,
      `Staff ${staff.name} marked ticket ${activeConv.id} as Resolved: ${note}`
    );
    toast.success("Ticket resolved successfully!");
    setResolutionNoteInput("");
    setShowResolveModal(false);
    reload();
  };

  const handleOpenStudentDrawer = (phone: string, name?: string) => {
    window.dispatchEvent(
      new CustomEvent("mma_open_student_drawer", { detail: { phone, name } })
    );
  };

  // Extract Categories
  const categoriesInConvs = Array.from(
    new Set(
      conversations
        .map((c) => c.category)
        .filter(Boolean) as string[]
    )
  );

  // Filter Conversations
  const filteredConversations = conversations.filter((c) => {
    // Status tab filter
    if (statusTab !== "all") {
      const currentStatus = c.status || "Open";
      if (currentStatus !== statusTab) return false;
    }

    // Category filter
    if (categoryFilter !== "all" && c.category !== categoryFilter) {
      return false;
    }

    // Debounced Search query
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      const matchName = (c.studentName || "").toLowerCase().includes(q);
      const matchPhone = (c.studentPhone || c.studentId || "").toLowerCase().includes(q);
      const matchCourse = (c.courseTitle || "").toLowerCase().includes(q);
      const matchMsg = (c.lastMessage || "").toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCourse && !matchMsg) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredConversations.length / PAGE_SIZE));
  const paginatedConversations = filteredConversations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Status Tab Counts
  const countOpen = conversations.filter((c) => (c.status || "Open") === "Open").length;
  const countInProgress = conversations.filter((c) => c.status === "In Progress").length;
  const countResolved = conversations.filter((c) => c.status === "Resolved").length;

  return (
    <PermissionGuard permission="messages.manage">
      <AdminShell>
        <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
                  Support Ticket Desk
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#2563EB] dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  messages.manage
                </span>
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                    {totalUnread} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Direct student issue resolutions, device lock resets, and support inquiries.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Radio className="w-4 h-4" />
                <span>Send Broadcast Notice</span>
              </button>
            </div>
          </div>

          {/* Status Tabs Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1E293B] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusTab("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  statusTab === "all"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>All Tickets</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                  {conversations.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusTab("Open")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  statusTab === "Open"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Open</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusTab === "Open" ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"}`}>
                  {countOpen}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusTab("In Progress")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  statusTab === "In Progress"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>In Progress</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusTab === "In Progress" ? "bg-white/20 text-white" : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"}`}>
                  {countInProgress}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusTab("Resolved")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  statusTab === "Resolved"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolved</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusTab === "Resolved" ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"}`}>
                  {countResolved}
                </span>
              </button>
            </div>

            {/* Category Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
                Category:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categoriesInConvs.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Two-Pane Ticket Desk */}
          <div className="grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs min-h-[620px]">
            {/* Left Pane: Tickets List */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 flex flex-col">
              {/* Search Box */}
              <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name, phone or message..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#2563EB] text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Tickets Cards List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[680px]">
                {paginatedConversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto stroke-1" />
                    <p className="text-xs font-semibold">No tickets match the selected criteria.</p>
                  </div>
                ) : (
                  paginatedConversations.map((conv) => {
                    const isSelected = activeConvId === conv.id;
                    const phone = (conv.studentPhone || conv.studentId || "").replace(/[^0-9]/g, "").slice(-10);
                    const status = conv.status || "Open";

                    return (
                      <div
                        key={conv.id}
                        className={`p-3.5 transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/70 dark:bg-blue-950/30 border-l-4 border-[#2563EB]"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                        onClick={() => setActiveConvId(conv.id)}
                      >
                        {/* Student Info & Status Strip */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {conv.studentName}
                              </h4>
                              {conv.unreadStaff > 0 && (
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              {conv.studentPhone || conv.studentId}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                                status === "Resolved"
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  : status === "In Progress"
                                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              }`}
                            >
                              {status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(conv.lastAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>

                        {/* Last Message Snippet */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                          {conv.lastMessage}
                        </p>

                        {/* Badges: Category & Course */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {conv.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80">
                              {conv.category}
                            </span>
                          )}
                          {conv.courseTitle && (
                            <span className="text-[10px] font-semibold text-[#2563EB] dark:text-blue-400 truncate max-w-[200px]">
                              • {conv.courseTitle}
                            </span>
                          )}
                        </div>

                        {/* 3 Direct Actions on Ticket Card */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                          {/* Call Student */}
                          <a
                            href={`tel:${phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition"
                            title="Call student immediately"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>Call</span>
                          </a>

                          {/* Quick Reset Device */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickResetDevice(phone, conv.studentName);
                            }}
                            disabled={resettingPhone === phone}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-300 text-[11px] font-bold flex items-center gap-1 transition disabled:opacity-50"
                            title="Reset DRM single-device session lock"
                          >
                            {resettingPhone === phone ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            <span>Reset Device</span>
                          </button>

                          {/* 360° Profile */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStudentDrawer(phone, conv.studentName);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition"
                            title="Open Student 360° Profile & Access Drawer"
                          >
                            <User className="w-3 h-3" />
                            <span>360°</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Tickets Pagination Toolbar */}
              {totalPages > 1 && (
                <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>Page {page} of {totalPages} ({filteredConversations.length} tickets)</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Pane: Active Thread Workspace */}
            <div className="lg:col-span-7 flex flex-col justify-between min-h-[500px]">
              {!activeConv ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500">
                  <div className="max-w-xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                      <MessageSquare className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Select a support ticket</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      View full student conversation, reset device lock, call, or resolve ticket directly.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Thread Header with Actions */}
                  <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {activeConv.studentName}
                        </h3>
                        {activeConv.category && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {activeConv.category}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            activeConv.status === "Resolved"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : activeConv.status === "In Progress"
                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {activeConv.status || "Open"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        <span>{activeConv.studentPhone || activeConv.studentId}</span>
                        {activeConv.courseTitle && <span className="font-sans text-[#2563EB] dark:text-blue-400">• {activeConv.courseTitle}</span>}
                      </div>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${(activeConv.studentPhone || activeConv.studentId).replace(/[^0-9]/g, "").slice(-10)}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Call</span>
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          handleQuickResetDevice(
                            activeConv.studentPhone || activeConv.studentId,
                            activeConv.studentName
                          )
                        }
                        disabled={resettingPhone !== null}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset Device</span>
                      </button>

                      {activeConv.status !== "In Progress" && activeConv.status !== "Resolved" && (
                        <button
                          type="button"
                          onClick={() => handleMarkInProgress(activeConv)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>In Progress</span>
                        </button>
                      )}

                      {activeConv.status !== "Resolved" && (
                        <button
                          type="button"
                          onClick={() => setShowResolveModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reply &amp; Resolve</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 dark:bg-slate-900/30 max-h-[500px]">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400">
                        No previous messages in this conversation.
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isStaff = msg.senderType === "staff";
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isStaff ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                                isStaff
                                  ? "bg-[#2563EB] text-white rounded-br-xs"
                                  : "bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-bl-xs"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <span className={`text-[10px] font-bold ${isStaff ? "text-blue-100" : "text-[#2563EB] dark:text-blue-400"}`}>
                                  {isStaff ? `${msg.senderName} (Staff)` : msg.senderName}
                                </span>
                                <span className={`text-[9px] ${isStaff ? "text-blue-200" : "text-slate-400"}`}>
                                  {new Date(msg.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p>{msg.body}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Composer */}
                  <div className="p-3 bg-white dark:bg-[#1E293B] border-t border-slate-200/80 dark:border-slate-800 space-y-2">
                    {/* ⚡ 1-Click Marathi Canned Replies */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 shrink-0">
                        १-क्लिक उत्तरे:
                      </span>
                      {[
                        { label: "📱 फोन रिसेट केला", msg: "नमस्कार! तुमचे जुने डिव्हाइस रिसेट केले आहे. आता नवीन फोनमध्ये लॉगिन करा." },
                        { label: "🎓 ऍक्सेस ॲक्टिव्ह केला", msg: "तुमचा कोर्स ऍक्सेस यशस्वीरीत्या ॲक्टिव्ह केला आहे. 'My Courses' मध्ये जाऊन पहा." },
                        { label: "⏳ समस्या तपासत आहोत", msg: "तुमची समस्या तपासली जात आहे. थोड्याच वेळात आमचे प्रतिनिधी संपर्क करतील." },
                        { label: "📞 ऑफिसला कॉल करा", msg: "या समस्येसाठी कृपया आमच्या सातारा सपोर्ट नंबरवर कॉल करा: +91 84593 44077." },
                      ].map((canned, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setComposerText(canned.msg)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap transition cursor-pointer border border-slate-200/70 dark:border-slate-700 text-[10px]"
                        >
                          {canned.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder={`Reply as ${staff.name}...`}
                        className="flex-1 text-xs px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#2563EB] text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!composerText.trim()}
                        className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Broadcast Notification Modal */}
          <BroadcastNotificationModal
            isOpen={isBroadcastModalOpen}
            onClose={() => setIsBroadcastModalOpen(false)}
            courses={getStaffCourses()}
          />

          {/* Reply & Resolve Ticket Modal */}
          {showResolveModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Reply &amp; Resolve Support Ticket</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Record an official resolution summary note.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resolution Note / Reply
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNoteInput}
                    onChange={(e) => setResolutionNoteInput(e.target.value)}
                    placeholder="e.g. Device lock released. Student verified and logged in successfully."
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#2563EB] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkResolved}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Resolution</span>
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
