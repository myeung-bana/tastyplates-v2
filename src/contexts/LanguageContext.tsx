"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE, 
  LANGUAGE_STORAGE_KEY, 
  LANGUAGE_COOKIE_KEY, 
  LANGUAGE_COOKIE_EXPIRY,
  LanguageOption 
} from '@/constants/languages';
import { useNhostSession } from '@/hooks/useNhostSession';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';

const MVP_LOCALE_CODES = ['en', 'zh', 'ko'];

interface LanguageContextType {
  selectedLanguage: LanguageOption;
  setSelectedLanguage: (language: LanguageOption) => void;
  isLoading: boolean;
  updateUserLanguagePreference: (languageCode: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Internal provider that uses Nhost session (auth.users.locale)
const LanguageProviderInternal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useNhostSession();
  const [selectedLanguage, setSelectedLanguageState] = useState<LanguageOption>(DEFAULT_LANGUAGE || SUPPORTED_LANGUAGES[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Priority: Nhost auth.users.locale (user.language_preference) > localStorage > cookies > browser > default 'en'
    const loadLanguage = async () => {
      let languageCode: string = DEFAULT_LANGUAGE?.code || 'en';

      try {
        if (user?.language_preference) {
          languageCode = MVP_LOCALE_CODES.includes(user.language_preference) ? user.language_preference : 'en';
        } else if (typeof window !== 'undefined') {
          const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
          if (savedLanguage && MVP_LOCALE_CODES.includes(savedLanguage)) {
            languageCode = savedLanguage;
          } else {
            const cookieLanguage = Cookies.get(LANGUAGE_COOKIE_KEY);
            if (cookieLanguage && MVP_LOCALE_CODES.includes(cookieLanguage)) {
              languageCode = cookieLanguage;
            } else {
              const browserLanguage = navigator.language.split('-')[0];
              if (MVP_LOCALE_CODES.includes(browserLanguage)) {
                languageCode = browserLanguage;
              }
            }
          }
        }

        const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || DEFAULT_LANGUAGE || SUPPORTED_LANGUAGES[0];
        setSelectedLanguageState(language);
      } catch (error) {
        console.error('Error loading language preference:', error);
        setSelectedLanguageState(DEFAULT_LANGUAGE || SUPPORTED_LANGUAGES[0]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, [user?.language_preference]);

  const setSelectedLanguage = (language: LanguageOption) => {
    setSelectedLanguageState(language);
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language.code);
        Cookies.set(LANGUAGE_COOKIE_KEY, language.code, { expires: LANGUAGE_COOKIE_EXPIRY });
        document.documentElement.lang = language.locale;
      }
      
      if (user?.user_id) {
        updateUserLanguagePreference(language.code);
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const updateUserLanguagePreference = async (languageCode: string) => {
    if (!user?.user_id) return;
    const code = MVP_LOCALE_CODES.includes(languageCode) ? languageCode : 'en';
    try {
      await restaurantUserService.updateUser(user.user_id, {
        language_preference: code,
      });
    } catch (error) {
      console.error('Failed to update user language preference:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      selectedLanguage, 
      setSelectedLanguage, 
      isLoading,
      updateUserLanguagePreference 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Wrapper provider that doesn't use useSession during SSR
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // During SSR, provide a basic context without session
    return (
      <LanguageContext.Provider value={{
        selectedLanguage: DEFAULT_LANGUAGE || SUPPORTED_LANGUAGES[0],
        setSelectedLanguage: () => {},
        isLoading: true,
        updateUserLanguagePreference: async () => {}
      }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  // On client side, use the full provider with session
  return <LanguageProviderInternal>{children}</LanguageProviderInternal>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
