"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  LanguageCode,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  LanguageInfo,
  TranslationDictionary,
  getTranslation,
} from "./i18n";

interface LanguageContextType {
  currentLanguage: LanguageCode;
  languageInfo: LanguageInfo;
  setLanguage: (code: LanguageCode) => void;
  t: (key: keyof TranslationDictionary) => string;
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "mindmaster_app_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
        setCurrentLanguageState(stored);
      } else {
        setCurrentLanguageState(DEFAULT_LANGUAGE);
      }
    } catch {
      setCurrentLanguageState(DEFAULT_LANGUAGE);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setCurrentLanguageState(e.newValue as LanguageCode);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setLanguage = (code: LanguageCode) => {
    setCurrentLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
      // Dispatch custom event for same-window instant sync
      window.dispatchEvent(new Event("mindmaster_language_changed"));
    } catch (e) {
      console.warn("Failed to persist language in localStorage:", e);
    }
  };

  const activeInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) ||
    SUPPORTED_LANGUAGES[0];

  const t = (key: keyof TranslationDictionary): string => {
    return getTranslation(currentLanguage, key);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        languageInfo: activeInfo,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside LanguageProvider
    const fallbackInfo = SUPPORTED_LANGUAGES[0];
    return {
      currentLanguage: DEFAULT_LANGUAGE,
      languageInfo: fallbackInfo,
      setLanguage: () => {},
      t: (key: keyof TranslationDictionary) => getTranslation(DEFAULT_LANGUAGE, key),
      supportedLanguages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
}
