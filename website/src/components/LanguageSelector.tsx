import React, { useState, useEffect } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';

export const LanguageSelector: React.FC<{ variant?: 'footer' | 'compact' | 'header' }> = ({
  variant = 'footer',
}) => {
  const { language, setLanguage, languageInfo } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Single Compact Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold shadow-xs hover:border-[#0052FF] transition-all cursor-pointer group"
        title="Select Language / भाषा निवडा (India's Major Languages)"
        aria-label="Select Language"
      >
        <span className="material-symbols-outlined text-[17px] text-[#0052FF]">language</span>
        <span className="text-sm leading-none">{languageInfo.flag}</span>
        <span className="font-title-md text-slate-800">
          {languageInfo.nativeName}
          <span className="text-slate-500 font-normal ml-1 text-[11px]">({languageInfo.englishName})</span>
        </span>
        <span className="material-symbols-outlined text-[15px] text-slate-400 group-hover:text-slate-700 transition-colors">
          expand_more
        </span>
      </button>

      {/* Language Selection Modal Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">translate</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Select Language • भाषा निवडा
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    भारतातील प्रमुख प्रादेशिक भाषा निवडा (Default: English)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Indian Major Languages Grid */}
            <div className="overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 py-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelect(lang.code)}
                    className={`p-3 rounded-2xl text-left transition-all border cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#0052FF] ring-2 ring-[#0052FF]/20 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-2xl shrink-0">{lang.flag}</span>
                      <div className="truncate">
                        <span
                          className={`block text-xs sm:text-sm font-bold truncate leading-tight ${
                            isSelected ? 'text-[#0052FF]' : 'text-slate-900'
                          }`}
                        >
                          {lang.nativeName}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {lang.englishName}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#0052FF] text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Footer Note */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <span>Primary Website Language: <strong>English</strong></span>
              <button
                type="button"
                onClick={() => handleSelect('en')}
                className="text-[#0052FF] hover:underline font-bold cursor-pointer"
              >
                Reset to English
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
