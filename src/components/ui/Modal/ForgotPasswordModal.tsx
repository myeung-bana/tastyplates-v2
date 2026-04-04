"use client";
import React, { RefObject } from "react";
import clsx from "clsx";
import { FiChevronLeft } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import ForgotPasswordPage from "@/pages/Login/ForgotPassword";

interface ForgotPassowordModalProps {
    isOpen: boolean;
    sheetVisible?: boolean;
    authSheetPanelRef?: RefObject<HTMLDivElement | null>;
    onClose?: () => void;
    onSuccess?: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPassowordModalProps> = ({
    isOpen,
    sheetVisible = false,
    authSheetPanelRef,
    onClose,
    onSuccess
}) => {

    if (!isOpen) return null;

    return (
        <div
            className={clsx(
                "review-modal-overlay review-modal-overlay--auth-sheet",
                sheetVisible && "auth-sheet--visible"
            )}
        >
            <div
                ref={authSheetPanelRef}
                className="review-modal-panel--auth-sheet !max-w-[488px] w-full !max-h-[auto] max-md:!max-h-none !p-0 !rounded-3xl max-md:!rounded-none font-neusans relative overflow-y-auto bg-white"
            >
                <button className="review-modal__close !left-[1.5rem] !top-5 max-md:!left-4 max-md:!top-4 !w-fit" onClick={onClose}>
                    <FiChevronLeft className="stroke-[2] text-[28px] text-[#1C1B1F] hover:opacity-80" />
                </button>
                <ForgotPasswordPage onSuccess={onSuccess} />
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
