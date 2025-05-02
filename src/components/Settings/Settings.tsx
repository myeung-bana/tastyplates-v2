"use client";
import React, { FormEvent, useState } from "react";
import "@/styles/pages/_settings.scss";
import Link from "next/link";
import CustomSelect from "@/components/ui/Select/Select";
import { CiLocationOn } from "react-icons/ci";
import CustomModal from "@/components/ui/Modal/Modal";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Settings = (props: any) => {
  const [setting, setSetting] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(props.step ?? 0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [editable, setEditable] = useState<string>("");
  const router = useRouter();
  const categories = [
    { key: "no-category", label: "Select a Category" },
    { key: "category-1", label: "Category 1" },
    { key: "category-2", label: "Category 2" },
  ];

  const handleChangeCheckbox = (e: any) => {
    setSetting({ ...setting, cuisineIds: e });
  };

  const handleRating = (rate: number) => {
    console.log("User rated:", rate);
  };

  const submitReview = (e: FormEvent) => {
    e.preventDefault();
    // setIsSubmitted(true);
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
      <div className="font-inter w-full max-w-[39rem] mx-auto">
        <div className="flex flex-col justify-center items-center py-10">
          <h1 className="text-[#31343F] text-2xl font-medium">Personal Info</h1>
          <form
            className="settings__form max-w-[672px] w-full pt-8"
            onSubmit={submitReview}
          >
            <div className="settings__form-group">
              <label className="settings__label">Username</label>
              <div className="settings__input-group">Julien Chang</div>
            </div>
            <div className="settings__form-group">
              <label className={`settings__label ${editable != '' && editable != 'birthdate' ? 'settings__label__disabled' : ''}`}>Birthdate</label>
              <div className={`settings__input-group ${editable != '' && editable != 'birthdate' ? 'settings__input-group__disabled' : ''}`}>
                {editable == "birthdate" ? (
                  <input
                    type="text"
                    name="birthdate"
                    className="settings__input"
                    placeholder="11/02/1990"
                    value={setting.name}
                    onChange={(e) => {}}
                    disabled
                  />
                ) : (
                  "11/02/1990"
                )}
              </div>
              {editable !== "birthdate" ? (
                <button
                  type="button"
                  className={`absolute top-0 right-0 underline font-semibold leading-5 ${editable != '' ? 'settings__input-group__disabled' : ''}`}
                  onClick={() => setEditable("birthdate")}
                  disabled={editable !== ''}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="absolute top-0 right-0 underline font-semibold leading-5"
                    onClick={() => setEditable("")}
                  >
                    Cancel
                  </button>
                  {/* <div className={`${editable ? 'flex' : 'hidden'} gap-4 items-center`}> */}
                  <button type="submit" className="settings__button">
                    Save and Continue
                  </button>
                  {/* </div> */}
                </>
              )}
            </div>
            <div className="settings__form-group">
            <label className={`settings__label ${editable != '' && editable != 'email' ? 'settings__label__disabled' : ''}`}>Email</label>
            <div className={`settings__input-group ${editable != '' && editable != 'email' ? 'settings__input-group__disabled' : ''}`}>
                {editable == 'email' ? (
                  <input
                    type="text"
                    name="email"
                    className="settings__input"
                    placeholder="Email"
                    value={setting.name}
                    onChange={(e) => {}}
                  />
                ) : (
                  "julienchang211@gmail.com"
                )}
              </div>
              {editable !== "email" ? (
                <button
                  type="button"
                  className={`absolute top-0 right-0 underline font-semibold leading-5 ${editable != '' ? 'settings__input-group__disabled' : ''}`}
                  onClick={() => setEditable("email")}
                  disabled={editable !== ''}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="absolute top-0 right-0 underline font-semibold leading-5"
                    onClick={() => setEditable("")}
                  >
                    Cancel
                  </button>
                  {/* <div className={`${editable ? 'flex' : 'hidden'} gap-4 items-center`}> */}
                  <button type="submit" className="settings__button">
                    Save and Continue
                  </button>
                  {/* </div> */}
                </>
              )}
            </div>
            <div className="settings__form-group">
            <label className={`settings__label ${editable != '' && editable != 'language' ? 'settings__label__disabled' : ''}`}>Language</label>
            <div className={`settings__input-group ${editable != '' && editable != 'language' ? 'settings__input-group__disabled' : ''}`}>
                {editable == 'language' ? (
                    <input
                    type="text"
                    name="name"
                    className="settings__input"
                    placeholder="Language"
                    value={setting.language}
                    onChange={(e) => {}}
                    />
                ) : (
                    'English'
                )}
              </div>
              {editable !== "language" ? (
                <button
                  type="button"
                  className={`absolute top-0 right-0 underline font-semibold leading-5 ${editable != '' ? 'settings__input-group__disabled' : ''}`}
                  onClick={() => setEditable("language")}
                  disabled={editable !== ''}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="absolute top-0 right-0 underline font-semibold leading-5"
                    onClick={() => setEditable("")}
                  >
                    Cancel
                  </button>
                  {/* <div className={`${editable ? 'flex' : 'hidden'} gap-4 items-center`}> */}
                  <button type="submit" className="settings__button">
                    Save and Continue
                  </button>
                  {/* </div> */}
                </>
              )}
            </div>
            <hr className="border border-[#CACACA] w-full" />
            <h1 className="text-[#31343F] text-2xl font-medium text-center">
              Security
            </h1>
            <div className="settings__form-group">
            <label className={`settings__label ${editable != '' && editable != 'password' ? 'settings__label__disabled' : ''}`}>Password</label>
            <div className={`settings__input-group ${editable != '' && editable != 'password' ? 'settings__input-group__disabled' : ''}`}>
                {editable == "password" ? (
                  <input
                    type="password"
                    name="password"
                    className="settings__input"
                    placeholder="Password"
                    value={setting.password}
                    onChange={(e) => {}}
                    disabled
                  />
                ) : (
                  <></>
                )}
              </div>
              {editable !== "password" ? (
                <button
                  type="button"
                  className={`absolute top-0 right-0 underline font-semibold leading-5 ${editable != '' ? 'settings__input-group__disabled' : ''}`}
                  onClick={() => setEditable("password")}
                  disabled={editable !== ''}
                >
                  Update
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="absolute top-0 right-0 underline font-semibold leading-5"
                    onClick={() => setEditable("")}
                  >
                    Cancel
                  </button>
                  {/* <div className={`${editable ? 'flex' : 'hidden'} gap-4 items-center`}> */}
                  <button type="submit" className="settings__button">
                    Save and Continue
                  </button>
                  {/* </div> */}
                </>
              )}
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

export default Settings;
