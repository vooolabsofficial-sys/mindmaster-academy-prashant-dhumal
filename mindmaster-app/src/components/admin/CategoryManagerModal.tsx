"use client";

import React, { useState, useEffect } from "react";
import {
  CategoryItem,
  getCategories,
  saveCategory,
  renameCategory,
  deleteCategory,
  moveCategory,
} from "@/lib/categoryStore";
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

export default function CategoryManagerModal({
  isOpen,
  onClose,
  onCategoriesChanged,
}: CategoryManagerModalProps) {
  const { currentLanguage } = useLanguage();
  const isMarathi = currentLanguage === "mr";

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // New Category State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newBadge, setNewBadge] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAudience, setNewAudience] = useState<"all" | "competitive" | "school">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastDeletedCategory, setLastDeletedCategory] = useState<CategoryItem | null>(null);

  const loadData = () => {
    setCategories(getCategories());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingCatId(cat.id);
    setEditLabel(cat.label);
    setEditBadge(cat.badge);
    setEditDesc(cat.description || "");
  };

  const handleSaveEdit = (catId: string) => {
    if (!editLabel.trim()) return;
    renameCategory(catId, editLabel, editBadge, editDesc);
    setEditingCatId(null);
    loadData();
    onCategoriesChanged?.();
    setToastMessage(
      isMarathi
        ? `✓ "${editLabel}" प्रवर्ग यशस्वीपणे अद्ययावत केला.`
        : `✓ Category "${editLabel}" updated successfully.`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    saveCategory({
      label: newLabel.trim(),
      badge: newBadge.trim() || newLabel.trim(),
      description: newDesc.trim(),
      audienceType: newAudience,
      category: "memory",
    });

    setNewLabel("");
    setNewBadge("");
    setNewDesc("");
    setIsAddingNew(false);
    loadData();
    onCategoriesChanged?.();
    setToastMessage(
      isMarathi
        ? `🎉 नवीन प्रवर्ग "${newLabel}" जोडला गेला!`
        : `🎉 New category "${newLabel}" created successfully!`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDelete = (cat: CategoryItem) => {
    const res = deleteCategory(cat.id);
    if (res.success) {
      loadData();
      onCategoriesChanged?.();
      setLastDeletedCategory(cat);
      setToastMessage(
        isMarathi
          ? `🗑️ "${cat.label}" हटवला आणि रीसायकल बिनमध्ये हलवला.`
          : `🗑️ "${cat.label}" moved to Recycle Bin.`
      );
      setTimeout(() => {
        setLastDeletedCategory((prev) => (prev?.id === cat.id ? null : prev));
      }, 8000);
    }
  };

  const handleUndoDelete = () => {
    if (!lastDeletedCategory) return;
    saveCategory(lastDeletedCategory);
    const restoredName = lastDeletedCategory.label;
    setLastDeletedCategory(null);
    loadData();
    onCategoriesChanged?.();
    setToastMessage(
      isMarathi
        ? `✓ "${restoredName}" प्रवर्ग पूर्ववत पुनर्संचयित केला!`
        : `✓ Category "${restoredName}" restored successfully!`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    moveCategory(id, direction);
    loadData();
    onCategoriesChanged?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[88vh] overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-6 bg-[#0E1B3D] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600/60 text-white">
                <Tag className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-lg font-heading">
                {isMarathi ? "प्रवर्ग व्यवस्थापन (Category Manager)" : "Category Manager"}
              </h3>
            </div>
            <p className="text-xs text-blue-200 mt-1">
              {isMarathi
                ? "नवीन प्रवर्ग तयार करा, नाव बदला, क्रमवारी लावा किंवा हटवा. हटवलेले प्रवर्ग रीसायकल बिनमधून परत आणता येतात."
                : "Create dynamic categories, rename, reorder, or delete. Changes instantly reflect across Student & Admin portals."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between px-6">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {toastMessage}
            </span>
            <div className="flex items-center gap-2">
              {lastDeletedCategory && (
                <button
                  type="button"
                  onClick={handleUndoDelete}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isMarathi ? "पूर्ववत करा (Undo)" : "Undo"}</span>
                </button>
              )}
              <button
                onClick={() => setToastMessage(null)}
                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[#0E1B3D] dark:text-white text-sm">
              {isMarathi
                ? `एकूण ${categories.length} प्रवर्गे उपलब्ध`
                : `${categories.length} Dynamic Categories`}
            </span>
            {!isAddingNew && (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="px-4 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isMarathi ? "+ नवीन प्रवर्ग जोडा" : "+ Add Category"}</span>
              </button>
            )}
          </div>

          {/* New Category Form Box */}
          {isAddingNew && (
            <form
              onSubmit={handleCreateNew}
              className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between font-bold text-[#0E1B3D] dark:text-white">
                <span className="flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {isMarathi ? "नवीन प्रवर्ग तपशील" : "New Category Details"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isMarathi ? "प्रवर्गाचे नाव (Title / Label) *" : "Category Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder={
                      isMarathi
                        ? "उदा. पोलिस भरती किंवा स्पर्धा परीक्षा"
                        : "e.g. Police Bharti, Vedic Maths, Foundation"
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-[#0E1B3D] dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isMarathi ? "लहान बॅज (Badge Text) *" : "Badge Text *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder={isMarathi ? "उदा. Police Special" : "e.g. Fast Track"}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isMarathi ? "वर्णन (Short Description)" : "Description"}
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder={
                      isMarathi
                        ? "विद्यार्थी या प्रवर्गात काय शिकतील..."
                        : "Curriculum scope and topics covered in this category"
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isMarathi ? "प्रकार (Audience)" : "Audience Scope"}
                  </label>
                  <select
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">{isMarathi ? "सर्व वयोगट (All)" : "All Learners"}</option>
                    <option value="school">{isMarathi ? "शालेय (School)" : "School (1st-10th)"}</option>
                    <option value="competitive">
                      {isMarathi ? "स्पर्धा परीक्षा (Competitive)" : "Competitive Exams"}
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
                >
                  {isMarathi ? "रद्द करा" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0B57D0] hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  {isMarathi ? "सेव्ह करा" : "Save Category"}
                </button>
              </div>
            </form>
          )}

          {/* Categories List */}
          {categories.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
              <Tag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                {isMarathi ? "अद्याप कोणताही प्रवर्ग तयार केलेला नाही." : "No categories created yet."}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {isMarathi
                  ? "नवीन प्रवर्ग जोडण्यासाठी वरील '+ नवीन प्रवर्ग जोडा' बटनावर क्लिक करा."
                  : "Click '+ Add Category' above to create your first dynamic category."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800/60 overflow-hidden">
              {categories.map((cat, index) => {
                const isEditing = editingCatId === cat.id;

                return (
                  <div key={cat.id} className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/80 transition-colors">
                    {isEditing ? (
                      <div className="space-y-3 bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              {isMarathi ? "नाव बदला (Label):" : "Category Name:"}
                            </label>
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              {isMarathi ? "बॅज (Badge):" : "Badge Text:"}
                            </label>
                            <input
                              type="text"
                              value={editBadge}
                              onChange={(e) => setEditBadge(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                            {isMarathi ? "वर्णन (Description):" : "Description:"}
                          </label>
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingCatId(null)}
                            className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
                          >
                            {isMarathi ? "रद्द करा" : "Cancel"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat.id)}
                            className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                          >
                            {isMarathi ? "बदल सेव्ह करा" : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMove(cat.id, "up")}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === categories.length - 1}
                              onClick={() => handleMove(cat.id, "down")}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[#0E1B3D] dark:text-white text-xs">
                                {cat.label}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-[#0B57D0] dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold text-[10px]">
                                {cat.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {cat.description || (isMarathi ? "कोणतेही वर्णन उपलब्ध नाही" : "No description provided")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-700/60 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                            title={isMarathi ? "नाव बदला / संपादन करा" : "Edit / Rename"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-lg transition cursor-pointer"
                            title={isMarathi ? "हटवा" : "Delete Category"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {isMarathi
              ? "💡 टीप: हटवलेले प्रवर्ग रीसायकल बिनमधून कधीही पूर्ववत करता येतात."
              : "💡 Tip: Deleted categories are kept safe in the Recycle Bin and can be restored anytime."}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {isMarathi ? "पूर्ण झाले" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
