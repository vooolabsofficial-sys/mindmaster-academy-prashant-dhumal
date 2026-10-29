"use client";

import React, { useState, useEffect, useRef } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { StaffUser } from "@/lib/types";
import { getCurrentStaff, logStaffAction } from "@/lib/staffStore";
import { Phone, CheckCircle2, Clock } from "lucide-react";
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

export default function SubAdminMessagesPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [composerText, setComposerText] = useState("");
  const [totalUnread, setTotalUnread] = useState(0);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "unread">("all");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const reload = async () => {
    setStaff(getCurrentStaff());
    await fetchDbConversations();
    const filters: { unreadOnly?: boolean; search?: string } = {};
    if (filterMode === "unread") filters.unreadOnly = true;
    if (searchQuery) filters.search = searchQuery;
    setConversations(getConversationsForStaff(filters));
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
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterMode]);

  useEffect(() => {
    if (activeConvId) {
      fetchDbMessages(activeConvId).then((msgs) => setMessages(msgs));
      markConversationReadByStaff(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleMarkInProgress = () => {
    if (!activeConv) return;
    updateTicketStatus({
      conversationId: activeConv.id,
      status: "In Progress",
      staffId: staff.staffId || staff.id,
      staffName: staff.name,
    });
    logStaffAction(
      "TICKET_STATUS_IN_PROGRESS",
      "student",
      activeConv.studentId,
      activeConv.studentName,
      `Sub-Admin ${staff.name} marked ticket ${activeConv.id} as In Progress`
    );
    toast.success("Ticket marked as In Progress");
    reload();
  };

  const handleMarkResolved = () => {
    if (!activeConv) return;
    const note = resolutionNoteInput.trim() || "Resolved by Sub-Admin.";
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
      `Sub-Admin ${staff.name} marked ticket ${activeConv.id} as Resolved: ${note}`
    );
    toast.success("Ticket resolved successfully!");
    setResolutionNoteInput("");
    setShowResolveModal(false);
    reload();
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <PermissionGuard permission="messages.manage">
      <AdminShell>
        <div className="space-y-0 font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-t-3xl border border-[#E4E8F8] shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold text-[#0E1B3D]">Messages</h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF3FE] text-[#0B57D0]">
                  messages.manage
                </span>
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {totalUnread} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                In-app student support threads.
              </p>
            </div>
          </div>

          {/* Two-Pane Layout */}
          <div className="flex bg-white border-x border-b border-[#E4E8F8] rounded-b-3xl overflow-hidden min-h-[600px]">
            {/* Left Pane: Conversation List */}
            <div className="w-full md:w-[380px] border-r border-[#E4E8F8] flex flex-col shrink-0">
              <div className="p-3 border-b border-[#E4E8F8] space-y-2">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl focus:outline-none focus:border-[#0B57D0]"
                />
                <div className="flex gap-1.5">
                  {(["all", "unread"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterMode(f)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize transition-all ${
                        filterMode === f
                          ? "bg-[#0B57D0] text-white"
                          : "bg-[#F5F7FF] text-[#5A6478] hover:bg-[#EEF4FF]"
                      }`}
                    >
                      {f === "all" ? "All" : `Unread (${totalUnread})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#E4E8F8]">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-[#8A94A6]">No conversations.</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`w-full p-3.5 text-left hover:bg-[#FAFBFD] transition-colors ${
                        activeConvId === conv.id ? "bg-[#EBF3FE] border-l-2 border-[#0B57D0]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-sm font-bold">
                          {conv.studentName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-[#0E1B3D] truncate">{conv.studentName}</h4>
                            <span className="text-[10px] text-[#8A94A6] shrink-0 ml-2">
                              {new Date(conv.lastAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          {conv.courseTitle && (
                            <span className="text-[10px] font-semibold text-[#0B57D0]">{conv.courseTitle}</span>
                          )}
                          <p className="text-[11px] text-[#5A6478] truncate mt-0.5">{conv.lastMessage}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {conv.category && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                {conv.category}
                              </span>
                            )}
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                              conv.status === "Resolved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : conv.status === "In Progress"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {conv.status || "Open"}
                            </span>
                          </div>
                        </div>
                        {conv.unreadStaff > 0 && (
                          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {conv.unreadStaff}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Pane */}
            <div className="hidden md:flex flex-col flex-1">
              {!activeConvId ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#F5F7FF] flex items-center justify-center mx-auto mb-3 text-3xl">💬</div>
                    <p className="text-xs text-[#8A94A6] font-medium">Select a conversation to reply</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Thread Header with Call Student & Status Actions */}
                  {activeConv && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-[#E4E8F8] bg-[#FAFBFD]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {activeConv.studentName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-[#0E1B3D] truncate">{activeConv.studentName}</h3>
                            {activeConv.category && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                {activeConv.category}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              activeConv.status === "Resolved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : activeConv.status === "In Progress"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {activeConv.status || "Open"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#5A6478] mt-0.5 flex-wrap">
                            <span>Phone: <strong className="font-mono text-[#0E1B3D]">{activeConv.studentPhone || (activeConv.studentId.startsWith("std-") ? "+91 84593 44077" : activeConv.studentId)}</strong></span>
                            {activeConv.courseTitle && <span className="text-[#0B57D0] font-semibold">• {activeConv.courseTitle}</span>}
                            {activeConv.district && <span className="text-[#8A94A6]">• {activeConv.district}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Call Student & Ticket Status Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`tel:${(activeConv.studentPhone || activeConv.studentId).replace(/[^0-9+]/g, "") || "+918459344077"}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          title="Call student directly via telephone"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Call Student</span>
                        </a>

                        {activeConv.status !== "In Progress" && activeConv.status !== "Resolved" && (
                          <button
                            type="button"
                            onClick={handleMarkInProgress}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            title="Mark ticket as in progress"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>In Progress</span>
                          </button>
                        )}

                        {activeConv.status !== "Resolved" && (
                          <button
                            type="button"
                            onClick={() => setShowResolveModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                            title="Mark ticket as resolved"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Resolve</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#FAFBFD]">
                    {messages.map((msg) => {
                      const isStaff = msg.senderType === "staff";
                      return (
                        <div key={msg.id} className={`flex ${isStaff ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isStaff
                                ? "bg-[#0B57D0] text-white rounded-br-md"
                                : "bg-white text-[#0E1B3D] border border-[#E4E8F8] rounded-bl-md"
                            }`}
                          >
                            {isStaff && (
                              <p className="text-[10px] font-bold text-blue-200 mb-1">{msg.senderName} (Staff)</p>
                            )}
                            {!isStaff && (
                              <p className="text-[10px] font-bold text-[#0B57D0] mb-1">{msg.senderName}</p>
                            )}
                            <p>{msg.body}</p>
                            <p className={`text-[10px] mt-1.5 ${isStaff ? "text-blue-200" : "text-[#8A94A6]"}`}>
                              {new Date(msg.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-[#E4E8F8] bg-white">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder={`Reply as ${staff.name}...`}
                        className="flex-1 text-xs px-4 py-3 bg-[#F5F7FF] border border-[#E4E8F8] rounded-xl focus:outline-none focus:border-[#0B57D0]"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!composerText.trim()}
                        className="px-5 py-3 bg-[#0B57D0] hover:bg-[#0842A0] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Resolve Ticket Modal */}
        {showResolveModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Resolve Support Ticket</h3>
                  <p className="text-xs text-slate-500">Provide an optional resolution reply sent to the student.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resolution Note / Reply</label>
                <textarea
                  rows={3}
                  value={resolutionNoteInput}
                  onChange={(e) => setResolutionNoteInput(e.target.value)}
                  placeholder="e.g. Issue resolved. Follow-up complete."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
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
      </AdminShell>
    </PermissionGuard>
  );
}
