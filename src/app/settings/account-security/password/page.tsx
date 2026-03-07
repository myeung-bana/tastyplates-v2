"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNhostSession } from '@/hooks/useNhostSession';
import { toast } from 'react-hot-toast';
import { MdOutlineEmail } from 'react-icons/md';
import { FiCheckCircle } from 'react-icons/fi';
import SettingsLayout from "@/components/Settings/SettingsLayout";
import { nhostAuthService } from '@/services/auth/nhostAuthService';
import { Button } from '@/components/ui/button';

const PasswordSettingsPage = () => {
  const router = useRouter();
  const { nhostUser, loading } = useNhostSession();
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Google/OAuth users manage passwords through their provider
  const isGoogleAuth = nhostUser?.metadata?.provider === 'google';

  const handleSendResetEmail = async () => {
    if (!nhostUser?.email) return;
    setIsSending(true);

    const redirectTo = `${window.location.origin}/reset-password`;
    const result = await nhostAuthService.sendPasswordResetEmail(nhostUser.email, redirectTo);

    setIsSending(false);

    if (result.success) {
      setEmailSent(true);
    } else {
      toast.error(result.error || 'Failed to send reset email. Please try again.');
    }
  };

  if (loading) {
    return (
      <SettingsLayout title="Change Password" subtitle="" showBackButton={true}>
        <div className="settings-page">
          <div className="settings-page-content">
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-12 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </SettingsLayout>
    );
  }

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
              <h2 className="text-xl font-semibold text-gray-900 mb-2 font-neusans">Password Not Available</h2>
              <p className="text-gray-600 mb-6 font-neusans">
                You signed in with Google. Password management is handled by your Google account.
              </p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-[#ff7c0a] hover:bg-[#e66d08] text-white rounded-full font-semibold transition-colors font-neusans"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  // Success state — email has been sent
  if (emailSent) {
    return (
      <SettingsLayout title="Check Your Email" subtitle="" showBackButton={false}>
        <div className="settings-page">
          <div className="settings-page-content">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-[#ff7c0a]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 font-neusans">Reset Link Sent</h2>
              <p className="text-gray-600 mb-1 font-neusans">
                We've sent a password reset link to
              </p>
              <p className="font-semibold text-gray-900 mb-4 font-neusans">
                {nhostUser?.email}
              </p>
              <p className="text-sm text-gray-500 font-neusans mb-8">
                Click the link in the email to set your new password. Check your spam folder if you don't see it.
              </p>
              <Button
                onClick={() => router.push('/settings')}
                variant="primary"
                size="default"
                className="w-full"
              >
                Back to Settings
              </Button>
            </div>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  // Default — prompt to send the reset email
  return (
    <SettingsLayout title="Change Password" subtitle="" showBackButton={true}>
      <div className="settings-page">
        <div className="settings-page-content space-y-6">
          {/* Email display */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <MdOutlineEmail className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 font-neusans">Reset link will be sent to</p>
              <p className="text-sm font-semibold text-gray-900 font-neusans">{nhostUser?.email}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 font-neusans">
            For your security, we'll send a reset link to your email address.
            Click it to securely set a new password.
          </p>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4 mt-8">
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => router.back()}
                disabled={isSending}
                variant="secondary"
                size="default"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isSending}
                variant="primary"
                size="default"
                className="flex-1"
              >
                {isSending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </div>
                ) : (
                  'Send Reset Email'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default PasswordSettingsPage;
