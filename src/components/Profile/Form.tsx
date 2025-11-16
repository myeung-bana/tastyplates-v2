"use client";

import React, {
  FormEvent,
  useEffect,
  useState,
  useRef,
  memo,
} from "react";
import { Key } from "@react-types/shared";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { palateOptions } from "@/constants/formOptions";
import { UserService } from "@/services/user/userService";
import { checkImageType } from "@/constants/utils";
import {
  imageMBLimit,
  imageSizeLimit,
  palateLimit,
  aboutMeMaxLimit,
} from "@/constants/validation";
import {
  palateMaxLimit,
  palateRequired,
  profileImageSizeLimit,
  profileImageTypeError,
  profileUpdateFailed,
  maximumBioLength,
} from "@/constants/messages";
import { MdOutlineEdit } from "react-icons/md";
import { PiCaretLeftBold } from "react-icons/pi";
import CustomModal from "../ui/Modal/Modal";
import CustomMultipleSelect from "../ui/Select/CustomMultipleSelect";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_add-listing.scss";
import { PROFILE } from "@/constants/pages";
import toast from "react-hot-toast";
import { IUserUpdate } from "@/interfaces/user/user";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { DEFAULT_USER_ICON } from "@/constants/images";
import PhotoCropModal from "../common/PhotoCropModal";
import { useProfileData } from "@/hooks/useProfileData";

const userService = new UserService()

interface FormContentProps {
  isSubmitted: boolean;
  setIsSubmitted: (value: boolean) => void;
  isLoading: boolean;
  profilePreview: string;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  profileError: string;
  aboutMe: string;
  handleTextAreaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  palateError: string;
  selectedPalates: Set<Key>;
  handlePalateChange: (keys: Set<Key>) => void;
  palateLimit: number;
  submitReview: (e: React.FormEvent) => void;
  router: { push: (path: string) => void; back: () => void };
  bioError: string;
  bioCharacterCount: number;
  showCropModal: boolean;
  setShowCropModal: (value: boolean) => void;
  tempImageSrc: string;
  setProfilePreview: (value: string) => void;
  setProfile: (value: string | null) => void;
}

const FormContent = memo(({
  isSubmitted,
  setIsSubmitted,
  isLoading,
  profilePreview,
  handleFileChange,
  profileError,
  aboutMe,
  handleTextAreaChange,
  textareaRef,
  palateError,
  selectedPalates,
  handlePalateChange,
  palateLimit,
  submitReview,
  router,
  bioError,
  bioCharacterCount,
  showCropModal,
  setShowCropModal,
  tempImageSrc,
  setProfilePreview,
  setProfile,
}: FormContentProps) => {
  return (
  <>
    {isSubmitted && (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60]" />
        <div className="fixed inset-0 flex items-center justify-center z-[70]">
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-orange-600 transition-colors text-2xl"
              onClick={() => setIsSubmitted(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                  <circle cx="28" cy="28" r="28" fill="#FFF3E6" />
                  <path
                    d="M18 29.5L25 36.5L38 23.5"
                    stroke="#E36B00"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-orange-700 mb-2">
                Profile Updated!
              </h2>
              <p className="mb-6 text-center text-gray-700">
                Your profile has been successfully updated.
              </p>
            </div>
          </div>
        </div>
      </>
    )}
    
    {/* Modern Instagram-inspired Profile Edit Layout */}
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white md:min-h-screen">
      <div className="max-w-4xl mx-auto px-0 md:px-4 py-0 md:py-8">
        {/* Header Section - Desktop Only */}
        <div className="hidden md:block text-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Edit Profile
          </h1>
          <p className="text-gray-600 text-lg">
            Update your information to help others discover your taste preferences
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-none md:rounded-2xl shadow-none md:shadow-sm border-0 md:border md:border-gray-100 overflow-hidden">
          <form onSubmit={submitReview} className="p-4 md:p-8 space-y-6 md:space-y-8">
            
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <label
                  htmlFor="image"
                  className={`cursor-pointer flex justify-center ${isLoading ? "opacity-50" : ""}`}
                >
                  <input
                    id="image"
                    type="file"
                    name="image"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isLoading}
                  />
                  <div className="relative">
                    <FallbackImage
                      src={profilePreview}
                      width={120}
                      height={120}
                      className="rounded-full size-24 md:size-32 object-cover ring-4 ring-gray-100 transition-all duration-200 group-hover:ring-gray-200"
                      alt="profile"
                      unoptimized
                      type={FallbackImageType.Icon}
                    />
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-3 shadow-lg border-2 border-gray-100 group-hover:border-gray-200 transition-all duration-200">
                      <MdOutlineEdit className="size-5 text-gray-600" />
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Profile Photo</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Click the edit icon to change your profile picture.
                </p>
                {profileError && (
                  <p className="mt-2 text-sm text-red-600">
                    {profileError}
                  </p>
                )}
              </div>
            </div>

            {/* Bio Section */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Bio
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Tell others about your food journey, favorite cuisines, or what makes you passionate about dining. This helps people connect with your taste preferences.
                </p>
              </div>
              
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  name="aboutMe"
                  className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-100 ${
                    isLoading ? "opacity-50" : ""
                  } ${
                    bioError ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-orange-300"
                  }`}
                  placeholder="Share your food story... What cuisines do you love? Any memorable dining experiences? What makes you excited about food?"
                  value={aboutMe}
                  onChange={handleTextAreaChange}
                  rows={4}
                  disabled={isLoading}
                  maxLength={aboutMeMaxLimit}
                />
                
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-400">
                    {bioCharacterCount}/{aboutMeMaxLimit} characters
                  </div>
                  {bioError && (
                    <div className="text-xs text-red-600">
                      {bioError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Palate Section */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Ethnic Palate Preferences
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Select up to 2 ethnic cuisines that best represent your taste preferences. This helps others understand your culinary background and recommendations.
                </p>
              </div>
              
              <div className={`${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
                <CustomMultipleSelect
                  label="Palate (Select up to 2)"
                  placeholder="Choose your preferred ethnic cuisines..."
                  items={palateOptions}
                  className="!rounded-xl w-full"
                  value={selectedPalates}
                  onChange={handlePalateChange}
                  limitValueLength={palateLimit}
                />
              </div>
              
              {palateError && (
                <p className="mt-2 text-sm text-red-600">{palateError}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
              <button
                type="submit"
                className="w-full bg-[#E36B00] hover:bg-[#c55a00] text-white font-semibold py-4 px-6 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                    Saving Changes...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
              
              <button
                type="button"
                className="w-full underline text-[#494D5D] font-semibold text-center py-3 px-6 bg-transparent hover:text-[#31343F] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => router.push(PROFILE)}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Photo Crop Modal */}
      <PhotoCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        onCrop={(croppedImage) => {
          setProfilePreview(croppedImage);
          setProfile(croppedImage);
          setShowCropModal(false);
        }}
        imageSrc={tempImageSrc}
      />
    </div>
  </>
  );
});

const Form = () => {
  const router = useRouter();
  const { data: session, update } = useSession();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aboutMe, setAboutMe] = useState("");
  const [profile, setProfile] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState(DEFAULT_USER_ICON);
  const [selectedPalates, setSelectedPalates] = useState<Set<Key>>(new Set());
  const [palateError, setPalateError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [bioError, setBioError] = useState("");
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState("");
  const hasInitialized = useRef(false); // Track if we've initialized form state to prevent flickering

  // Use the existing useProfileData hook - get current user ID from session
  const currentUserId = session?.user?.id ? Number(session.user.id) : 0;
  const {
    userData,
    loading: isLoadingData,
    isViewingOwnProfile
  } = useProfileData(currentUserId);

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setAboutMe(value);
    
    // Clear bio error when user starts typing
    if (bioError) {
      setBioError("");
    }
    
    // Validate character limit
    if (value.length > aboutMeMaxLimit) {
      setBioError(maximumBioLength(aboutMeMaxLimit));
    }
  };

  const handlePalateChange = (keys: Set<Key>) => {
    setSelectedPalates(keys);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!checkImageType(file.name)) {
      setProfileError(profileImageTypeError);
      return;
    }

    if (file.size > imageSizeLimit) {
      setProfileError(profileImageSizeLimit(imageMBLimit));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageSrc(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const capitalizeFirstLetter = (string: string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate bio length
    if (aboutMe.length > aboutMeMaxLimit) {
      setBioError(maximumBioLength(aboutMeMaxLimit));
      setIsLoading(false);
      return;
    }

    if (
      selectedPalates.size === 0 ||
      selectedPalates.size > palateLimit
    ) {
      setPalateError(
        selectedPalates.size === 0
          ? palateRequired
          : palateMaxLimit(palateLimit)
      );
      setIsLoading(false);
      return;
    }

    if (profile) {
      const profileParts = profile.split(",");
      if (profileParts[1]) {
        const sizeInBytes = (profileParts[1].length * 3) / 4;
        if (sizeInBytes > imageSizeLimit) {
          setProfileError(profileImageSizeLimit(imageMBLimit));
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      const formattedPalates = Array.from(selectedPalates)
        .map((p) => String(p).trim())
        .join("|");

      const updateData: Record<string, string> = {};
      if (profile) updateData.profile_image = profile;
      if (aboutMe?.trim()) updateData.about_me = aboutMe;
      if (formattedPalates) updateData.palates = formattedPalates;

      const res = await userService.updateUserFields(
        updateData as Partial<IUserUpdate>,
        session?.accessToken
      );

      // Update session with response data (response uses profile_image)
      await update({
        ...session,
        user: {
          ...session?.user,
          image: res.profile_image || res.image || session?.user?.image,
          about_me: aboutMe,
          palates: formattedPalates,
        },
      });

      // Refresh router to update server components with new session data
      router.refresh();

      setIsSubmitted(true);
      setTimeout(() => router.push(PROFILE), 2000);
    } catch (error) {
      console.error(error);
      toast.error(profileUpdateFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <FormContent
      isSubmitted={isSubmitted}
      setIsSubmitted={setIsSubmitted}
      isLoading={isLoading}
      profilePreview={profilePreview}
      handleFileChange={handleFileChange}
      profileError={profileError}
      aboutMe={aboutMe}
      handleTextAreaChange={handleTextAreaChange}
      textareaRef={textareaRef}
      palateError={palateError}
      selectedPalates={selectedPalates}
      handlePalateChange={handlePalateChange}
      palateLimit={palateLimit}
      submitReview={submitReview}
      router={router}
      bioError={bioError}
      bioCharacterCount={aboutMe.length}
      showCropModal={showCropModal}
      setShowCropModal={setShowCropModal}
      tempImageSrc={tempImageSrc}
      setProfilePreview={setProfilePreview}
      setProfile={setProfile}
    />
  );

  // Update form state when userData is loaded from useProfileData hook
  // Only run once when data is first loaded to prevent flickering
  useEffect(() => {
    // Prevent re-initialization if we've already set up the form
    if (hasInitialized.current) {
      return;
    }

    if (userData && isViewingOwnProfile && !isLoadingData) {
      // Extract data from GraphQL structure (userProfile.aboutMe, userProfile.profileImage, etc.)
      // or use direct properties if already transformed
      const userProfile = (userData.userProfile as any);
      const aboutMeValue = (userData.about_me as string) || 
                          (userProfile?.aboutMe as string) || "";
      const profileImageValue = (userData.profile_image as string) || 
                               (userProfile?.profileImage?.node?.mediaItemUrl as string) || 
                               DEFAULT_USER_ICON;
      const palatesValue = (userData.palates as string) || 
                          (userProfile?.palates as string) || "";

      // Update form fields with data from hook
      setAboutMe(aboutMeValue);
      setProfilePreview(profileImageValue);
      
      // Set palates
      if (palatesValue) {
        const palates = palatesValue
          .split(/[|,]/)
          .map((p) => p.trim())
          .map((p) => capitalizeFirstLetter(p));
        setSelectedPalates(new Set(palates));
      }
      
      // Update session with fresh data if needed (only once, don't retrigger)
      // Capture current session values to avoid dependency issues
      const currentSession = session;
      if (currentSession?.user) {
        const currentImage = currentSession.user.image || '';
        const currentAboutMe = currentSession.user.about_me || '';
        const currentPalates = currentSession.user.palates || '';
        const currentName = (userData.display_name as string) || (userData.name as string) || currentSession.user.name || '';
        
        const needsUpdate = 
          profileImageValue !== currentImage ||
          aboutMeValue !== currentAboutMe ||
          palatesValue !== currentPalates ||
          currentName !== currentSession.user.name;
        
        if (needsUpdate) {
          // Use setTimeout to avoid triggering useEffect again immediately
          setTimeout(() => {
            update({
              user: {
                ...currentSession.user,
                image: profileImageValue,
                about_me: aboutMeValue,
                palates: palatesValue,
                name: currentName,
              },
            }).catch(err => {
              console.error('Error updating session:', err);
            });
          }, 0);
        }
      }
      
      hasInitialized.current = true; // Mark as initialized
    } else if (!isLoadingData && !userData && session?.user && currentUserId > 0 && !hasInitialized.current) {
      // Fallback to session data if hook hasn't loaded yet or failed (only once)
      setAboutMe(session?.user?.about_me ?? "");
      setProfilePreview(session?.user?.image ?? DEFAULT_USER_ICON);
    if (session?.user?.palates) {
      const palates = session.user.palates
        .split(/[|,]/)
        .map((p) => p.trim())
        .map((p) => capitalizeFirstLetter(p));
      setSelectedPalates(new Set(palates));
    }
      hasInitialized.current = true; // Mark as initialized even with fallback
    }
  }, [userData, isViewingOwnProfile, isLoadingData, currentUserId]); // Removed session and update from deps

  // Reset initialization flag when user changes
  useEffect(() => {
    hasInitialized.current = false;
  }, [currentUserId]);

  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E36B00] mx-auto mb-4"></div>
          <p className="text-gray-600 font-neusans">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Layout - Full Screen */}
      <div className="md:hidden">
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Mobile Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2"
            >
              <PiCaretLeftBold className="size-5 text-gray-900" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Edit Profile</h1>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
          
          {/* Mobile Content */}
          <div className="px-4 py-6">
            {formContent}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block font-inter mt-16 md:mt-20">
        {formContent}
      </div>

      {/* Photo Crop Modal */}
      <PhotoCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        onCrop={(croppedImage) => {
          setProfilePreview(croppedImage);
          setProfile(croppedImage);
          setShowCropModal(false);
        }}
        imageSrc={tempImageSrc}
      />
    </>
  );
};

FormContent.displayName = 'FormContent';

export default Form;
