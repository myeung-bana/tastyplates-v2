"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import "@/styles/pages/_auth.scss";
import CustomSelect from "@/components/ui/Select/Select";
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

const OnboardingOnePage = () => {
  const router = useRouter();

  useEffect(() => {
    let storedData = localStorage.getItem('registrationData');
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
      localStorage.setItem('registrationData', JSON.stringify(registrationData));
      storedData = JSON.stringify(registrationData);
    }

    if (!storedData) {
      router.replace('/');
      window.history.pushState(null, '', '/');
    }
  }, [router]);

  useEffect(() => {
    const handlePopState = () => {
      router.replace('/');
      window.history.pushState({}, '', '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  // Get initial data from localStorage instead of URL params
  const storedData = JSON.parse(localStorage.getItem('registrationData') || '{}');
  
  const [birthdate, setBirthdate] = useState(storedData.birthdate || "");
  const [gender, setGender] = useState(storedData.gender || "");
  const [name, setName] = useState(storedData.username || Cookies.get('username') || "");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [customGender, setCustomGender] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [selectedPalates, setSelectedPalates] = useState<Set<Key>>(new Set());
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [birthdateError, setBirthdateError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    setUsernameError(null);
    setBirthdateError(null);

    // Username validation
    if (!name || name.length > 20) {
      setUsernameError("Username must be 1-20 characters.");
      hasError = true;
    }

    // Birthdate validation (must be 18+)
    if (!birthdate) {
      setBirthdateError("Birthdate is required.");
      hasError = true;
    } else {
      const birth = new Date(birthdate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      const isBirthdayPassed = m > 0 || (m === 0 && today.getDate() >= birth.getDate());
      const actualAge = isBirthdayPassed ? age : age - 1;
      if (isNaN(birth.getTime()) || actualAge < 18) {
        setBirthdateError("You must be at least 18 years old.");
        hasError = true;
      }
    }

    if (hasError) return;

    let formattedBirthdate = "";
    if (birthdate) {
      const dateObj = new Date(birthdate);
      if (!isNaN(dateObj.getTime())) {
        formattedBirthdate = dateObj.toISOString().split("T")[0];
      }
    }

    // Update localStorage with new data
    const updatedData = {
      ...storedData,
      username: name,
      birthdate: formattedBirthdate,
      gender,
      customGender: gender === "custom" ? customGender : undefined,
      pronoun: gender === "custom" ? pronoun : undefined,
      palates: Array.from(selectedPalates).join(","),
    };
    
    localStorage.setItem('registrationData', JSON.stringify(updatedData));
    router.push("/onboarding2");
  };

  const handleGenderChange = (value: string) => {
    console.log("Gender changed to:", value);
    setGender(value);
    // Reset custom gender fields when switching genders
    if (value !== "custom") {
      setCustomGender("");
      setPronoun("");
    }
  };

  const handlePalateChange = (keys: Set<Key>) => {
    setSelectedPalates(keys);
  };

  const baseFormFields = [
    {
      label: "Username",
      type: "text",
      placeholder: "Enter your username",
      value: name,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
    },
    {
      label: "Birthdate",
      type: "date",
      placeholder: "Select your birthdate",
      value: birthdate,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setBirthdate(e.target.value),
    },
    {
      label: "Gender",
      type: "select",
      placeholder: "Select Gender",
      defaultValue: gender || "0",
      className: "w-full",
      value: gender,
      onChange: handleGenderChange,
      items: genderOptions.map(option => ({
        ...option,
        content: <div>{option.content}</div>
      })),
    },
  ];

  const customGenderFields = gender === "custom" ? [
    {
      label: "Custom Gender",
      type: "text",
      placeholder: "What's your gender?",
      value: customGender,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCustomGender(e.target.value),
    },
    {
      label: "Pronoun",
      type: "select",
      placeholder: "Select your pronoun",
      defaultValue: pronoun || "0",
      className: "w-full",
      value: pronoun,
      onChange: (value: string) => setPronoun(value),
      items: pronounOptions,
    },
  ] : [];

  // Combine base fields with custom gender fields first, then add palate at the end
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
    },
  ];

  return (
    <div className="min-h-screen px-2 pt-8 sm:px-1">
      <div className="auth__container w-full max-w-full sm:!max-w-[672px] mx-auto">
        <h1 className="auth__header text-2xl sm:text-3xl">Create account</h1>
        <div className="auth__card py-4 rounded-4xl border border-[#CACACA] w-full sm:!w-[672px] bg-white">
          <p className="auth__subtitle text-base sm:text-lg">Step 1 of 2</p>
          <h1 className="auth__title text-lg sm:!text-xl font-semibold">
            Basic Information
          </h1>
          <form
            className="auth__form border-y max-w-full sm:!max-w-[672px] w-full border-[#CACACA] gap-4 pb-6"
            onSubmit={handleSubmit}
          >
            {formFields.map((field: any, index: number) => (
              <div
                key={index}
                className="auth__form-group mt-4 sm:mt-6 mb-4 sm:mb-0 w-full shrink-0"
              >
                <label htmlFor={field.label?.toLowerCase()} className="font-bold text-sm sm:text-base">
                  {field.label}
                </label>
                <div className="auth__input-group">
                  {field.type === "select" ? (
                    <CustomSelect {...field} />
                  ) : field.type === "multiple-select" ? (
                    <CustomMultipleSelect {...field} />
                  ) : (
                    <input
                      type={field.type}
                      id={field.label?.toLowerCase()}
                      className="auth__input text-sm sm:text-base"
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={field.onChange}
                      required
                      disabled={field.disabled}
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
              </div>
            ))}
            <button
              type="submit"
              className="auth__button !bg-[#E36B00] mt-0 rounded-xl w-full sm:w-auto text-base sm:text-lg"
            >
              Save and Continue
            </button>
          </form>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <ModalContent>
          {(onClose) => (
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
