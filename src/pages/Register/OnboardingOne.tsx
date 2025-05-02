"use client";
import { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import "@/styles/pages/_auth.scss";
import CustomSelect from "@/components/ui/Select/Select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";

const OnboardingOnePage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic
    console.log("Registration attempt:", {
      name,
      email,
      password,
      confirmPassword,
    });
  };

  const formFields = [
    {
      label: "Username",
      type: "text",
      placeholder: "User name",
      value: "JulienChang",
    },
    {
      label: "Birthdate",
      type: "date",
      placeholder: "Birth date",
      value: "15/06/1990",
    },
    {
      label: "",
      type: "select",
      placeholder: "Select Gender",
      defaultValue: "0",
      className: "w-full !bg-[#E36B00]",
      itemClassName:
        "w-full t !bg-[#E36B00]ext-sm leading-9 font-medium text-left",
      contentClassName: "w-full !bg-[#E36B00]",
      triggerClassName: "relative w-full h !bg-[#E36B00]-[48px]",
      valuePlaceholder: "nationality",
      valueClassName: "",
      groupClassName: "w-full !bg-[#E36B00]",
      items: [
        {
          key: "1",
          value: "+81",
          label: "Toggle +81",
          content: <div>+81</div>,
        },
        {
          key: "2",
          value: "+63",
          label: "Toggle +63",
          content: <div>+63</div>,
        },
        {
          key: "3",
          value: "+90",
          label: "Toggle +90",
          content: <div>+90</div>,
        },
      ],
    },
    {
      label: "Gender",
      type: "select",
      placeholder: "Select Gender",
      defaultValue: "0",
      className: "md:w-[220px] !bg-[#E36B00]",
      itemClassName:
        "md:w-[220px] t !bg-[#E36B00]ext-sm leading-9 font-medium text-left",
      contentClassName: "md:w-[220px] !bg-[#E36B00]",
      triggerClassName: "relative w-full h !bg-[#E36B00]-[48px]",
      valuePlaceholder: "nationality",
      valueClassName: "",
      groupClassName: "md:w-[220px] !bg-[#E36B00]",
      items: [
        // {
        //   value: '+81',
        //   label: 'Toggle +81',
        //   content: <div>+81</div>,
        // },
        // {
        //   value: '+63',
        //   label: 'Toggle +63',
        //   content: <div>+63</div>,
        // },
        // {
        //   value: '+90',
        //   label: 'Toggle +90',
        //   content: <div>+90</div>,
        // },
      ],
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
                <label htmlFor="email" className="auth__label">
                  {field.label}
                </label>
                <div className="auth__input-group">
                  {field.type == "text" || field.type == "date" ? (
                    <input
                      type={field.type}
                      id="email"
                      className="auth__input"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  ) : (
                    <CustomSelect {...field} />
                  )}
                </div>
              </div>
            ))}
            <button
              type="submit"
              className="auth__button !bg-[#E36B00] !mt-0 !rounded-xl"
            >
              Continue
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
