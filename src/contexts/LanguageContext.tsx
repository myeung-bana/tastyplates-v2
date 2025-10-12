"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Cookies from 'js-cookie';
import { 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE, 
  LANGUAGE_STORAGE_KEY, 
  LANGUAGE_COOKIE_KEY, 
  LANGUAGE_COOKIE_EXPIRY,
  LanguageOption 
} from '@/constants/languages';

interface LanguageContextType {
  selectedLanguage: LanguageOption;
  setSelectedLanguage: (language: LanguageOption) => void;
  isLoading: boolean;
  updateUserLanguagePreference: (languageCode: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Internal provider that uses useSession
const LanguageProviderInternal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, update } = useSession();
  const [selectedLanguage, setSelectedLanguageState] = useState<LanguageOption>(DEFAULT_LANGUAGE || SUPPORTED_LANGUAGES[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Priority: User session > localStorage > cookies > browser > default
    const loadLanguage = async () => {
      let languageCode = DEFAULT_LANGUAGE?.code || SUPPORTED_LANGUAGES[0].code;

      try {
        // 1. Check user session first
        if (session?.user?.language) {
          languageCode = session.user.language;
        } else {
          // 2. Check localStorage (only in browser)
          if (typeof window !== 'undefined') {
            const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLanguage) {
              languageCode = savedLanguage;
            } else {
              // 3. Check cookies
              const cookieLanguage = Cookies.get(LANGUAGE_COOKIE_KEY);
              if (cookieLanguage) {
                languageCode = cookieLanguage;
              } else {
                // 4. Check browser language
                const browserLanguage = navigator.language.split('-')[0];
                if (SUPPORTED_LANGUAGES.some(lang => lang.code === browserLanguage)) {
                  languageCode = browserLanguage;
                }
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
  }, [session?.user?.language]);

  const setSelectedLanguage = (language: LanguageOption) => {
    setSelectedLanguageState(language);
    
    try {
      // Save to localStorage and cookies (only in browser)
      if (typeof window !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language.code);
        Cookies.set(LANGUAGE_COOKIE_KEY, language.code, { expires: LANGUAGE_COOKIE_EXPIRY });
        
        // Update document language attribute
        document.documentElement.lang = language.locale;
      }
      
      // Update user session if logged in
      if (session?.user) {
        updateUserLanguagePreference(language.code);
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const updateUserLanguagePreference = async (languageCode: string) => {
    if (!session?.user?.userId || !session?.accessToken) return;

    try {
      // Update via your existing user service
      const { UserService } = await import('@/services/user/userService');
      const userService = new UserService();
      
      await userService.updateUserFields(
        { language: languageCode },
        session.accessToken
      );

      // Update session
      if (update) {
        await update({
          ...session,
          user: {
            ...session.user,
            language: languageCode,
          },
        });
      }
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
