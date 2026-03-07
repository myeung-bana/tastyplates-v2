"use client";
import React, { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNhostSession } from '@/hooks/useNhostSession';
import { toast } from 'react-hot-toast';
import SettingsLayout from "@/components/Settings/SettingsLayout";
import { genderOptions } from '@/constants/formOptions';
import {
  birthdateLimit,
  birthdateRequired,
  genderRequired
} from '@/constants/messages';
import { ageLimit } from '@/constants/validation';
import { formatDateForInput } from '@/lib/utils';
import CustomDatePicker from '@/components/common/CustomDatepicker';
import { Button } from '@/components/ui/button';

const ProfileSettingsPage = () => {
  const router = useRouter();
  const { user, nhostUser, loading } = useNhostSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    birthdate: '',
    gender: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    birthdate: '',
    gender: '',
  });

  // Initialize form once Nhost auth has resolved.
  // Email comes from nhostUser (auth.users), birthdate/gender from user_profiles.
  useEffect(() => {
    if (loading) return;
    if (!nhostUser) return;

    setFormData({
      email: nhostUser.email || '',
      birthdate: formatDateForInput(user?.birthdate || ''),
      gender: user?.gender || '',
    });
    setIsInitialized(true);
  }, [loading, nhostUser, user]);

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

  const validateGender = (gender: string) => {
    if (!gender) return genderRequired;
    return "";
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newErrors = {
      email: '',
      birthdate: validateBirthdate(formData.birthdate),
      gender: validateGender(formData.gender),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(err => err !== '')) {
      setIsLoading(false);
      return;
    }

    try {
      if (!nhostUser) {
        toast.error('Please log in to update your profile');
        setIsLoading(false);
        return;
      }

      const { nhost } = await import('@/lib/nhost');
      const accessToken = nhost.auth.getSession()?.accessToken;
      if (!accessToken) {
        toast.error('Session expired. Please log in again.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/v1/restaurant-users/update-restaurant-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: nhostUser.id,
          birthdate: formData.birthdate,
          gender: formData.gender,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully!');
      setTimeout(() => router.push('/settings'), 1500);
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: nhostUser?.email || '',
      birthdate: formatDateForInput(user?.birthdate || ''),
      gender: user?.gender || '',
    });
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
            {/* Email — read-only, tied to Nhost auth */}
            <div>
              <label className="block text-sm text-gray-700 mb-2 font-neusans">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl transition-all duration-200 focus:outline-none bg-gray-50 cursor-not-allowed"
                value={formData.email}
                disabled
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500 font-neusans">
                Email is tied to your account authentication and cannot be changed here
              </p>
            </div>

            {/* Birthdate */}
            <div>
              <label className="block text-sm text-gray-700 mb-2 font-neusans">
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
                <p className="mt-1 text-sm text-red-600 font-neusans">{errors.birthdate}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm text-gray-700 mb-2 font-neusans">
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
                <p className="mt-1 text-sm text-red-600 font-neusans">{errors.gender}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4 mt-8">
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  variant="secondary"
                  size="default"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="primary"
                  size="default"
                  className="flex-1"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default ProfileSettingsPage;
