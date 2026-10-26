"use client";

import { useState } from "react";
import { X, Check, Globe } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageCode } from "@/lib/i18n";

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageModal({ isOpen, onClose }: LanguageModalProps) {
  const { currentLanguage, setLanguage, supportedLanguages, t } = useLanguage();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    // Trigger localized single-language feedback toast
    setToastMessage(t("langModal.confirmToast"));
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 450);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xl flex flex-col gap-4 sm:gap-5 max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 id="language-modal-title" className="text-lg font-extrabold text-slate-900 tracking-tight">
                {t("langModal.title")}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {t("langModal.subtitle")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("langModal.close")}
            className="touch-target-44 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Confirmation Toast */}
        {toastMessage && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 8 Indian Languages Grid */}
        <div className="overflow-y-auto pr-1 flex flex-col gap-2.5 max-h-[58vh]">
          {supportedLanguages.map((lang) => {
            const isSelected = currentLanguage === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`touch-target-48 min-h-[56px] w-full p-3.5 px-4 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] touch-manipulation ${
                  isSelected
                    ? "bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500"
                    : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div>
                    <span className="text-base font-extrabold text-slate-900 block leading-tight">
                      {lang.nativeName}
                    </span>
                    <span className="text-xs text-slate-600 font-medium block mt-0.5">
                      {lang.englishName} • {lang.region}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-full shadow-2xs shrink-0">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="touch-target-44 px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            {t("langModal.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
