import { useLanguage } from '@/contexts/LanguageContext';

// This will be expanded when you implement full i18n
export const useTranslation = () => {
  const { selectedLanguage } = useLanguage();
  
  // Placeholder for future translation function
  const t = (key: string, params?: Record<string, string>): string => {
    // For now, return the key. Later this will look up translations
    // based on selectedLanguage.code
    return key;
  };

  return {
    t,
    language: selectedLanguage.code,
    locale: selectedLanguage.locale,
    isRTL: selectedLanguage.rtl
  };
};
