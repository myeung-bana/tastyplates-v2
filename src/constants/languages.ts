export interface LanguageOption {
  code: string;           // ISO 639-1 language code
  locale: string;         // Full locale code (e.g., 'en-US', 'zh-TW')
  label: string;          // Display name in native language
  labelEn: string;        // Display name in English
  flag: string;           // Flag emoji or URL
  rtl: boolean;           // Right-to-left text direction
  region: string;         // Geographic region
  encoding: string;       // Character encoding (UTF-8, etc.)
  currency?: string;      // Default currency for region
  timezone?: string;      // Default timezone
  isDefault: boolean;     // Is this the default language
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    locale: 'en-US',
    label: 'English',
    labelEn: 'English',
    flag: '🇺🇸',
    rtl: false,
    region: 'North America',
    encoding: 'UTF-8',
    currency: 'USD',
    timezone: 'America/New_York',
    isDefault: true
  },
  {
    code: 'zh',
    locale: 'zh-TW',
    label: '繁體中文',
    labelEn: 'Chinese Traditional',
    flag: '🇹🇼',
    rtl: false,
    region: 'Taiwan',
    encoding: 'UTF-8',
    currency: 'TWD',
    timezone: 'Asia/Taipei',
    isDefault: false
  },
  {
    code: 'ko',
    locale: 'ko-KR',
    label: '한국어',
    labelEn: 'Korean',
    flag: '🇰🇷',
    rtl: false,
    region: 'South Korea',
    encoding: 'UTF-8',
    currency: 'KRW',
    timezone: 'Asia/Seoul',
    isDefault: false
  }
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.find(lang => lang.isDefault) || SUPPORTED_LANGUAGES[0];

// Language storage keys
export const LANGUAGE_STORAGE_KEY = 'tastyplates_language';
export const LANGUAGE_COOKIE_KEY = 'tastyplates_language';
export const LANGUAGE_COOKIE_EXPIRY = 365; // days

// Helper functions
export const getLanguageByCode = (code: string): LanguageOption | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const getLanguageByLocale = (locale: string): LanguageOption | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.locale === locale);
};

export const isValidLanguageCode = (code: string): boolean => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
};
