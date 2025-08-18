"use client";
import React from "react";
import { FiX } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import "@/styles/pages/_auth.scss";

interface PasswordUpdateModalProps {
    isOpen: boolean;
    onClose?: () => void;
}

const PasswordUpdatedModal: React.FC<PasswordUpdateModalProps> = ({
    isOpen,
    onClose,
}) => {

    if (!isOpen) return null;

    return (
        <div className="review-modal-overlay">
            <div className="!max-w-[488px] w-full !max-h-[auto] !p-0 !rounded-3xl font-inter relative overflow-y-auto">
                <button className="review-modal__close !top-5" onClick={onClose}>
                    <FiX />
                </button>
                <div className="auth !min-h-[auto]">
                    <div className="auth__container">
                        <div className="auth__card !px-0 !py-6">
                            <h1 className="auth__title">Password Updated</h1>
                            <div className="border-t border-[#CACACA]">
                                <div className="auth__form-group px-[2rem] mt-6">
                                    <p className="text-sm text-[#31343F]">Your password was successfully updated. You can now start browsing!</p>
                                    <button
                                        type="button"
                                        className="auth__button !bg-[#E36B00] !mt-5 !rounded-xl hover:bg-[#d36400] transition-all duration-200"
                                        onClick={onClose}
                                    >
                                        Start Browsing
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordUpdatedModal;
