import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';

export const LanguageSelector: React.FC<{ variant?: 'desktop' | 'mobile' }> = ({ variant = 'desktop' }) => {
  const { language, setLanguage, languageInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div className="pt-2 border-t border-white/20">
        <div className="text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2 px-1 flex items-center justify-between">
          <span>Choose Language</span>
          <span className="text-[10px] text-white/50">Primary: English</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`py-2 px-2.5 rounded-xl text-xs font-title-md font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-[#0052FF] shadow-sm scale-102 ring-2 ring-white/50'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-white/20 hover:bg-white/30 border border-white/35 text-white text-xs font-title-md font-bold flex items-center gap-1.5 transition-all shadow-inner cursor-pointer hover:scale-105 active:scale-95"
        title="Choose Language (Default: English)"
        aria-label="Choose Language"
        aria-expanded={isOpen}
      >
        <span className="text-sm">{languageInfo.flag}</span>
        <span className="hidden lg:inline">{languageInfo.englishName}</span>
        <span className="lg:hidden uppercase text-[11px]">{languageInfo.code}</span>
        <span className="material-symbols-outlined text-[15px] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Select Language
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full px-3 py-2 text-left text-xs font-title-md flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-[#0052FF] font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{lang.flag}</span>
                  <div>
                    <span className="block leading-tight">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">{lang.englishName}</span>
                  </div>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-[#0052FF] text-base">check</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
