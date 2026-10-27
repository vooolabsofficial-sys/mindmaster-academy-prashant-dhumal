"use client";

import React, { useState, useEffect } from "react";
import {
  RecycleBinItem,
  getRecycleBinItems,
  restoreFromRecycleBin,
  permanentlyDeleteFromRecycleBin,
  clearRecycleBin,
} from "@/lib/categoryStore";
import {
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Video,
  BookOpen,
  Tag,
  Loader2,
  Calendar,
} from "lucide-react";

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored?: (item: RecycleBinItem) => void;
}

export default function RecycleBinModal({
  isOpen,
  onClose,
  onRestored,
}: RecycleBinModalProps) {
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "course" | "video" | "category">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setItems(getRecycleBinItems());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = async (item: RecycleBinItem) => {
    setProcessingId(item.id);
    try {
      const res = await restoreFromRecycleBin(item.id);
      if (res.success) {
        loadData();
        onRestored?.(item);
        setToastMessage(`✓ "${item.title}" पूर्ववत पुनर्संचयित (Restored) करण्यात आला!`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handlePermanentDelete = async (item: RecycleBinItem) => {
    if (!confirm(`⚠️ "${item.title}" कायमचा हटवायचा आहे का? ही कृती पूर्ववत करता येणार नाही.`)) {
      return;
    }
    setProcessingId(item.id);
    try {
      const ok = await permanentlyDeleteFromRecycleBin(item.id);
      if (ok) {
        loadData();
        setToastMessage(`🗑️ "${item.title}" डेटाबेसमधून कायमचा हटवण्यात आला.`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleClearAll = () => {
    if (!confirm("⚠️ रीसायकल बिनमधील सर्व वस्तू कायमच्या हटवायच्या आहेत का?")) {
      return;
    }
    clearRecycleBin();
    loadData();
    setToastMessage("रीसायकल बिन पूर्णपणे रिकामी करण्यात आली.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredItems = items.filter((i) => {
    if (activeTab === "all") return true;
    return i.itemType === activeTab;
  });

  const courseCount = items.filter((i) => i.itemType === "course").length;
  const videoCount = items.filter((i) => i.itemType === "video").length;
  const catCount = items.filter((i) => i.itemType === "category").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#0E1B3D] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-600/60 text-white">
                <Trash2 className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-lg font-heading">
                रीसायकल बिन (Recycle Bin / कचरापेटी)
              </h3>
            </div>
            <p className="text-xs text-blue-200 mt-1">
              येथून चुकून हटवलेले कोर्सेस, व्हिडिओ किंवा प्रवर्गे पुन्हा एका क्लिकवर पूर्ववत (Undo / Restore) करा.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between px-6">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-950">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter Tabs & Clear Button */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            {[
              { key: "all", label: `सर्व (${items.length})` },
              { key: "course", label: `कोर्सेस (${courseCount})` },
              { key: "video", label: `व्हिडिओ (${videoCount})` },
              { key: "category", label: `प्रवर्गे (${catCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  activeTab === tab.key
                    ? "bg-[#0B57D0] text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 underline"
            >
              कचरापेटी रिकामी करा (Empty Trash)
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 text-xs">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-3">
                ✓
              </div>
              <h4 className="font-extrabold text-sm text-[#0E1B3D]">
                रीसायकल बिन रिकामी आहे (No Items in Trash)
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                कोणताही कोर्स किंवा व्हिडिओ चुकून हटवल्यास तो येथे दिसेल आणि एका क्लिकवर परत आणता येईल.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden">
              {filteredItems.map((item) => {
                const isBusy = processingId === item.id;
                const dateFormatted = new Date(item.deletedAt).toLocaleString("mr-IN", {
                  dateStyle: "short",
                  timeStyle: "short",
                });

                return (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 bg-slate-100 text-slate-700">
                        {item.itemType === "course" && <BookOpen className="w-4 h-4 text-blue-600" />}
                        {item.itemType === "video" && <Video className="w-4 h-4 text-red-600" />}
                        {item.itemType === "category" && <Tag className="w-4 h-4 text-purple-600" />}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="font-extrabold text-[#0E1B3D] truncate">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="uppercase font-bold text-slate-500">
                            {item.itemType}
                          </span>
                          <span>•</span>
                          <span>हटवले: {dateFormatted}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRestore(item)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>पूर्ववत करा (Undo / Restore)</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handlePermanentDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="कायमचे हटवा (Permanent Delete)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            💡 Undo केल्यावर आयटम लगेच मूळ जागी पूर्ववत सक्रिय होतो.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition"
          >
            बंद करा (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
