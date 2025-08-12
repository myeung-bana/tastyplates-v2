"use client";
import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import LoginPage from "@/pages/Login/Login";
import ForgotPasswordModal from "./ui/Modal/ForgotPasswordModal";
import ForgotPassLinkModal from "./ui/Modal/ForgotPassLinkModal";

interface SigninModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
  onOpenSignup?: () => void;
}

const SigninModal: React.FC<SigninModalProps> = ({
  data = [],
  isOpen,
  onClose,
  onOpenSignup,
}) => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotLinkSuccess, setShowForgotLinkSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowForgotPassword(false);
      setShowForgotLinkSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Login Modal */}
      {!showForgotPassword && !showForgotLinkSuccess && (
        <div className="review-modal-overlay">
          <div className="!max-w-[488px] w-[calc(100%-24px)] md:w-full max-h-[700px] !p-0 !rounded-3xl font-inter relative overflow-y-auto">
            <button className="review-modal__close !top-5" onClick={onClose}>
              <FiX />
            </button>
            <LoginPage
              onOpenSignup={onOpenSignup}
              onOpenForgotPassword={() => setShowForgotPassword(true)}
            />
          </div>
        </div>
      )}

      {showForgotPassword && !showForgotLinkSuccess && (
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
          onSuccess={() => {
            setShowForgotPassword(false);
            // Use setTimeout to ensure state updates are batched correctly
            setTimeout(() => setShowForgotLinkSuccess(true), 0);
          }}
        />
      )}

      {showForgotLinkSuccess && (
        <ForgotPassLinkModal
          isOpen={showForgotLinkSuccess}
          onClose={() => {
            setShowForgotLinkSuccess(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default SigninModal;
