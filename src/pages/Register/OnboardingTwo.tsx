"use client";
import { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc"
import "@/styles/pages/_auth.scss";

const OnboardingTwoPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false)

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
      label: 'Username',
      type: 'text',
      placeholder: 'User name',
      value: 'JulienChang',
    },
    {
      label: 'Birthdate',
      type: 'date',
      placeholder: 'Birth date',
      value: '15/06/1990',
    },
    {
      label: 'Gender',
      type: 'select',
      placeholder: 'Select Gender',
      value: 'Male',
      options: [
        {
          value: '',
          text: 'Select up to 2 palates',
        },
        {
          value: '1',
          text: 'Palate 1',
        },
        {
          value: '2',
          text: 'Palate 2',
        },
      ]
    },
    {
      label: 'Palate (Select up to 2 palates)',
      type: 'select',
      placeholder: 'Select up to 2 palates',
      value: '1',
      options: [
        {
          value: '',
          text: 'Select up to 2 palates',
        },
        {
          value: '1',
          text: 'Palate 1',
        },
        {
          value: '2',
          text: 'Palate 2',
        },
      ]
    }
  ]

  const toggleShowPassword = () => setShowPassword(!showPassword)

  return (
    <div className="auth flex flex-col justify-center items-start">
      <div className="auth__container !max-w-[672px] w-full">
        <h1 className="auth__header">Create account</h1>
        <div className="auth__card !py-4 !rounded-3xl border border-[#CACACA] !w-[672px]">
          <p className="auth__subtitle">Step 2 of 2</p>
          <h1 className="auth__title !text-xl !font-semibold">Basic Information</h1>
          <form className="auth__form border-y !max-w-[672px] w-full border-[#CACACA] !gap-4 !pb-6" onSubmit={handleSubmit}>
            {formFields.map((field: any, index: number) => (
              <div key={index} className="auth__form-group mt-6 w-full shrink-0">
                <label htmlFor="email" className="auth__label">
                  { field.label }
                </label>
                <div className="auth__input-group">
                  {field.type == 'text' || field.type == 'date' ? (
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
                    <select id="" className="auth__input">
                      {field.options.map((option: any, index: number) => 
                        <option key={index} value={option.value}>{option.text}</option>
                      )}
                    </select>
                  )}
                </div>
              </div>
            ))}
            <button type="submit" className="auth__button !bg-[#E36B00] !mt-0 !rounded-xl">
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTwoPage;
