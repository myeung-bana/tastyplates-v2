"use client";
import React from "react";
import { FiX } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import RegisterPage from "@/pages/Register/Register";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: Record<string, unknown>;
  onOpenSignin?: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onOpenSignin,
}) => {

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay review-modal-overlay--auth-sheet">
      <div className="review-modal-panel--auth-sheet !max-w-[488px] w-[calc(100%-24px)] md:w-full max-h-[800px] max-md:max-h-none !p-0 !rounded-3xl max-md:!rounded-none font-neusans relative overflow-y-auto bg-white">
        <button className="review-modal__close !top-3 md:!top-5 max-md:!top-4 max-md:!right-4" onClick={onClose}>
          <FiX />
        </button>
        <RegisterPage onOpenSignin={onOpenSignin} />
      </div>
    </div>
  );
};

export default SignupModal;
