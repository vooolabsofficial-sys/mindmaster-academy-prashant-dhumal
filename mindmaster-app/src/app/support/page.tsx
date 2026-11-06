"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppShell from "@/components/navigation/AppShell";
import { MessageCircle, Send, ArrowLeft, Brain } from "lucide-react";
import {
  Conversation,
  Message,
  getConversationsForStudent,
  getConversationMessages,
  sendMessage,
  markConversationReadByStudent,
  createConversation,
  fetchDbConversations,
  fetchDbMessages,
  subscribeToSupportLiveUpdates,
} from "@/lib/messageStore";

export default function StudentSupportPage() {
  const [currentStudent, setCurrentStudent] = useState<{
    id: string;
    name: string;
    district: string;
  } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [composerText, setComposerText] = useState("");
  const [newThreadText, setNewThreadText] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [supportSettings, setSupportSettings] = useState({
    supportPhone: "+91 84593 44077",
    supportEmail: "mindmasterdhumal@gmail.com",
    centreAddress: "Satara, Taluka: Satara, Dist: Satara, Maharashtra 415001",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setSupportSettings({
            supportPhone: data.settings.support_phone || "+91 84593 44077",
            supportEmail: data.settings.support_email || "mindmasterdhumal@gmail.com",
            centreAddress: data.settings.centre_address || "Satara, Taluka: Satara, Dist: Satara, Maharashtra 415001",
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mindmaster_user_profile");
      const savedPhone = localStorage.getItem("mindmaster_verified_phone");
      if (raw) {
        const p = JSON.parse(raw);
        const resolvedPhone = p.phone || p.mobile_number || savedPhone || "";
        if (p.id || resolvedPhone) {
          setCurrentStudent({
            id: p.id || (resolvedPhone ? `std-${resolvedPhone.replace(/\D/g, "").slice(-10)}` : ""),
            name: p.full_name || "Student",
            district: p.district || "Satara",
          });
        }
      } else if (savedPhone) {
        setCurrentStudent({
          id: `std-${savedPhone.replace(/\D/g, "").slice(-10)}`,
          name: "Student",
          district: "Satara",
        });
      }
    } catch {}
  }, []);

  const reload = async () => {
    if (!currentStudent?.id) return;
    await fetchDbConversations();
    setConversations(getConversationsForStudent(currentStudent.id));
  };

  useEffect(() => {
    if (!currentStudent?.id) return;
    reload();
    const unsubscribe = subscribeToSupportLiveUpdates(() => {
      reload();
      if (activeConvId) {
        fetchDbMessages(activeConvId).then((msgs) => setMessages(msgs));
      }
    });
    window.addEventListener("mma_messages_changed", reload);
    return () => {
      unsubscribe();
      window.removeEventListener("mma_messages_changed", reload);
    };
  }, [currentStudent?.id, activeConvId]);

  useEffect(() => {
    if (activeConvId) {
      fetchDbMessages(activeConvId).then((msgs) => setMessages(msgs));
      markConversationReadByStudent(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!composerText.trim() || !activeConvId || !currentStudent) return;
    const text = composerText.trim();
    setComposerText("");
    const newMsg = sendMessage({
      conversationId: activeConvId,
      senderType: "student",
      senderId: currentStudent.id,
      senderName: currentStudent.name,
      body: text,
    });
    setMessages((prev) => [...prev, newMsg]);
    reload();
  };

  const handleNewThread = () => {
    if (!newThreadText.trim() || !currentStudent) return;
    const conv = createConversation({
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      district: currentStudent.district,
      firstMessage: newThreadText.trim(),
    });
    setNewThreadText("");
    setShowNewThread(false);
    reload();
    setActiveConvId(conv.id);
  };

  if (!currentStudent) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-16 px-4 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-slate-700">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Student Support & Helpdesk
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Please sign in with your mobile number to access direct messaging with Prashant Dhumal Sir and the academic support desk.
          </p>
          <Link
            href="/login?next=/support"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
          >
            Sign In to Open Tickets →
          </Link>
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 w-full text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Direct Helpline:</p>
            <p>{supportSettings.supportPhone}</p>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mt-2">Campus Desk:</p>
            <p>{supportSettings.centreAddress}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Thread View
  if (activeConvId && activeConv) {
    return (
      <AppShell>
        <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-40px)] max-w-2xl mx-auto">
          {/* Thread Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 rounded-t-2xl">
            <button
              onClick={() => setActiveConvId(null)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-slate-900 truncate">
                {activeConv.courseTitle ? `${activeConv.courseTitle}` : "MindMaster Academy"}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {activeConv.staffName ? `Staff: ${activeConv.staffName}` : "Academy Support"}
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {/* Academy pinned banner */}
            <div className="text-center py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200">
                Thread Started
              </span>
            </div>

            {messages.map((msg) => {
              const isStudent = msg.senderType === "student";
              return (
                <div key={msg.id} className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isStudent
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"
                    }`}
                  >
                    {!isStudent && (
                      <p className="text-[10px] font-bold text-blue-600 mb-1">{msg.senderName}</p>
                    )}
                    <p>{msg.body}</p>
                    <p className={`text-[10px] mt-1.5 ${isStudent ? "text-blue-200" : "text-slate-400"}`}>
                      {new Date(msg.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="p-3 bg-white border-t border-slate-200 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={handleSend}
                disabled={!composerText.trim()}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Conversation List View
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4 px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Support</h1>
            <p className="text-xs text-slate-500 mt-0.5">Chat with MindMaster Academy team</p>
          </div>
          <button
            onClick={() => setShowNewThread(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            + New Message
          </button>
        </div>

        {/* Pinned Academy Thread */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-slate-900">MindMaster Academy</h3>
              <p className="text-[11px] text-blue-600 font-semibold"> Pinned — General support &amp; queries</p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-600 font-medium">
                <a
                  href={`tel:${supportSettings.supportPhone.replace(/\s+/g, "")}`}
                  className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                >
                   {supportSettings.supportPhone}
                </a>
                <span>•</span>
                <span> {supportSettings.centreAddress}</span>
              </div>
            </div>
            <span className="text-[10px] text-blue-500 font-bold px-2 py-1 bg-white rounded-full border border-blue-200">
              Academy
            </span>
          </div>
        </div>

        {/* New Thread Composer */}
        {showNewThread && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <p className="text-xs font-bold text-slate-700">Start a new conversation:</p>
            <textarea
              value={newThreadText}
              onChange={(e) => setNewThreadText(e.target.value)}
              placeholder="Describe your question or issue..."
              rows={3}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowNewThread(false); setNewThreadText(""); }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleNewThread}
                disabled={!newThreadText.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">No conversations yet. Tap &quot;New Message&quot; to start.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className="w-full bg-white border border-slate-200 hover:border-blue-200 rounded-2xl p-4 flex items-center gap-3 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {conv.courseTitle || "General Support"}
                    </h4>
                    {conv.unreadStudent > 0 && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadStudent}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(conv.lastAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
