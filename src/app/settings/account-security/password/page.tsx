"use client";
import React, { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import SettingsLayout from "@/components/Settings/SettingsLayout";
import { UserService } from '@/services/user/userService';
import { 
  currentPasswordError, 
  currentPasswordRequired, 
  confirmPasswordRequired, 
  passwordLimit, 
  passwordsNotMatch 
} from '@/constants/messages';
import { minimumPassword } from '@/constants/validation';
import { sessionProvider as provider } from '@/constants/response';

const userService = new UserService();

const PasswordSettingsPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFields, setPasswordFields] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const isGoogleAuth = session?.user?.provider === provider.google;

  const validatePasswords = () => {
    const errors = { current: "", new: "", confirm: "" };
    
    if (passwordFields.current.length === 0) {
      errors.current = currentPasswordRequired;
    }
    
    if (!passwordFields.new || passwordFields.new.length < minimumPassword) {
      errors.new = passwordLimit(minimumPassword, "New password");
    }
    
    if (!passwordFields.confirm) {
      errors.confirm = confirmPasswordRequired;
    }
    
    if (
      passwordFields.new &&
      passwordFields.confirm &&
      passwordFields.new !== passwordFields.confirm
    ) {
      errors.confirm = passwordsNotMatch;
    }
    
    setPasswordErrors(errors);
    return errors;
  };

  const validateCurrentPassword = async (password: string): Promise<boolean> => {
    try {
      const response = await userService.validatePassword(password, session?.accessToken);
      return response?.status === true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords
    const errors = validatePasswords();
    let hasError = errors.current || errors.new || errors.confirm;

    // Validate current password with backend
    if (!hasError) {
      const isValidPassword = await validateCurrentPassword(passwordFields.current);
      if (!isValidPassword) {
        setPasswordErrors(prev => ({
          ...prev,
          current: currentPasswordError
        }));
        hasError = true;
      }
    }

    if (hasError) {
      setIsLoading(false);
      return;
    }

    try {
      if (!session?.user?.userId || !session?.accessToken) {
        toast.error('Please log in to change your password');
        return;
      }

      const response = await userService.updateUserFields(
        { password: passwordFields.new },
        session.accessToken
      );

      if (response?.data?.status === 200 || response?.status === 200) {
        toast.success('Password changed successfully!');
        
        // Clear form
        setPasswordFields({ current: "", new: "", confirm: "" });
        setPasswordErrors({ current: "", new: "", confirm: "" });
        
        // Navigate back to settings after a short delay
        setTimeout(() => {
          router.push('/settings');
        }, 1500);
      } else {
        throw new Error('Failed to update password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPasswordFields({ current: "", new: "", confirm: "" });
    setPasswordErrors({ current: "", new: "", confirm: "" });
    router.back();
  };

  if (isGoogleAuth) {
    return (
      <SettingsLayout title="Password Settings" subtitle="" showBackButton={true}>
        <div className="settings-page">
          <div className="settings-page-content">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Not Available</h2>
              <p className="text-gray-600 mb-6">
                You're signed in with Google. Password management is handled by your Google account.
              </p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-[#E36B00] hover:bg-[#c55a00] text-white rounded-full font-semibold transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Change Password" subtitle="" showBackButton={true}>
      <div className="settings-page">
        <div className="settings-page-content">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-100 ${
                    passwordErrors.current 
                      ? "border-red-300 focus:border-red-400" 
                      : "border-gray-200 focus:border-orange-300"
                  }`}
                  placeholder="Enter your current password"
                  value={passwordFields.current}
                  onChange={(e) =>
                    setPasswordFields({ ...passwordFields, current: e.target.value })
                  }
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {passwordErrors.current && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.current}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-100 ${
                    passwordErrors.new 
                      ? "border-red-300 focus:border-red-400" 
                      : "border-gray-200 focus:border-orange-300"
                  }`}
                  placeholder="Enter your new password"
                  value={passwordFields.new}
                  onChange={(e) =>
                    setPasswordFields({ ...passwordFields, new: e.target.value })
                  }
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {passwordErrors.new && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.new}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least {minimumPassword} characters long
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-100 ${
                    passwordErrors.confirm 
                      ? "border-red-300 focus:border-red-400" 
                      : "border-gray-200 focus:border-orange-300"
                  }`}
                  placeholder="Confirm your new password"
                  value={passwordFields.confirm}
                  onChange={(e) =>
                    setPasswordFields({ ...passwordFields, confirm: e.target.value })
                  }
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {passwordErrors.confirm && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.confirm}</p>
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
                      Changing...
                    </div>
                  ) : (
                    'Change Password'
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

export default PasswordSettingsPage;
