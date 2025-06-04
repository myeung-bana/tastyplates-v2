"use client";
import React, { FormEvent, useEffect, useState } from "react";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_add-listing.scss";
import CustomSelect from "@/components/ui/Select/Select";
import CustomModal from "@/components/ui/Modal/Modal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaPen } from "react-icons/fa";
import { users } from "@/data/dummyUsers";
import { useSession } from "next-auth/react";
import { palateOptions } from "@/constants/formOptions";

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

  const changeStep = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (step == 1) {
        router.push("/listing/step-2");
      } else {
        setStep(step + 1);
      }
      setIsLoading(false);
    }, 500);
  };

  const submitReview = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
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

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          setProfilePreview(e.target.result as string);
          setProfile(file);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setSelectedPalates([]); // Reset palates when region changes
  };

  const togglePalate = (palate: string) => {
    setSelectedPalates(prev => {
      const normalizedPrev = prev.map(p => p.toLowerCase());
      const normalizedPalate = palate.toLowerCase();
      
      if (normalizedPrev.includes(normalizedPalate)) {
        return prev.filter(p => p.toLowerCase() !== normalizedPalate);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, palate];
    });
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
                className="cursor-pointer flex justify-center"
              >
                <input
                  id="image"
                  type="file"
                  name="image"
                  onChange={handleFileChange}
                  placeholder="Image"
                  className="hidden"
                  accept="image/*"
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
            </div>
            <div className="listing__form-group">
              <label className="listing__label">About Me</label>
              <div className="listing__input-group">
                <textarea
                  name="name"
                  className="listing__input"
                  placeholder="About Me"
                  value={aboutMe}
                  onChange={(e) => { }}
                  rows={5}
                />
              </div>
            </div>
            <div className="listing__form-group">
              <label className="listing__label">Region</label>
              <div className="listing__input-group">
                <CustomSelect
                  className="min-h-[48px] border border-gray-200 rounded-[10px]"
                  placeholder="Select your region"
                  items={regionOptions}
                  onChange={handleRegionChange}
                  value={selectedRegion}
                />
              </div>
            </div>
            <div className="listing__form-group">
              <label className="listing__label">
                Ethnic Palate <span className="!font-medium">(Select up to 2 palates)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedRegion && palateOptions
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
              </div>
            </div>
            <div className="flex gap-4 items-center m-auto">
              <button className="listing__button" onClick={changeStep}>
                Sava and Continue
              </button>
              <button
                className="underline h-10 !text-[#494D5D] !bg-transparent font-semibold text-center"
                type="submit"
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
