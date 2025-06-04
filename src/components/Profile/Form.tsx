"use client";
import React, { FormEvent, useEffect, useState } from "react";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_add-listing.scss";
import CustomSelect from "@/components/ui/Select/Select";
import CustomModal from "@/components/ui/Modal/Modal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaPen } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { palateOptions } from "@/constants/formOptions";
import { UserService } from "@/services/userService";

const Form = (props: any) => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(props.step ?? 0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);
  const [aboutMe, setAboutMe] = useState<string>(session?.user?.name ?? "");
  const [profilePreview, setProfilePreview] = useState<any>(session?.user?.image ?? "/profile-icon.svg");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedPalates, setSelectedPalates] = useState<string[]>([]);
  const [palateError, setPalateError] = useState<string>("");
  const [profileError, setProfileError] = useState<string>("");
  const router = useRouter();
  const categories = [
    { key: "no-category", label: "Select a Category" },
    { key: "category-1", label: "Category 1" },
    { key: "category-2", label: "Category 2" },
  ];

  const regionOptions = palateOptions.map(option => ({
    key: option.key,
    label: option.label
  }));

  const getAllSelectedPalates = () => {
    return selectedPalates.map(palate => {
      const region = palateOptions.find(option =>
        option.children.some(child => 
          child.label.toLowerCase() === palate.toLowerCase()
        )
      );

      const capitalizedPalate = palate
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      return {
        palate: capitalizedPalate,
        region: region?.label || 'Unknown'
      };
    });
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileError("");
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setProfileError("Profile image must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfilePreview(e.target.result as string);
          setProfile(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Set loading state

    // Validate image size if profile is updated
    if (profile) {
      const base64Length = profile.split(',')[1].length;
      const sizeInBytes = (base64Length * 3) / 4;
      if (sizeInBytes > 5 * 1024 * 1024) {
        setProfileError("Profile image must be less than 5MB");
        setIsLoading(false);
        return;
      }
    }

    // Rest of validation
    const allPalates = getAllSelectedPalates();
    if (selectedPalates.length > 2) {
      setPalateError('You can only select up to 2 palates');
      setIsLoading(false);
      return;
    }

    try {
      if (!session?.accessToken) {
        throw new Error('No session token found');
      }

      // Format the palates for storage
      const formattedPalates = selectedPalates
        .map(p => p.trim())
        .join('|');

      // Prepare update data
      const updateData = {
        profile_image: profile, // blob data
        about_me: aboutMe,
        palates: formattedPalates
      };

      console.log('Update Data:', updateData);
      await UserService.updateUserFields(
        updateData,
        session.accessToken
      );

      // Update local storage if needed
      const localKey = `userData_${session.user?.email}`;
      const cachedData = JSON.parse(localStorage.getItem(localKey) || '{}');
      localStorage.setItem(localKey, JSON.stringify({
        ...cachedData,
        ...updateData,
      }));

      setPalateError("");
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
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
          .map(p => p.trim())
          .filter(Boolean); // Remove empty strings
        
        setSelectedPalates(palates);
        
        // Find the region that contains any of these palates
        const region = palateOptions.find(option =>
          option.children.some(child => 
            palates.some(palate => 
              palate.toLowerCase() === child.label.toLowerCase()
            )
          )
        );
        
        if (region) {
          setSelectedRegion(region.key);
        }
      }
    }
  }, [session]); // Add session as dependency

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    // Don't reset palates when region changes
    setPalateError(""); // Clear any existing errors
  };

  const togglePalate = (palate: string) => {
    setPalateError(""); // Clear error when selection changes
    setSelectedPalates(prev => {
      const normalizedPrev = prev.map(p => p.toLowerCase());
      const normalizedPalate = palate.toLowerCase();
      
      if (normalizedPrev.includes(normalizedPalate)) {
        return prev.filter(p => p.toLowerCase() !== normalizedPalate);
      }
      return [...prev, palate]; // Remove the 2 palate limit check here
    });
  };

  // Update the aboutMe change handler
  const handleAboutMeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAboutMe(e.target.value);
  };

  return (
    <>
      <div className="font-inter mt-20">
        <div className="flex flex-col justify-center items-center pt-10">
          <h1 className="text-[#31343F] text-2xl font-bold">Edit Profile</h1>
          <form
            className="listing__form max-w-[672px] w-full my-10 py-8 px-6 rounded-3xl border border-[#CACACA] bg-[#FCFCFC]"
            onSubmit={submitReview}
          >
            <div className="listing__form-group relative justify-center self-center">
              <label
                htmlFor="image"
                className={`cursor-pointer flex justify-center ${isLoading ? 'opacity-50' : ''}`}
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
                  <div className="w-[120px] h-[120px] relative">
                    <Image
                      src={profilePreview}
                      fill
                      className="rounded-full object-cover"
                      alt="profile"
                    />
                  </div>
                  <div className="absolute right-0 bottom-0 h-11 w-11 p-3 rounded-[50px] border-1.5 bg-white text-center">
                    <FaPen />
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
                  className={`listing__input ${isLoading ? 'opacity-50' : ''}`}
                  placeholder="About Me"
                  value={aboutMe}
                  onChange={handleAboutMeChange}
                  rows={5}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="listing__form-group">
              <label className="listing__label">Region</label>
              <div className="listing__input-group">
                <CustomSelect
                  className={`min-h-[48px] border border-gray-200 rounded-[10px] ${isLoading ? 'opacity-50' : ''}`}
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
                Ethnic Palate <span className="!font-medium">(Select up to 2 palates)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedRegion && (
                  <>
                    {palateOptions
                      .find(option => option.key === selectedRegion)
                      ?.children.map(child => (
                        <button
                          key={child.key}
                          type="button"
                          onClick={() => togglePalate(child.label)}
                          className={`py-1 px-3 rounded-full text-sm font-medium transition-colors border border-[#494D5D] ${
                            selectedPalates.some(p => 
                              p.toLowerCase() === child.label.toLowerCase()
                            )
                              ? 'bg-[#F1F1F1] !font-bold'
                              : 'bg-[##FCFCFC] text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {child.label}
                        </button>
                    ))}
                    {selectedPalates.length > 0 && (
                      <div className="w-full mt-2">
                        <p className="text-sm text-gray-600">
                          Selected palates: {
                            getAllSelectedPalates().slice(0, 4).map(p => p.palate).join(", ") + 
                            (getAllSelectedPalates().length > 4 ? "..." : "")
                          }
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
              {palateError && (
                <p className="mt-2 text-sm text-red-600">
                  {palateError}
                </p>
              )}
            </div>
            <div className="flex gap-4 items-center m-auto">
              <button 
                className="listing__button flex items-center justify-center gap-2" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save and Continue'
                )}
              </button>
              <button
                type="button"
                className={`underline h-10 !text-[#494D5D] !bg-transparent font-semibold text-center ${isLoading ? 'opacity-50' : ''}`}
                onClick={() => router.push('/profile')}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        <CustomModal
          header="Listing Submitted"
          content="Your listing has been successfully submitted! Approval typically takes 1–3 working days. Once approved, your reviews will be uploaded automatically."
          isOpen={isSubmitted}
          setIsOpen={() => setIsSubmitted(!isSubmitted)}
        />
      </div>
    </>
  );
};

export default Form;
