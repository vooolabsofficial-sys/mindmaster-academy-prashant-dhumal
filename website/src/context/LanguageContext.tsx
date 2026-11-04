import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'mr' | 'hi';

export interface LanguageInfo {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', flag: '🇬🇧' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', flag: '🇮🇳' },
  { code: 'hi', nativeName: 'हिंदी', englishName: 'Hindi', flag: '🇮🇳' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

const STORAGE_KEY = 'mindmaster_app_language';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  languageInfo: LanguageInfo;
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  languageInfo: SUPPORTED_LANGUAGES[0],
  supportedLanguages: SUPPORTED_LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
        setLanguageState(stored);
      } else {
        setLanguageState(DEFAULT_LANGUAGE);
      }
    } catch {
      setLanguageState(DEFAULT_LANGUAGE);
    }

    const handleSync = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
        if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
          setLanguageState(stored);
        }
      } catch {}
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('mindmaster_language_changed', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mindmaster_language_changed', handleSync);
    };
  }, []);

  const setLanguage = (code: LanguageCode) => {
    const target = SUPPORTED_LANGUAGES.some((l) => l.code === code) ? code : DEFAULT_LANGUAGE;
    setLanguageState(target);
    try {
      localStorage.setItem(STORAGE_KEY, target);
      localStorage.setItem('mma_lang', target);
      if (typeof document !== 'undefined') {
        document.cookie = `mma_app_lang=${target}; path=/; max-age=31536000; SameSite=Lax`;
      }
      window.dispatchEvent(new Event('mindmaster_language_changed'));
    } catch {}
  };

  const activeInfo = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languageInfo: activeInfo,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
