"use client";
import React, { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import { toast } from 'react-hot-toast';
import SettingsLayout from "@/components/Settings/SettingsLayout";
import { UserService } from '@/services/user/userService';
import { genderOptions } from '@/constants/formOptions';
import { 
  birthdateLimit, 
  birthdateRequired, 
  emailOccurredError, 
  invalidEmailFormat, 
  emailRequired,
  genderRequired 
} from '@/constants/messages';
import { ageLimit } from '@/constants/validation';
import { emailExistCode, sessionProvider as provider } from '@/constants/response';
import { formatDateForInput, validEmail } from '@/lib/utils';
import CustomDatePicker from '@/components/common/CustomDatepicker';

const userService = new UserService();

const ProfileSettingsPage = () => {
  const router = useRouter();
  const { user, firebaseUser } = useFirebaseSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    birthdate: '',
    gender: '',
  });
  
  // Error state
  const [errors, setErrors] = useState({
    email: '',
    birthdate: '',
    gender: '',
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        birthdate: user.birthdate || '',
        gender: user.gender || '',
      });
      setIsInitialized(true);
    }
  }, [user]);

  const validateBirthdate = (birthdate: string) => {
    if (!birthdate) return birthdateRequired;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (isNaN(birth.getTime()) || age < ageLimit) {
      return birthdateLimit(ageLimit);
    }
    return "";
  };

  const validateEmail = (email: string) => {
    if (!email) return emailRequired;
    if (!validEmail(email)) return invalidEmailFormat;
    return "";
  };

  const validateGender = (gender: string) => {
    if (!gender) return genderRequired;
    return "";
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate all fields (email is always disabled, so skip validation)
    const newErrors = {
      email: '',
      birthdate: validateBirthdate(formData.birthdate),
      gender: validateGender(formData.gender),
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors) {
      setIsLoading(false);
      return;
    }

    try {
      if (!user || !firebaseUser) {
        toast.error('Please log in to update your profile');
        return;
      }

      // Get Firebase ID token for authentication
      const idToken = await firebaseUser.getIdToken();

      // Email is always disabled, so we don't update it
      const updateData: Record<string, unknown> = {
        birthdate: formData.birthdate,
        gender: formData.gender,
      };

      const response = await userService.updateUserFields(
        updateData,
        idToken
      );

      if (response?.code === emailExistCode) {
        setErrors(prev => ({ ...prev, email: response?.message || emailOccurredError }));
        setIsLoading(false);
        return;
      }

      if (response?.data?.status === 200 || response?.status === 200) {
        // Session will be automatically refreshed by useFirebaseSession hook
        // Force a page reload to ensure fresh data
        toast.success('Profile updated successfully!');
        
        // Navigate back to settings after a short delay
        setTimeout(() => {
          router.push('/settings');
        }, 1500);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (user) {
      setFormData({
        email: user.email || '',
        birthdate: user.birthdate || '',
        gender: user.gender || '',
      });
    }
    setErrors({ email: '', birthdate: '', gender: '' });
    router.back();
  };

  if (!isInitialized) {
    return (
      <SettingsLayout title="Profile" subtitle="" showBackButton={true}>
        <div className="settings-page">
          <div className="settings-page-content">
            <div className="animate-pulse space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Profile" subtitle="" showBackButton={true}>
      <div className="settings-page">
        <div className="settings-page-content">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 bg-gray-50 cursor-not-allowed"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={true}
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                Email is tied to your account authentication and cannot be changed here
              </p>
            </div>

            {/* Birthdate Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <CustomDatePicker
                buttonClassName={`${
                  errors.birthdate 
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100" 
                    : "border-gray-200 focus:border-orange-300 focus:ring-orange-100"
                }`}
                value={formData.birthdate}
                onChange={(val) => handleInputChange('birthdate', val)}
                formatValue="MM/dd/yyyy"
                disabled={isLoading}
              />
              {errors.birthdate && (
                <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                You must be at least {ageLimit} years old
              </p>
            </div>

            {/* Gender Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-100 ${
                  errors.gender 
                    ? "border-red-300 focus:border-red-400" 
                    : "border-gray-200 focus:border-orange-300"
                }`}
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select your gender</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4 mt-8">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-full font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 py-3 px-4 rounded-full font-semibold transition-all duration-200 ${
                    isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#E36B00] hover:bg-[#c55a00] text-white active:bg-[#b85000]'
                  }`}
                >
                  {isLoading ? (
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
          </form>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default ProfileSettingsPage;
