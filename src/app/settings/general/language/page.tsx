"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import SettingsLayout from "@/components/Settings/SettingsLayout";
import { useLanguage } from '@/contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

const LanguageSettingsPage = () => {
  const router = useRouter();
  const { selectedLanguage, setSelectedLanguage, isLoading: contextLoading } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [tempSelectedLanguage, setTempSelectedLanguage] = useState(selectedLanguage);

  useEffect(() => {
    setTempSelectedLanguage(selectedLanguage);
  }, [selectedLanguage]);

  const handleLanguageSelect = (languageCode: string) => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    if (language) {
      setTempSelectedLanguage(language);
    }
  };

  const handleSave = async () => {
    if (tempSelectedLanguage.code === selectedLanguage.code) {
      router.back();
      return;
    }

    setIsSaving(true);
    try {
      setSelectedLanguage(tempSelectedLanguage);
      toast.success('Language preference updated successfully!');
      
      // Small delay to show success message, then navigate back
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Error saving language preference:', error);
      toast.error('Failed to save language preference. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempSelectedLanguage(selectedLanguage);
    router.back();
  };

  if (contextLoading) {
    return (
      <SettingsLayout title="Language Settings" subtitle="" showBackButton={true}>
        <div className="settings-page">
          <div className="settings-page-content">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Language Settings" subtitle="" showBackButton={true}>
      <div className="settings-page">
        <div className="settings-page-content">
          {/* Language Options List */}
          <div className="space-y-2">
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  tempSelectedLanguage.code === language.code
                    ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{language.flag}</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {language.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language.labelEn} • {language.region}
                      </p>
                    </div>
                  </div>
                  {tempSelectedLanguage.code === language.code && (
                    <div className="w-6 h-6 bg-[#E36B00] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4 mt-8">
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 py-3 px-4 rounded-full font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || tempSelectedLanguage.code === selectedLanguage.code}
                className={`flex-1 py-3 px-4 rounded-full font-semibold transition-all duration-200 ${
                  isSaving || tempSelectedLanguage.code === selectedLanguage.code
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#E36B00] hover:bg-[#c55a00] text-white active:bg-[#b85000]'
                }`}
              >
                {isSaving ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default LanguageSettingsPage;
