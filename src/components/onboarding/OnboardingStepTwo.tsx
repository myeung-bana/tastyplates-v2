"use client";
import { useEffect, useState, useRef } from "react";
import "@/styles/pages/_auth.scss";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { restaurantUserService, UpdateRestaurantUserRequest } from "@/app/api/v1/services/restaurantUserService";
import { profileImageSizeLimit, registrationSuccess, textLimit, welcomeProfile } from "@/constants/messages";
import { imageSizeLimit, imageMBLimit, aboutMeMaxLimit } from "@/constants/validation";
import { responseStatus } from "@/constants/response";
import { PROFILE } from "@/constants/pages";
import toast from "react-hot-toast";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { REGISTRATION_KEY, WELCOME_KEY } from "@/constants/session";
import OnboardingStepIndicator from "@/components/onboarding/OnboardingStepIndicator";

interface OnboardingStepTwoProps {
  onPrevious: () => void;
  currentStep: number;
}

const OnboardingStepTwo: React.FC<OnboardingStepTwoProps> = ({ onPrevious, currentStep }) => {
  const router = useRouter();
  const { user, firebaseUser } = useFirebaseSession();
  const [aboutMe, setAboutMe] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<(typeof responseStatus)[keyof typeof responseStatus] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [aboutMeError, setAboutMeError] = useState<string | null>(null);

  // Helper function to extract profile image URL from JSONB format
  const getProfileImageUrl = (profileImage: any): string | null => {
    if (!profileImage) return null;
    
    // If it's a string, return it directly
    if (typeof profileImage === 'string') {
      return profileImage;
    }
    
    // If it's an object, extract the URL
    if (typeof profileImage === 'object') {
      // Try different possible URL fields
      return profileImage.url || profileImage.thumbnail || profileImage.medium || profileImage.large || null;
    }
    
    return null;
  };

  // Add effect to load saved data and fetch from API
  useEffect(() => {
    const loadUserData = async () => {
      // First, check localStorage for any existing data
    const storedData = localStorage.getItem(REGISTRATION_KEY);
      const parsedData = storedData ? JSON.parse(storedData) : {};

      // Try to fetch from API if we have a user ID
      if (user?.id) {
        try {
          const userId = String(user.id);
          const response = await restaurantUserService.getUserById(userId);
          
          if (response.success && response.data) {
            const userData = response.data;
            
            // Pre-fill about_me from API, but only if not already set in localStorage
            // This allows localStorage to take precedence (for partial saves)
            if (!parsedData.aboutMe && userData.about_me) {
              setAboutMe(userData.about_me);
            } else if (parsedData.aboutMe) {
              setAboutMe(parsedData.aboutMe);
            }

            // Pre-fill profile_image from API, but only if not already set in localStorage
            if (!parsedData.profileImage && userData.profile_image) {
              const imageUrl = getProfileImageUrl(userData.profile_image);
              if (imageUrl) {
                setProfileImage(imageUrl);
              }
            } else if (parsedData.profileImage) {
              setProfileImage(parsedData.profileImage);
            }
          }
        } catch (error) {
          console.error('Error loading user data from API:', error);
          // Fall back to localStorage if API fails
          if (parsedData.aboutMe) setAboutMe(parsedData.aboutMe);
          if (parsedData.profileImage) setProfileImage(parsedData.profileImage);
        }
      } else {
        // No session, use localStorage only
      if (parsedData.aboutMe) setAboutMe(parsedData.aboutMe);
      if (parsedData.profileImage) setProfileImage(parsedData.profileImage);
    }
    };

    loadUserData();
  }, [user?.id]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfileError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > imageSizeLimit) {
        setProfileError(profileImageSizeLimit(imageMBLimit));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProfileError(null);
    setAboutMeError(null);

    // About Me validation
    if (aboutMe.length > aboutMeMaxLimit) {
      setAboutMeError(textLimit(aboutMeMaxLimit));
      setIsLoading(false);
      return;
    }

    // Get user ID from Firebase session (UUID from Hasura) - required for Firebase auth users
    if (!user?.id) {
      toast.error('Session expired. Please log in again.');
      setIsLoading(false);
      router.push('/login');
      return;
    }

    const userId = String(user.id); // UUID from Hasura

    try {
      // Get data from OnboardingStepOne (stored in localStorage)
      const registrationData = JSON.parse(localStorage.getItem(REGISTRATION_KEY) || '{}');
      
      // Prepare update data for Hasura API
      const updateData: Partial<UpdateRestaurantUserRequest> = {};
      
      // Step 1 data (from localStorage)
      if (registrationData.birthdate) updateData.birthdate = registrationData.birthdate;
      if (registrationData.gender) updateData.gender = registrationData.gender;
      if (registrationData.customGender) updateData.custom_gender = registrationData.customGender;
      if (registrationData.pronoun) updateData.pronoun = registrationData.pronoun;
      
      // Handle palates - convert string to array if needed
      if (registrationData.palates) {
        if (Array.isArray(registrationData.palates)) {
          updateData.palates = registrationData.palates;
        } else if (typeof registrationData.palates === 'string') {
          // Convert comma-separated string to array
          updateData.palates = registrationData.palates
            .split(',')
            .map((p: string) => p.trim())
            .filter((p: string) => p.length > 0);
        }
      }
      
      if (registrationData.username) updateData.username = registrationData.username;
      if (registrationData.language_preference) updateData.language_preference = registrationData.language_preference;
      
      // Step 2 data (current form)
      if (profileImage) {
        // Handle profile image - convert base64 to JSONB format
        // For now, store as JSONB with url and type
        // In the future, you might want to upload to storage and use the URL
        updateData.profile_image = typeof profileImage === 'string' 
          ? { 
              url: profileImage, 
              type: profileImage.startsWith('data:') ? 'base64' : 'url',
              alt_text: 'Profile picture'
            }
          : profileImage;
      }
      
      if (aboutMe) updateData.about_me = aboutMe;
      
      // Mark onboarding as complete
      updateData.onboarding_complete = true;
      
      // Update user via Hasura API
      const updateResult = await restaurantUserService.updateUser(userId, updateData);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update user profile');
      }
      
      // Clear registration data from localStorage
      localStorage.removeItem(REGISTRATION_KEY);
      
      // Session will be automatically refreshed by useFirebaseSession hook
      // Force a page reload to ensure fresh data
      setMessage(registrationSuccess);
      localStorage.setItem(WELCOME_KEY, welcomeProfile);
      setMessageType(responseStatus.success);
      
      // Redirect to profile after short delay
      setTimeout(() => {
        router.push(`/profile/${userId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating user profile:', error);
      setIsLoading(false);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          toast.error('User account not found. Please try logging in again.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(error.message || 'Failed to update profile. Please try again.');
        }
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    }
  }

  return (
    <div className="px-3 pt-8 sm:px-1 w-full">
      <div className="auth__container w-full max-w-full sm:!max-w-[672px] mx-auto">
        <h1 className="auth__header text-2xl sm:text-3xl mb-6 font-neusans font-normal">Create Account</h1>
        <OnboardingStepIndicator currentStep={currentStep} totalSteps={2} />
        <div className="auth__card py-4 !rounded-[24px] border border-[#CACACA] w-full sm:!w-[672px] bg-white">
          {/* Avatar section */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="Profile"
                      fill
                      className={`object-cover ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                    />
                  ) : (
                    <svg
                      width="60"
                      height="60"
                      viewBox="0 0 96 94"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`scale-[1.5] translate-y-4 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <path d="M48 48C41.4 48 35.75 45.65 31.05 40.95C26.35 36.25 24 30.6 24 24C24 17.4 26.35 11.75 31.05 7.05C35.75 2.35 41.4 0 48 0C54.6 0 60.25 2.35 64.95 7.05C69.65 11.75 72 17.4 72 24C72 30.6 69.65 36.25 64.95 40.95C60.25 45.65 54.6 48 48 48ZM0 84V79.2C0 75.8 0.875 72.675 2.625 69.825C4.375 66.975 6.7 64.8 9.6 63.3C15.8 60.2 22.1 57.875 28.5 56.325C34.9 54.775 41.4 54 48 54C54.6 54 61.1 54.775 67.5 56.325C73.9 57.875 80.2 60.2 86.4 63.3C89.3 64.8 91.625 66.975 93.375 69.825C95.125 72.675 96 75.8 96 79.2V84C96 87.3 94.825 90.125 92.475 92.475C90.125 94.825 87.3 96 84 96H12C8.7 96 5.875 94.825 3.525 92.475C1.175 90.125 0 87.3 0 84Z" fill="#31343F" />
                    </svg>
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                disabled={isLoading}
              />
              <div
                className={`absolute -bottom-1 -right-1 cursor-pointer ${isLoading ? 'pointer-events-none' : ''}`}
                onClick={handleImageClick}
              >
                {profileImage ? (
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.75" y="0.75" width="42.5" height="42.5" rx="21.25" fill="#FCFCFC" />
                    <rect x="0.75" y="0.75" width="42.5" height="42.5" rx="21.25" stroke="#494D5D" strokeWidth="1.5" />
                    <mask id="mask0_7615_21170" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="12" y="12" width="20" height="20">
                      <rect x="12" y="12" width="20" height="20" fill="#D9D9D9" />
                    </mask>
                    <g mask="url(#mask0_7615_21170)">
                      <path d="M16.1667 27.8333H17.3542L25.5 19.6875L24.3125 18.5L16.1667 26.6458V27.8333ZM15.3333 29.5C15.0972 29.5 14.8993 29.4201 14.7396 29.2604C14.5799 29.1007 14.5 28.9028 14.5 28.6667V26.6458C14.5 26.4236 14.5417 26.2118 14.625 26.0104C14.7083 25.809 14.8264 25.6319 14.9792 25.4792L25.5 14.9792C25.6667 14.8264 25.8507 14.7083 26.0521 14.625C26.2535 14.5417 26.4653 14.5 26.6875 14.5C26.9097 14.5 27.125 14.5417 27.3333 14.625C27.5417 14.7083 27.7222 14.8333 27.875 15L29.0208 16.1667C29.1875 16.3194 29.309 16.5 29.3854 16.7083C29.4618 16.9167 29.5 17.125 29.5 17.3333C29.5 17.5556 29.4618 17.7674 29.3854 17.9687C29.309 18.1701 29.1875 18.3542 29.0208 18.5208L18.5208 29.0208C18.3681 29.1736 18.191 29.2917 17.9896 29.375C17.7882 29.4583 17.5764 29.5 17.3542 29.5H15.3333ZM24.8958 19.1042L24.3125 18.5L25.5 19.6875L24.8958 19.1042Z" fill="#494D5D" />
                    </g>
                  </svg>
                ) : (
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.75" y="0.75" width="42.5" height="42.5" rx="21.25" fill="#FCFCFC" />
                    <rect x="0.75" y="0.75" width="42.5" height="42.5" rx="21.25" stroke="#494D5D" strokeWidth="1.5" />
                    <mask id="mask0_7615_21880" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="12" y="12" width="20" height="20">
                      <rect x="12" y="12" width="20" height="20" fill="#D9D9D9" />
                    </mask>
                    <g mask="url(#mask0_7615_21880)">
                      <path d="M21.1665 22.8337H16.9998C16.7637 22.8337 16.5658 22.7538 16.4061 22.5941C16.2464 22.4344 16.1665 22.2364 16.1665 22.0003C16.1665 21.7642 16.2464 21.5663 16.4061 21.4066C16.5658 21.2469 16.7637 21.167 16.9998 21.167H21.1665V17.0003C21.1665 16.7642 21.2464 16.5663 21.4061 16.4066C21.5658 16.2469 21.7637 16.167 21.9998 16.167C22.2359 16.167 22.4339 16.2469 22.5936 16.4066C22.7533 16.5663 22.8332 16.7642 22.8332 17.0003V21.167H26.9998C27.2359 21.167 27.4339 21.2469 27.5936 21.4066C27.7533 21.5663 27.8332 21.7642 27.8332 22.0003C27.8332 22.2364 27.7533 22.4344 27.5936 22.5941C27.4339 22.7538 27.2359 22.8337 26.9998 22.8337H22.8332V27.0003C22.8332 27.2364 22.7533 27.4344 22.5936 27.5941C22.4339 27.7538 22.2359 27.8337 21.9998 27.8337C21.7637 27.8337 21.5658 27.7538 21.4061 27.5941C21.2464 27.4344 21.1665 27.2364 21.1665 27.0003V22.8337Z" fill="#31343F" />
                    </g>
                  </svg>
                )}
              </div>
            </div>
          </div>
          {profileError && (
            <div className="text-red-600 text-xs mt-2 text-center font-neusans font-normal">{profileError}</div>
          )}

          {/* About Me Textarea */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="aboutMe" className="block font-neusans font-normal mb-2">
                About Me
              </label>
              <textarea
                id="aboutMe"
                name="aboutMe"
                rows={4}
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                placeholder="Tell us a little about yourself! Share your interests, background, or food that you like."
                className={`w-full border border-gray-300 rounded-[10px] p-3 text-sm resize-none font-neusans font-normal ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                readOnly={isLoading}
              />
              <div className="flex justify-between items-center mt-1">
                {aboutMeError && (
                  <span className="text-red-600 text-xs font-neusans font-normal">{aboutMeError}</span>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {/* Previous Button (Secondary) */}
              <Button
                type="button"
                onClick={onPrevious}
                disabled={isLoading}
                variant="secondary"
                size="default"
                className="w-full sm:w-auto"
              >
                Previous
              </Button>
              
              {/* Done Button (Primary) */}
              <Button
                type="submit"
                disabled={isLoading}
                variant="primary"
                size="default"
                className="w-full sm:w-auto"
              >
                {isLoading ? "Loading..." : "Done"}
              </Button>
            </div>
            {/* Success/Error Message */}
            {message && (
              <div
                className={`mt-4 mx-10 text-center px-4 py-2 rounded-xl font-neusans font-normal ${messageType === responseStatus.success
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                  }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStepTwo;

