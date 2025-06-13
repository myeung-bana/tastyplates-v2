"use client";
import React, { FormEvent, useEffect, useState } from "react";
import { Key } from "@react-types/shared";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_add-listing.scss";
import CustomSelect from "@/components/ui/Select/Select";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaPen, FaPenAlt } from "react-icons/fa";
import { List } from "@/data/dummyList";
import { users } from "@/data/dummyUsers";
import CustomMultipleSelect from "../ui/Select/CustomMultipleSelect";
import { useSession } from "next-auth/react";
import { palateOptions } from "@/constants/formOptions";
import { UserService } from "@/services/userService";
import { checkImageType } from "@/constants/utils";
import { imageMBLimit, imageSizeLimit, palateLimit } from "@/constants/validation";
import { palateMaxLimit, profileImageSizeLimit } from "@/constants/messages";
import { MdEdit, MdOutlineEdit } from "react-icons/md";
import CustomModal from "../ui/Modal/Modal";
import { PiCaretLeftBold } from "react-icons/pi";

const Form = () => {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);
  const [aboutMe, setAboutMe] = useState<string>(session?.user?.name ?? "");
  const [profilePreview, setProfilePreview] = useState<any>(
    session?.user?.image ?? "/profile-icon.svg"
  );
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedPalates, setSelectedPalates] = useState<string[]>([]);
  const [selectedPalates2, setSelectedPalates2] = useState<Set<Key>>(new Set());
  const [palateError, setPalateError] = useState<string>("");
  const [profileError, setProfileError] = useState<string>("");
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== undefined && window.innerWidth < 768);

  const router = useRouter();
  const regionOptions = palateOptions.map((option) => ({
    key: option.key,
    label: option.label,
  }));

  useEffect(() => {
    window.addEventListener("load", () => {
      console.log('load')
      if (typeof window !== "undefined") {
        handleResize();
      }
    });
    window.addEventListener("resize", () => {
      handleResize();
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);
    };
  }, []);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const handlePalateChange = (keys: Set<Key>) => {
    setSelectedPalates2(keys);
  };

  const getAllSelectedPalates = () => {
    return selectedPalates.map((palate) => {
      const region = palateOptions.find((option) =>
        option.children.some(
          (child) => child.label.toLowerCase() === palate.toLowerCase()
        )
      );

      const capitalizedPalate = palate
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");

      return {
        palate: capitalizedPalate,
        region: region?.label || "Unknown",
      };
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfileError("");
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // Check image type
      if (!checkImageType(file.name)) {
        setProfileError("Profile image must be a valid image type")
        return;
      }

      // Check file size (5MB)
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
    }
  };

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate palates count
    if (selectedPalates.length > palateLimit) {
      setPalateError(palateMaxLimit(palateLimit));
      setIsLoading(false);
      return;
    }

    // Validate image size if profile is updated
    if (profile) {
      const base64Length = profile.split(",")[1].length;
      const sizeInBytes = (base64Length * 3) / 4;
      if (sizeInBytes > imageSizeLimit) {
        setProfileError(profileImageSizeLimit(imageMBLimit));
        setIsLoading(false);
        return;
      }
    }

    try {
      if (!session?.accessToken || !session?.user?.email) {
        throw new Error("No session token found");
      }

      const formattedPalates = selectedPalates.map((p) => p.trim()).join("|");
      const updateData: Record<string, any> = {};

      if (profile) {
        updateData.profile_image = profile;
      }
      if (aboutMe?.trim()) {
        updateData.about_me = aboutMe.trim();
      }
      if (formattedPalates) {
        updateData.palates = formattedPalates;
      }

      // Get response from API
      const response = await UserService.updateUserFields(
        updateData,
        session.accessToken
      );

      // Update local storage
      // const localKey = `userData_${session.user.email}`;
      // localStorage.setItem(localKey, JSON.stringify({
      //   ...JSON.parse(localStorage.getItem(localKey) || '{}'),
      //   image: response.profile_image,
      //   about_me: aboutMe,
      //   palates: formattedPalates,
      // }));

      // Update session with direct user field modification
      await update({
        ...session,
        user: {
          ...session.user,
          image: response.profile_image,
          about_me: aboutMe,
          palates: formattedPalates,
        },
      });

      setPalateError("");
      setIsSubmitted(true);

      // Redirect after successful update
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setProfilePreview(session.user.image || "/profile-icon.svg");
      setAboutMe(session.user.about_me || "");

      if (session.user.palates) {
        // Split and trim each palate name
        const palates = session.user.palates
          .split(/[|,]/)
          .map((p) => p.trim())
          .filter(Boolean); // Remove empty strings

        setSelectedPalates(palates);

        // Find the region that contains any of these palates
        const region = palateOptions.find((option) =>
          option.children.some((child) =>
            palates.some(
              (palate) => palate.toLowerCase() === child.label.toLowerCase()
            )
          )
        );

        if (region) {
          setSelectedRegion(region.key);
        }
      }
    }
  }, [session]);

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    // Don't reset palates when region changes
    setPalateError(""); // Clear any existing errors
  };

  const togglePalate = (palate: string) => {
    setPalateError(""); // Clear error when selection changes
    setSelectedPalates((prev) => {
      const normalizedPrev = prev.map((p) => p.toLowerCase());
      const normalizedPalate = palate.toLowerCase();

      if (normalizedPrev.includes(normalizedPalate)) {
        return prev.filter((p) => p.toLowerCase() !== normalizedPalate);
      }
      return [...prev, palate]; // Remove the 2 palate limit check here
    });
  };

  // Update the aboutMe change handler
  const handleAboutMeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAboutMe(e.target.value);
  };

  const FormContent = () => {
  return (
    <>
      {/* Overlay when modal is open */}
      {isSubmitted && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-60 z-[1000]"></div>
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[1010]">
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
              {/* Exit button */}
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-orange-600 transition-colors text-2xl"
                onClick={() => setIsSubmitted(false)}
                aria-label="Close"
                tabIndex={0}
              >
                &times;
              </button>
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 56 56"
                    fill="none"
                  >
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
                  Your profile have been successfully updated.
                </p>
              </div>
            </div>
          </div>
          {/* Animation */}
          <style jsx>{`
            .animate-fade-in {
              animation: fadeInScale 0.3s cubic-bezier(0.4, 2, 0.6, 1)
                both;
            }
            @keyframes fadeInScale {
              0% {
                opacity: 0;
                transform: scale(0.95);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </>
      )}
      <div className="flex flex-col justify-center items-center pt-10 px-3 md:px-0">
        <h1 className="text-[#31343F] text-lg md:text-2xl font-medium">
          Edit Profile
        </h1>
        <form
          className="listing__form max-w-[672px] w-full my-4 md:my-10 mx-3 py-6 px-4 md:py-8 md:px-6 lg:mx-0 rounded-3xl border border-[#CACACA] bg-[#FCFCFC]"
          onSubmit={submitReview}
        >
          <div className="listing__form-group relative justify-center self-center">
            <label
              htmlFor="image"
              className={`cursor-pointer flex justify-center ${
                isLoading ? "opacity-50" : ""
              }`}
            >
              <input
                id="image"
                type="file"
                name="image"
                onChange={handleFileChange}
                placeholder="Image"
                className="hidden"
                accept="image/*"
                disabled={isLoading}
              />
              <div>
                <Image
                  src={profilePreview}
                  width={120}
                  height={120}
                  className="rounded-full size-20 md:size-[120px] object-contain"
                  alt="profile"
                />
                <div className="border-[1.5px] border-[#494D5D] absolute right-0 bottom-0 size-8 md:size-11 p-2 md:p-3 rounded-[50px] border-1.5 bg-white text-center">
                  <MdOutlineEdit className="size-4 md:size-5" />
                </div>
              </div>
            </label>
            {profileError && (
              <p className="mt-2 text-sm text-red-600 text-center">
                {profileError}
              </p>
            )}
          </div>
          <div className="listing__form-group">
            <label className="listing__label">About Me</label>
            <div className="listing__input-group">
              <textarea
                name="name"
                className={`listing__input resize-none ${
                  isLoading ? "opacity-50" : ""
                }`}
                placeholder="About Me"
                value={aboutMe}
                onChange={handleAboutMeChange}
                rows={5}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="listing__form-group !hidden md:!flex">
            <label className="listing__label">Region</label>
            <div className="listing__input-group">
              <CustomSelect
                className={`min-h-[48px] border border-gray-200 rounded-[10px] ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                placeholder="Select your region"
                items={regionOptions}
                onChange={handleRegionChange}
                value={selectedRegion}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="listing__form-group">
            <label className="listing__label">
              Ethnic Palate{" "}
              <span className="!font-medium">
                (Select up to 2 palates)
              </span>
            </label>
            <div className="hidden md:flex flex-wrap gap-2">
              {selectedRegion && (
                <>
                  {palateOptions
                    .find((option) => option.key === selectedRegion)
                    ?.children.map((child) => (
                      <button
                        key={child.key}
                        type="button"
                        onClick={() => togglePalate(child.label)}
                        disabled={isLoading}
                        className={`py-1 px-3 rounded-full text-sm font-medium transition-colors border border-[#494D5D] 
                    ${
                      selectedPalates.some(
                        (p) =>
                          p.toLowerCase() === child.label.toLowerCase()
                      )
                        ? "bg-[#F1F1F1] !font-bold"
                        : "bg-[##FCFCFC] text-gray-600 hover:bg-gray-200"
                    } ${
                          isLoading
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  {selectedPalates.length > 0 && (
                    <div className="w-full mt-2">
                      <p className="text-sm text-gray-600">
                        Selected palates:{" "}
                        {getAllSelectedPalates()
                          .slice(0, 4)
                          .map((p) => p.palate)
                          .join(", ") +
                          (getAllSelectedPalates().length > 4
                            ? "..."
                            : "")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex md:hidden flex-wrap gap-2">
              <CustomMultipleSelect
                label="Palate (Select up to 2 palates)"
                placeholder="Select your palate"
                items={palateOptions}
                className="!rounded-[10px] w-full"
                value={selectedPalates2}
                onChange={handlePalateChange}
              />
            </div>
            {palateError && (
              <p className="mt-2 text-sm text-red-600">{palateError}</p>
            )}
          </div>
          <div className="flex gap-4 items-center m-auto">
            <button
              className="listing__button flex items-center justify-center gap-2 text-sm md:text-base"
              type="submit"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
              className={`underline h-10 !text-[#494D5D] !bg-transparent font-semibold text-center ${
                isLoading ? "opacity-50" : ""
              }`}
              onClick={() => router.push("/profile")}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

  return (
    <>
      <CustomModal
        header={<></>}
        content={
          <FormContent />
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
            onClick={() => {
              router.back()
            }}
            className="absolute top-4 left-3 p-2"
          >
            <PiCaretLeftBold className="size-4 stroke-[#1C1B1F]" />
          </button>
        }
      />
      <div className="font-inter mt-16 md:mt-20 hidden md:block">
       <FormContent />
      </div>
    </>
  );
};

export default Form;
