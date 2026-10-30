"use client";

import React, { useState, useEffect } from "react";
import {
  CategoryItem,
  getCategories,
  saveCategory,
  renameCategory,
  deleteCategory,
} from "@/lib/categoryStore";
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles,
} from "lucide-react";

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
    setToastMessage(`✓ "${editLabel}" प्रवर्ग यशस्वीपणे अद्ययावत केला.`);
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
    setToastMessage(`🎉 नवीन प्रवर्ग "${newLabel}" जोडला गेला!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDelete = (cat: CategoryItem) => {
    const res = deleteCategory(cat.id);
    if (res.success) {
      loadData();
      onCategoriesChanged?.();
      setLastDeletedCategory(cat);
      setToastMessage(`🗑️ "${cat.label}" हटवला आणि रीसायकल बिनमध्ये हलवला.`);
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
    setToastMessage(`✓ "${restoredName}" प्रवर्ग पूर्ववत पुनर्संचयित (Restored) केला!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#0E1B3D] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600/60 text-white">
                <Tag className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-lg font-heading">
                प्रवर्ग व्यवस्थापन (Category Manager)
              </h3>
            </div>
            <p className="text-xs text-blue-200 mt-1">
              नवीन प्रवर्ग तयार करा, नाव बदला (Rename), किंवा हटवा. हटवलेले प्रवर्ग रीसायकल बिनमधून परत आणता येतात.
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
            <div className="flex items-center gap-2">
              {lastDeletedCategory && (
                <button
                  type="button"
                  onClick={handleUndoDelete}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>पूर्ववत करा (Undo)</span>
                </button>
              )}
              <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-950">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[#0E1B3D] text-sm">
              एकूण {categories.length} प्रवर्गे उपलब्ध
            </span>
            {!isAddingNew && (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="px-4 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>नवीन प्रवर्ग जोडा (+ Add Category)</span>
              </button>
            )}
          </div>

          {/* New Category Form Drawer / Box */}
          {isAddingNew && (
            <form onSubmit={handleCreateNew} className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between font-bold text-[#0E1B3D]">
                <span className="flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  नवीन प्रवर्ग तपशील (New Category Details)
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">प्रवर्गाचे नाव (Title / Label) *</label>
                  <input
                    type="text"
                    required
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="उदा. तलाठी भरती विशेष किंवा NEET / JEE Foundation"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-[#0E1B3D] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">लहान बॅज (Badge Text) *</label>
                  <input
                    type="text"
                    required
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="उदा. Talathi Bharti किंवा NEET Prep"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">वर्णन (Short Description)</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="विद्यार्थी या प्रवर्गात काय शिकतील..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">प्रकार (Audience)</label>
                  <select
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">सर्व वयोगट (All)</option>
                    <option value="school">शालेय (School)</option>
                    <option value="competitive">स्पर्धा परीक्षा (Competitive)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg text-xs"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0B57D0] hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  सेव्ह करा (Save Category)
                </button>
              </div>
            </form>
          )}

          {/* Categories List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden">
            {categories.map((cat) => {
              const isEditing = editingCatId === cat.id;

              return (
                <div key={cat.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                  {isEditing ? (
                    <div className="space-y-3 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">नाव बदला (Label):</label>
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">बॅज (Badge):</label>
                          <input
                            type="text"
                            value={editBadge}
                            onChange={(e) => setEditBadge(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">वर्णन (Description):</label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="px-3 py-1 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg text-xs"
                        >
                          रद्द करा
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs"
                        >
                          बदल सेव्ह करा (Save)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#0E1B3D] text-xs">
                            {cat.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0B57D0] border border-blue-200 font-bold text-[10px]">
                            {cat.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {cat.description || "कोणतेही वर्णन उपलब्ध नाही"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg transition"
                          title="Rename / Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                          title="Delete Category"
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
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            💡 टीप: हटवलेले प्रवर्ग &quot;रीसायकल बिन&quot; मध्ये सुरक्षित राहतात व तिथून कधीही पूर्ववत करता येतात.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition"
          >
            पूर्ण झाले (Done)
          </button>
        </div>
      </div>
    </div>
  );
}
