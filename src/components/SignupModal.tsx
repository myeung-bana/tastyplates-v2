"use client";
import React from "react";
import { FiX } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import RegisterPage from "@/pages/Register/Register";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
  onOpenSignin?: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({
  data = [],
  isOpen,
  onClose,
  onOpenSignin,
}) => {

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay">
      <div className="!max-w-[488px] w-full max-h-[800px] !p-0 !rounded-3xl font-inter relative overflow-y-auto">
        <button className="review-modal__close !top-5" onClick={onClose}>
          <FiX />
        </button>
        <RegisterPage onOpenSignin={onOpenSignin} />
      </div>
    </div>
  );
};

export default SignupModal;
