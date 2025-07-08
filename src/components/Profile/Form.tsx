"use client";

import React, {
  FormEvent,
  useEffect,
  useState,
  useRef,
  memo,
} from "react";
import { Key } from "@react-types/shared";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { palateOptions } from "@/constants/formOptions";
import { UserService } from "@/services/userService";
import { checkImageType } from "@/constants/utils";
import {
  imageMBLimit,
  imageSizeLimit,
  palateLimit,
} from "@/constants/validation";
import {
  palateMaxLimit,
  palateRequired,
  profileImageSizeLimit,
} from "@/constants/messages";
import { MdOutlineEdit } from "react-icons/md";
import { PiCaretLeftBold } from "react-icons/pi";
import CustomModal from "../ui/Modal/Modal";
import CustomMultipleSelect from "../ui/Select/CustomMultipleSelect";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_add-listing.scss";

const FormContent = memo(({
  isSubmitted,
  setIsSubmitted,
  isMobile,
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
}: any) => (
  <>
    {isSubmitted && (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[1000]" />
        <div className="fixed inset-0 flex items-center justify-center z-[1010]">
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
    <div className="flex flex-col justify-center items-center pt-10 px-3 md:px-0">
      <h1 className="text-[#31343F] text-lg md:text-2xl font-medium">
        Edit Profile
      </h1>
      <form
        onSubmit={submitReview}
        className="listing__form max-w-[672px] w-full my-4 md:my-10 mx-3 py-6 px-4 md:py-8 md:px-6 lg:mx-0 rounded-3xl border border-[#CACACA] bg-[#FCFCFC]"
      >
        {/* Profile image upload */}
        <div className="listing__form-group">
          <div className="relative flex justify-center">
            <label
              htmlFor="image"
              className={`cursor-pointer flex justify-center ${isLoading ? "opacity-50" : ""
                }`}
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
                <Image
                  src={profilePreview}
                  width={120}
                  height={120}
                  className="rounded-full size-20 md:size-[120px] object-cover"
                  alt="profile"
                  unoptimized
                />
                <div className="border-[1.5px] border-[#494D5D] absolute right-0 bottom-0 size-8 md:size-11 p-2 md:p-3 rounded-[50px] bg-white text-center">
                  <MdOutlineEdit className="size-4 md:size-5" />
                </div>
              </div>
            </label>
          </div>
          {profileError && (
            <p className="mt-2 text-sm text-red-600 text-center">
              {profileError}
            </p>
          )}
        </div>

        {/* About Me */}
        <div className="listing__form-group">
          <label className="listing__label">About Me</label>
          <div className="listing__input-group">
            <textarea
              ref={textareaRef}
              name="aboutMe"
              className={`listing__input resize-none ${isLoading ? "opacity-50" : ""
                }`}
              placeholder="About Me"
              value={aboutMe}
              onChange={handleTextAreaChange}
              rows={5}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Palate */}
        <div className="listing__form-group">
          <label className="listing__label">
            Ethnic Palate <span className="!font-medium">(Select up to 2)</span>
          </label>
          <div
            className={`flex flex-wrap gap-2 ${isLoading ? "opacity-50 pointer-events-none" : ""
              }`}
          >
            <CustomMultipleSelect
              label="Palate (Select up to 2)"
              placeholder="Select your palate"
              items={palateOptions}
              className="!rounded-[10px] w-full"
              value={selectedPalates}
              onChange={handlePalateChange}
              limitValueLength={palateLimit}
            />
          </div>
          {palateError && (
            <p className="mt-2 text-sm text-red-600">{palateError}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 items-center m-auto">
          <button
            type="submit"
            className="listing__button flex items-center justify-center gap-2 text-sm md:text-base"
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
                Saving...
              </>
            ) : (
              "Save and Continue"
            )}
          </button>
          <button
            type="button"
            className="underline h-10 !text-[#494D5D] !bg-transparent font-semibold text-center"
            onClick={() => router.push("/profile")}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </>
));

const Form = () => {
  const router = useRouter();
  const { data: session, update } = useSession();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aboutMe, setAboutMe] = useState(session?.user?.about_me ?? "");
  const [profile, setProfile] = useState<any>(null);
  const [profilePreview, setProfilePreview] = useState(
    session?.user?.image ?? "/profile-icon.svg"
  );
  const [selectedPalates, setSelectedPalates] = useState<Set<Key>>(new Set());
  const [palateError, setPalateError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAboutMe(e.target.value);
  };

  const handlePalateChange = (keys: Set<Key>) => {
    setSelectedPalates(keys);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!checkImageType(file.name)) {
      setProfileError("Profile image must be a valid image type");
      return;
    }

    if (file.size > imageSizeLimit) {
      setProfileError(profileImageSizeLimit(imageMBLimit));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result as string);
      setProfile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
      const sizeInBytes = (profile.split(",")[1].length * 3) / 4;
      if (sizeInBytes > imageSizeLimit) {
        setProfileError(profileImageSizeLimit(imageMBLimit));
        setIsLoading(false);
        return;
      }
    }

    try {
      const formattedPalates = Array.from(selectedPalates)
        .map((p) => String(p).trim())
        .join("|");

      const updateData: Record<string, any> = {};
      if (profile) updateData.profile_image = profile;
      if (aboutMe?.trim()) updateData.about_me = aboutMe;
      if (formattedPalates) updateData.palates = formattedPalates;

      const res = await UserService.updateUserFields(
        updateData,
        session?.accessToken!
      );

      await update({
        ...session,
        user: {
          ...session?.user,
          image: res.profile_image,
          about_me: aboutMe,
          palates: formattedPalates,
        },
      });

      setIsSubmitted(true);
      setTimeout(() => router.push("/profile"), 2000);
    } catch (error) {
      console.error(error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.palates) {
      const palates = session.user.palates
        .split(/[|,]/)
        .map((p) => p.trim().toLowerCase());
      setSelectedPalates(new Set(palates));
    }

    if (typeof window !== "undefined") {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      handleResize();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  return (
    <>
      <CustomModal
        header={<></>}
        content={
          <FormContent
            isSubmitted={isSubmitted}
            setIsSubmitted={setIsSubmitted}
            isMobile={isMobile}
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
          />
        }
        isOpen={isMobile}
        backdropClass="bg-white backdrop-opacity-100"
        baseClass="h-full md:h-3/4 !max-w-[1060px] max-h-full md:max-h-[530px] lg:max-h-[640px] xl:max-h-[720px] m-0 rounded-none relative md:rounded-3xl"
        closeButtonClass="!top-5 md:!top-6 !right-unset !left-3 z-10"
        headerClass="border-b border-[#CACACA] h-16"
        contentClass="!p-0"
        hasFooter={true}
        footer={<></>}
        footerClass="!p-0 hidden"
        wrapperClass="!z-[1010]"
        hasCustomCloseButton
        customButton={
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-3 p-2"
          >
            <PiCaretLeftBold className="size-4 stroke-[#1C1B1F]" />
          </button>
        }
      />
      <div className="font-inter mt-16 md:mt-20 hidden md:block">
        <FormContent
          isSubmitted={isSubmitted}
          setIsSubmitted={setIsSubmitted}
          isMobile={isMobile}
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
        />
      </div>
    </>
  );
};

export default Form;
