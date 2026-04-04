"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { FiX } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import LoginPage from "@/pages/Login/Login";
import ForgotPasswordModal from "../ui/Modal/ForgotPasswordModal";
import ForgotPassLinkModal from "../ui/Modal/ForgotPassLinkModal";
import { useAuthSheetDismissal } from "@/hooks/useAuthSheetDismissal";

interface SigninModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: Record<string, unknown>;
  onOpenSignup?: () => void;
}

const SigninModal: React.FC<SigninModalProps> = ({
  isOpen,
  onClose,
  onOpenSignup,
}) => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotLinkSuccess, setShowForgotLinkSuccess] = useState(false);
  const { panelRef, requestDismiss, authSheetVisible } = useAuthSheetDismissal(
    isOpen,
    onClose
  );

  useEffect(() => {
    if (isOpen) {
      setShowForgotPassword(false);
      setShowForgotLinkSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const overlayClass = clsx(
    "review-modal-overlay review-modal-overlay--auth-sheet",
    authSheetVisible && "auth-sheet--visible"
  );

  return (
    <>
      {/* Login Modal */}
      {!showForgotPassword && !showForgotLinkSuccess && (
        <div className={overlayClass}>
          <div
            ref={panelRef}
            className="review-modal-panel--auth-sheet !max-w-[488px] w-[calc(100%-24px)] md:w-full max-h-[700px] max-md:max-h-none !p-0 !rounded-3xl max-md:!rounded-none font-neusans relative overflow-y-auto bg-white"
          >
            <button
              type="button"
              className="review-modal__close !top-5 max-md:!top-4 max-md:!right-4"
              onClick={() => requestDismiss()}
            >
              <FiX />
            </button>
            <LoginPage
              onOpenSignup={onOpenSignup}
              onOpenForgotPassword={() => setShowForgotPassword(true)}
              onLoginSuccess={() => requestDismiss()}
            />
          </div>
        </div>
      )}

      {showForgotPassword && !showForgotLinkSuccess && (
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          sheetVisible={authSheetVisible}
          authSheetPanelRef={panelRef}
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
          sheetVisible={authSheetVisible}
          authSheetPanelRef={panelRef}
          onClose={() => {
            requestDismiss(() => {
              setShowForgotLinkSuccess(false);
              onClose();
            });
          }}
        />
      )}
    </>
  );
};

export default SigninModal;
