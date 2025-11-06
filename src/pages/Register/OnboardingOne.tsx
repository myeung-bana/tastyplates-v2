"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import "@/styles/pages/_auth.scss";
import CustomMultipleSelect from "@/components/ui/Select/CustomMultipleSelect";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Key } from "@react-types/shared";
import { genderOptions, pronounOptions, palateOptions } from "@/constants/formOptions";
import Cookies from "js-cookie";
import { UserService } from '@/services/user/userService';
import {
  birthdateRequired,
  birthdateLimit,
  genderRequired,
  palateMaxLimit,
  usernameCheckError,
  usernameValidationLimit,
  palateRequired,
} from "@/constants/messages";
import { ageLimit, palateLimit, userNameMaxLimit, userNameMinLimit } from "@/constants/validation";
import CustomDatePicker from "@/components/common/CustomDatepicker";
import { HOME, ONBOARDING_TWO } from "@/constants/pages";
import { formatDateForInput } from "@/lib/utils";
import { REGISTRATION_KEY } from "@/constants/session";

const userService = new UserService()

const OnboardingOnePage = () => {
  const router = useRouter();
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [customGender, setCustomGender] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [selectedPalates, setSelectedPalates] = useState<Set<Key>>(new Set());
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [birthdateError, setBirthdateError] = useState<string | null>(null);
  const [genderError, setGenderError] = useState<string | null>(null);
  const [palateError, setPalateError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true); // Ensures code only runs after client-side mount
  }, []);

  // Move initialization logic to a separate useEffect
  useEffect(() => {
    if (!hasMounted) return;

    const storedData = localStorage.getItem(REGISTRATION_KEY);
    const parsedData = storedData ? JSON.parse(storedData) : {};

    setBirthdate(parsedData.birthdate || "");
    setGender(parsedData.gender || "");
    setName(parsedData.username || Cookies.get('username') || "");
    setCustomGender(parsedData.customGender || "");
    setPronoun(parsedData.pronoun || "");

    if (parsedData.palates) {
      const palatesArray = Array.isArray(parsedData.palates) 
        ? parsedData.palates 
        : parsedData.palates.split(",");
      setSelectedPalates(new Set(palatesArray));
    }

    setHasMounted(true);
  }, [hasMounted]);

  // Navigation protection effects
  useEffect(() => {
    if (!hasMounted) return;
    let storedData = localStorage.getItem(REGISTRATION_KEY);
    const googleAuth = Cookies.get('googleAuth');
    const email = Cookies.get('email');
    const username = Cookies.get('username');
    
    if (!storedData && googleAuth === 'true') {
      const registrationData = {
        username: username || "",
        email: email || "",
        password: "",
        googleAuth: true
      };
      localStorage.setItem(REGISTRATION_KEY, JSON.stringify(registrationData));
      storedData = JSON.stringify(registrationData);
    }

    if (!storedData) {
      router.replace(HOME);
    }
  }, [router, hasMounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get stored data first
      const storedDataStr = localStorage.getItem(REGISTRATION_KEY);
      let existingData = {};
      
      // Safely parse the stored data
      try {
        existingData = storedDataStr ? JSON.parse(storedDataStr) : {};
      } catch {
        existingData = {};
      }

      // Reset errors
      setUsernameError(null);
      setBirthdateError(null);
      setPalateError(null);
      setGenderError(null);

      let formattedBirthdate = "";

      // Username validation
      if (!name || name.length > userNameMaxLimit) {
        setUsernameError(usernameValidationLimit(userNameMinLimit, userNameMaxLimit));
        setIsLoading(false);
        return;
      }

      // Birthdate validation
      if (!birthdate) {
        setBirthdateError(birthdateRequired);
        setIsLoading(false);
        return;
      }

      // Age validation
      const birth = new Date(birthdate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      const isBirthdayPassed = m > 0 || (m === 0 && today.getDate() >= birth.getDate());
      const actualAge = isBirthdayPassed ? age : age - 1;
      
      if (isNaN(birth.getTime()) || actualAge < ageLimit) {
        setBirthdateError(birthdateLimit(ageLimit));
        setIsLoading(false);
        return;
      }

      if (birthdate) {
        formattedBirthdate = formatDateForInput(birthdate);
      }

      // Gender validation
      if (!gender) {
        setGenderError(genderRequired);
        setIsLoading(false);
        return;
      }

      // Palate validation
      if (selectedPalates.size === 0) {
        setPalateError(palateRequired);
        setIsLoading(false);
        return;
      }
      if (selectedPalates.size > palateLimit) {
        setPalateError(palateMaxLimit(palateLimit));
        setIsLoading(false);
        return;
      }

      try {
        const response = await userService.checkUsernameExists(name);
        if (response.exists) {
          setUsernameError(response.message as string);
          setIsLoading(false);
          return;
        }
      } catch {
        setUsernameError(usernameCheckError);
        setIsLoading(false);
        return;
      }
      if (!hasMounted) return null;

      // Update localStorage with new data while preserving onboarding2 data
      const updatedData = {
        ...existingData,
        username: name,
        birthdate: formattedBirthdate,
        gender,
        customGender: gender === "custom" ? customGender : undefined,
        pronoun: gender === "custom" ? pronoun : undefined,
        palates: Array.from(selectedPalates).join(","),
      };

      // Clean undefined values before storing
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key as keyof typeof updatedData] === undefined) {
          delete updatedData[key as keyof typeof updatedData];
        }
      });

      localStorage.setItem(REGISTRATION_KEY, JSON.stringify(updatedData));
      setIsLoading(false);
      router.push(ONBOARDING_TWO);
      return; // Explicit return
    } catch (error) {
      console.error('Error in form submission:', error);
      setIsLoading(false);
      return; // Explicit return
    }
  };

  const handleGenderChange = (value: string) => {
    console.log('gender reveal', value)
    setGender(value);
    // Reset custom gender fields when switching genders
    if (value !== "custom") {
      setCustomGender("");
      setPronoun("");
    }
  };

  const handlePalateChange = (keys: Set<Key>) => {
    // Remove immediate validation
    setSelectedPalates(keys);
    setPalateError(null); // Clear any existing error
  };

  const baseFormFields = [
    {
      label: "Username",
      type: "text",
      placeholder: "Username",
      value: name,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
      disabled: isLoading,
      className: "!rounded-[10px] !h-10 md:!h-[48px]"
    },
    {
      label: "Birthdate",
      type: "date",
      placeholder: "DD/MM/YYYY",
      value: birthdate,
      onChange: (val: string) => setBirthdate(val),
      disabled: isLoading,
      className: "relative",
    },
    {
      label: "Gender",
      type: "select",
      placeholder: "Select your gender",
      defaultValue: gender || "0",
      className: `auth__input auth__select !h-10 md:!h-[48px] rounded-[10px] focus:!text-[#31343f] ${gender ? '!text-[#31343f]' : '!text-[#797979]'}`,
      value: gender,
      onChange: handleGenderChange,
      items: genderOptions,
      disabled: isLoading,
    },
  ];

  const customGenderFields = gender === "custom" ? [
    {
      label: "",
      type: "text",
      placeholder: "What's your gender?",
      value: customGender,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCustomGender(e.target.value),
      disabled: isLoading,
      className: "auth__input h-10 md:h-[48px] rounded-[10px]",
    },
    {
      label: "Pronoun",
      type: "select",
      placeholder: "Select your pronoun",
      defaultValue: pronoun || "0",
      className: `auth__input auth__select h-10 md:h-[48px] rounded-[10px] focus:!text-[#31343f] ${pronoun ? '!text-[#31343f]' : '!text-[#797979]'}`,
      value: pronoun,
      onChange: (value: string) => setPronoun(value),
      items: pronounOptions,
      disabled: isLoading,
    },
  ] : [];

  // Update the palate field
  const formFields = [
    ...baseFormFields,
    ...(gender === "custom" ? customGenderFields : []),
    {
      label: "Palate (Select up to 2 palates)",
      type: "multiple-select",
      placeholder: "Select your palate",
      value: selectedPalates,
      onChange: handlePalateChange,
      items: palateOptions,
      disabled: isLoading,
      limitValueLength: 2,
      className: "!h-10 md:!h-[48px] !rounded-[10px] auth__input",
    },
  ];

  return (
    <div className="px-2 pt-8 sm:px-1 h-auto">
      <div className="auth__container w-full max-w-full sm:!max-w-[672px] mx-auto">
        <h1 className="auth__header text-2xl sm:text-3xl">Create Account</h1>
        <div className="auth__card py-4 !rounded-[24px] border border-[#CACACA] w-full sm:!w-[672px] bg-white">
          <p className="auth__subtitle text-sm sm:text-base">Step 1 of 2</p>
          <h1 className="auth__title">
            Basic Information
          </h1>
          <form
            className="auth__form max-w-full sm:!max-w-[672px] w-full border-[#CACACA] gap-4 pb-6"
            onSubmit={handleSubmit}
          >
            {formFields.map((field: Record<string, unknown>, index: number) => {
              // Check if current field is custom gender and previous field was gender
              const isCustomGenderField = gender === "custom" && field.label === "";
              const groupClassName = isCustomGenderField
                ? "auth__form-group w-full shrink-0 -mt-4"
                : "auth__form-group w-full shrink-0";

              return (
                <div key={index} className={groupClassName}>
                  <label htmlFor={String(field.label || "").toLowerCase()} className="font-semibold text-sm sm:text-base">
                    {String(field.label || "")}
                  </label>
                  <div className={`auth__input-group ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
                    {field.type === "date" ? (
                        <CustomDatePicker
                          id={String(field.label || "").toLowerCase()}
                          className={`!w-full text-sm sm:text-base !rounded-[10px] ${!field.value ? '[&::-webkit-datetime-edit]:opacity-0' : ''} ${field.className || ''}`}
                          buttonClassName="!h-10 md:!h-[48px] text-[#31343f] text-xs md:text-base border border-solid !border-[#797979] hover:border-[#31343f] hover:bg-[#F1F1F1] placeholder:text-[#797979]"
                          value={String(field.value || "")}
                          onChange={field.onChange as (val: string) => void}
                          formatValue="MM/dd/yyyy"
                          disabled={Boolean(field.disabled)}
                        />
                    ) : field.type === "select" ? (
                      // <CustomSelect {...field} />
                      <select className={String(field.className || "")} value={String(field.value || "")} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => (field.onChange as (val: string) => void)(e.target.value)} disabled={Boolean(field.disabled)}>
                        <option value="">{String(field.placeholder || "")}</option>
                        {(field.items as Array<Record<string, unknown>> || []).map((option: Record<string, unknown>) =>
                          <option key={String(option.key || "")} value={String(option.value || "")}>{String(option.content || "")}</option>
                        )}
                      </select>
                    ) : field.type === "multiple-select" ? (
                      <CustomMultipleSelect 
                        items={field.items as Array<{ key: string; label: string }> || []}
                        value={new Set([String(field.value || "")])}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onChange={(keys: Set<any>) => (field.onChange as (val: string) => void)(String(Array.from(keys)[0] || ""))}
                        placeholder={String(field.placeholder || "")}
                        className={String(field.className || "")}
                      />
                    ) : (
                      <input
                        type={String(field.type || "text")}
                        id={String(field.label || "").toLowerCase()}
                        className={`auth__input text-sm sm:text-base ${String(field.className || '')}`}
                        placeholder={String(field.placeholder || "")}
                        value={String(field.value || "")}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => (field.onChange as (val: string) => void)(e.target.value)}
                        disabled={Boolean(field.disabled)}
                      />
                    )}
                  </div>
                  {/* Validation errors */}
                  {field.label === "Username" && usernameError && (
                    <div className="text-red-600 text-xs mt-1">{usernameError}</div>
                  )}
                  {field.label === "Birthdate" && birthdateError && (
                    <div className="text-red-600 text-xs mt-1">{birthdateError}</div>
                  )}
                  {field.label === "Palate (Select up to 2 palates)" && palateError && (
                    <div className="text-red-600 text-xs mt-1">{palateError}</div>
                  )}
                  {field.label === "Gender" && genderError && (
                    <div className="text-red-600 text-xs mt-1">{genderError}</div>
                  )}
                </div>
              );
            })}
            <button
              type="submit"
              className={`auth__button !bg-[#E36B00] mt-0 !rounded-[12px] w-fit text-base mx-auto ${isLoading ? 'pointer-events-none' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Save and Continue"}
            </button>
          </form>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Modal Title
              </ModalHeader>
              <ModalBody>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Nullam pulvinar risus non risus hendrerit venenatis.
                  Pellentesque sit amet hendrerit risus, sed porttitor quam.
                </p>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Nullam pulvinar risus non risus hendrerit venenatis.
                  Pellentesque sit amet hendrerit risus, sed porttitor quam.
                </p>
                <p>
                  Magna exercitation reprehenderit magna aute tempor cupidatat
                  consequat elit dolor adipisicing. Mollit dolor eiusmod sunt ex
                  incididunt cillum quis. Velit duis sit officia eiusmod Lorem
                  aliqua enim laboris do dolor eiusmod. Et mollit incididunt
                  nisi consectetur esse laborum eiusmod pariatur proident Lorem
                  eiusmod et. Culpa deserunt nostrud ad veniam.
                </p>
              </ModalBody>
              <ModalFooter>
                <button color="danger" onClick={() => setIsOpen(!isOpen)}>
                  Close
                </button>
                <button color="primary" onClick={() => setIsOpen(!isOpen)}>
                  Action
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default OnboardingOnePage;
