"use client";
import React, { FormEvent, useState } from "react";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_add-listing.scss";
import Link from "next/link";
import CustomSelect from "@/components/ui/Select/Select";
import { CiLocationOn } from "react-icons/ci";
import CustomModal from "@/components/ui/Modal/Modal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaPen } from "react-icons/fa";
import { List } from "@/data/dummyList";
import { users } from "@/data/dummyUsers";
import CustomMultipleSelect from "../ui/Select/CustomMultipleSelect";

const Form = (props: any) => {
  const [listing, setListing] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(props.step ?? 0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(users[0]);
  const router = useRouter();
  const categories = [
    { key: "no-category", label: "Select a Category" },
    { key: "category-1", label: "Category 1" },
    { key: "category-2", label: "Category 2" },
  ];

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

  const handleChangeCheckbox = (e: any) => {
    setListing({ ...listing, cuisineIds: e });
  };

  const handleRating = (rate: number) => {
    console.log("User rated:", rate);
  };

  const submitReview = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement | any>
  ) => {
    if (event.target.files && event.target.files?.length > 0) {
      const selectedFile = event.target.files;
      // setSelectedFiles([])
      console.log(selectedFile.length, "length");
      let imageList: string[] = [];
      for (let i = 0; i < selectedFile.length; i++) {
        let reader = new FileReader();
        const file = selectedFile[i];
        const length = selectedFile.length;
        reader.onload = function (e) {
          console.log(length, "length");
          // console.log(reader.result as string, 'hello')
          imageList.push(reader.result as string);
          console.log(
            imageList,
            "image list 0",
            i,
            selectedFile.length,
            selectedFile.length - 1
          );
          if (length - 1 == i) {
            //   setSelectedFiles(imageList)
            //   setIsDoneSelecting(true)
          }
        }; // Would see a path?
        reader.readAsDataURL(file);
        // console.log(selectedFile.length, 'length', url)
      }
      console.log(imageList, "image list");
    }
  };

  return (
    <>
      <div className="font-inter mt-16 md:mt-20">
        <div className="flex flex-col justify-center items-center pt-10 px-3 md:px-0">
          <h1 className="text-[#31343F] text-lg md:text-2xl font-medium">Edit Profile</h1>
          <form
            className="listing__form max-w-[672px] w-full my-4 md:my-10 mx-3 py-6 px-4 md:py-8 md:px-6 lg:mx-0 rounded-3xl border border-[#CACACA] bg-[#FCFCFC]"
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
                  value={profile.image ?? "profile-icon.svg"}
                  onChange={handleFileChange}
                  placeholder="Image"
                  className="hidden"
                />
                <div>
                  <Image
                    src="/profile-icon.svg"
                    width={120}
                    height={120}
                    className="rounded-full size-20 md:size-[120px] object-contain"
                    alt="profile"
                  />
                  <div className="absolute right-0 bottom-0 size-8 md:size-11 p-2 md:p-3 rounded-[50px] border-1.5 bg-white text-center">
                    <FaPen className="size-4 md:size-5" />
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
                  value={listing.name}
                  onChange={(e) => {}}
                  rows={5}
                />
              </div>
            </div>
            <div className="listing__form-group !hidden md:!flex">
              <label className="listing__label">Region</label>
              <div className="listing__input-group">
                <CustomSelect
                  className=""
                  placeholder="Select a region"
                  items={categories}
                />
              </div>
            </div>
            <div className="listing__form-group md:!hidden">
              <label className="listing__label">
                Ethnic Palate (Select up to 2 palates)
              </label>
              <div className="listing__input-group">
                <CustomMultipleSelect items={categories} />
              </div>
            </div>
            <div className="listing__form-group !hidden md:!flex">
              <label className="listing__label">
                Ethnic Palate (Select up to 2 palates)
              </label>
              <div className="listing__input-group">
                <CustomSelect
                  mode="multiple"
                  max={2}
                  placeholder="Select a category"
                  items={categories}
                />
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <button className="listing__button" onClick={changeStep}>
                Save and Continue
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
