"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import "@/styles/pages/_auth.scss";
import CustomSelect from "@/components/ui/Select/Select";
import CustomMultipleSelect from "@/components/ui/Select/CustomMultipleSelect";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Key } from "@react-types/shared";
import { genderOptions, pronounOptions, palateOptions } from "@/constants/formOptions";

interface UserSession {
  username: string;
  email: string;
  birthdate?: string;
  gender?: string;
}

const OnboardingOnePage = () => {
  const router = useRouter();
  
  // Get initial data from localStorage instead of URL params
  const storedData = JSON.parse(localStorage.getItem('registrationData') || '{}');
  
  const [email, setEmail] = useState(storedData.email || "");
  const [birthdate, setBirthdate] = useState(storedData.birthdate || "");
  const [gender, setGender] = useState(storedData.gender || "");
  const [name, setName] = useState(storedData.username || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [customGender, setCustomGender] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [selectedPalates, setSelectedPalates] = useState<Set<Key>>(new Set());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="auth flex flex-col justify-center items-start">
      <div className="auth__container !max-w-[672px] w-full">
        <h1 className="auth__header">Create account</h1>
        <div className="auth__card !py-4 !rounded-3xl border border-[#CACACA] !w-[672px]">
          <p className="auth__subtitle">Step 1 of 2</p>
          <h1 className="auth__title !text-xl !font-semibold">
            Basic Information
          </h1>
          <form
            className="auth__form border-y !max-w-[672px] w-full border-[#CACACA] !gap-4 !pb-6"
            onSubmit={handleSubmit}
          >
            {formFields.map((field: any, index: number) => (
              <div
                key={index}
                className="auth__form-group mt-6 w-full shrink-0"
              >
                <label htmlFor={field.label?.toLowerCase()} className="auth__label">
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
                      className="auth__input"
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={field.onChange}
                      required
                      disabled={field.disabled}
                    />
                  )}
                </div>
              </div>
            ))}
            <button
              type="submit"
              className="auth__button !bg-[#E36B00] !mt-0 !rounded-xl"
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
