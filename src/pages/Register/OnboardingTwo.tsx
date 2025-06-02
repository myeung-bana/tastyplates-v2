"use client";
import { useEffect, useState, useRef } from "react";
import "@/styles/pages/_auth.scss";
import { useRouter } from "next/navigation";
import Spinner from "@/components/LoadingSpinner";
import { UserService } from "@/services/userService";

const OnboardingTwoPage = () => {
  const router = useRouter();
  const [aboutMe, setAboutMe] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [aboutMeError, setAboutMeError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfileError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setProfileError("Profile image must be less than 5MB.");
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
    setAboutMeError(null);

    // About Me validation
    if (aboutMe.length > 500) {
      setAboutMeError("The text must be 500 characters or less.");
      setIsLoading(false);
      return;
    }

    // Get registration data from localStorage
    const registrationData = JSON.parse(localStorage.getItem('registrationData') || '{}');
    const uniqueSignUpId = registrationData.id || Date.now().toString();

    // Combine with final profile data
    const completeRegistration = {
      id: uniqueSignUpId,
      ...registrationData,
      profileImage,
      aboutMe,
    };

    await UserService.registerUser(completeRegistration);

    localStorage.removeItem('registrationData');
    setMessage("Registration successful!");
    setMessageType("success");

    setTimeout(() => {
      setIsLoading(false);
      router.push("/");
    }, 1500);
  }

  // Redirect if registrationData is missing
  useEffect(() => {
    const storedData = localStorage.getItem('registrationData');
    if (!storedData) {
      router.replace('/');
    }
  }, [router]);

  return (
    <div className="px-2 pt-8 sm:px-1">
      <div className="auth__container w-full max-w-full sm:!max-w-[672px] mx-auto">
        <h1 className="auth__header text-2xl sm:text-3xl">Create Account</h1>
        <div className="auth__card py-4 !rounded-[24px] border border-[#CACACA] w-full sm:!w-[672px] bg-white">
          <p className="auth__subtitle text-sm sm:text-base">Step 2 of 2</p>
          <h1 className="auth__title text-lg sm:!text-xl font-semibold">Set Up Profile</h1>
          {/* Avatar section */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      width="60"
                      height="60"
                      viewBox="0 0 96 94"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="scale-[1.5] translate-y-4"
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
                className="absolute -bottom-1 -right-1 cursor-pointer"
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
                <div className="text-red-600 text-xs mt-2 text-center">{profileError}</div>
              )}

          {/* About Me Textarea */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="aboutMe" className="block font-semibold mb-2">
                About Me
              </label>
              <textarea
                id="aboutMe"
                name="aboutMe"
                rows={4}
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                placeholder="Tell us a little about yourself! Share your interests, background, or food that you like."
                className="w-full border border-gray-300 rounded-[10px] p-3 text-sm resize-none"
                readOnly={isLoading}
              />
              <div className="flex justify-between items-center mt-1">
                {aboutMeError && (
                  <span className="text-red-600 text-xs">{aboutMeError}</span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-xl font-medium flex items-center justify-center w-full sm:w-auto"
                disabled={isLoading}
              >
                {isLoading && (
                  <span className="mr-2">
                    <Spinner size={20} className="text-white" />
                  </span>
                )}
                Done
              </button>
              <button
                disabled={isLoading}
                type="button"
                className="text-sm text-black-700 underline font-bold self-center w-full sm:w-auto"
                onClick={() => {
                  localStorage.removeItem('registrationData');
                  router.push("/");
                }}
              >
                I’ll Do It Later
              </button>
            </div>
            {/* Success/Error Message */}
            {message && (
              <div
                className={`mt-4 text-center px-4 py-2 rounded-xl font-medium ${messageType === "success"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-red-100 text-red-700 border border-red-300"
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

export default OnboardingTwoPage;
